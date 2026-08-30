from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.models.models import AutomationAction, ActivityLog


# ============================================================
# AUTOMATION SERVICE
# ============================================================


def execute_action(
    request_id: str,
    action: str = "AUTO_EXECUTE",
    customer_email: str | None = None,
    input_text: str | None = None,
    db: Session | None = None,
) -> dict[str, Any]:
    """
    Execute the approved business automation action.

    Compatible with requests.py:

        execute_action(
            request_id=request_id,
            action=action_taken,
            customer_email=customer_email,
            input_text=input_text,
            db=db,
        )
    """

    normalized_action = str(
        action or "AUTO_EXECUTE"
    ).strip().upper()

    # ========================================================
    # HUMAN REVIEW
    # ========================================================

    if normalized_action in {
        "HUMAN_REVIEW",
        "REVIEW",
        "ESCALATE",
    }:

        result = {
            "success": True,
            "status": "PENDING_REVIEW",
            "action": "HUMAN_REVIEW",
            "message": (
                "Request has been routed to human review."
            ),
        }

        if db is not None:
            db.add(
                AutomationAction(
                    request_id=request_id,
                    action_type="HUMAN_REVIEW",
                    status="PENDING",
                    input_data=input_text,
                    output_data=result["message"],
                )
            )

            db.add(
                ActivityLog(
                    request_id=request_id,
                    action="ACTION_EXECUTED",
                    status="PENDING",
                    message=result["message"],
                )
            )

        return result

    # ========================================================
    # AUTO EXECUTION
    # ========================================================

    if normalized_action in {
        "AUTO_EXECUTE",
        "AUTOMATE",
    }:

        message = (
            "Business request was processed successfully "
            "through automated workflow."
        )

        result = {
            "success": True,
            "status": "SUCCESS",
            "action": "AUTO_EXECUTE",
            "message": message,
            "customer_email": customer_email,
            "processed_at": datetime.utcnow().isoformat(),
        }

        if db is not None:
            db.add(
                AutomationAction(
                    request_id=request_id,
                    action_type="AUTO_EXECUTE",
                    status="COMPLETED",
                    input_data=input_text,
                    output_data=message,
                    completed_at=datetime.utcnow(),
                )
            )

            db.add(
                ActivityLog(
                    request_id=request_id,
                    action="ACTION_EXECUTED",
                    status="SUCCESS",
                    message=message,
                )
            )

        return result

    # ========================================================
    # UNSUPPORTED ACTION
    # ========================================================

    message = (
        f"Unsupported automation action: "
        f"{normalized_action}"
    )

    if db is not None:
        db.add(
            AutomationAction(
                request_id=request_id,
                action_type=normalized_action,
                status="FAILED",
                input_data=input_text,
                error_message=message,
            )
        )

        db.add(
            ActivityLog(
                request_id=request_id,
                action="ACTION_EXECUTED",
                status="FAILED",
                message=message,
            )
        )

    return {
        "success": False,
        "status": "FAILED",
        "action": normalized_action,
        "message": message,
    }