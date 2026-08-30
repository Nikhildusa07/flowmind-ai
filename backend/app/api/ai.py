import json
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.models import AIConversation, User
from app.schemas.ai import AIChatRequest, AIChatResponse
from app.services.ai_service import generate_assistant_response


router = APIRouter(
    prefix="/ai",
    tags=["AI Assistant"],
)


@router.post(
    "/chat",
    response_model=AIChatResponse,
    status_code=status.HTTP_200_OK,
)
def chat_with_ai(
    request: AIChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send a message to the AI business assistant.

    Conversation history is stored for the authenticated user.
    """

    conversation = (
        db.query(AIConversation)
        .filter(
            AIConversation.user_id == current_user.id
        )
        .order_by(
            AIConversation.updated_at.desc()
        )
        .first()
    )

    if conversation:
        try:
            messages = json.loads(
                conversation.messages or "[]"
            )
        except (json.JSONDecodeError, TypeError):
            messages = []
    else:
        conversation = AIConversation(
            id=str(uuid4()),
            user_id=current_user.id,
            title=request.message[:255],
            messages="[]",
        )

        db.add(conversation)
        db.flush()

        messages = []

    conversation_context = ""

    if messages:
        context_messages = messages[-10:]

        conversation_context = "\n".join(
            [
                f"{item.get('role', 'user').upper()}: "
                f"{item.get('content', '')}"
                for item in context_messages
            ]
        )

    result = generate_assistant_response(
        message=request.message,
        conversation_context=conversation_context,
    )

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["message"],
        )

    messages.append(
        {
            "role": "user",
            "content": request.message,
        }
    )

    messages.append(
        {
            "role": "assistant",
            "content": result["response"],
        }
    )

    conversation.messages = json.dumps(
        messages,
        ensure_ascii=False,
    )

    db.commit()
    db.refresh(conversation)

    return AIChatResponse(
        success=True,
        response=result["response"],
        conversation_id=conversation.id,
        message=result["message"],
    )