from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, Token, RefreshTokenRequest
from app.schemas.user import UserOut
from app.schemas.common import ApiResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=ApiResponse[Token], summary="Authenticate user", description="Login with email and password to receive JWT access and refresh tokens.")
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    ip_address = request.client.host if request.client else None
    user = AuthService.authenticate(db=db, email=req.email, password=req.password, ip_address=ip_address)
    tokens = AuthService.create_tokens_for_user(user)
    return ApiResponse(success=True, data=Token(**tokens), message="Login successful")


@router.post("/refresh", response_model=ApiResponse[Token], summary="Refresh token", description="Obtain a new access token using a valid refresh token.")
def refresh_token(req: RefreshTokenRequest, db: Session = Depends(get_db)):
    tokens = AuthService.refresh(db=db, refresh_token_str=req.refresh_token)
    return ApiResponse(success=True, data=Token(**tokens), message="Token refreshed")


@router.get("/me", response_model=ApiResponse[UserOut], summary="Get current user", description="Retrieve profile of the currently logged in user.")
def get_me(current_user: User = Depends(get_current_user)):
    user_out = UserOut.model_validate(current_user)
    user_out.role_name = current_user.role.name if current_user.role else None
    user_out.designation_name = current_user.designation.name if current_user.designation else None
    user_out.department_name = current_user.department.name if current_user.department else None
    return ApiResponse(success=True, data=user_out)
