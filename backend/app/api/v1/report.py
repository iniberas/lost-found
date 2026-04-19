from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    File,
    UploadFile,
    Query,
    Form,
)
from typing import List, Optional
from uuid import UUID

from app.schemas.report import (
    LostReportRequest,
    LostReportResponse,
    FoundReportRequest,
    FoundReportResponse,
    HandoverReportRequest,
    UpdateReportRequest,
    MyReportsResponse,
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

from app.api.dependencies import (
    get_current_user,
    get_current_admin_user,
    get_lost_report_form_data,
    get_found_report_form_data,
    get_handover_report_form_data,
    get_create_lost_report_use_case,
    get_create_found_report_use_case,
    get_create_handover_report_use_case,
    get_list_open_lost_report_use_case,
    get_list_open_found_report_use_case,
    get_lost_report_by_id_use_case,
    get_found_report_by_id_use_case,
    get_search_lost_reports_use_case,
    get_search_found_reports_use_case,
    get_reports_by_user_use_case,
    get_update_lost_report_use_case,
    get_update_found_report_use_case,
    get_resolve_lost_report_use_case,
    get_resolve_found_report_use_case,
    get_transfer_found_item_use_case,
    get_delete_lost_report_use_case,
    get_delete_found_report_use_case,
    get_find_potential_matches_use_case,
)

from app.services.report import save_multiple_uploads

router = APIRouter(tags=["Reports"])


@router.post(
    "/lost-reports",
    response_model=LostReportResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_lost_report(
    request: LostReportRequest = Depends(get_lost_report_form_data),
    photos: Optional[List[UploadFile]] = File(None),
    user=Depends(get_current_user),
    use_case: CreateLostReportUseCase = Depends(get_create_lost_report_use_case),
):
    valid_photos = [p for p in photos if p.filename] if photos else []
    photo_urls = save_multiple_uploads(valid_photos)

    try:
        return use_case.execute(
            reporter=user,
            photos=photo_urls,
            **request.model_dump(),
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/found-reports",
    response_model=FoundReportResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_found_report(
    request: FoundReportRequest = Depends(get_found_report_form_data),
    photos: List[UploadFile] = File(...),
    user=Depends(get_current_user),
    use_case: CreateFoundReportUseCase = Depends(get_create_found_report_use_case),
):
    valid_photos = [p for p in photos if p.filename]
    if not valid_photos:
        raise HTTPException(
            status_code=400, detail="Found reports must have at least one photo."
        )
    photo_urls = save_multiple_uploads(valid_photos)

    try:
        return use_case.execute(
            reporter=user,
            **request.model_dump(),
            photos=photo_urls,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/handover-reports",
    response_model=FoundReportResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_handover_report(
    request: HandoverReportRequest = Depends(get_handover_report_form_data),
    photos: List[UploadFile] = File(default=[]),
    admin_user=Depends(get_current_admin_user),
    use_case: CreateHandoverReportUseCase = Depends(
        get_create_handover_report_use_case
    ),
):
    valid_photos = [p for p in photos if p.filename]
    if not valid_photos:
        raise HTTPException(
            status_code=400, detail="Found reports must have at least one photo."
        )
    photo_urls = save_multiple_uploads(valid_photos)

    try:
        return use_case.execute(
            reporter=admin_user,
            photos=photo_urls,
            **request.model_dump(),
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==========================================
# SEARCH & LISTING ENDPOINTS
# ==========================================
# Placed above {report_id} endpoints to prevent path collision


@router.get("/lost-reports/search", response_model=List[LostReportResponse])
def search_lost_reports(
    query: str = Query("", description="Search by title or description"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    use_case: SearchLostReportsUseCase = Depends(get_search_lost_reports_use_case),
):
    return use_case.execute(query=query, category_id=category_id)


@router.get("/found-reports/search", response_model=List[FoundReportResponse])
def search_found_reports(
    query: str = Query("", description="Search by title or description"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    use_case: SearchFoundReportsUseCase = Depends(get_search_found_reports_use_case),
):
    return use_case.execute(query=query, category_id=category_id)


@router.get("/lost-reports", response_model=List[LostReportResponse])
def get_open_lost_reports(
    use_case: ListOpenLostReportUseCase = Depends(get_list_open_lost_report_use_case),
):
    return use_case.execute()


@router.get("/found-reports", response_model=List[FoundReportResponse])
def get_open_found_reports(
    use_case: ListOpenFoundReportUseCase = Depends(get_list_open_found_report_use_case),
):
    return use_case.execute()


@router.get("/my-reports", response_model=MyReportsResponse)
def get_my_reports(
    user=Depends(get_current_user),
    use_case: GetReportsByUserUseCase = Depends(get_reports_by_user_use_case),
):
    return use_case.execute(user_id=user.id)


# ==========================================
# GET BY ID ENDPOINTS
# ==========================================


@router.get("/lost-reports/{report_id}", response_model=LostReportResponse)
def get_lost_report(
    report_id: UUID,
    use_case: GetLostReportByIdUseCase = Depends(get_lost_report_by_id_use_case),
):
    try:
        return use_case.execute(report_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/found-reports/{report_id}", response_model=FoundReportResponse)
def get_found_report(
    report_id: UUID,
    use_case: GetFoundReportByIdUseCase = Depends(get_found_report_by_id_use_case),
):
    try:
        return use_case.execute(report_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ==========================================
# MATCHING ENDPOINT
# ==========================================


@router.get(
    "/lost-reports/{report_id}/matches", response_model=List[FoundReportResponse]
)
def get_potential_matches(
    report_id: UUID,
    use_case: FindPotentialMatchesUseCase = Depends(
        get_find_potential_matches_use_case
    ),
):
    try:
        return use_case.execute(lost_report_id=report_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ==========================================
# UPDATE ENDPOINTS
# ==========================================


@router.put("/lost-reports/{report_id}", response_model=LostReportResponse)
def update_lost_report(
    report_id: UUID,
    request: UpdateReportRequest,
    user=Depends(
        get_current_user
    ),  # Assuming you'd add authorization checks inside or before the use case
    use_case: UpdateLostReportUseCase = Depends(get_update_lost_report_use_case),
):
    try:
        return use_case.execute(
            report_id=report_id, title=request.title, description=request.description
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/found-reports/{report_id}", response_model=FoundReportResponse)
def update_found_report(
    report_id: UUID,
    request: UpdateReportRequest,
    user=Depends(get_current_user),
    use_case: UpdateFoundReportUseCase = Depends(get_update_found_report_use_case),
):
    try:
        return use_case.execute(
            report_id=report_id, title=request.title, description=request.description
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ==========================================
# RESOLUTION / STATE CHANGE ENDPOINTS
# ==========================================


@router.post("/lost-reports/{report_id}/resolve", response_model=LostReportResponse)
def resolve_lost_report(
    report_id: UUID,
    user=Depends(get_current_user),
    use_case: ResolveLostReportUseCase = Depends(get_resolve_lost_report_use_case),
):
    try:
        return use_case.execute(report_id=report_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/found-reports/{report_id}/resolve", response_model=FoundReportResponse)
def resolve_found_report(
    report_id: UUID,
    notes: str = Form(...),
    photos: List[UploadFile] = File(...),
    user=Depends(get_current_user),
    use_case: ResolveFoundReportUseCase = Depends(get_resolve_found_report_use_case),
):
    valid_photos = [p for p in photos if p.filename]
    if not valid_photos:
        raise HTTPException(
            status_code=400, detail="Proof requires at least one photo."
        )
    photo_urls = save_multiple_uploads(valid_photos)

    try:
        return use_case.execute(report_id=report_id, photos=photo_urls, notes=notes)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/found-reports/{report_id}/transfer", response_model=FoundReportResponse)
def transfer_item_to_admin(
    report_id: UUID,
    admin_user=Depends(get_current_admin_user),
    use_case: TransferFoundItemToAdminUseCase = Depends(
        get_transfer_found_item_use_case
    ),
):
    try:
        return use_case.execute(report_id=report_id, admin=admin_user)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ==========================================
# DELETE ENDPOINTS
# ==========================================


@router.delete("/lost-reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lost_report(
    report_id: UUID,
    user=Depends(get_current_user),
    use_case: DeleteLostReportUseCase = Depends(get_delete_lost_report_use_case),
):
    try:
        use_case.execute(report_id=report_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/found-reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_found_report(
    report_id: UUID,
    user=Depends(get_current_user),
    use_case: DeleteFoundReportUseCase = Depends(get_delete_found_report_use_case),
):
    try:
        use_case.execute(report_id=report_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
