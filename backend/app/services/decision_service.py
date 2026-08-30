from typing import Any


# ============================================================
# DECISION CONFIGURATION
# ============================================================

AUTO_EXECUTION_CONFIDENCE = 0.60
HIGH_PRIORITY_CONFIDENCE = 0.80


# ============================================================
# DECISION ENGINE
# ============================================================


def make_decision(
    priority: Any,
    confidence: Any,
) -> dict[str, Any]:
    """
    Decide whether a business request should be automated
    or routed for human review.

    This signature matches the current requests.py usage:
        make_decision(priority, confidence)
    """

    # --------------------------------------------------------
    # Normalize priority
    # --------------------------------------------------------

    normalized_priority = str(
        priority or "MEDIUM"
    ).strip().upper()

    if normalized_priority not in {
        "LOW",
        "MEDIUM",
        "HIGH",
        "CRITICAL",
        "URGENT",
    }:
        normalized_priority = "MEDIUM"

    # --------------------------------------------------------
    # Normalize confidence
    # --------------------------------------------------------

    try:
        normalized_confidence = float(
            confidence
        )
    except (
        TypeError,
        ValueError,
    ):
        normalized_confidence = 0.0

    normalized_confidence = max(
        0.0,
        min(1.0, normalized_confidence),
    )

    # --------------------------------------------------------
    # Critical / urgent requests
    # --------------------------------------------------------

    if normalized_priority in {
        "CRITICAL",
        "URGENT",
    }:
        return {
            "success": True,
            "decision": "review",
            "action_type": "HUMAN_REVIEW",
            "reason": (
                "Critical or urgent requests require "
                "human review before automated action."
            ),
            "priority": normalized_priority,
            "confidence": normalized_confidence,
            "confidence_score": normalized_confidence,
            "requires_human_approval": True,
            "message": (
                "Request routed to human review "
                "because of its priority."
            ),
        }

    # --------------------------------------------------------
    # High-priority requests
    # --------------------------------------------------------

    if normalized_priority == "HIGH":

        if normalized_confidence < HIGH_PRIORITY_CONFIDENCE:
            return {
                "success": True,
                "decision": "review",
                "action_type": "HUMAN_REVIEW",
                "reason": (
                    "High-priority request has insufficient "
                    "AI confidence for automatic processing."
                ),
                "priority": normalized_priority,
                "confidence": normalized_confidence,
                "confidence_score": normalized_confidence,
                "requires_human_approval": True,
                "message": (
                    "High-priority request requires "
                    "human review."
                ),
            }

        return {
            "success": True,
            "decision": "automate",
            "action_type": "AUTO_EXECUTE",
            "reason": (
                "High-priority request has sufficient "
                "AI confidence for controlled automation."
            ),
            "priority": normalized_priority,
            "confidence": normalized_confidence,
            "confidence_score": normalized_confidence,
            "requires_human_approval": False,
            "message": (
                "High-priority request approved "
                "for automated processing."
            ),
        }

    # --------------------------------------------------------
    # Medium-priority requests
    # --------------------------------------------------------

    if normalized_priority == "MEDIUM":

        if normalized_confidence < AUTO_EXECUTION_CONFIDENCE:
            return {
                "success": True,
                "decision": "review",
                "action_type": "HUMAN_REVIEW",
                "reason": (
                    "Medium-priority request has AI confidence "
                    "below the automatic processing threshold."
                ),
                "priority": normalized_priority,
                "confidence": normalized_confidence,
                "confidence_score": normalized_confidence,
                "requires_human_approval": True,
                "message": (
                    "Request requires human review "
                    "because AI confidence is too low."
                ),
            }

        return {
            "success": True,
            "decision": "automate",
            "action_type": "AUTO_EXECUTE",
            "reason": (
                "Medium-priority request has sufficient "
                "AI confidence for automated processing."
            ),
            "priority": normalized_priority,
            "confidence": normalized_confidence,
            "confidence_score": normalized_confidence,
            "requires_human_approval": False,
            "message": (
                "Request approved for automated processing."
            ),
        }

    # --------------------------------------------------------
    # Low-priority requests
    # --------------------------------------------------------

    if normalized_confidence < AUTO_EXECUTION_CONFIDENCE:
        return {
            "success": True,
            "decision": "review",
            "action_type": "HUMAN_REVIEW",
            "reason": (
                "AI confidence is below the automatic "
                "processing threshold."
            ),
            "priority": normalized_priority,
            "confidence": normalized_confidence,
            "confidence_score": normalized_confidence,
            "requires_human_approval": True,
            "message": (
                "Request requires human review "
                "because AI confidence is too low."
            ),
        }

    return {
        "success": True,
        "decision": "automate",
        "action_type": "AUTO_EXECUTE",
        "reason": (
            "Request is low risk and has sufficient "
            "AI confidence for automated processing."
        ),
        "priority": normalized_priority,
        "confidence": normalized_confidence,
        "confidence_score": normalized_confidence,
        "requires_human_approval": False,
        "message": (
            "Request approved for automated processing."
        ),
    }