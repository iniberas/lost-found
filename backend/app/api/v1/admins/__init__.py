from app.api.v1.admins.audit_logs import router as audit_logs_router
from app.api.v1.admins.categories import router as categories_router
from app.api.v1.admins.dashboard import router as dashboard_router
from app.api.v1.admins.reports import router as reports_router
from app.api.v1.admins.storage_locations import router as storage_locations_router
from app.api.v1.admins.users import router as users_router
from app.core.dependencies import get_current_admin
from app.domain.entities.user import Admin
from app.schemas.admin import AdminUserResponse
from fastapi import APIRouter, Depends

router = APIRouter(
    prefix="/admin", tags=["Admin"], dependencies=[Depends(get_current_admin)]
)

router.include_router(users_router)
router.include_router(categories_router)
router.include_router(dashboard_router)
router.include_router(reports_router)
router.include_router(storage_locations_router)
router.include_router(audit_logs_router)


@router.get("/me", response_model=AdminUserResponse)
async def me(current_admin: Admin = Depends(get_current_admin)):
    return current_admin
