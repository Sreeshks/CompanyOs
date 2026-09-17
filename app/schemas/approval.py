import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, model_validator


class ClientApprovalOut(BaseModel):
    id: uuid.UUID
    content_id: uuid.UUID
    client_id: uuid.UUID
    approval_status: str
    rejection_reason: Optional[str] = None
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    access_token: str
    token_expires_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ApprovalDecisionRequest(BaseModel):
    decision: str  # 'approved' or 'rejected'
    rejection_reason: Optional[str] = None
    approved_by_name: Optional[str] = "Client Reviewer"

    @model_validator(mode="after")
    def validate_rejection_reason(self):
        if self.decision.lower() == "rejected" and (not self.rejection_reason or not self.rejection_reason.strip()):
            raise ValueError("rejection_reason is mandatory when rejecting content")
        return self


class PublicContentReviewOut(BaseModel):
    content_id: uuid.UUID
    file_name: str
    display_name: str
    client_name: str
    target_month: Optional[str] = None
    approval_status: str
    rejection_reason: Optional[str] = None
    preview_url: Optional[str] = None
    token_valid: bool = True
