from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.models import (
    AutomationLog,
    ExecutionStatus,
    Task,
    TaskStatus,
    WorkflowExecution,
)


def get_monitoring_data(
    db: Session,
    days: int = 7,
) -> dict:
    """
    Return operational monitoring information
    from workflow executions, tasks, and automation logs.

    No external API or paid service is required.
    """

    if days < 1:
        days = 1

    now = datetime.utcnow()
    start_date = now - timedelta(days=days)

    # ============================================================
    # EXECUTION MONITORING
    # ============================================================

    total_executions = (
        db.query(func.count(WorkflowExecution.id))
        .filter(
            WorkflowExecution.created_at >= start_date
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

    failed_executions = (
        db.query(func.count(WorkflowExecution.id))
        .filter(
            WorkflowExecution.created_at >= start_date,
            WorkflowExecution.status == ExecutionStatus.FAILED,
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

    # ============================================================
    # TASK MONITORING
    # ============================================================

    total_tasks = (
        db.query(func.count(Task.id))
        .filter(
            Task.created_at >= start_date
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

    failed_tasks = (
        db.query(func.count(Task.id))
        .filter(
            Task.created_at >= start_date,
            Task.status == TaskStatus.FAILED,
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

    # ============================================================
    # LOG MONITORING
    # ============================================================

    total_logs = (
        db.query(func.count(AutomationLog.id))
        .filter(
            AutomationLog.created_at >= start_date
        )
        .scalar()
        or 0
    )

    error_logs = (
        db.query(func.count(AutomationLog.id))
        .filter(
            AutomationLog.created_at >= start_date,
            AutomationLog.level == "error",
        )
        .scalar()
        or 0
    )

    warning_logs = (
        db.query(func.count(AutomationLog.id))
        .filter(
            AutomationLog.created_at >= start_date,
            AutomationLog.level == "warning",
        )
        .scalar()
        or 0
    )

    info_logs = (
        db.query(func.count(AutomationLog.id))
        .filter(
            AutomationLog.created_at >= start_date,
            AutomationLog.level == "info",
        )
        .scalar()
        or 0
    )

    # ============================================================
    # HEALTH STATUS
    # ============================================================

    if failed_executions > 0 or failed_tasks > 0 or error_logs > 0:
        health_status = "warning"
    elif running_executions > 0 or running_tasks > 0:
        health_status = "active"
    else:
        health_status = "healthy"

    # ============================================================
    # RETURN MONITORING DATA
    # ============================================================

    return {
        "period": {
            "days": days,
            "start": start_date.isoformat(),
            "end": now.isoformat(),
        },
        "health": {
            "status": health_status,
        },
        "executions": {
            "total": total_executions,
            "completed": completed_executions,
            "running": running_executions,
            "failed": failed_executions,
        },
        "tasks": {
            "total": total_tasks,
            "completed": completed_tasks,
            "running": running_tasks,
            "failed": failed_tasks,
        },
        "logs": {
            "total": total_logs,
            "info": info_logs,
            "warning": warning_logs,
            "error": error_logs,
        },
    }