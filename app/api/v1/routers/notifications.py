import uuid
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user
from app.core.exceptions import NotFoundException
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationOut
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=ApiResponse[List[NotificationOut]], summary="List current user notifications")
def list_notifications(
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.read == False)
    items = query.order_by(Notification.created_at.desc()).limit(50).all()
    return ApiResponse(success=True, data=[NotificationOut.model_validate(i) for i in items])


@router.patch("/{notification_id}/read", response_model=ApiResponse[bool], summary="Mark notification as read")
def mark_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise NotFoundException("Notification", notification_id)

    notif.read = True
    db.commit()
    return ApiResponse(success=True, data=True, message="Notification marked as read")


@router.post("/mark-all-read", response_model=ApiResponse[bool], summary="Mark all notifications as read")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == False
    ).update({"read": True})
    db.commit()
    return ApiResponse(success=True, data=True, message="All notifications marked as read")
