from app.api.v1.admins.categories import router as categories_router
from app.api.v1.admins.reports import router as reports_router
from app.api.v1.admins.users import router as users_router
from app.core.dependencies import get_current_admin
from fastapi import APIRouter, Depends

router = APIRouter(
    prefix="/admin", tags=["admin"], dependencies=[Depends(get_current_admin)]
)

router.include_router(users_router)
router.include_router(categories_router)
router.include_router(reports_router)
