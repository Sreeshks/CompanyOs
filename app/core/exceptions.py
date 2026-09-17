from typing import Any, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError


class AppException(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Optional[Any] = None
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)


class NotFoundException(AppException):
    def __init__(self, resource: str, identifier: Any):
        super().__init__(
            code="RESOURCE_NOT_FOUND",
            message=f"{resource} with identifier '{identifier}' was not found.",
            status_code=status.HTTP_404_NOT_FOUND
        )


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Invalid authentication credentials"):
        super().__init__(
            code="UNAUTHORIZED",
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED
        )


class ForbiddenException(AppException):
    def __init__(self, message: str = "You do not have permission to perform this action"):
        super().__init__(
            code="FORBIDDEN",
            message=message,
            status_code=status.HTTP_403_FORBIDDEN
        )


class InvalidWorkflowTransitionException(AppException):
    def __init__(self, message: str):
        super().__init__(
            code="INVALID_WORKFLOW_TRANSITION",
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST
        )


class ConcurrencyException(AppException):
    def __init__(self, message: str = "Concurrent modification detected. Please try again."):
        super().__init__(
            code="CONCURRENCY_ERROR",
            message=message,
            status_code=status.HTTP_409_CONFLICT
        )


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    payload = {
        "success": False,
        "error": {
            "code": exc.code,
            "message": exc.message,
            "details": exc.details
        }
    }
    return JSONResponse(status_code=exc.status_code, content=payload)


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = []
    for err in exc.errors():
        loc = " -> ".join([str(l) for l in err.get("loc", [])])
        msg = err.get("msg", "")
        errors.append(f"{loc}: {msg}")
    
    payload = {
        "success": False,
        "error": {
            "code": "VALIDATION_ERROR",
            "message": "Validation failed for request data",
            "details": errors
        }
    }
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=payload)


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    payload = {
        "success": False,
        "error": {
            "code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred. Please contact the administrator.",
            "details": str(exc) if request.app.debug else None
        }
    }
    return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=payload)
