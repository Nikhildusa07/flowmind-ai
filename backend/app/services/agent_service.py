from app.services.ai_service import analyze_request


def run_agent_workflow(
    request_text: str,
) -> dict:
    """
    Run the AI agent workflow for a business request.

    The workflow:
    1. Analyzes the request using Gemini.
    2. Determines intent, priority and confidence.
    3. Returns the structured result for the request API.
    """

    analysis = analyze_request(request_text)

    if not analysis["success"]:
        return {
            "success": False,
            "message": analysis["message"],
            "intent": "",
            "priority": "MEDIUM",
            "confidence": 0.0,
            "summary": "",
        }

    return {
        "success": True,
        "message": "Agent workflow completed successfully.",
        "intent": analysis["intent"],
        "priority": analysis["priority"],
        "confidence": analysis["confidence"],
        "summary": analysis["summary"],
    }