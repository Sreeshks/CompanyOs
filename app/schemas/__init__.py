from app.schemas.common import ApiResponse, ErrorDetail, PaginationParams, PaginatedResponse
from app.schemas.auth import LoginRequest, Token, RefreshTokenRequest, TokenPayload
from app.schemas.role import RoleCreate, RoleUpdate, RoleOut, PermissionOut, RolePermissionUpdate
from app.schemas.user import UserCreate, UserUpdate, UserStatusUpdate, UserResetPassword, UserOut, UserSkillCreate, UserSkillOut
from app.schemas.master_data import (
    DepartmentCreate, DepartmentUpdate, DepartmentOut,
    DesignationCreate, DesignationUpdate, DesignationOut,
    BillingCompanyCreate, BillingCompanyUpdate, BillingCompanyOut,
    ServiceCreate, ServiceUpdate, ServiceOut,
    PackageCreate, PackageUpdate, PackageOut, PackageTaskCreate, PackageTaskOut,
    TaskTypeCreate, TaskTypeUpdate, TaskTypeOut,
    ContentTypeCreate, ContentTypeOut
)
from app.schemas.client import (
    ClientStatusCreate, ClientStatusOut,
    ClientStatusTransitionCreate, ClientStatusTransitionOut,
    ClientCreate, ClientUpdate, ClientOut,
    ClientStaffAssignmentCreate, ClientStaffAssignmentOut,
    PipelineTransitionRequest
)
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate, WorkspaceOut
from app.schemas.folder import FolderCreate, FolderUpdate, FolderMoveRequest, FolderOut, FolderTreeOut
from app.schemas.workflow import (
    WorkflowCreate, WorkflowOut,
    WorkflowStageCreate, WorkflowStageOut,
    WorkflowTransitionCreate, WorkflowTransitionOut
)
from app.schemas.content import (
    ContentItemCreate, ContentItemUpdate, ContentItemOut,
    ContentTransitionRequest, ContentMoveFolderRequest
)
from app.schemas.task import (
    TaskCreate, TaskUpdate, TaskOut,
    TaskCompleteRequest, TaskReassignRequest,
    TaskAssignmentHistoryOut, TaskHistoryOut
)
from app.schemas.approval import ClientApprovalOut, ApprovalDecisionRequest, PublicContentReviewOut
from app.schemas.rejection import RejectionOut, RejectionResolveRequest
from app.schemas.document import (
    DocumentTypeOut, DocumentItemCreate, DocumentItemOut,
    DocumentCreate, DocumentStatusUpdate, DocumentOut
)
from app.schemas.notification import NotificationOut
from app.schemas.audit import AuditLogOut
from app.schemas.dashboard import (
    DashboardSummaryOut, TeamOverviewOut,
    MonthlyWorkOverviewOut, RejectionOverviewOut
)
