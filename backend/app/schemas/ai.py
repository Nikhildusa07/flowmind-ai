from pydantic import BaseModel, Field


class AIChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=5000,
    )


class AIChatResponse(BaseModel):
    success: bool
    response: str
    conversation_id: str | None = None
    message: str