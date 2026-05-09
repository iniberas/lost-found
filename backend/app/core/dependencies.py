import uuid
from datetime import datetime
from typing import List, Optional

from app.core.config import settings
from app.domain.entities.user import Admin, SuperAdmin, User
from app.domain.use_cases.audit_log import (
    GetAuditLogByIdUseCase,
    SearchAuditLogsUseCase,
)
from app.domain.use_cases.auth import (
    LoginUserUseCase,
    RefreshTokenUseCase,
    RegisterUserUseCase,
)
from app.domain.use_cases.category import (
    CreateCategoryUseCase,
    DeleteCategoryUseCase,
    SearchCategoriesUseCase,
    UpdateCategoryUseCase,
)
from app.domain.use_cases.contact_request import (
    ApproveContactRequestUseCase,
    CancelContactRequestUseCase,
    CreateContactRequestUseCase,
    RejectContactRequestUseCase,
    SearchContactRequestsUseCase,
)
from app.domain.use_cases.proof import CreateProofUseCase, GetProofByIdUseCase
from app.domain.use_cases.report import (
    CreateFoundReportUseCase,
    CreateHandOverReportUseCase,
    CreateLostReportUseCase,
    DeleteFoundReportUseCase,
    DeleteLostReportUseCase,
    FindPotentialFoundReportsUseCase,
    FindPotentialLostReportsUseCase,
    GetFoundReportByIdUseCase,
    GetLostReportByIdUseCase,
    HandOverToAdminUseCase,
    ResolveFoundReportUseCase,
    ResolveLostReportUseCase,
    SearchFoundReportsUseCase,
    SearchLostReportsUseCase,
    UpdateFoundReportUseCase,
    UpdateLostReportUseCase,
)
from app.domain.use_cases.storage_location import (
    ActivateStorageLocationUseCase,
    CreateStorageLocationUseCase,
    DeleteStorageLocationUseCase,
    GetStorageLocationByIdUseCase,
    SearchStorageLocationsUseCase,
    UpdateStorageLocationUseCase,
)
from app.domain.use_cases.user import (
    ChangePasswordUseCase,
    CreateAdminUseCase,
    CreateSuperAdminUseCase,
    DeleteUserUseCase,
    GetUserByEmailUseCase,
    GetUserByIdUseCase,
    SearchUsersUseCase,
    UpdateUserUseCase,
)
from app.infrastructure.database.session import get_session
from app.infrastructure.repositories.audit_log import AuditLogRepository
from app.infrastructure.repositories.category import CategoryRepository
from app.infrastructure.repositories.contact_request import ContactRequestRepository
from app.infrastructure.repositories.proof import ProofRepository
from app.infrastructure.repositories.report import (
    FoundReportRepository,
    LostReportRepository,
)
from app.infrastructure.repositories.storage_location import StorageLocationRepository
from app.infrastructure.repositories.user import UserRepository
from app.infrastructure.services.auth import JWTTokenService, PasslibHasher
from app.infrastructure.services.storage import StorageService
from app.schemas.admin import (
    AdminCreateHandOverReportRequest,
    AdminUpdateFoundReportRequest,
)
from app.schemas.category import CreateCategoryRequest, UpdateCategoryRequest
from app.schemas.point import PointSchema
from app.schemas.report import (
    CreateFoundReportRequest,
    CreateLostReportRequest,
    ResolveFoundReportRequest,
    UpdateFoundReportRequest,
    UpdateLostReportRequest,
)
from app.schemas.user import (
    ChangePasswordRequest,
    LoginUserRequest,
    RegisterUserRequest,
    UpdateUserRequest,
)
from fastapi import Depends, Form, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/swagger-thing")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False,
)


def get_hasher() -> PasslibHasher:
    return PasslibHasher()


def get_token_service() -> JWTTokenService:
    return JWTTokenService(
        secret_key=settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
        access_token_expire_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        refresh_token_expire_days=settings.REFRESH_TOKEN_EXPIRE_DAYS,
    )


def get_storage_service() -> StorageService:
    return StorageService(upload_dir=settings.UPLOAD_DIR, base_url=settings.BASE_URL)


async def get_user_repo(session: AsyncSession = Depends(get_session)) -> UserRepository:
    return UserRepository(session)


async def get_category_repo(
    session: AsyncSession = Depends(get_session),
) -> CategoryRepository:
    return CategoryRepository(session)


async def get_proof_repo(
    session: AsyncSession = Depends(get_session),
) -> ProofRepository:
    return ProofRepository(session)


async def get_lost_report_repo(
    session: AsyncSession = Depends(get_session),
) -> LostReportRepository:
    return LostReportRepository(session)


async def get_found_report_repo(
    session: AsyncSession = Depends(get_session),
) -> FoundReportRepository:
    return FoundReportRepository(session)


async def get_storage_location_repo(
    session: AsyncSession = Depends(get_session),
) -> StorageLocationRepository:
    return StorageLocationRepository(session)


async def get_contact_request_repo(
    session: AsyncSession = Depends(get_session),
) -> ContactRequestRepository:
    return ContactRequestRepository(session)


async def get_audit_log_repo(
    session: AsyncSession = Depends(get_session),
) -> AuditLogRepository:
    return AuditLogRepository(session)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    user_repo: UserRepository = Depends(get_user_repo),
    token_service: JWTTokenService = Depends(get_token_service),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = token_service.decode_token(token)
        email: str = payload.get("sub")
        if not email:
            raise credentials_exception
    except ValueError:
        raise credentials_exception

    user = await user_repo.find_by_email(email)
    if not user:
        raise credentials_exception
    if user.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Account has been deleted"
        )
    return user

# buat di get report, soalnya bisa aja lom login gitu
async def get_current_user_optional(
    token: Optional[str] = Depends(
        oauth2_scheme_optional
    ),
    user_repo: UserRepository = Depends(get_user_repo),
    token_service: JWTTokenService = Depends(get_token_service),
) -> Optional[User]:

    print("token" + str(token))
    if not token:
        return None

    try:
        payload = token_service.decode_token(token)
        email: str = payload.get("sub")

        if not email:
            return None

    except ValueError:
        return None

    user = await user_repo.find_by_email(email)

    if not user:
        return None

    if user.deleted_at is not None:
        return None

    return user

async def get_current_admin(current_user: User = Depends(get_current_user)) -> Admin:
    if not isinstance(current_user, Admin) and not isinstance(current_user, SuperAdmin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required"
        )
    return current_user


async def get_current_superadmin(
    current_user: User = Depends(get_current_user),
) -> SuperAdmin:
    if not isinstance(current_user, SuperAdmin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="SuperAdmin privileges required",
        )
    return current_user


def get_register_use_case(
    repo: UserRepository = Depends(get_user_repo),
    hasher: PasslibHasher = Depends(get_hasher),
) -> RegisterUserUseCase:
    return RegisterUserUseCase(repo, hasher)


def get_login_use_case(
    repo: UserRepository = Depends(get_user_repo),
    hasher: PasslibHasher = Depends(get_hasher),
    token_service: JWTTokenService = Depends(get_token_service),
) -> LoginUserUseCase:
    return LoginUserUseCase(repo, hasher, token_service)


def get_refresh_use_case(
    repo: UserRepository = Depends(get_user_repo),
    token_service: JWTTokenService = Depends(get_token_service),
) -> RefreshTokenUseCase:
    return RefreshTokenUseCase(repo, token_service)


def get_create_category_use_case(
    repo: CategoryRepository = Depends(get_category_repo),
    audit_log_repo: AuditLogRepository = Depends(get_audit_log_repo),
) -> CreateCategoryUseCase:
    return CreateCategoryUseCase(repo, audit_log_repo)


def get_update_category_use_case(
    repo: CategoryRepository = Depends(get_category_repo),
    audit_log_repo: AuditLogRepository = Depends(get_audit_log_repo),
) -> UpdateCategoryUseCase:
    return UpdateCategoryUseCase(repo, audit_log_repo)


def get_search_categories_use_case(
    repo: CategoryRepository = Depends(get_category_repo),
) -> SearchCategoriesUseCase:
    return SearchCategoriesUseCase(repo)


def get_delete_category_use_case(
    repo: CategoryRepository = Depends(get_category_repo),
    audit_log_repo: AuditLogRepository = Depends(get_audit_log_repo),
) -> DeleteCategoryUseCase:
    return DeleteCategoryUseCase(repo, audit_log_repo)


def get_create_proof_use_case(
    repo: ProofRepository = Depends(get_proof_repo),
    storage: StorageService = Depends(get_storage_service),
) -> CreateProofUseCase:
    return CreateProofUseCase(repo, storage)


def get_proof_by_id_use_case(
    repo: ProofRepository = Depends(get_proof_repo),
) -> GetProofByIdUseCase:
    return GetProofByIdUseCase(repo)


def get_create_lost_report_use_case(
    report_repo: LostReportRepository = Depends(get_lost_report_repo),
    category_repo: CategoryRepository = Depends(get_category_repo),
    storage: StorageService = Depends(get_storage_service),
    audit_log_repo: AuditLogRepository = Depends(get_audit_log_repo),
) -> CreateLostReportUseCase:
    return CreateLostReportUseCase(report_repo, category_repo, storage, audit_log_repo)


def get_update_lost_report_use_case(
    report_repo: LostReportRepository = Depends(get_lost_report_repo),
    category_repo: CategoryRepository = Depends(get_category_repo),
    storage: StorageService = Depends(get_storage_service),
    audit_log_repo: AuditLogRepository = Depends(get_audit_log_repo),
) -> UpdateLostReportUseCase:
    return UpdateLostReportUseCase(report_repo, category_repo, storage, audit_log_repo)


def get_lost_report_by_id_use_case(
    repo: LostReportRepository = Depends(get_lost_report_repo),
) -> GetLostReportByIdUseCase:
    return GetLostReportByIdUseCase(repo)


def get_search_lost_reports_use_case(
    repo: LostReportRepository = Depends(get_lost_report_repo),
) -> SearchLostReportsUseCase:
    return SearchLostReportsUseCase(repo)


def get_resolve_lost_report_use_case(
    repo: LostReportRepository = Depends(get_lost_report_repo),
    audit_log_repo: AuditLogRepository = Depends(get_audit_log_repo),
) -> ResolveLostReportUseCase:
    return ResolveLostReportUseCase(repo, audit_log_repo)


def get_delete_lost_report_use_case(
    repo: LostReportRepository = Depends(get_lost_report_repo),
    audit_log_repo: AuditLogRepository = Depends(get_audit_log_repo),
) -> DeleteLostReportUseCase:
    return DeleteLostReportUseCase(repo, audit_log_repo)


def get_create_found_report_use_case(
    report_repo: FoundReportRepository = Depends(get_found_report_repo),
    category_repo: CategoryRepository = Depends(get_category_repo),
    storage: StorageService = Depends(get_storage_service),
    audit_log_repo: AuditLogRepository = Depends(get_audit_log_repo),
) -> CreateFoundReportUseCase:
    return CreateFoundReportUseCase(report_repo, category_repo, storage, audit_log_repo)


def get_create_hand_over_report_use_case(
    report_repo: FoundReportRepository = Depends(get_found_report_repo),
    category_repo: CategoryRepository = Depends(get_category_repo),
    storage: StorageService = Depends(get_storage_service),
    storage_location_repo: StorageLocationRepository = Depends(
        get_storage_location_repo
    ),
    audit_log_repo: AuditLogRepository = Depends(get_audit_log_repo),
) -> CreateHandOverReportUseCase:
    return CreateHandOverReportUseCase(
        report_repo, category_repo, storage, storage_location_repo, audit_log_repo
    )


def get_update_found_report_use_case(
    report_repo: FoundReportRepository = Depends(get_found_report_repo),
    category_repo: CategoryRepository = Depends(get_category_repo),
    storage: StorageService = Depends(get_storage_service),
    audit_log_repo: AuditLogRepository = Depends(get_audit_log_repo),
) -> UpdateFoundReportUseCase:
    return UpdateFoundReportUseCase(report_repo, category_repo, storage, audit_log_repo)


def get_found_report_by_id_use_case(
    repo: FoundReportRepository = Depends(get_found_report_repo),
) -> GetFoundReportByIdUseCase:
    return GetFoundReportByIdUseCase(repo)


def get_search_found_reports_use_case(
    repo: FoundReportRepository = Depends(get_found_report_repo),
) -> SearchFoundReportsUseCase:
    return SearchFoundReportsUseCase(repo)


def get_resolve_found_report_use_case(
    report_repo: FoundReportRepository = Depends(get_found_report_repo),
    proof_repo: ProofRepository = Depends(get_proof_repo),
    storage: StorageService = Depends(get_storage_service),
    audit_log_repo: AuditLogRepository = Depends(get_audit_log_repo),
) -> ResolveFoundReportUseCase:
    return ResolveFoundReportUseCase(report_repo, proof_repo, storage, audit_log_repo)


def get_hand_over_to_admin_use_case(
    report_repo: FoundReportRepository = Depends(get_found_report_repo),
    user_repo: UserRepository = Depends(get_user_repo),
    storage_location_repo: StorageLocationRepository = Depends(
        get_storage_location_repo
    ),
    audit_log_repo: AuditLogRepository = Depends(get_audit_log_repo),
) -> HandOverToAdminUseCase:
    return HandOverToAdminUseCase(
        report_repo, user_repo, storage_location_repo, audit_log_repo
    )


def get_delete_found_report_use_case(
    repo: FoundReportRepository = Depends(get_found_report_repo),
    audit_log_repo: AuditLogRepository = Depends(get_audit_log_repo),
) -> DeleteFoundReportUseCase:
    return DeleteFoundReportUseCase(repo, audit_log_repo)


def get_potential_found_reports_use_case(
    lost_repo: LostReportRepository = Depends(get_lost_report_repo),
    found_repo: FoundReportRepository = Depends(get_found_report_repo),
) -> FindPotentialFoundReportsUseCase:
    return FindPotentialFoundReportsUseCase(lost_repo, found_repo)


def get_potential_lost_reports_use_case(
    lost_repo: LostReportRepository = Depends(get_lost_report_repo),
    found_repo: FoundReportRepository = Depends(get_found_report_repo),
) -> FindPotentialLostReportsUseCase:
    return FindPotentialLostReportsUseCase(lost_repo, found_repo)


def get_user_by_id_use_case(
    repo: UserRepository = Depends(get_user_repo),
) -> GetUserByIdUseCase:
    return GetUserByIdUseCase(repo)


def get_user_by_email_use_case(
    repo: UserRepository = Depends(get_user_repo),
) -> GetUserByEmailUseCase:
    return GetUserByEmailUseCase(repo)


def get_update_user_use_case(
    repo: UserRepository = Depends(get_user_repo),
    audit_log_repo: AuditLogRepository = Depends(get_audit_log_repo),
) -> UpdateUserUseCase:
    return UpdateUserUseCase(repo, audit_log_repo)


def get_change_password_use_case(
    repo: UserRepository = Depends(get_user_repo),
    hasher: PasslibHasher = Depends(get_hasher),
    audit_log_repo: AuditLogRepository = Depends(get_audit_log_repo),
) -> ChangePasswordUseCase:
    return ChangePasswordUseCase(repo, hasher, audit_log_repo)


def get_search_users_use_case(
    repo: UserRepository = Depends(get_user_repo),
) -> SearchUsersUseCase:
    return SearchUsersUseCase(repo)


def get_delete_user_use_case(
    repo: UserRepository = Depends(get_user_repo),
    audit_log_repo: AuditLogRepository = Depends(get_audit_log_repo),
) -> DeleteUserUseCase:
    return DeleteUserUseCase(repo, audit_log_repo)


def get_create_admin_use_case(
    repo: UserRepository = Depends(get_user_repo),
    hasher: PasslibHasher = Depends(get_hasher),
    audit_log_repo: AuditLogRepository = Depends(get_audit_log_repo),
) -> CreateAdminUseCase:
    return CreateAdminUseCase(repo, hasher, audit_log_repo)


def get_create_superadmin_use_case(
    repo: UserRepository = Depends(get_user_repo),
    hasher: PasslibHasher = Depends(get_hasher),
    audit_log_repo: AuditLogRepository = Depends(get_audit_log_repo),
) -> CreateSuperAdminUseCase:
    return CreateSuperAdminUseCase(repo, hasher, audit_log_repo)


def get_create_storage_location_use_case(
    repo: StorageLocationRepository = Depends(get_storage_location_repo),
    audit_log_repo: AuditLogRepository = Depends(get_audit_log_repo),
) -> CreateStorageLocationUseCase:
    return CreateStorageLocationUseCase(repo, audit_log_repo)


def get_update_storage_location_use_case(
    repo: StorageLocationRepository = Depends(get_storage_location_repo),
    audit_log_repo: AuditLogRepository = Depends(get_audit_log_repo),
) -> UpdateStorageLocationUseCase:
    return UpdateStorageLocationUseCase(repo, audit_log_repo)


def get_delete_storage_location_use_case(
    repo: StorageLocationRepository = Depends(get_storage_location_repo),
    audit_log_repo: AuditLogRepository = Depends(get_audit_log_repo),
) -> DeleteStorageLocationUseCase:
    return DeleteStorageLocationUseCase(repo, audit_log_repo)


def get_activate_storage_location_use_case(
    repo: StorageLocationRepository = Depends(get_storage_location_repo),
    audit_log_repo: AuditLogRepository = Depends(get_audit_log_repo),
) -> ActivateStorageLocationUseCase:
    return ActivateStorageLocationUseCase(repo, audit_log_repo)


def get_search_storage_locations_use_case(
    repo: StorageLocationRepository = Depends(get_storage_location_repo),
) -> SearchStorageLocationsUseCase:
    return SearchStorageLocationsUseCase(repo)


def get_storage_location_by_id_use_case(
    repo: StorageLocationRepository = Depends(get_storage_location_repo),
) -> GetStorageLocationByIdUseCase:
    return GetStorageLocationByIdUseCase(repo)


def get_create_contact_request_use_case(
    request_repo: ContactRequestRepository = Depends(get_contact_request_repo),
    user_repo: UserRepository = Depends(get_user_repo),
    audit_log_repo: AuditLogRepository = Depends(get_audit_log_repo),
    lost_report_repo: LostReportRepository = Depends(get_lost_report_repo),
    found_report_repo: FoundReportRepository = Depends(get_found_report_repo),
) -> CreateContactRequestUseCase:
    return CreateContactRequestUseCase(request_repo, user_repo, audit_log_repo, lost_report_repo, found_report_repo)


def get_approve_contact_request_use_case(
    repo: ContactRequestRepository = Depends(get_contact_request_repo),
    audit_log_repo: AuditLogRepository = Depends(get_audit_log_repo),
) -> ApproveContactRequestUseCase:
    return ApproveContactRequestUseCase(repo, audit_log_repo)


def get_reject_contact_request_use_case(
    repo: ContactRequestRepository = Depends(get_contact_request_repo),
    audit_log_repo: AuditLogRepository = Depends(get_audit_log_repo),
) -> RejectContactRequestUseCase:
    return RejectContactRequestUseCase(repo, audit_log_repo)


def get_cancel_contact_request_use_case(
    repo: ContactRequestRepository = Depends(get_contact_request_repo),
    audit_log_repo: AuditLogRepository = Depends(get_audit_log_repo),
) -> CancelContactRequestUseCase:
    return CancelContactRequestUseCase(repo, audit_log_repo)


def get_search_contact_requests_use_case(
    repo: ContactRequestRepository = Depends(get_contact_request_repo),
) -> SearchContactRequestsUseCase:
    return SearchContactRequestsUseCase(repo)


def get_audit_log_by_id_use_case(
    repo: AuditLogRepository = Depends(get_audit_log_repo),
) -> GetAuditLogByIdUseCase:
    return GetAuditLogByIdUseCase(repo)


def get_search_audit_logs_use_case(
    repo: AuditLogRepository = Depends(get_audit_log_repo),
) -> SearchAuditLogsUseCase:
    return SearchAuditLogsUseCase(repo)


def get_register_user_form(
    name: str = Form(...),
    email: EmailStr = Form(...),
    phone_number: str = Form(...),
    password: str = Form(...),
) -> RegisterUserRequest:
    return RegisterUserRequest(
        name=name, email=email, phone_number=phone_number, password=password
    )


def get_login_user_form(
    email: EmailStr = Form(...), password: str = Form(...)
) -> LoginUserRequest:
    return LoginUserRequest(email=email, password=password)


def get_update_user_form(
    name: Optional[str] = Form(default=None),
    email: Optional[EmailStr] = Form(default=None),
    phone_number: Optional[str] = Form(default=None),
) -> UpdateUserRequest:
    return UpdateUserRequest(name=name, email=email, phone_number=phone_number)


def get_change_password_form(
    old_password: str = Form(...), new_password: str = Form(...)
) -> ChangePasswordRequest:
    return ChangePasswordRequest(old_password=old_password, new_password=new_password)


def get_create_category_form(name: str = Form(...)) -> CreateCategoryRequest:
    return CreateCategoryRequest(name=name)


def get_update_category_form(name: str = Form(...)) -> UpdateCategoryRequest:
    return UpdateCategoryRequest(name=name)


def get_create_lost_report_form(
    title: str = Form(...),
    description: str = Form(...),
    location_name: str = Form(...),
    incident_date: datetime = Form(...),
    category_ids: List[uuid.UUID] = Form(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
) -> CreateLostReportRequest:
    location_point = (
        PointSchema(latitude=latitude, longitude=longitude)
        if latitude is not None and longitude is not None
        else None
    )
    return CreateLostReportRequest(
        title=title,
        description=description,
        location_name=location_name,
        incident_date=incident_date,
        category_ids=category_ids,
        location_point=location_point,
    )


def get_create_found_report_form(
    title: str = Form(...),
    description: str = Form(...),
    location_name: str = Form(...),
    incident_date: datetime = Form(...),
    category_ids: List[uuid.UUID] = Form(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
) -> CreateFoundReportRequest:
    location_point = (
        PointSchema(latitude=latitude, longitude=longitude)
        if latitude is not None and longitude is not None
        else None
    )
    return CreateFoundReportRequest(
        title=title,
        description=description,
        location_name=location_name,
        incident_date=incident_date,
        category_ids=category_ids,
        location_point=location_point,
    )


def get_create_hand_over_report_form(
    title: str = Form(...),
    description: str = Form(...),
    location_name: str = Form(...),
    incident_date: datetime = Form(...),
    finder_name: str = Form(...),
    finder_contact: str = Form(...),
    category_ids: List[uuid.UUID] = Form(...),
    storage_location_id: uuid.UUID = Form(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
) -> AdminCreateHandOverReportRequest:
    location_point = (
        PointSchema(latitude=latitude, longitude=longitude)
        if latitude is not None and longitude is not None
        else None
    )
    return AdminCreateHandOverReportRequest(
        title=title,
        description=description,
        location_name=location_name,
        incident_date=incident_date,
        category_ids=category_ids,
        finder_name=finder_name,
        finder_contact=finder_contact,
        storage_location_id=storage_location_id,
        location_point=location_point,
    )


def get_update_lost_report_form(
    title: Optional[str] = Form(default=None),
    description: Optional[str] = Form(default=None),
    incident_date: Optional[datetime] = Form(default=None),
    location_name: Optional[str] = Form(default=None),
    category_ids: Optional[List[uuid.UUID]] = Form(default=None),
    photos_to_remove: Optional[List[str]] = Form(default=None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
) -> UpdateLostReportRequest:
    location_point = (
        PointSchema(latitude=latitude, longitude=longitude)
        if latitude is not None and longitude is not None
        else None
    )
    return UpdateLostReportRequest(
        title=title,
        description=description,
        incident_date=incident_date,
        location_name=location_name,
        category_ids=category_ids,
        photos_to_remove=photos_to_remove,
        location_point=location_point,
    )


def get_update_found_report_form(
    title: Optional[str] = Form(default=None),
    description: Optional[str] = Form(default=None),
    incident_date: Optional[datetime] = Form(default=None),
    location_name: Optional[str] = Form(default=None),
    category_ids: Optional[List[uuid.UUID]] = Form(default=None),
    photos_to_remove: Optional[List[str]] = Form(default=None),
    finder_name: Optional[str] = Form(default=None),
    finder_contact: Optional[str] = Form(default=None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
) -> UpdateFoundReportRequest:
    location_point = (
        PointSchema(latitude=latitude, longitude=longitude)
        if latitude is not None and longitude is not None
        else None
    )
    return UpdateFoundReportRequest(
        title=title,
        description=description,
        incident_date=incident_date,
        location_name=location_name,
        category_ids=category_ids,
        photos_to_remove=photos_to_remove,
        finder_name=finder_name,
        finder_contact=finder_contact,
        location_point=location_point,
    )


def get_admin_update_found_report_form(
    title: Optional[str] = Form(default=None),
    description: Optional[str] = Form(default=None),
    incident_date: Optional[datetime] = Form(default=None),
    location_name: Optional[str] = Form(default=None),
    category_ids: Optional[List[uuid.UUID]] = Form(default=None),
    photos_to_remove: Optional[List[str]] = Form(default=None),
    finder_name: Optional[str] = Form(default=None),
    finder_contact: Optional[str] = Form(default=None),
    storage_location_id: Optional[uuid.UUID] = Form(default=None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
) -> AdminUpdateFoundReportRequest:
    location_point = (
        PointSchema(latitude=latitude, longitude=longitude)
        if latitude is not None and longitude is not None
        else None
    )
    return AdminUpdateFoundReportRequest(
        title=title,
        description=description,
        incident_date=incident_date,
        location_name=location_name,
        category_ids=category_ids,
        photos_to_remove=photos_to_remove,
        finder_name=finder_name,
        finder_contact=finder_contact,
        storage_location_id=storage_location_id,
        location_point=location_point,
    )


def get_resolve_found_report_form(notes: str = Form(...)) -> ResolveFoundReportRequest:
    return ResolveFoundReportRequest(notes=notes)
