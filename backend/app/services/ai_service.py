from typing import Any

from google import genai

from app.core.config import settings


# ============================================================
# AI SERVICE
# ============================================================


class AIService:
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise RuntimeError(
                "GEMINI_API_KEY is not configured."
            )

        self.client = genai.Client(
            api_key=settings.GEMINI_API_KEY
        )

        self.model = settings.GEMINI_MODEL

    def generate_text(
        self,
        prompt: str,
        system_prompt: str = (
            "You are an AI business automation assistant. "
            "Provide accurate, concise and useful business insights."
        ),
    ) -> str:

        full_prompt = f"""
{system_prompt}

{prompt}
"""

        response = self.client.models.generate_content(
            model=self.model,
            contents=full_prompt,
        )

        response_text = getattr(
            response,
            "text",
            None,
        )

        if not response_text:
            raise RuntimeError(
                "Gemini returned an empty response."
            )

        return response_text.strip()


ai_service = AIService()


# ============================================================
# HELPERS
# ============================================================


def _extract_value(
    text: str,
    label: str,
    next_label: str | None = None,
) -> str:

    if label not in text:
        return ""

    value = text.split(
        label,
        1,
    )[1]

    if next_label and next_label in value:
        value = value.split(
            next_label,
            1,
        )[0]

    return value.strip()


def _safe_confidence(
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


# ============================================================
# DOCUMENT SUMMARY
# ============================================================


def generate_summary(
    document_text: str,
) -> dict:

    prompt = f"""
Analyze the following business document.

Generate:
1. A concise summary.
2. Important business insights.

Return your response in exactly this format:

SUMMARY:
<summary>

INSIGHTS:
- <insight 1>
- <insight 2>
- <insight 3>

Document:
{document_text}
"""

    try:

        response_text = ai_service.generate_text(
            prompt
        )

        summary = ""
        insights = []

        if "SUMMARY:" in response_text:

            summary_part = response_text.split(
                "SUMMARY:",
                1,
            )[1]

            if "INSIGHTS:" in summary_part:

                summary, insights_part = (
                    summary_part.split(
                        "INSIGHTS:",
                        1,
                    )
                )

                summary = summary.strip()

                for line in insights_part.splitlines():

                    line = line.strip()

                    if line.startswith("-"):

                        insight = line[1:].strip()

                        if insight:
                            insights.append(
                                insight
                            )

            else:
                summary = summary_part.strip()

        else:
            summary = response_text.strip()

        return {
            "success": True,
            "summary": summary,
            "insights": insights,
            "message": (
                "Document summary generated successfully."
            ),
        }

    except Exception as exc:

        return {
            "success": False,
            "summary": "",
            "insights": [],
            "message": (
                f"AI analysis failed: {str(exc)}"
            ),
        }


# ============================================================
# BUSINESS REQUEST ANALYSIS
# ============================================================


def analyze_request(
    request_text: str,
) -> dict:
    """
    Analyze a business request using Gemini.

    Returns a normalized structure containing:

    - success
    - intent
    - priority
    - confidence
    - confidence_score
    - summary
    - analysis_source
    """

    prompt = f"""
Analyze the following business request.

Business Request:
{request_text}

Determine:

1. Intent
Identify the main purpose of the request.

2. Priority
Choose exactly one:
LOW
MEDIUM
HIGH
URGENT

3. Confidence
Give a confidence score between 0 and 1.

4. Summary
Write a short summary of the request.

Return ONLY this format:

INTENT:
<intent>

PRIORITY:
<LOW | MEDIUM | HIGH | URGENT>

CONFIDENCE:
<number between 0 and 1>

SUMMARY:
<short summary>
"""

    try:

        response_text = ai_service.generate_text(
            prompt,
            system_prompt=(
                "You are an AI business request "
                "classification assistant. "
                "Analyze requests carefully. "
                "Always return the exact requested "
                "INTENT, PRIORITY, CONFIDENCE and SUMMARY "
                "fields. "
                "Never omit CONFIDENCE."
            ),
        )

        # ----------------------------------------------------
        # Parse Gemini response
        # ----------------------------------------------------

        intent = _extract_value(
            response_text,
            "INTENT:",
            "PRIORITY:",
        )

        priority = _extract_value(
            response_text,
            "PRIORITY:",
            "CONFIDENCE:",
        ).upper()

        confidence_text = _extract_value(
            response_text,
            "CONFIDENCE:",
            "SUMMARY:",
        )

        summary = _extract_value(
            response_text,
            "SUMMARY:",
            None,
        )

        # ----------------------------------------------------
        # Validate priority
        # ----------------------------------------------------

        if priority not in {
            "LOW",
            "MEDIUM",
            "HIGH",
            "URGENT",
        }:
            priority = "MEDIUM"

        # ----------------------------------------------------
        # Parse confidence
        # ----------------------------------------------------

        confidence = _safe_confidence(
            confidence_text
        )

        # ----------------------------------------------------
        # Validate required AI fields
        # ----------------------------------------------------

        if not intent:
            raise ValueError(
                "Gemini response did not contain a valid INTENT."
            )

        if not summary:
            summary = request_text[:500]

        # ----------------------------------------------------
        # IMPORTANT:
        # Return BOTH confidence names so the API layer
        # remains compatible with existing code.
        # ----------------------------------------------------

        return {
            "success": True,
            "intent": intent,
            "priority": priority,
            "confidence": confidence,
            "confidence_score": confidence,
            "summary": summary,
            "analysis_source": "GEMINI",
            "message": (
                "Business request analyzed successfully."
            ),
        }

    except Exception as exc:

        return {
            "success": False,
            "intent": "",
            "priority": "MEDIUM",
            "confidence": 0.0,
            "confidence_score": 0.0,
            "summary": "",
            "analysis_source": "GEMINI_ERROR",
            "message": (
                f"Request analysis failed: {str(exc)}"
            ),
        }


# ============================================================
# AI ASSISTANT
# ============================================================


def generate_assistant_response(
    message: str,
    conversation_context: str = "",
) -> dict:
    """
    Generate a response for the FlowMind AI assistant.
    """

    prompt = f"""
You are the FlowMind AI business assistant.

Help the user with:

- business automation
- workflows
- documents
- tasks
- analytics
- operational decisions

User message:
{message}

Previous conversation context:
{conversation_context}

Instructions:

- Understand the user's natural-language request.
- Give a clear and useful response.
- If the request involves business automation,
  suggest practical next steps.
- Do not invent data that was not provided.
- Keep the response concise and professional.
- Use clear headings and bullet points when useful.
- Format the response cleanly for a web chat interface.
"""

    try:

        response = ai_service.generate_text(
            prompt
        )

        return {
            "success": True,
            "response": response,
            "message": (
                "AI assistant response "
                "generated successfully."
            ),
        }

    except Exception as exc:

        return {
            "success": False,
            "response": "",
            "message": (
                f"AI assistant failed: {str(exc)}"
            ),
        }