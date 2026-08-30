import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.models import (
    AutomationLog,
    ExecutionStatus,
    LogLevel,
    Task,
    TaskStatus,
    User,
    Workflow,
    WorkflowExecution,
    WorkflowStatus,
    WorkflowStep,
)
from app.schemas.workflows import (
    TaskResponse,
    WorkflowCreate,
    WorkflowExecuteRequest,
    WorkflowExecutionResponse,
    WorkflowResponse,
    WorkflowStepCreate,
    WorkflowStepResponse,
    WorkflowUpdate,
)


router = APIRouter(
    prefix="/workflows",
    tags=["Workflows"],
)


# ============================================================
# HELPERS
# ============================================================


def get_user_workflow(
    workflow_id: str,
    user: User,
    db: Session,
) -> Workflow:
    workflow = db.scalar(
        select(Workflow).where(
            Workflow.id == workflow_id,
            Workflow.owner_id == user.id,
        )
    )

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found",
        )

    return workflow


# ============================================================
# CREATE WORKFLOW
# ============================================================


@router.post(
    "",
    response_model=WorkflowResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_workflow(
    workflow_data: WorkflowCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workflow = Workflow(
        name=workflow_data.name,
        description=workflow_data.description,
        owner_id=current_user.id,
        status=WorkflowStatus.DRAFT,
        version=1,
    )

    db.add(workflow)
    db.commit()
    db.refresh(workflow)

    return workflow


# ============================================================
# LIST WORKFLOWS
# ============================================================


@router.get(
    "",
    response_model=list[WorkflowResponse],
)
def list_workflows(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workflows = db.scalars(
        select(Workflow)
        .where(Workflow.owner_id == current_user.id)
        .order_by(Workflow.created_at.desc())
    ).all()

    return workflows


# ============================================================
# GET WORKFLOW
# ============================================================


@router.get(
    "/{workflow_id}",
    response_model=WorkflowResponse,
)
def get_workflow(
    workflow_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_user_workflow(
        workflow_id,
        current_user,
        db,
    )


# ============================================================
# UPDATE WORKFLOW
# ============================================================


@router.put(
    "/{workflow_id}",
    response_model=WorkflowResponse,
)
def update_workflow(
    workflow_id: str,
    workflow_data: WorkflowUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workflow = get_user_workflow(
        workflow_id,
        current_user,
        db,
    )

    if workflow_data.name is not None:
        workflow.name = workflow_data.name

    if workflow_data.description is not None:
        workflow.description = workflow_data.description

    if workflow_data.status is not None:
        workflow.status = workflow_data.status

    workflow.version += 1
    workflow.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(workflow)

    return workflow


# ============================================================
# DELETE WORKFLOW
# ============================================================


@router.delete(
    "/{workflow_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_workflow(
    workflow_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workflow = get_user_workflow(
        workflow_id,
        current_user,
        db,
    )

    db.delete(workflow)
    db.commit()

    return None


# ============================================================
# CREATE WORKFLOW STEP
# ============================================================


@router.post(
    "/{workflow_id}/steps",
    response_model=WorkflowStepResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_workflow_step(
    workflow_id: str,
    step_data: WorkflowStepCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workflow = get_user_workflow(
        workflow_id,
        current_user,
        db,
    )

    existing_step = db.scalar(
        select(WorkflowStep).where(
            WorkflowStep.workflow_id == workflow.id,
            WorkflowStep.step_order == step_data.step_order,
        )
    )

    if existing_step:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A workflow step already exists at this order",
        )

    step = WorkflowStep(
        workflow_id=workflow.id,
        name=step_data.name,
        step_type=step_data.step_type,
        step_order=step_data.step_order,
        configuration=step_data.configuration,
    )

    db.add(step)

    workflow.version += 1
    workflow.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(step)

    return step


# ============================================================
# LIST WORKFLOW STEPS
# ============================================================


@router.get(
    "/{workflow_id}/steps",
    response_model=list[WorkflowStepResponse],
)
def list_workflow_steps(
    workflow_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workflow = get_user_workflow(
        workflow_id,
        current_user,
        db,
    )

    steps = db.scalars(
        select(WorkflowStep)
        .where(WorkflowStep.workflow_id == workflow.id)
        .order_by(WorkflowStep.step_order)
    ).all()

    return steps


# ============================================================
# EXECUTE WORKFLOW
# ============================================================


@router.post(
    "/{workflow_id}/execute",
    response_model=WorkflowExecutionResponse,
)
def execute_workflow(
    workflow_id: str,
    execution_data: WorkflowExecuteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workflow = get_user_workflow(
        workflow_id,
        current_user,
        db,
    )

    if workflow.status != WorkflowStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only active workflows can be executed",
        )

    steps = db.scalars(
        select(WorkflowStep)
        .where(WorkflowStep.workflow_id == workflow.id)
        .order_by(WorkflowStep.step_order)
    ).all()

    if not steps:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workflow has no steps",
        )

    execution = WorkflowExecution(
        workflow_id=workflow.id,
        status=ExecutionStatus.RUNNING,
        trigger_type=execution_data.trigger_type,
        input_data=execution_data.input_data,
        started_at=datetime.utcnow(),
    )

    db.add(execution)
    db.flush()

    try:
        previous_output = execution_data.input_data

        for step in steps:
            task = Task(
                name=step.name,
                task_type=step.step_type,
                status=TaskStatus.RUNNING,
                execution_id=execution.id,
                user_id=current_user.id,
                input_data=previous_output,
            )

            db.add(task)
            db.flush()

            # ------------------------------------------------
            # Basic execution engine
            # ------------------------------------------------

            if step.configuration:
                try:
                    configuration = json.loads(step.configuration)
                except json.JSONDecodeError:
                    configuration = {
                        "raw_configuration": step.configuration
                    }
            else:
                configuration = {}

            result = {
                "step": step.name,
                "step_type": step.step_type,
                "status": "completed",
                "configuration": configuration,
                "input": previous_output,
            }

            previous_output = json.dumps(result)

            task.output_data = previous_output
            task.status = TaskStatus.COMPLETED
            task.completed_at = datetime.utcnow()

            db.add(
                AutomationLog(
                    user_id=current_user.id,
                    workflow_id=workflow.id,
                    execution_id=execution.id,
                    level=LogLevel.INFO,
                    message=f"Workflow step completed: {step.name}",
                    details=previous_output,
                )
            )

        execution.status = ExecutionStatus.COMPLETED
        execution.output_data = previous_output
        execution.completed_at = datetime.utcnow()

        db.add(
            AutomationLog(
                user_id=current_user.id,
                workflow_id=workflow.id,
                execution_id=execution.id,
                level=LogLevel.INFO,
                message=f"Workflow completed: {workflow.name}",
                details=previous_output,
            )
        )

        db.commit()
        db.refresh(execution)

        return execution

    except Exception as exc:
        execution.status = ExecutionStatus.FAILED
        execution.error_message = str(exc)
        execution.completed_at = datetime.utcnow()

        db.add(
            AutomationLog(
                user_id=current_user.id,
                workflow_id=workflow.id,
                execution_id=execution.id,
                level=LogLevel.ERROR,
                message=f"Workflow failed: {workflow.name}",
                details=str(exc),
            )
        )

        db.commit()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Workflow execution failed",
        )


# ============================================================
# LIST EXECUTIONS
# ============================================================


@router.get(
    "/{workflow_id}/executions",
    response_model=list[WorkflowExecutionResponse],
)
def list_workflow_executions(
    workflow_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workflow = get_user_workflow(
        workflow_id,
        current_user,
        db,
    )

    executions = db.scalars(
        select(WorkflowExecution)
        .where(
            WorkflowExecution.workflow_id == workflow.id
        )
        .order_by(WorkflowExecution.created_at.desc())
    ).all()

    return executions


# ============================================================
# GET EXECUTION TASKS
# ============================================================


@router.get(
    "/{workflow_id}/executions/{execution_id}/tasks",
    response_model=list[TaskResponse],
)
def get_execution_tasks(
    workflow_id: str,
    execution_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workflow = get_user_workflow(
        workflow_id,
        current_user,
        db,
    )

    execution = db.scalar(
        select(WorkflowExecution).where(
            WorkflowExecution.id == execution_id,
            WorkflowExecution.workflow_id == workflow.id,
        )
    )

    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow execution not found",
        )

    tasks = db.scalars(
        select(Task)
        .where(Task.execution_id == execution.id)
        .order_by(Task.created_at)
    ).all()

    return tasks