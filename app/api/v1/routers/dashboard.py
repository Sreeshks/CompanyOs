from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import require_permission
from app.schemas.dashboard import (
    DashboardSummaryOut, StaffWorkloadItem, MonthlyWorkItem, RejectionOverviewOut
)
from app.schemas.common import ApiResponse
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Reports"])


@router.get("/company-overview", response_model=ApiResponse[DashboardSummaryOut], summary="Company Dashboard Summary", dependencies=[Depends(require_permission("dashboard.view"))])
def get_company_overview(db: Session = Depends(get_db)):
    summary = DashboardService.get_summary(db=db)
    return ApiResponse(success=True, data=summary)


@router.get("/team-overview", response_model=ApiResponse[List[StaffWorkloadItem]], summary="Staff & Team Workload", dependencies=[Depends(require_permission("reports.view"))])
def get_team_overview(db: Session = Depends(get_db)):
    overview = DashboardService.get_team_overview(db=db)
    return ApiResponse(success=True, data=overview)


@router.get("/monthly-work", response_model=ApiResponse[List[MonthlyWorkItem]], summary="Monthly Work Completion Breakdown", dependencies=[Depends(require_permission("reports.view"))])
def get_monthly_work(db: Session = Depends(get_db)):
    monthly = DashboardService.get_monthly_work(db=db)
    return ApiResponse(success=True, data=monthly)


@router.get("/rejection-overview", response_model=ApiResponse[RejectionOverviewOut], summary="Rejection Oversight & Analysis", dependencies=[Depends(require_permission("reports.view"))])
def get_rejection_overview(db: Session = Depends(get_db)):
    rejections = DashboardService.get_rejection_overview(db=db)
    return ApiResponse(success=True, data=rejections)
