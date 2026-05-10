import uuid
from datetime import datetime
from typing import List, Optional

from app.core.dependencies import (
    get_create_lost_report_form,
    get_create_lost_report_use_case,
    get_current_user,
    get_current_user_optional,
    get_delete_lost_report_use_case,
    get_lost_report_by_id_use_case,
    get_potential_found_reports_use_case,
    get_resolve_lost_report_use_case,
    get_search_lost_reports_use_case,
    get_update_lost_report_form,
    get_update_lost_report_use_case,
)
from app.domain.entities.point import Point
from app.domain.entities.report import ReportStatus
from app.domain.entities.user import User
from app.domain.exceptions import FutureDateError, StateTransitionError, ValidationError
from app.domain.use_cases.report import (
    CreateLostReportUseCase,
    DeleteLostReportUseCase,
    FindPotentialFoundReportsUseCase,
    GetLostReportByIdUseCase,
    ResolveLostReportUseCase,
    SearchLostReportsUseCase,
    UpdateLostReportUseCase,
)
from app.schemas.pagination import Paginated
from app.schemas.report import (
    CreateLostReportRequest,
    FoundReportResponse,
    LostReportResponse,
    UpdateLostReportRequest,
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

router = APIRouter(prefix="/lost-reports", tags=["Lost Reports"])


@router.get("", response_model=Paginated[LostReportResponse])
async def search_lost_reports(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    query: Optional[str] = Query(None),
    report_status: Optional[List[ReportStatus]] = Query(None),
    incident_date_from: Optional[datetime] = Query(None),
    incident_date_to: Optional[datetime] = Query(None),
    category_ids: Optional[List[uuid.UUID]] = Query(None),
    user_ids: Optional[List[uuid.UUID]] = Query(None),
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
    radius_km: Optional[float] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    current_user: Optional[User] = Depends(get_current_user_optional),
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
        category_ids=category_ids,
        user_ids=user_ids,
        location_point=location_point,
        location_radius=radius_km,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    items = []
    for r in result.items:
        response = LostReportResponse.model_validate(r)
        response.is_owner = (
            current_user is not None
            and r.reporter.id == current_user.id
        )
        items.append(response)

    return Paginated(
        items=items,
        total_items=result.total_items,
        current_page=result.current_page,
        total_pages=result.total_pages,
        limit=result.limit,
    )


@router.get("/{report_id}", response_model=LostReportResponse)
async def get_lost_report(
    report_id: uuid.UUID,
    current_user: Optional[User] = Depends(get_current_user_optional),
    use_case: GetLostReportByIdUseCase = Depends(get_lost_report_by_id_use_case),
):
    try:
        report = await use_case.execute(report_id)
        # return LostReportResponse.model_validate(report)
        response = LostReportResponse.model_validate(report)
        response.is_owner = ( current_user is not None and report.reporter.id == current_user.id )
        return response
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("", response_model=LostReportResponse, status_code=status.HTTP_201_CREATED)
async def create_lost_report(
    body: CreateLostReportRequest = Depends(get_create_lost_report_form),
    photos: Optional[List[UploadFile]] = File(default=None),
    current_user: User = Depends(get_current_user),
    use_case: CreateLostReportUseCase = Depends(get_create_lost_report_use_case),
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
            **body.model_dump(exclude={"location_point"}),
            location_point=location_point,
            photo_files=photo_files,
        )
        return LostReportResponse.model_validate(report)
    except (ValidationError, FutureDateError) as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(e)
        )


@router.patch("/{report_id}", response_model=LostReportResponse)
async def update_lost_report(
    report_id: uuid.UUID,
    body: UpdateLostReportRequest = Depends(get_update_lost_report_form),
    photos_to_add: Optional[List[UploadFile]] = File(None),
    current_user: User = Depends(get_current_user),
    use_case: UpdateLostReportUseCase = Depends(get_update_lost_report_use_case),
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
        )
        return LostReportResponse.model_validate(report)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except (ValidationError, StateTransitionError, FutureDateError) as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(e)
        )


@router.post("/{report_id}/resolve", response_model=LostReportResponse)
async def resolve_lost_report(
    report_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    use_case: ResolveLostReportUseCase = Depends(get_resolve_lost_report_use_case),
):
    try:
        report = await use_case.execute(report_id=report_id, user=current_user)
        return LostReportResponse.model_validate(report)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except StateTransitionError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(e)
        )


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lost_report(
    report_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    use_case: DeleteLostReportUseCase = Depends(get_delete_lost_report_use_case),
):
    try:
        await use_case.execute(report_id=report_id, user=current_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.get("/{report_id}/potential-matches", response_model=List[FoundReportResponse])
async def potential_matches(
    report_id: uuid.UUID,
    current_user: Optional[User] = Depends(get_current_user_optional),
    use_case: FindPotentialFoundReportsUseCase = Depends(
        get_potential_found_reports_use_case
    ),
):
    try:
        reports = await use_case.execute(report_id)
        responses = []
        for report in reports:
            response = FoundReportResponse.model_validate(report)
            response.is_owner = (
                current_user is not None
                and report.reporter.id == current_user.id
            )
            responses.append(response)
        return responses
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
