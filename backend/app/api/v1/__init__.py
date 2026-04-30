from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.categories import router as categories_router
from app.api.v1.found_reports import router as found_reports_router
from app.api.v1.lost_reports import router as lost_reports_router
from app.api.v1.admins import router as admins_route
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1")

router.include_router(auth_router)
router.include_router(users_router)
router.include_router(categories_router)
router.include_router(lost_reports_router)
router.include_router(found_reports_router)
router.include_router(admins_route)
