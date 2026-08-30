from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.models import (
    ExecutionStatus,
    TaskStatus,
    WorkflowStatus,
)


# ============================================================
# WORKFLOW
# ============================================================


class WorkflowCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None


class WorkflowUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: WorkflowStatus | None = None


class WorkflowResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str | None
    status: WorkflowStatus
    version: int
    owner_id: str
    created_at: datetime
    updated_at: datetime


# ============================================================
# WORKFLOW STEP
# ============================================================


class WorkflowStepCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    step_type: str = Field(..., min_length=1, max_length=100)
    step_order: int = Field(..., ge=1)
    configuration: str | None = None


class WorkflowStepResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workflow_id: str
    name: str
    step_type: str
    step_order: int
    configuration: str | None
    created_at: datetime


# ============================================================
# WORKFLOW EXECUTION
# ============================================================


class WorkflowExecuteRequest(BaseModel):
    trigger_type: str = Field(
        default="manual",
        min_length=1,
        max_length=100,
    )
    input_data: str | None = None


class WorkflowExecutionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workflow_id: str
    status: ExecutionStatus
    trigger_type: str
    input_data: str | None
    output_data: str | None
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime


# ============================================================
# TASK
# ============================================================


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    task_type: str
    status: TaskStatus
    execution_id: str | None
    user_id: str
    input_data: str | None
    output_data: str | None
    error_message: str | None
    created_at: datetime
    completed_at: datetime | None