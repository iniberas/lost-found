import uuid
from typing import Optional

from app.core.dependencies import (
    get_activate_storage_location_use_case,
    get_create_storage_location_use_case,
    get_current_admin,
    get_delete_storage_location_use_case,
    get_search_storage_locations_use_case,
    get_update_storage_location_use_case,
)
from app.domain.entities.point import Point
from app.domain.entities.user import Admin
from app.domain.exceptions import StateTransitionError, ValidationError
from app.domain.use_cases.storage_location import (
    ActivateStorageLocationUseCase,
    CreateStorageLocationUseCase,
    DeleteStorageLocationUseCase,
    SearchStorageLocationsUseCase,
    UpdateStorageLocationUseCase,
)
from app.schemas.admin import (
    AdminCreateStorageLocationRequest,
    AdminStorageLocationResponse,
    AdminUpdateStorageLocationRequest,
)
from app.schemas.pagination import Paginated
from fastapi import APIRouter, Depends, HTTPException, Query, status

router = APIRouter(prefix="/storage-locations")


@router.post(
    "",
    response_model=AdminStorageLocationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_storage_location(
    body: AdminCreateStorageLocationRequest,
    current_admin: Admin = Depends(get_current_admin),
    use_case: CreateStorageLocationUseCase = Depends(
        get_create_storage_location_use_case
    ),
):
    location_point = Point(
        latitude=body.location_point.latitude, longitude=body.location_point.longitude
    )
    try:
        location = await use_case.execute(
            actor=current_admin,
            name=body.name,
            description=body.description,
            location_point=location_point,
        )
        return AdminStorageLocationResponse.model_validate(location)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except (ValidationError, PermissionError) as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(e)
        )


@router.get("", response_model=Paginated[AdminStorageLocationResponse])
async def search_storage_locations(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    query: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(
        None, description="Filter aktif/nonaktif. Kosongkan untuk melihat semua."
    ),
    _: Admin = Depends(get_current_admin),
    use_case: SearchStorageLocationsUseCase = Depends(
        get_search_storage_locations_use_case
    ),
):
    result = await use_case.execute(
        page=page,
        limit=limit,
        query=query,
        is_active=is_active,
    )
    return Paginated(
        items=[
            AdminStorageLocationResponse.model_validate(loc) for loc in result.items
        ],
        total_items=result.total_items,
        current_page=result.current_page,
        total_pages=result.total_pages,
        limit=result.limit,
    )


@router.put("/{location_id}", response_model=AdminStorageLocationResponse)
async def update_storage_location(
    location_id: uuid.UUID,
    body: AdminUpdateStorageLocationRequest,
    current_admin: Admin = Depends(get_current_admin),
    use_case: UpdateStorageLocationUseCase = Depends(
        get_update_storage_location_use_case
    ),
):
    location_point = None
    if body.location_point:
        location_point = Point(
            latitude=body.location_point.latitude,
            longitude=body.location_point.longitude,
        )

    try:
        location = await use_case.execute(
            actor=current_admin,
            location_id=location_id,
            name=body.name,
            description=body.description,
            location_point=location_point,
        )
        return AdminStorageLocationResponse.model_validate(location)
    except ValueError as e:
        status_code = (
            status.HTTP_404_NOT_FOUND
            if "not found" in str(e).lower()
            else status.HTTP_409_CONFLICT
        )
        raise HTTPException(status_code=status_code, detail=str(e))
    except (ValidationError, PermissionError, StateTransitionError) as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(e)
        )


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_storage_location(
    location_id: uuid.UUID,
    current_admin: Admin = Depends(get_current_admin),
    use_case: DeleteStorageLocationUseCase = Depends(
        get_delete_storage_location_use_case
    ),
):
    try:
        await use_case.execute(actor=current_admin, location_id=location_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except StateTransitionError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(e)
        )


@router.post("/{location_id}/activate", response_model=AdminStorageLocationResponse)
async def activate_storage_location(
    location_id: uuid.UUID,
    current_admin: Admin = Depends(get_current_admin),
    use_case: ActivateStorageLocationUseCase = Depends(
        get_activate_storage_location_use_case
    ),
):
    try:
        location = await use_case.execute(actor=current_admin, location_id=location_id)
        return AdminStorageLocationResponse.model_validate(location)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except StateTransitionError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(e)
        )
