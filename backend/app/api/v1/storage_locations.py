import uuid
from typing import Optional

from app.core.dependencies import (
    get_search_storage_locations_use_case,
    get_storage_location_by_id_use_case,
)
from app.domain.use_cases.storage_location import (
    GetStorageLocationByIdUseCase,
    SearchStorageLocationsUseCase,
)
from app.schemas.pagination import Paginated
from app.schemas.storage_location import StorageLocationResponse
from fastapi import APIRouter, Depends, HTTPException, Query, status

router = APIRouter(prefix="/storage-locations", tags=["Storage Locations"])


@router.get("", response_model=Paginated[StorageLocationResponse])
async def search_storage_locations(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    query: Optional[str] = Query(None),
    use_case: SearchStorageLocationsUseCase = Depends(
        get_search_storage_locations_use_case
    ),
):
    result = await use_case.execute(page=page, limit=limit, query=query, is_active=True)

    return Paginated(
        items=[StorageLocationResponse.model_validate(loc) for loc in result.items],
        total_items=result.total_items,
        current_page=result.current_page,
        total_pages=result.total_pages,
        limit=result.limit,
    )


@router.get("/{location_id}", response_model=StorageLocationResponse)
async def get_storage_location(
    location_id: uuid.UUID,
    use_case: GetStorageLocationByIdUseCase = Depends(
        get_storage_location_by_id_use_case
    ),
):
    try:
        location = await use_case.execute(location_id=location_id)
        if not location.is_active:
            raise ValueError("Storage location not found")
        return StorageLocationResponse.model_validate(location)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
