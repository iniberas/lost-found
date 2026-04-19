from fastapi import Depends, HTTPException, Form, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, Annotated, List

from app.infrastructure.database.session import SessionLocal
from app.core.security import ArgusPasswordHasher, JWTTokenService

# Ensure you import the Admin entity if you use isinstance for admin checks
from app.domain.entities.user import Admin 

from app.domain.use_cases.auth import (
    RegisterUserUseCase,
    LoginUserUseCase,
    RefreshTokenUseCase,
    GetUserUseCase,
)
from app.domain.use_cases.report import (
    CreateLostReportUseCase,
    CreateFoundReportUseCase,
    CreateHandoverReportUseCase,
    ListOpenLostReportUseCase,
    ListOpenFoundReportUseCase,
    GetLostReportByIdUseCase,
    GetFoundReportByIdUseCase,
    SearchLostReportsUseCase,
    SearchFoundReportsUseCase,
    GetReportsByUserUseCase,
    UpdateLostReportUseCase,
    UpdateFoundReportUseCase,
    ResolveLostReportUseCase,
    ResolveFoundReportUseCase,
    TransferFoundItemToAdminUseCase,
    DeleteLostReportUseCase,
    DeleteFoundReportUseCase,
    FindPotentialMatchesUseCase,
)
from app.infrastructure.repositories.user import SqlAlchemyUserRepository
from app.infrastructure.repositories.report import (
    SqlAlchemyCategoryRepository,
    SqlAlchemyLostReportRepository,
    SqlAlchemyFoundReportRepository,
    SqlAlchemyProofRepository,
)
from app.schemas.report import (
    LostReportRequest,
    FoundReportRequest,
    HandoverReportRequest,
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/swagger-thing")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# CORE SERVICES
# ==========================================

def get_hasher():
    return ArgusPasswordHasher()


def get_token_service():
    return JWTTokenService()

# ==========================================
# REPOSITORIES
# ==========================================

def get_user_repo(db: Session = Depends(get_db)):
    return SqlAlchemyUserRepository(db)


def get_category_repo(db: Session = Depends(get_db)):
    return SqlAlchemyCategoryRepository(db)


def get_lost_report_repo(db: Session = Depends(get_db)):
    return SqlAlchemyLostReportRepository(db)


def get_found_report_repo(db: Session = Depends(get_db)):
    return SqlAlchemyFoundReportRepository(db)


def get_proof_repo(db: Session = Depends(get_db)):
    return SqlAlchemyProofRepository(db)


def get_register_use_case(repo=Depends(get_user_repo), hasher=Depends(get_hasher)):
    return RegisterUserUseCase(repo, hasher)


def get_login_use_case(
    repo=Depends(get_user_repo),
    hasher=Depends(get_hasher),
    tokens=Depends(get_token_service),
):
    return LoginUserUseCase(repo, hasher, tokens)


def get_refresh_use_case(
    repo=Depends(get_user_repo), tokens=Depends(get_token_service)
):
    return RefreshTokenUseCase(repo, tokens)


def get_profile_use_case(repo=Depends(get_user_repo)):
    return GetUserUseCase(repo)


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    profile_use_case: GetUserUseCase = Depends(get_profile_use_case),
    token_service: JWTTokenService = Depends(get_token_service),
):
    try:
        payload = token_service.decode_token(token)
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token claims")
    except Exception:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    try:
        return profile_use_case.execute(email)
    except Exception:
        raise HTTPException(status_code=401, detail="User not found")


async def get_current_admin_user(current_user = Depends(get_current_user)):
    if not isinstance(current_user, Admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Requires administrative privileges"
        )
    return current_user


def get_create_lost_report_use_case(
    report_repo=Depends(get_lost_report_repo), category_repo=Depends(get_category_repo)
):
    return CreateLostReportUseCase(report_repo, category_repo)


def get_create_found_report_use_case(
    report_repo=Depends(get_found_report_repo), category_repo=Depends(get_category_repo)
):
    return CreateFoundReportUseCase(report_repo, category_repo)


def get_create_handover_report_use_case(
    report_repo=Depends(get_found_report_repo), category_repo=Depends(get_category_repo)
):
    return CreateHandoverReportUseCase(report_repo, category_repo)


def get_list_open_lost_report_use_case(repo=Depends(get_lost_report_repo)):
    return ListOpenLostReportUseCase(repo)


def get_list_open_found_report_use_case(repo=Depends(get_found_report_repo)):
    return ListOpenFoundReportUseCase(repo)


def get_lost_report_by_id_use_case(repo=Depends(get_lost_report_repo)):
    return GetLostReportByIdUseCase(repo)


def get_found_report_by_id_use_case(repo=Depends(get_found_report_repo)):
    return GetFoundReportByIdUseCase(repo)


def get_search_lost_reports_use_case(repo=Depends(get_lost_report_repo)):
    return SearchLostReportsUseCase(repo)


def get_search_found_reports_use_case(repo=Depends(get_found_report_repo)):
    return SearchFoundReportsUseCase(repo)


def get_reports_by_user_use_case(
    lost_repo=Depends(get_lost_report_repo), found_repo=Depends(get_found_report_repo)
):
    return GetReportsByUserUseCase(lost_repo, found_repo)


def get_update_lost_report_use_case(repo=Depends(get_lost_report_repo)):
    return UpdateLostReportUseCase(repo)


def get_update_found_report_use_case(repo=Depends(get_found_report_repo)):
    return UpdateFoundReportUseCase(repo)


def get_resolve_lost_report_use_case(
    report_repo=Depends(get_lost_report_repo), proof_repo=Depends(get_proof_repo)
):
    return ResolveLostReportUseCase(report_repo, proof_repo)


def get_resolve_found_report_use_case(
    report_repo=Depends(get_found_report_repo), proof_repo=Depends(get_proof_repo)
):
    return ResolveFoundReportUseCase(report_repo, proof_repo)


def get_transfer_found_item_use_case(repo=Depends(get_found_report_repo)):
    return TransferFoundItemToAdminUseCase(repo)


def get_delete_lost_report_use_case(repo=Depends(get_lost_report_repo)):
    return DeleteLostReportUseCase(repo)


def get_delete_found_report_use_case(repo=Depends(get_found_report_repo)):
    return DeleteFoundReportUseCase(repo)


def get_find_potential_matches_use_case(
    lost_repo=Depends(get_lost_report_repo), found_repo=Depends(get_found_report_repo)
):
    return FindPotentialMatchesUseCase(lost_repo, found_repo)


def get_lost_report_form_data(
    title: str = Form(...),
    description: str = Form(...),
    date: datetime = Form(...),
    location_name: str = Form(...),
    category_ids: List[int] = Form(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
) -> LostReportRequest:
    return LostReportRequest(
        title=title,
        description=description,
        date=date,
        location_name=location_name,
        category_ids=category_ids,
        latitude=latitude,
        longitude=longitude,
    )


def get_found_report_form_data(
    title: str = Form(...),
    description: str = Form(...),
    date: datetime = Form(...),
    location_name: str = Form(...),
    category_ids: List[int] = Form(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
) -> FoundReportRequest:
    return FoundReportRequest(
        title=title,
        description=description,
        date=date,
        location_name=location_name,
        category_ids=category_ids,
        latitude=latitude,
        longitude=longitude,
    )


def get_handover_report_form_data(
    title: str = Form(...),
    description: str = Form(...),
    date: datetime = Form(...),
    location_name: str = Form(...),
    category_ids: List[int] = Form(...),
    finder_name: str = Form(...),
    finder_contact: str = Form(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
) -> HandoverReportRequest:
    return HandoverReportRequest(
        title=title,
        description=description,
        date=date,
        location_name=location_name,
        category_ids=category_ids,
        finder_name=finder_name,
        finder_contact=finder_contact,
        latitude=latitude,
        longitude=longitude,
    )