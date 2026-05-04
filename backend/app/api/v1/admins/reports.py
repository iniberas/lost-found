import uuid
from datetime import datetime
from typing import List, Optional

from app.core.dependencies import (
    get_admin_update_found_report_form,
    get_create_hand_over_report_form,
    get_create_hand_over_report_use_case,
    get_current_admin,
    get_delete_found_report_use_case,
    get_delete_lost_report_use_case,
    get_found_report_by_id_use_case,
    get_hand_over_to_admin_use_case,
    get_lost_report_by_id_use_case,
    get_search_found_reports_use_case,
    get_search_lost_reports_use_case,
    get_update_found_report_use_case,
    get_update_lost_report_form,
    get_update_lost_report_use_case,
)
from app.domain.entities.point import Point
from app.domain.entities.report import FoundStatus, ReportStatus
from app.domain.entities.user import Admin
from app.domain.exceptions import FutureDateError, StateTransitionError, ValidationError
from app.domain.use_cases.report import (
    CreateHandOverReportUseCase,
    DeleteFoundReportUseCase,
    DeleteLostReportUseCase,
    GetFoundReportByIdUseCase,
    GetLostReportByIdUseCase,
    HandOverToAdminUseCase,
    SearchFoundReportsUseCase,
    SearchLostReportsUseCase,
    UpdateFoundReportUseCase,
    UpdateLostReportUseCase,
)
from app.schemas.admin import (
    AdminCreateHandOverReportRequest,
    AdminFoundReportResponse,
    AdminLostReportResponse,
    AdminUpdateFoundReportRequest,
    AdminUpdateLostReportRequest,
)
from app.schemas.pagination import Paginated
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

router = APIRouter(prefix="/reports")


@router.get("/lost-reports", response_model=Paginated[AdminLostReportResponse])
async def search_lost_reports(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    query: Optional[str] = Query(None),
    reporter_id: Optional[uuid.UUID] = Query(None),
    report_status: Optional[List[ReportStatus]] = Query(None),
    incident_date_from: Optional[datetime] = Query(None),
    incident_date_to: Optional[datetime] = Query(None),
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
    radius_km: Optional[float] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    use_case: SearchLostReportsUseCase = Depends(get_search_lost_reports_use_case),
):
    location_point = (
        Point(latitude=latitude, longitude=longitude)
        if latitude is not None and longitude is not None
        else None
    )
    user_ids = [reporter_id] if reporter_id else None
    result = await use_case.execute(
        page=page,
        limit=limit,
        query=query,
        user_ids=user_ids,
        report_status=report_status,
        incident_date_from=incident_date_from,
        incident_date_to=incident_date_to,
        location_point=location_point,
        location_radius=radius_km,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return Paginated(
        items=[AdminLostReportResponse.model_validate(r) for r in result.items],
        total_items=result.total_items,
        current_page=result.current_page,
        total_pages=result.total_pages,
        limit=result.limit,
    )


@router.get("/found-reports", response_model=Paginated[AdminFoundReportResponse])
async def search_found_reports(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    query: Optional[str] = Query(None),
    reporter_id: Optional[uuid.UUID] = Query(None),
    report_status: Optional[List[ReportStatus]] = Query(None),
    found_status: Optional[FoundStatus] = Query(None),
    storage_location_id: Optional[uuid.UUID] = Query(None),
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
    user_ids = [reporter_id] if reporter_id else None
    result = await use_case.execute(
        page=page,
        limit=limit,
        query=query,
        user_ids=user_ids,
        report_status=report_status,
        found_status=found_status,
        storage_location_id=storage_location_id,
        incident_date_from=incident_date_from,
        incident_date_to=incident_date_to,
        location_point=location_point,
        location_radius=radius_km,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return Paginated(
        items=[AdminFoundReportResponse.model_validate(r) for r in result.items],
        total_items=result.total_items,
        current_page=result.current_page,
        total_pages=result.total_pages,
        limit=result.limit,
    )


@router.post(
    "/found-reports/hand-over",
    response_model=AdminFoundReportResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_hand_over_report(
    body: AdminCreateHandOverReportRequest = Depends(get_create_hand_over_report_form),
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
            storage_location_id=body.storage_location_id,
            location_point=location_point,
            photo_files=photo_files,
        )
        return AdminFoundReportResponse.model_validate(report)
    except (ValidationError, FutureDateError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(e)
        )


@router.post(
    "/found-reports/{report_id}/hand-over",
    response_model=AdminFoundReportResponse,
)
async def hand_over_to_admin(
    report_id: uuid.UUID,
    admin_id: uuid.UUID = Form(...),
    current_admin: Admin = Depends(get_current_admin),
    use_case: HandOverToAdminUseCase = Depends(get_hand_over_to_admin_use_case),
):
    try:
        report = await use_case.execute(
            report_id=report_id, user=current_admin, admin_id=admin_id
        )
        return AdminFoundReportResponse.model_validate(report)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except (ValidationError, StateTransitionError) as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(e)
        )


@router.put("/found-reports/{report_id}", response_model=AdminFoundReportResponse)
async def update_found_report(
    report_id: uuid.UUID,
    body: AdminUpdateFoundReportRequest = Depends(get_admin_update_found_report_form),
    photos_to_add: Optional[List[UploadFile]] = File(None),
    current_admin: Admin = Depends(get_current_admin),
    use_case: UpdateFoundReportUseCase = Depends(get_update_found_report_use_case),
):
    photo_files = (
        [(await f.read(), f.content_type) for f in photos_to_add]
        if photos_to_add
        else None
    )

    location_point = None
    if body.location_point:
        location_point = Point(
            latitude=body.location_point.latitude,
            longitude=body.location_point.longitude,
        )

    try:
        report = await use_case.execute(
            user=current_admin,
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
            storage_location_id=body.storage_location_id,
        )
        return AdminFoundReportResponse.model_validate(report)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except (ValidationError, PermissionError, StateTransitionError) as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(e)
        )


@router.put("/lost-reports/{report_id}", response_model=AdminLostReportResponse)
async def update_lost_report(
    report_id: uuid.UUID,
    body: AdminUpdateLostReportRequest = Depends(get_update_lost_report_form),
    photos_to_add: Optional[List[UploadFile]] = File(None),
    current_admin: Admin = Depends(get_current_admin),
    use_case: UpdateLostReportUseCase = Depends(get_update_lost_report_use_case),
):
    photo_files = (
        [(await f.read(), f.content_type) for f in photos_to_add]
        if photos_to_add
        else None
    )

    location_point = None
    if body.location_point:
        location_point = Point(
            latitude=body.location_point.latitude,
            longitude=body.location_point.longitude,
        )

    try:
        report = await use_case.execute(
            user=current_admin,
            report_id=report_id,
            title=body.title,
            description=body.description,
            incident_date=body.incident_date,
            location_name=body.location_name,
            location_point=location_point,
            category_ids=body.category_ids,
            photos_to_add=photo_files,
            photos_to_remove=body.photos_to_remove,
        )
        return AdminLostReportResponse.model_validate(report)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except (ValidationError, PermissionError, StateTransitionError) as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(e)
        )


@router.get("/found-reports/{report_id}", response_model=AdminFoundReportResponse)
async def get_found_report(
    report_id: uuid.UUID,
    use_case: GetFoundReportByIdUseCase = Depends(get_found_report_by_id_use_case),
):
    try:
        report = await use_case.execute(report_id)
        return AdminFoundReportResponse.model_validate(report)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/lost-reports/{report_id}", response_model=AdminLostReportResponse)
async def get_lost_report(
    report_id: uuid.UUID,
    use_case: GetLostReportByIdUseCase = Depends(get_lost_report_by_id_use_case),
):
    try:
        report = await use_case.execute(report_id)
        return AdminLostReportResponse.model_validate(report)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/found-reports/{report_id}")
async def delete_found_report(
    report_id: uuid.UUID,
    use_case: DeleteFoundReportUseCase = Depends(get_delete_found_report_use_case),
):
    try:
        await use_case.execute(report_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/lost-reports/{report_id}")
async def delete_lost_report(
    report_id: uuid.UUID,
    use_case: DeleteLostReportUseCase = Depends(get_delete_lost_report_use_case),
):
    try:
        await use_case.execute(report_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
