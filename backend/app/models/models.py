from datetime import datetime
from enum import Enum
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


# ============================================================
# ENUMS
# ============================================================


class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"


class WorkflowStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"


class ExecutionStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class DocumentStatus(str, Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"


class LogLevel(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"


# ============================================================
# USER
# ============================================================


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    full_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    role: Mapped[UserRole] = mapped_column(
        default=UserRole.USER,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    workflows: Mapped[list["Workflow"]] = relationship(
        back_populates="owner",
        cascade="all, delete-orphan",
    )

    documents: Mapped[list["Document"]] = relationship(
        back_populates="owner",
        cascade="all, delete-orphan",
    )

    conversations: Mapped[list["AIConversation"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    tasks: Mapped[list["Task"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    logs: Mapped[list["AutomationLog"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    requests: Mapped[list["Request"]] = relationship(
        back_populates="owner",
        cascade="all, delete-orphan",
    )


# ============================================================
# WORKFLOW
# ============================================================


class Workflow(Base):
    __tablename__ = "workflows"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[WorkflowStatus] = mapped_column(
        default=WorkflowStatus.DRAFT,
        nullable=False,
    )

    version: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )

    owner_id: Mapped[str] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    owner: Mapped["User"] = relationship(
        back_populates="workflows",
    )

    steps: Mapped[list["WorkflowStep"]] = relationship(
        back_populates="workflow",
        cascade="all, delete-orphan",
        order_by="WorkflowStep.step_order",
    )

    executions: Mapped[list["WorkflowExecution"]] = relationship(
        back_populates="workflow",
        cascade="all, delete-orphan",
    )


# ============================================================
# WORKFLOW STEP
# ============================================================


class WorkflowStep(Base):
    __tablename__ = "workflow_steps"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )

    workflow_id: Mapped[str] = mapped_column(
        ForeignKey("workflows.id"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    step_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    step_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    configuration: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    workflow: Mapped["Workflow"] = relationship(
        back_populates="steps",
    )


# ============================================================
# WORKFLOW EXECUTION
# ============================================================


class WorkflowExecution(Base):
    __tablename__ = "workflow_executions"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )

    workflow_id: Mapped[str] = mapped_column(
        ForeignKey("workflows.id"),
        nullable=False,
        index=True,
    )

    status: Mapped[ExecutionStatus] = mapped_column(
        default=ExecutionStatus.PENDING,
        nullable=False,
    )

    trigger_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    input_data: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    output_data: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    started_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    workflow: Mapped["Workflow"] = relationship(
        back_populates="executions",
    )

    tasks: Mapped[list["Task"]] = relationship(
        back_populates="execution",
        cascade="all, delete-orphan",
    )


# ============================================================
# TASK
# ============================================================


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    task_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    status: Mapped[TaskStatus] = mapped_column(
        default=TaskStatus.PENDING,
        nullable=False,
    )

    execution_id: Mapped[str | None] = mapped_column(
        ForeignKey("workflow_executions.id"),
        nullable=True,
        index=True,
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    input_data: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    output_data: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    execution: Mapped["WorkflowExecution | None"] = relationship(
        back_populates="tasks",
    )

    user: Mapped["User"] = relationship(
        back_populates="tasks",
    )


# ============================================================
# DOCUMENT
# ============================================================


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )

    filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    file_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    file_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    status: Mapped[DocumentStatus] = mapped_column(
        default=DocumentStatus.UPLOADED,
        nullable=False,
    )

    extracted_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    owner_id: Mapped[str] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    owner: Mapped["User"] = relationship(
        back_populates="documents",
    )


# ============================================================
# AI CONVERSATION
# ============================================================


class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    title: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    messages: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="[]",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    user: Mapped["User"] = relationship(
        back_populates="conversations",
    )


# ============================================================
# AUTOMATION LOG
# ============================================================


class AutomationLog(Base):
    __tablename__ = "automation_logs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )

    user_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    workflow_id: Mapped[str | None] = mapped_column(
        ForeignKey("workflows.id"),
        nullable=True,
        index=True,
    )

    execution_id: Mapped[str | None] = mapped_column(
        ForeignKey("workflow_executions.id"),
        nullable=True,
        index=True,
    )

    level: Mapped[LogLevel] = mapped_column(
        default=LogLevel.INFO,
        nullable=False,
    )

    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    details: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    user: Mapped["User | None"] = relationship(
        back_populates="logs",
    )


# ============================================================
# BUSINESS REQUEST
# ============================================================


class Request(Base):
    __tablename__ = "business_requests"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )

    request_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    customer_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    customer_email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )

    input_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    intent: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    priority: Mapped[str] = mapped_column(
        String(30),
        default="MEDIUM",
        nullable=False,
    )

    confidence_score: Mapped[float] = mapped_column(
        default=0.0,
        nullable=False,
    )

    ai_summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="processing",
        nullable=False,
        index=True,
    )

    action_taken: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    owner_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    owner: Mapped["User | None"] = relationship(
        back_populates="requests",
    )

    activities: Mapped[list["ActivityLog"]] = relationship(
        back_populates="request",
        cascade="all, delete-orphan",
    )

    reviews: Mapped[list["ReviewQueue"]] = relationship(
        back_populates="request",
        cascade="all, delete-orphan",
    )

    automation_actions: Mapped[list["AutomationAction"]] = relationship(
        back_populates="request",
        cascade="all, delete-orphan",
    )


# ============================================================
# REQUEST ACTIVITY LOG
# ============================================================


class ActivityLog(Base):
    __tablename__ = "request_activity_logs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )

    request_id: Mapped[str] = mapped_column(
        ForeignKey("business_requests.request_id"),
        nullable=False,
        index=True,
    )

    action: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    request: Mapped["Request"] = relationship(
        back_populates="activities",
    )


# ============================================================
# HUMAN REVIEW QUEUE
# ============================================================


class ReviewQueue(Base):
    __tablename__ = "review_queue"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )

    request_id: Mapped[str] = mapped_column(
        ForeignKey("business_requests.request_id"),
        nullable=False,
        index=True,
    )

    reason: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="pending",
        nullable=False,
        index=True,
    )

    reviewer_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    review_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    request: Mapped["Request"] = relationship(
        back_populates="reviews",
    )


# ============================================================
# AUTOMATION ACTION
# ============================================================


class AutomationAction(Base):
    __tablename__ = "automation_actions"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )

    request_id: Mapped[str] = mapped_column(
        ForeignKey("business_requests.request_id"),
        nullable=False,
        index=True,
    )

    action_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    input_data: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    output_data: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    request: Mapped["Request"] = relationship(
        back_populates="automation_actions",
    )