from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.models import (
    AutomationLog,
    Document,
    ExecutionStatus,
    Task,
    TaskStatus,
    WorkflowExecution,
)


def get_analytics(
    db: Session,
    days: int = 7,
) -> dict:
    """
    Generate operational analytics from existing database records.

    No external API or paid service is required.
    """

    if days < 1:
        days = 1

    now = datetime.utcnow()
    start_date = now - timedelta(days=days)

    # ============================================================
    # WORKFLOW EXECUTIONS
    # ============================================================

    total_executions = (
        db.query(func.count(WorkflowExecution.id))
        .filter(
            WorkflowExecution.created_at >= start_date
        )
        .scalar()
        or 0
    )

    completed_executions = (
        db.query(func.count(WorkflowExecution.id))
        .filter(
            WorkflowExecution.created_at >= start_date,
            WorkflowExecution.status == ExecutionStatus.COMPLETED,
        )
        .scalar()
        or 0
    )

    running_executions = (
        db.query(func.count(WorkflowExecution.id))
        .filter(
            WorkflowExecution.created_at >= start_date,
            WorkflowExecution.status == ExecutionStatus.RUNNING,
        )
        .scalar()
        or 0
    )

    pending_executions = (
        db.query(func.count(WorkflowExecution.id))
        .filter(
            WorkflowExecution.created_at >= start_date,
            WorkflowExecution.status == ExecutionStatus.PENDING,
        )
        .scalar()
        or 0
    )

    failed_executions = (
        db.query(func.count(WorkflowExecution.id))
        .filter(
            WorkflowExecution.created_at >= start_date,
            WorkflowExecution.status == ExecutionStatus.FAILED,
        )
        .scalar()
        or 0
    )

    cancelled_executions = (
        db.query(func.count(WorkflowExecution.id))
        .filter(
            WorkflowExecution.created_at >= start_date,
            WorkflowExecution.status == ExecutionStatus.CANCELLED,
        )
        .scalar()
        or 0
    )

    # ============================================================
    # TASKS
    # ============================================================

    total_tasks = (
        db.query(func.count(Task.id))
        .filter(
            Task.created_at >= start_date
        )
        .scalar()
        or 0
    )

    completed_tasks = (
        db.query(func.count(Task.id))
        .filter(
            Task.created_at >= start_date,
            Task.status == TaskStatus.COMPLETED,
        )
        .scalar()
        or 0
    )

    running_tasks = (
        db.query(func.count(Task.id))
        .filter(
            Task.created_at >= start_date,
            Task.status == TaskStatus.RUNNING,
        )
        .scalar()
        or 0
    )

    pending_tasks = (
        db.query(func.count(Task.id))
        .filter(
            Task.created_at >= start_date,
            Task.status == TaskStatus.PENDING,
        )
        .scalar()
        or 0
    )

    failed_tasks = (
        db.query(func.count(Task.id))
        .filter(
            Task.created_at >= start_date,
            Task.status == TaskStatus.FAILED,
        )
        .scalar()
        or 0
    )

    cancelled_tasks = (
        db.query(func.count(Task.id))
        .filter(
            Task.created_at >= start_date,
            Task.status == TaskStatus.CANCELLED,
        )
        .scalar()
        or 0
    )

    # ============================================================
    # DOCUMENTS
    # ============================================================

    total_documents = (
        db.query(func.count(Document.id))
        .filter(
            Document.created_at >= start_date
        )
        .scalar()
        or 0
    )

    processed_documents = (
        db.query(func.count(Document.id))
        .filter(
            Document.created_at >= start_date,
            Document.status == "processed",
        )
        .scalar()
        or 0
    )

    failed_documents = (
        db.query(func.count(Document.id))
        .filter(
            Document.created_at >= start_date,
            Document.status == "failed",
        )
        .scalar()
        or 0
    )

    # ============================================================
    # LOGS
    # ============================================================

    total_logs = (
        db.query(func.count(AutomationLog.id))
        .filter(
            AutomationLog.created_at >= start_date
        )
        .scalar()
        or 0
    )

    # ============================================================
    # SUCCESS RATES
    # ============================================================

    execution_success_rate = (
        round(
            completed_executions / total_executions * 100,
            2,
        )
        if total_executions
        else 0.0
    )

    task_success_rate = (
        round(
            completed_tasks / total_tasks * 100,
            2,
        )
        if total_tasks
        else 0.0
    )

    document_processing_rate = (
        round(
            processed_documents / total_documents * 100,
            2,
        )
        if total_documents
        else 0.0
    )

    # ============================================================
    # RETURN ANALYTICS
    # ============================================================

    return {
        "period": {
            "days": days,
            "start": start_date.isoformat(),
            "end": now.isoformat(),
        },
        "executions": {
            "total": total_executions,
            "completed": completed_executions,
            "running": running_executions,
            "pending": pending_executions,
            "failed": failed_executions,
            "cancelled": cancelled_executions,
            "success_rate": execution_success_rate,
        },
        "tasks": {
            "total": total_tasks,
            "completed": completed_tasks,
            "running": running_tasks,
            "pending": pending_tasks,
            "failed": failed_tasks,
            "cancelled": cancelled_tasks,
            "success_rate": task_success_rate,
        },
        "documents": {
            "total": total_documents,
            "processed": processed_documents,
            "failed": failed_documents,
            "processing_rate": document_processing_rate,
        },
        "logs": {
            "total": total_logs,
        },
    }