from datetime import datetime
from typing import List, Optional

from app.core.dependencies import (
    get_create_hand_over_report_form,
    get_create_hand_over_report_use_case,
    get_current_admin,
    get_search_found_reports_use_case,
    get_search_lost_reports_use_case,
)
from app.domain.entities.point import Point
from app.domain.entities.report import FoundStatus, ReportStatus
from app.domain.entities.user import Admin
from app.domain.exceptions import FutureDateError, ValidationError
from app.domain.use_cases.report import (
    CreateHandOverReportUseCase,
    SearchFoundReportsUseCase,
    SearchLostReportsUseCase,
)
from app.schemas.pagination import Paginated
from app.schemas.report import (
    CreateHandOverReportRequest,
    FoundReportResponse,
    LostReportResponse,
)
from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)

router = APIRouter(prefix="/reports", tags=["categories"])


@router.get("/lost-reports", response_model=Paginated[LostReportResponse])
async def search_lost_reports(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    query: Optional[str] = Query(None),
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
    result = await use_case.execute(
        page=page,
        limit=limit,
        query=query,
        report_status=report_status,
        incident_date_from=incident_date_from,
        incident_date_to=incident_date_to,
        location_point=location_point,
        location_radius=radius_km,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return Paginated(
        items=[LostReportResponse.model_validate(r) for r in result.items],
        total_items=result.total_items,
        current_page=result.current_page,
        total_pages=result.total_pages,
        limit=result.limit,
    )


@router.get("/found-reports", response_model=Paginated[FoundReportResponse])
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
