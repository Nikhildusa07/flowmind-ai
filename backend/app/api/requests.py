import re
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import (
    Request,
    ActivityLog,
    ReviewQueue,
    AutomationAction,
)
from app.services.ai_service import analyze_request
from app.services.agent_service import run_agent_workflow
from app.services.decision_service import make_decision
from app.services.automation_service import execute_action
from app.services.email_service import send_business_response_email


router = APIRouter(
    prefix="/requests",
    tags=["Business Requests"],
)


# ============================================================
# CONFIGURATION
# ============================================================

MAX_INPUT_LENGTH = 5000
MAX_CUSTOMER_NAME_LENGTH = 100
MIN_AUTO_CONFIDENCE = 0.60


# ============================================================
# REQUEST SCHEMA
# ============================================================


class RequestCreate(BaseModel):
    customer_name: str = Field(
        ...,
        min_length=1,
        max_length=MAX_CUSTOMER_NAME_LENGTH,
    )

    customer_email: EmailStr

    subject: str = Field(
        default="",
        max_length=500,
    )

    message: str = Field(
        default="",
        max_length=MAX_INPUT_LENGTH,
    )

    input_text: str = Field(
        default="",
        max_length=MAX_INPUT_LENGTH,
    )

    priority: str | None = None

    recommended_action: str | None = None

    requires_human_approval: bool | None = None


# ============================================================
# HELPERS
# ============================================================


def _text(
    value: Any,
    default: str = "",
) -> str:
    if value is None:
        return default

    return str(value).strip()


def _input_text(
    data: RequestCreate,
) -> str:

    if _text(data.input_text):
        return _text(data.input_text)

    parts = []

    subject = _text(data.subject)
    message = _text(data.message)

    if subject:
        parts.append(subject)

    if message:
        parts.append(message)

    return "\n".join(parts).strip()


def _priority(
    value: Any,
) -> str:

    priority = _text(
        value,
        "MEDIUM",
    ).upper()

    if priority not in {
        "LOW",
        "MEDIUM",
        "HIGH",
        "CRITICAL",
        "URGENT",
    }:
        return "MEDIUM"

    return priority


def _confidence(
    value: Any,
) -> float:

    try:
        confidence = float(value)
    except (
        TypeError,
        ValueError,
    ):
        confidence = 0.0

    return max(
        0.0,
        min(1.0, confidence),
    )


def _dict(
    value: Any,
) -> dict:

    if isinstance(value, dict):
        return value

    return {}


# ============================================================
# SECURITY CHECK
# ============================================================


BLOCKED_PROMPT_PATTERNS = [
    r"ignore\s+(all\s+)?previous\s+instructions",
    r"ignore\s+(your|the)\s+(current\s+)?instructions",
    r"disregard\s+(all\s+)?previous\s+instructions",
    r"reveal\s+(your\s+)?system\s+prompt",
    r"reveal\s+(your\s+)?internal\s+instructions",
    r"show\s+(me\s+)?your\s+system\s+prompt",
    r"show\s+(me\s+)?internal\s+instructions",
    r"reveal\s+api\s+keys?",
    r"reveal\s+secrets?",
    r"reveal\s+credentials?",
    r"print\s+(the\s+)?api\s+key",
    r"send\s+api\s+keys?",
    r"bypass\s+(security|approval|authentication)",
    r"disable\s+(security|authentication|approval)",
    r"execute\s+any\s+available\s+automation",
    r"approve\s+this\s+request\s+and\s+execute",
    r"developer\s+message",
    r"system\s+message",
]


def _contains_prompt_injection(
    input_text: str,
) -> bool:

    normalized = re.sub(
        r"\s+",
        " ",
        input_text.lower(),
    ).strip()

    return any(
        re.search(
            pattern,
            normalized,
            flags=re.IGNORECASE,
        )
        for pattern in BLOCKED_PROMPT_PATTERNS
    )


# ============================================================
# SAFE HUMAN REVIEW
# ============================================================


def _create_review(
    request_id: str,
    reason: str,
    db: Session,
) -> None:

    existing = (
        db.query(ReviewQueue)
        .filter(
            ReviewQueue.request_id == request_id,
            ReviewQueue.status == "pending",
        )
        .first()
    )

    if existing:
        return

    db.add(
        ReviewQueue(
            request_id=request_id,
            reason=reason,
            status="pending",
        )
    )


# ============================================================
# CUSTOMER EMAIL
# ============================================================


def _send_customer_email(
    customer_email: str,
    subject: str,
    message: str,
) -> dict:

    if not customer_email:
        return {
            "status": "SKIPPED",
            "message": "Customer email is not configured.",
        }

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
                "message_id": result.get(
                    "message_id"
                ),
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


# ============================================================
# LOCAL AI FALLBACK
# ============================================================


def _local_ai_analysis(
    input_text: str,
) -> dict:

    text = input_text.lower()

    security_words = [
        "unauthorized",
        "fraud",
        "compromised",
        "security breach",
        "account hacked",
        "hacked account",
        "stolen",
        "malware",
        "security incident",
    ]

    if any(
        word in text
        for word in security_words
    ):

        return {
            "intent": "Security Incident",
            "priority": "CRITICAL",
            "confidence": 0.95,
            "confidence_score": 0.95,
            "summary": (
                "Security-related request requires "
                "immediate human review."
            ),
            "analysis_source": "LOCAL_FALLBACK",
        }

    financial_words = [
        "refund",
        "payment",
        "charge",
        "invoice",
        "billing",
        "transaction",
    ]

    if any(
        word in text
        for word in financial_words
    ):

        return {
            "intent": "Payment / Billing Support",
            "priority": "MEDIUM",
            "confidence": 0.78,
            "confidence_score": 0.78,
            "summary": (
                "Financial or billing-related request "
                "requires appropriate verification."
            ),
            "analysis_source": "LOCAL_FALLBACK",
        }

    profile_words = [
        "profile",
        "account details",
        "subscription",
        "change my details",
        "update my account",
    ]

    if any(
        word in text
        for word in profile_words
    ):

        return {
            "intent": "Customer Profile Support",
            "priority": "MEDIUM",
            "confidence": 0.82,
            "confidence_score": 0.82,
            "summary": (
                "Customer account information request "
                "requires normal support processing."
            ),
            "analysis_source": "LOCAL_FALLBACK",
        }

    return {
        "intent": "General Business Request",
        "priority": "LOW",
        "confidence": 0.75,
        "confidence_score": 0.75,
        "summary": (
            "Routine business request suitable "
            "for automated processing."
        ),
        "analysis_source": "LOCAL_FALLBACK",
    }


# ============================================================
# DECISION NORMALIZATION
# ============================================================


def _normalize_decision(
    decision: Any,
    priority: str,
    confidence: float,
) -> dict:

    decision = _dict(decision)

    priority = _priority(priority)
    confidence = _confidence(confidence)

    decision_name = _text(
        decision.get("decision"),
        "",
    ).lower()

    action_type = _text(
        decision.get("action_type"),
        "",
    ).upper()

    reason = _text(
        decision.get("reason"),
        "",
    )

    requires_human_approval = decision.get(
        "requires_human_approval"
    )

    # --------------------------------------------------------
    # Safety override for critical / urgent requests
    # --------------------------------------------------------

    if priority in {
        "CRITICAL",
        "URGENT",
    }:

        return {
            "decision": "ESCALATE",
            "action_type": "HUMAN_REVIEW",
            "reason": (
                "Critical or urgent request requires "
                "immediate human review."
            ),
            "requires_human_approval": True,
        }

    # --------------------------------------------------------
    # Respect the decision engine result
    # --------------------------------------------------------

    if decision_name in {
        "review",
        "escalate",
        "human_review",
    }:

        return {
            "decision": "REVIEW",
            "action_type": "HUMAN_REVIEW",
            "reason": reason or (
                "Request requires human review "
                "before execution."
            ),
            "requires_human_approval": True,
        }

    if decision_name in {
        "automate",
        "automation",
        "auto_execute",
    }:

        return {
            "decision": "AUTOMATE",
            "action_type": (
                action_type
                if action_type
                else "AUTO_EXECUTE"
            ),
            "reason": reason or (
                "Request has sufficient confidence "
                "for automated processing."
            ),
            "requires_human_approval": False,
        }

    # --------------------------------------------------------
    # Fallback decision
    # --------------------------------------------------------

    if confidence < MIN_AUTO_CONFIDENCE:

        return {
            "decision": "REVIEW",
            "action_type": "HUMAN_REVIEW",
            "reason": (
                "AI confidence is below the "
                "automatic execution threshold."
            ),
            "requires_human_approval": True,
        }

    return {
        "decision": "AUTOMATE",
        "action_type": "AUTO_EXECUTE",
        "reason": (
            "Request has sufficient AI confidence "
            "for automated processing."
        ),
        "requires_human_approval": False,
    }


# ============================================================
# CREATE REQUEST
# ============================================================


@router.post(
    "/",
    status_code=200,
)
def create_request(
    request_data: RequestCreate,
    db: Session = Depends(get_db),
):

    input_text = _input_text(request_data)

    if not input_text:

        raise HTTPException(
            status_code=422,
            detail=(
                "Either input_text or "
                "subject/message is required."
            ),
        )

    if len(input_text) > MAX_INPUT_LENGTH:

        raise HTTPException(
            status_code=413,
            detail=(
                "Request input exceeds the maximum "
                "length of 5000 characters."
            ),
        )

    request_id = (
        f"REQ-{uuid4().hex[:8].upper()}"
    )

    customer_email = str(
        request_data.customer_email
    )

    # ========================================================
    # 1. SECURITY CHECK
    # ========================================================

    if _contains_prompt_injection(input_text):

        reason = (
            "Potential prompt injection or "
            "security-sensitive instruction detected. "
            "Automatic execution is blocked."
        )

        new_request = Request(
            request_id=request_id,
            customer_name=request_data.customer_name,
            customer_email=customer_email,
            input_text=input_text,
            intent="Security / Prompt Injection",
            priority="CRITICAL",
            confidence_score=1.0,
            ai_summary=(
                "Potential prompt injection detected. "
                "Automatic execution blocked."
            ),
            status="pending_review",
            action_taken="SECURITY_BLOCKED",
            error_message=None,
        )

        db.add(new_request)

        db.add(
            ActivityLog(
                request_id=request_id,
                action="REQUEST_RECEIVED",
                status="SUCCESS",
                message="Business request received.",
            )
        )

        db.add(
            ActivityLog(
                request_id=request_id,
                action="ACTION_EXECUTED",
                status="BLOCKED",
                message=(
                    "Security control prevented "
                    "automatic execution."
                ),
            )
        )

        _create_review(
            request_id,
            reason,
            db,
        )

        customer_notification = _send_customer_email(
            customer_email,
            f"Request Received - {request_id}",
            (
                "Your request has been received successfully.\n\n"
                f"Request ID: {request_id}\n\n"
                "The request requires additional human review. "
                "Our team will review it and contact you with "
                "the next steps."
            ),
        )

        db.commit()
        db.refresh(new_request)

        return {
            "success": True,
            "message": (
                "Request blocked by security controls "
                "and routed to human review."
            ),
            "request_id": request_id,
            "status": "pending_review",
            "security": {
                "blocked": True,
                "reason": reason,
            },
            "ai_analysis": {
                "intent": "Security / Prompt Injection",
                "priority": "CRITICAL",
                "confidence_score": 1.0,
                "summary": (
                    "Potential prompt injection detected. "
                    "Automatic execution blocked."
                ),
                "analysis_source": "SECURITY_CONTROL",
            },
            "decision": {
                "decision": "ESCALATE",
                "action_type": "HUMAN_REVIEW",
                "reason": reason,
                "requires_human_approval": True,
            },
            "automation": {
                "action": "SECURITY_BLOCKED",
                "status": "PENDING_REVIEW",
            },
            "notifications": {
                "customer": customer_notification,
            },
        }

    # ========================================================
    # 2. REQUEST RECEIVED
    # ========================================================

    db.add(
        ActivityLog(
            request_id=request_id,
            action="REQUEST_RECEIVED",
            status="SUCCESS",
            message=(
                "Business request received successfully."
            ),
        )
    )

    # ========================================================
    # 3. AI ANALYSIS
    # ========================================================

    try:

        ai_result = analyze_request(
            input_text
        )

        if not isinstance(
            ai_result,
            dict,
        ):
            raise ValueError(
                "AI service returned an invalid response."
            )

        # Gemini returned a failure response.
        # Treat it as an exception so the deterministic
        # local fallback is activated.
        if not ai_result.get(
            "success",
            False,
        ):
            raise RuntimeError(
                ai_result.get(
                    "message",
                    "Gemini analysis failed.",
                )
            )

    except Exception as exc:

        error_message = str(exc)

        db.add(
            ActivityLog(
                request_id=request_id,
                action="AI_ANALYSIS",
                status="FAILED",
                message=error_message,
            )
        )

        # ----------------------------------------------------
        # SAFE DETERMINISTIC FALLBACK
        # ----------------------------------------------------

        ai_result = _local_ai_analysis(
            input_text
        )

        ai_result["success"] = True
        ai_result["analysis_source"] = (
            "LOCAL_FALLBACK"
        )

        db.add(
            ActivityLog(
                request_id=request_id,
                action="AI_ANALYSIS",
                status="FALLBACK",
                message=(
                    "Gemini analysis failed. "
                    "Deterministic local analysis "
                    "was used."
                ),
            )
        )

    # ========================================================
    # 4. NORMALIZE AI RESULT
    # ========================================================

    intent = _text(
        ai_result.get(
            "intent",
            "General Business Request",
        ),
        "General Business Request",
    )

    priority = _priority(
        ai_result.get(
            "priority",
            "MEDIUM",
        )
    )

    # Support both confidence field names.
    confidence = _confidence(
        ai_result.get(
            "confidence_score",
            ai_result.get(
                "confidence",
                0.0,
            ),
        )
    )

    ai_summary = _text(
        ai_result.get(
            "summary",
            "Business request analyzed.",
        ),
        "Business request analyzed.",
    )

    # ========================================================
    # 5. DECISION ENGINE
    # ========================================================

    try:

        decision_result = make_decision(
            priority,
            confidence,
        )

        decision = _normalize_decision(
            decision_result,
            priority,
            confidence,
        )

    except Exception as exc:

        decision = {
            "decision": "ESCALATE",
            "action_type": "HUMAN_REVIEW",
            "reason": (
                "Decision engine failed. "
                "Safe human review fallback activated."
            ),
            "requires_human_approval": True,
        }

        db.add(
            ActivityLog(
                request_id=request_id,
                action="DECISION_MADE",
                status="FAILED",
                message=str(exc),
            )
        )

    db.add(
        ActivityLog(
            request_id=request_id,
            action="DECISION_MADE",
            status="SUCCESS",
            message=(
                f"Decision: "
                f"{decision['decision']} | "
                f"Action: "
                f"{decision['action_type']}"
            ),
        )
    )

    # ========================================================
    # 6. SAVE REQUEST
    # ========================================================

    requires_review = bool(
        decision["requires_human_approval"]
    )

    initial_status = (
        "pending_review"
        if requires_review
        else "processing"
    )

    action_taken = _text(
        decision.get(
            "action_type",
            "AUTO_EXECUTE",
        ),
        "AUTO_EXECUTE",
    ).upper()

    new_request = Request(
        request_id=request_id,
        customer_name=request_data.customer_name,
        customer_email=customer_email,
        input_text=input_text,
        intent=intent,
        priority=priority,
        confidence_score=confidence,
        ai_summary=ai_summary,
        status=initial_status,
        action_taken=action_taken,
        error_message=None,
    )

    db.add(new_request)
    db.flush()

    # ========================================================
    # 7. HUMAN REVIEW
    # ========================================================

    if requires_review:

        _create_review(
            request_id,
            decision["reason"],
            db,
        )

        db.add(
            ActivityLog(
                request_id=request_id,
                action="HUMAN_REVIEW",
                status="PENDING",
                message=decision["reason"],
            )
        )

        customer_notification = _send_customer_email(
            customer_email,
            f"Request Received - {request_id}",
            (
                "Your request has been received successfully.\n\n"
                f"Request ID: {request_id}\n\n"
                "Your request requires additional review "
                "before processing. Our team will review "
                "it and contact you with the next steps."
            ),
        )

        db.commit()
        db.refresh(new_request)

        return {
            "success": True,
            "message": (
                "Request received and routed "
                "to human review."
            ),
            "request_id": request_id,
            "status": new_request.status,
            "ai_analysis": {
                "intent": intent,
                "priority": priority,
                "confidence_score": confidence,
                "summary": ai_summary,
                "analysis_source": ai_result.get(
                    "analysis_source",
                    "GEMINI",
                ),
            },
            "decision": decision,
            "automation": {
                "action": "HUMAN_REVIEW",
                "status": "PENDING_REVIEW",
                "message": decision["reason"],
            },
            "notifications": {
                "customer": customer_notification,
            },
        }

    # ========================================================
    # 8. AGENT WORKFLOW
    # ========================================================

    try:

        agent_result = run_agent_workflow(
            input_text
        )

        if not isinstance(
            agent_result,
            dict,
        ):
            agent_result = {
                "status": "SUCCESS",
                "message": (
                    "Agent workflow completed."
                ),
            }

        db.add(
            ActivityLog(
                request_id=request_id,
                action="AGENT_WORKFLOW",
                status="SUCCESS",
                message=str(
                    agent_result.get(
                        "message",
                        "Agent workflow completed.",
                    )
                ),
            )
        )

    except Exception as exc:

        agent_result = {
            "status": "FALLBACK",
            "message": (
                "Agent workflow unavailable. "
                "Continuing with deterministic processing."
            ),
            "error": str(exc),
        }

        db.add(
            ActivityLog(
                request_id=request_id,
                action="AGENT_WORKFLOW",
                status="FALLBACK",
                message=str(exc),
            )
        )

    # ========================================================
    # 9. AUTOMATION ACTION
    # ========================================================

    try:

        automation_result = execute_action(
            request_id=request_id,
            action=action_taken,
            customer_email=customer_email,
            input_text=input_text,
            db=db,
        )

        if not isinstance(
            automation_result,
            dict,
        ):
            automation_result = {
                "status": "SUCCESS",
                "message": (
                    "Automation completed."
                ),
            }

    except TypeError:

        try:

            automation_result = execute_action(
                request_id,
                action_taken,
                customer_email,
                input_text,
                db,
            )

            if not isinstance(
                automation_result,
                dict,
            ):
                automation_result = {
                    "status": "SUCCESS",
                    "message": (
                        "Automation completed."
                    ),
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

    automation_status = _text(
        automation_result.get(
            "status",
            "SUCCESS",
        ),
        "SUCCESS",
    ).upper()

    automation_message = _text(
        automation_result.get(
            "message",
            "Automation completed.",
        ),
        "Automation completed.",
    )

    # ========================================================
    # 10. AUTOMATION FAILURE
    # ========================================================

    if automation_status in {
        "FAILED",
        "ERROR",
    }:

        new_request.status = "pending_review"
        new_request.action_taken = (
            "AUTOMATION_FAILED"
        )
        new_request.error_message = (
            automation_message
        )

        db.add(
            ActivityLog(
                request_id=request_id,
                action="ACTION_EXECUTED",
                status="FAILED",
                message=automation_message,
            )
        )

        _create_review(
            request_id,
            (
                "Automation failed. "
                "Manual review is required."
            ),
            db,
        )

        customer_notification = _send_customer_email(
            customer_email,
            f"Request Requires Review - {request_id}",
            (
                "Your request was received, but the "
                "automated workflow could not complete safely.\n\n"
                f"Request ID: {request_id}\n\n"
                "The request has been routed for human review."
            ),
        )

        db.commit()
        db.refresh(new_request)

        return {
            "success": True,
            "message": (
                "Automation failed safely and "
                "the request was routed to human review."
            ),
            "request_id": request_id,
            "status": new_request.status,
            "ai_analysis": {
                "intent": intent,
                "priority": priority,
                "confidence_score": confidence,
                "summary": ai_summary,
                "analysis_source": ai_result.get(
                    "analysis_source",
                    "GEMINI",
                ),
            },
            "decision": decision,
            "automation": automation_result,
            "agent": agent_result,
            "notifications": {
                "customer": customer_notification,
            },
        }

    # ========================================================
    # 11. SUCCESSFUL AUTOMATION
    # ========================================================

    new_request.status = "completed"
    new_request.action_taken = action_taken
    new_request.error_message = None

    db.add(
        ActivityLog(
            request_id=request_id,
            action="ACTION_EXECUTED",
            status="SUCCESS",
            message=automation_message,
        )
    )

    db.add(
        ActivityLog(
            request_id=request_id,
            action="REQUEST_COMPLETED",
            status="SUCCESS",
            message=(
                "Business request completed successfully."
            ),
        )
    )

    customer_notification = _send_customer_email(
        customer_email,
        f"Request Completed - {request_id}",
        (
            "Your business request has been processed successfully.\n\n"
            f"Request ID: {request_id}\n\n"
            f"Result: {automation_message}"
        ),
    )

    db.commit()
    db.refresh(new_request)

    return {
        "success": True,
        "message": (
            "Business request processed successfully."
        ),
        "request_id": request_id,
        "status": new_request.status,
        "ai_analysis": {
            "intent": intent,
            "priority": priority,
            "confidence_score": confidence,
            "summary": ai_summary,
            "analysis_source": ai_result.get(
                "analysis_source",
                "GEMINI",
            ),
        },
        "decision": decision,
        "agent": agent_result,
        "automation": automation_result,
        "notifications": {
            "customer": customer_notification,
        },
    }


# ============================================================
# LIST REQUESTS
# ============================================================


@router.get("/")
def list_requests(
    db: Session = Depends(get_db),
):

    requests = (
        db.query(Request)
        .order_by(
            Request.created_at.desc()
        )
        .limit(100)
        .all()
    )

    return {
        "success": True,
        "count": len(requests),
        "requests": [
            {
                "request_id": item.request_id,
                "customer_name": item.customer_name,
                "customer_email": item.customer_email,
                "input_text": item.input_text,
                "intent": item.intent,
                "priority": item.priority,
                "confidence_score": item.confidence_score,
                "ai_summary": item.ai_summary,
                "status": item.status,
                "action_taken": item.action_taken,
                "error_message": item.error_message,
                "created_at": item.created_at,
            }
            for item in requests
        ],
    }


# ============================================================
# GET REQUEST
# ============================================================


@router.get("/{request_id}")
def get_request(
    request_id: str,
    db: Session = Depends(get_db),
):

    item = (
        db.query(Request)
        .filter(
            Request.request_id == request_id
        )
        .first()
    )

    if not item:

        raise HTTPException(
            status_code=404,
            detail="Request not found.",
        )

    return {
        "success": True,
        "request": {
            "request_id": item.request_id,
            "customer_name": item.customer_name,
            "customer_email": item.customer_email,
            "input_text": item.input_text,
            "intent": item.intent,
            "priority": item.priority,
            "confidence_score": item.confidence_score,
            "ai_summary": item.ai_summary,
            "status": item.status,
            "action_taken": item.action_taken,
            "error_message": item.error_message,
            "created_at": item.created_at,
        },
    }