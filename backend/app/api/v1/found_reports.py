import uuid
from datetime import datetime
from typing import List, Optional

from app.core.dependencies import (
    get_create_found_report_form,
    get_create_found_report_use_case,
    get_create_hand_over_report_form,
    get_create_hand_over_report_use_case,
    get_current_admin,
    get_current_user,
    get_delete_found_report_use_case,
    get_found_report_by_id_use_case,
    get_hand_over_to_admin_use_case,
    get_potential_lost_reports_use_case,
    get_resolve_found_report_form,
    get_resolve_found_report_use_case,
    get_search_found_reports_use_case,
    get_update_found_report_form,
    get_update_found_report_use_case,
)
from app.domain.entities.point import Point
from app.domain.entities.report import FoundStatus, ReportStatus
from app.domain.entities.user import Admin, User
from app.domain.exceptions import FutureDateError, StateTransitionError, ValidationError
from app.domain.use_cases.report import (
    CreateFoundReportUseCase,
    CreateHandOverReportUseCase,
    DeleteFoundReportUseCase,
    FindPotentialLostReportsUseCase,
    GetFoundReportByIdUseCase,
    HandOverToAdminUseCase,
    ResolveFoundReportUseCase,
    SearchFoundReportsUseCase,
    UpdateFoundReportUseCase,
)
from app.schemas.pagination import Paginated
from app.schemas.report import (
    CreateFoundReportRequest,
    CreateHandOverReportRequest,
    FoundReportResponse,
    LostReportResponse,
    ResolveFoundReportRequest,
    UpdateFoundReportRequest,
)
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)

router = APIRouter(prefix="/found-reports", tags=["found-reports"])


@router.get("", response_model=Paginated[FoundReportResponse])
async def search_found_reports(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    query: Optional[str] = Query(None),
    report_status: Optional[List[ReportStatus]] = Query(None),
    found_status: Optional[FoundStatus] = Query(None),
    incident_date_from: Optional[datetime] = Query(None),
    incident_date_to: Optional[datetime] = Query(None),
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
    radius_km: Optional[float] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    use_case: SearchFoundReportsUseCase = Depends(get_search_found_reports_use_case),
):
    location_point = (
        Point(latitude=latitude, longitude=longitude)
        if latitude is not None and longitude is not None
        else None
    )
    result = await use_case.execute(
        page=page,
        limit=limit,
        query=query,
        report_status=report_status,
        found_status=found_status,
        location_point=location_point,
        location_radius=radius_km,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return Paginated(
        items=[FoundReportResponse.model_validate(r) for r in result.items],
        total_items=result.total_items,
        current_page=result.current_page,
        total_pages=result.total_pages,
        limit=result.limit,
    )


@router.get("/{report_id}", response_model=FoundReportResponse)
async def get_found_report(
    report_id: uuid.UUID,
    use_case: GetFoundReportByIdUseCase = Depends(get_found_report_by_id_use_case),
):
    try:
        report = await use_case.execute(report_id)
        return FoundReportResponse.model_validate(report)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post(
    "", response_model=FoundReportResponse, status_code=status.HTTP_201_CREATED
)
async def create_found_report(
    body: CreateFoundReportRequest = Depends(get_create_found_report_form),
    photos: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    use_case: CreateFoundReportUseCase = Depends(get_create_found_report_use_case),
):
    photo_files = None
    if photos:
        photo_files = []
        for photo in photos:
            file_bytes = await photo.read()
            if file_bytes:
                photo_files.append((file_bytes, photo.filename))
    location_point = (
        Point(
            latitude=body.location_point.latitude,
            longitude=body.location_point.longitude,
        )
        if body.location_point
        else None
    )
    try:
        report = await use_case.execute(
            reporter=current_user,
            incident_date=body.incident_date,
            title=body.title,
            description=body.description,
            location_name=body.location_name,
            category_ids=body.category_ids,
            location_point=location_point,
            photo_files=photo_files,
        )
        return FoundReportResponse.model_validate(report)
    except (ValidationError, FutureDateError) as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(e)
        )


@router.post(
    "/handover", response_model=FoundReportResponse, status_code=status.HTTP_201_CREATED
)
async def create_hand_over_report(
    body: CreateHandOverReportRequest = Depends(get_create_hand_over_report_form),
    photos: List[UploadFile] = File(...),
    admin: Admin = Depends(get_current_admin),
    use_case: CreateHandOverReportUseCase = Depends(
        get_create_hand_over_report_use_case
    ),
):
    photo_files = None
    if photos:
        photo_files = []
        for photo in photos:
            file_bytes = await photo.read()
            if file_bytes:
                photo_files.append((file_bytes, photo.filename))

    location_point = (
        Point(
            latitude=body.location_point.latitude,
            longitude=body.location_point.longitude,
        )
        if body.location_point
        else None
    )
    try:
        report = await use_case.execute(
            reporter=admin,
            incident_date=body.incident_date,
            title=body.title,
            description=body.description,
            location_name=body.location_name,
            category_ids=body.category_ids,
            finder_name=body.finder_name,
            finder_contact=body.finder_contact,
            location_point=location_point,
            photo_files=photo_files,
        )
        return FoundReportResponse.model_validate(report)
    except (ValidationError, FutureDateError) as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(e)
        )


@router.patch("/{report_id}", response_model=FoundReportResponse)
async def update_found_report(
    report_id: uuid.UUID,
    body: UpdateFoundReportRequest = Depends(get_update_found_report_form),
    photos_to_add: Optional[List[UploadFile]] = File(None),
    current_user: User = Depends(get_current_user),
    use_case: UpdateFoundReportUseCase = Depends(get_update_found_report_use_case),
):
    photo_files = (
        [(await f.read(), f.content_type) for f in photos_to_add]
        if photos_to_add
        else None
    )
    location_point = (
        Point(
            latitude=body.location_point.latitude,
            longitude=body.location_point.longitude,
        )
        if body.location_point
        else None
    )

    try:
        report = await use_case.execute(
            user=current_user,
            report_id=report_id,
            title=body.title,
            description=body.description,
            incident_date=body.incident_date,
            location_name=body.location_name,
            location_point=location_point,
            category_ids=body.category_ids,
            photos_to_add=photo_files,
            photos_to_remove=body.photos_to_remove,
            finder_name=body.finder_name,
            finder_contact=body.finder_contact,
        )
        return FoundReportResponse.model_validate(report)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except (ValidationError, StateTransitionError, FutureDateError) as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(e)
        )


@router.post("/{report_id}/resolve", response_model=FoundReportResponse)
async def resolve_found_report(
    report_id: uuid.UUID,
    body: ResolveFoundReportRequest = Depends(get_resolve_found_report_form),
    proof_photos: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    use_case: ResolveFoundReportUseCase = Depends(get_resolve_found_report_use_case),
):
    photo_files = [(await f.read(), f.content_type) for f in proof_photos]

    try:
        report = await use_case.execute(
            report_id=report_id,
            user=current_user,
            photo_files=photo_files,
            notes=body.notes,
        )
        return FoundReportResponse.model_validate(report)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except (ValidationError, StateTransitionError) as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(e)
        )


@router.post("/{report_id}/hand_over-to-admin", response_model=FoundReportResponse)
async def hand_over_to_admin(
    report_id: uuid.UUID,
    admin_id: uuid.UUID = Form(...),
    current_user: User = Depends(get_current_user),
    use_case: HandOverToAdminUseCase = Depends(get_hand_over_to_admin_use_case),
):
    try:
        report = await use_case.execute(
            report_id=report_id, user=current_user, admin_id=admin_id
        )
        return FoundReportResponse.model_validate(report)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except (ValidationError, StateTransitionError) as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(e)
        )


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_found_report(
    report_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    use_case: DeleteFoundReportUseCase = Depends(get_delete_found_report_use_case),
):
    try:
        await use_case.execute(report_id=report_id, user=current_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.get("/{report_id}/potential-matches", response_model=List[LostReportResponse])
async def potential_matches(
    report_id: uuid.UUID,
    use_case: FindPotentialLostReportsUseCase = Depends(
        get_potential_lost_reports_use_case
    ),
):
    try:
        reports = await use_case.execute(report_id)
        return [LostReportResponse.model_validate(r) for r in reports]
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
