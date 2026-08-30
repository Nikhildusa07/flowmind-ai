from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.models import User
from app.analytics.service import get_analytics


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)


@router.get(
    "",
    status_code=200,
)
def analytics(
    days: int = Query(
        default=7,
        ge=1,
        le=365,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return operational analytics for the authenticated user.
    """

    return get_analytics(
        db=db,
        days=days,
    )