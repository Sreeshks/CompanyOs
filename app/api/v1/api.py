from fastapi import APIRouter
from app.api.v1.routers import (
    auth, users, roles, master_data, clients, pipeline,
    workspaces, folders, content, workflows, tasks,
    my_work, approvals, rejections, documents, notifications,
    dashboard, audit_logs, upload
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(roles.router)
api_router.include_router(master_data.router)
api_router.include_router(clients.router)
api_router.include_router(pipeline.router)
api_router.include_router(workspaces.router)
api_router.include_router(folders.router)
api_router.include_router(content.router)
api_router.include_router(workflows.router)
api_router.include_router(tasks.router)
api_router.include_router(my_work.router)
api_router.include_router(approvals.router)
api_router.include_router(rejections.router)
api_router.include_router(documents.router)
api_router.include_router(notifications.router)
api_router.include_router(dashboard.router)
api_router.include_router(audit_logs.router)
api_router.include_router(upload.router)
