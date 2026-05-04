import uuid
from datetime import datetime
from typing import Optional

from app.core.dependencies import (
    get_audit_log_by_id_use_case,
    get_current_admin,
    get_search_audit_logs_use_case,
)
from app.domain.entities.audit_log import ActionType, EntityType
from app.domain.entities.user import Admin
from app.domain.use_cases.audit_log import (
    GetAuditLogByIdUseCase,
    SearchAuditLogsUseCase,
)
from app.schemas.admin import AdminAuditLogResponse
from app.schemas.pagination import Paginated
from fastapi import APIRouter, Depends, HTTPException, Query, status

router = APIRouter(prefix="/audit-logs")


@router.get("", response_model=Paginated[AdminAuditLogResponse])
async def search_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    actor_id: Optional[uuid.UUID] = Query(
        None, description="Filter log berdasarkan siapa yang melakukan aksi"
    ),
    entity_type: Optional[EntityType] = Query(
        None, description="Contoh: user, admin, lost_report"
    ),
    entity_id: Optional[uuid.UUID] = Query(None, description="ID entitas yang diubah"),
    action: Optional[ActionType] = Query(
        None, description="Contoh: create, update, delete, handover"
    ),
    created_at_from: Optional[datetime] = Query(None),
    created_at_to: Optional[datetime] = Query(None),
    sort_order: str = Query(
        "desc", description="'desc' untuk terbaru, 'asc' untuk terlama"
    ),
    current_admin: Admin = Depends(get_current_admin),
    use_case: SearchAuditLogsUseCase = Depends(get_search_audit_logs_use_case),
):
    try:
        result = await use_case.execute(
            actor=current_admin,
            page=page,
            limit=limit,
            actor_id=actor_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            created_at_from=created_at_from,
            created_at_to=created_at_to,
            sort_order=sort_order,
        )

        return Paginated(
            items=[AdminAuditLogResponse.model_validate(log) for log in result.items],
            total_items=result.total_items,
            current_page=result.current_page,
            total_pages=result.total_pages,
            limit=result.limit,
        )
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.get("/{log_id}", response_model=AdminAuditLogResponse)
async def get_audit_log(
    log_id: uuid.UUID,
    current_admin: Admin = Depends(get_current_admin),
    use_case: GetAuditLogByIdUseCase = Depends(get_audit_log_by_id_use_case),
):
    try:
        log = await use_case.execute(actor=current_admin, log_id=log_id)
        return AdminAuditLogResponse.model_validate(log)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
