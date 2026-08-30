from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import (
    Request,
    ReviewQueue,
    ActivityLog,
)
from app.services.automation_service import execute_action
from app.services.email_service import send_business_response_email


router = APIRouter(
    prefix="/reviews",
    tags=["Human Review"],
)


# ============================================================
# SCHEMAS
# ============================================================


class ReviewAction(BaseModel):
    review_notes: str = Field(
        default="",
        max_length=2000,
    )


# ============================================================
# HELPERS
# ============================================================


def _send_customer_email(
    customer_email: str,
    subject: str,
    message: str,
) -> dict:
    try:
        result = send_business_response_email(
            to_email=customer_email,
            subject=subject,
            response_message=message,
        )

        if result.get("success"):
            return {
                "status": "SENT",
                "message": result.get(
                    "message",
                    "Email sent successfully.",
                ),
                "message_id": result.get("message_id"),
            }

        return {
            "status": "FAILED",
            "message": result.get(
                "message",
                "Email sending failed.",
            ),
        }

    except Exception as exc:
        return {
            "status": "FAILED",
            "message": str(exc),
        }


def _review_response(review, request):
    return {
        "review_id": review.id,
        "request_id": request.request_id,
        "reason": review.reason,
        "review_status": review.status,
        "review_notes": review.review_notes,
        "reviewer_id": review.reviewer_id,
        "created_at": review.created_at,
        "reviewed_at": review.reviewed_at,
        "request": {
            "request_id": request.request_id,
            "customer_name": request.customer_name,
            "customer_email": request.customer_email,
            "input_text": request.input_text,
            "intent": request.intent,
            "priority": request.priority,
            "confidence_score": request.confidence_score,
            "ai_summary": request.ai_summary,
            "status": request.status,
            "action_taken": request.action_taken,
            "error_message": request.error_message,
            "created_at": request.created_at,
        },
    }


# ============================================================
# LIST REVIEWS
# ============================================================


@router.get("/")
def list_reviews(
    status: str = "pending",
    db: Session = Depends(get_db),
):
    query = (
        db.query(ReviewQueue, Request)
        .join(
            Request,
            ReviewQueue.request_id == Request.request_id,
        )
    )

    if status.lower() != "all":
        query = query.filter(
            ReviewQueue.status == status.lower()
        )

    results = (
        query
        .order_by(ReviewQueue.created_at.desc())
        .limit(100)
        .all()
    )

    reviews = [
        _review_response(review, request)
        for review, request in results
    ]

    return {
        "success": True,
        "count": len(reviews),
        "reviews": reviews,
    }


# ============================================================
# GET REVIEW
# ============================================================


@router.get("/{review_id}")
def get_review(
    review_id: str,
    db: Session = Depends(get_db),
):
    result = (
        db.query(ReviewQueue, Request)
        .join(
            Request,
            ReviewQueue.request_id == Request.request_id,
        )
        .filter(ReviewQueue.id == review_id)
        .first()
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Review request not found.",
        )

    review, request = result

    return {
        "success": True,
        "review": _review_response(
            review,
            request,
        ),
    }


# ============================================================
# APPROVE REVIEW
# ============================================================


@router.post("/{review_id}/approve")
def approve_review(
    review_id: str,
    action_data: ReviewAction,
    db: Session = Depends(get_db),
):
    result = (
        db.query(ReviewQueue, Request)
        .join(
            Request,
            ReviewQueue.request_id == Request.request_id,
        )
        .filter(ReviewQueue.id == review_id)
        .first()
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Review request not found.",
        )

    review, request = result

    if review.status != "pending":
        raise HTTPException(
            status_code=409,
            detail=(
                f"Review has already been {review.status}."
            ),
        )

    notes = action_data.review_notes.strip()

    # --------------------------------------------------------
    # Record review decision
    # --------------------------------------------------------

    review.status = "approved"
    review.review_notes = notes or "Approved by human reviewer."
    review.reviewed_at = datetime.utcnow()

    db.add(
        ActivityLog(
            request_id=request.request_id,
            action="HUMAN_REVIEW",
            status="APPROVED",
            message=review.review_notes,
        )
    )

    # --------------------------------------------------------
    # Execute approved request
    # --------------------------------------------------------

    try:
        automation_result = execute_action(
            request_id=request.request_id,
            action="AUTO_EXECUTE",
            customer_email=request.customer_email,
            input_text=request.input_text,
            db=db,
        )

        if not isinstance(automation_result, dict):
            automation_result = {
                "status": "SUCCESS",
                "message": "Approved request was executed.",
            }

    except TypeError:
        try:
            automation_result = execute_action(
                request.request_id,
                "AUTO_EXECUTE",
                request.customer_email,
                request.input_text,
                db,
            )

            if not isinstance(automation_result, dict):
                automation_result = {
                    "status": "SUCCESS",
                    "message": "Approved request was executed.",
                }

        except Exception as exc:
            automation_result = {
                "status": "FAILED",
                "message": str(exc),
            }

    except Exception as exc:
        automation_result = {
            "status": "FAILED",
            "message": str(exc),
        }

    automation_status = str(
        automation_result.get(
            "status",
            "SUCCESS",
        )
    ).upper()

    automation_message = str(
        automation_result.get(
            "message",
            "Approved request was executed.",
        )
    )

    # --------------------------------------------------------
    # Automation failed
    # --------------------------------------------------------

    if automation_status in {"FAILED", "ERROR"}:
        request.status = "pending_review"
        request.action_taken = "AUTOMATION_FAILED"
        request.error_message = automation_message

        db.add(
            ActivityLog(
                request_id=request.request_id,
                action="ACTION_EXECUTED",
                status="FAILED",
                message=automation_message,
            )
        )

        db.commit()

        return {
            "success": True,
            "message": (
                "Review approved, but automation failed. "
                "Request remains under review."
            ),
            "review_id": review.id,
            "request_id": request.request_id,
            "status": request.status,
            "automation": automation_result,
        }

    # --------------------------------------------------------
    # Successful execution
    # --------------------------------------------------------

    request.status = "completed"
    request.action_taken = "AUTO_EXECUTE"
    request.error_message = None

    db.add(
        ActivityLog(
            request_id=request.request_id,
            action="ACTION_EXECUTED",
            status="SUCCESS",
            message=automation_message,
        )
    )

    db.add(
        ActivityLog(
            request_id=request.request_id,
            action="REQUEST_COMPLETED",
            status="SUCCESS",
            message=(
                "Request approved by human reviewer "
                "and completed successfully."
            ),
        )
    )

    customer_notification = _send_customer_email(
        request.customer_email,
        f"Request Completed - {request.request_id}",
        (
            "Your business request has been reviewed "
            "and processed successfully.\n\n"
            f"Request ID: {request.request_id}\n\n"
            f"Result: {automation_message}"
        ),
    )

    db.commit()
    db.refresh(request)
    db.refresh(review)

    return {
        "success": True,
        "message": (
            "Request approved and processed successfully."
        ),
        "review_id": review.id,
        "request_id": request.request_id,
        "status": request.status,
        "review_status": review.status,
        "automation": automation_result,
        "notification": customer_notification,
    }


# ============================================================
# REJECT REVIEW
# ============================================================


@router.post("/{review_id}/reject")
def reject_review(
    review_id: str,
    action_data: ReviewAction,
    db: Session = Depends(get_db),
):
    result = (
        db.query(ReviewQueue, Request)
        .join(
            Request,
            ReviewQueue.request_id == Request.request_id,
        )
        .filter(ReviewQueue.id == review_id)
        .first()
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Review request not found.",
        )

    review, request = result

    if review.status != "pending":
        raise HTTPException(
            status_code=409,
            detail=(
                f"Review has already been {review.status}."
            ),
        )

    notes = action_data.review_notes.strip()

    if not notes:
        raise HTTPException(
            status_code=422,
            detail="Review notes are required when rejecting a request.",
        )

    review.status = "rejected"
    review.review_notes = notes
    review.reviewed_at = datetime.utcnow()

    request.status = "rejected"
    request.action_taken = "REJECTED"
    request.error_message = None

    db.add(
        ActivityLog(
            request_id=request.request_id,
            action="HUMAN_REVIEW",
            status="REJECTED",
            message=notes,
        )
    )

    db.add(
        ActivityLog(
            request_id=request.request_id,
            action="REQUEST_COMPLETED",
            status="REJECTED",
            message="Request rejected during human review.",
        )
    )

    customer_notification = _send_customer_email(
        request.customer_email,
        f"Request Update - {request.request_id}",
        (
            "Your business request has been reviewed.\n\n"
            f"Request ID: {request.request_id}\n\n"
            "The request could not be approved for processing "
            "at this time.\n\n"
            f"Review note: {notes}"
        ),
    )

    db.commit()
    db.refresh(request)
    db.refresh(review)

    return {
        "success": True,
        "message": "Request rejected successfully.",
        "review_id": review.id,
        "request_id": request.request_id,
        "status": request.status,
        "review_status": review.status,
        "notification": customer_notification,
    }