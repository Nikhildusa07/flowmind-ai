from app.core.database import Base, engine

from app.models.models import (
    AIConversation,
    AutomationLog,
    Document,
    Task,
    User,
    Workflow,
    WorkflowExecution,
    WorkflowStep,
)


def initialize_database() -> None:
    Base.metadata.create_all(bind=engine)