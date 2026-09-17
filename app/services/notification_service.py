import uuid
from typing import Optional
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.core.logging import logger


class NotificationService:
    @staticmethod
    def send(
        db: Session,
        user_id: uuid.UUID,
        type_: str,
        title: str,
        message: str,
        entity_type: Optional[str] = None,
        entity_id: Optional[uuid.UUID] = None
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            type=type_,
            title=title,
            message=message,
            entity_type=entity_type,
            entity_id=entity_id,
            read=False
        )
        db.add(notification)
        db.flush()
        
        # Log event for notification dispatch
        logger.info(f"Notification sent to user {user_id}: [{type_}] {title}")
        return notification
