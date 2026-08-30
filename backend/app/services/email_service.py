import json
from urllib import error, request

from app.core.config import settings


BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    to_name: str | None = None,
) -> dict:
    """
    Send an email through the Brevo HTTP API.

    The Brevo API key is kept on the backend and loaded
    from the application's settings.
    """

    if not settings.BREVO_API_KEY:
        return {
            "success": False,
            "message": "BREVO_API_KEY is not configured.",
        }

    if not settings.BREVO_SENDER_EMAIL:
        return {
            "success": False,
            "message": "BREVO_SENDER_EMAIL is not configured.",
        }

    recipient = {
        "email": to_email,
    }

    if to_name:
        recipient["name"] = to_name

    payload = {
        "sender": {
            "email": settings.BREVO_SENDER_EMAIL,
            "name": "FlowMind AI",
        },
        "to": [recipient],
        "subject": subject,
        "htmlContent": html_content,
    }

    data = json.dumps(payload).encode("utf-8")

    req = request.Request(
        BREVO_API_URL,
        data=data,
        method="POST",
        headers={
            "accept": "application/json",
            "api-key": settings.BREVO_API_KEY,
            "content-type": "application/json",
        },
    )

    try:
        with request.urlopen(req, timeout=30) as response:
            response_body = response.read().decode(
                "utf-8"
            )

            response_data = (
                json.loads(response_body)
                if response_body
                else {}
            )

            return {
                "success": True,
                "message": "Email sent successfully.",
                "message_id": response_data.get(
                    "messageId"
                ),
            }

    except error.HTTPError as exc:
        try:
            error_body = exc.read().decode(
                "utf-8"
            )

            error_data = (
                json.loads(error_body)
                if error_body
                else {}
            )

            error_message = (
                error_data.get("message")
                or error_data.get("code")
                or f"Brevo API returned HTTP {exc.code}"
            )

        except Exception:
            error_message = (
                f"Brevo API returned HTTP {exc.code}"
            )

        return {
            "success": False,
            "message": f"Email sending failed: {error_message}",
        }

    except error.URLError as exc:
        return {
            "success": False,
            "message": (
                "Unable to connect to Brevo: "
                f"{exc.reason}"
            ),
        }

    except Exception as exc:
        return {
            "success": False,
            "message": (
                f"Email sending failed: {str(exc)}"
            ),
        }


def send_text_email(
    to_email: str,
    subject: str,
    message: str,
    to_name: str | None = None,
) -> dict:
    """
    Convenience helper for sending a plain-text
    message using a simple HTML wrapper.
    """

    escaped_message = (
        message.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\n", "<br>")
    )

    html_content = f"""
    <html>
        <body>
            <p>{escaped_message}</p>
        </body>
    </html>
    """

    return send_email(
        to_email=to_email,
        subject=subject,
        html_content=html_content,
        to_name=to_name,
    )


def send_business_response_email(
    to_email: str,
    subject: str,
    response_message: str,
    to_name: str | None = None,
) -> dict:
    """
    Send a professional FlowMind AI business response.
    """

    html_content = f"""
    <!DOCTYPE html>
    <html>
        <body
            style="
                margin: 0;
                padding: 0;
                background: #f5f7fb;
                font-family: Arial, sans-serif;
                color: #172033;
            "
        >
            <div
                style="
                    max-width: 640px;
                    margin: 40px auto;
                    background: #ffffff;
                    border-radius: 12px;
                    padding: 32px;
                    border: 1px solid #e5e7eb;
                "
            >
                <h2
                    style="
                        margin-top: 0;
                        color: #173b8f;
                    "
                >
                    FlowMind AI
                </h2>

                <p>
                    Dear {to_name or "Customer"},
                </p>

                <div
                    style="
                        line-height: 1.7;
                        white-space: normal;
                    "
                >
                    {response_message.replace(chr(10), "<br>")}
                </div>

                <p
                    style="
                        margin-top: 28px;
                        color: #667085;
                    "
                >
                    Regards,<br>
                    FlowMind AI
                </p>
            </div>
        </body>
    </html>
    """

    return send_email(
        to_email=to_email,
        subject=subject,
        html_content=html_content,
        to_name=to_name,
    )