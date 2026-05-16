import uuid
from typing import Optional

from app.core.dependencies import (
    get_approve_contact_request_use_case,
    get_cancel_contact_request_use_case,
    get_create_contact_request_use_case,
    get_current_user,
    get_reject_contact_request_use_case,
    get_search_contact_requests_use_case,
    get_contact_access_use_case,
    get_contact_request_notification_count_use_case,
    get_mark_contact_request_response_seen_use_case,
)
from app.domain.entities.contact_request import RequestStatus
from app.domain.entities.user import User

from app.domain.exceptions import StateTransitionError, ValidationError
from app.domain.use_cases.contact_request import (
    ApproveContactRequestUseCase,
    CancelContactRequestUseCase,
    CreateContactRequestUseCase,
    RejectContactRequestUseCase,
    SearchContactRequestsUseCase,
    GetContactAccessUseCase,
    GetContactRequestNotificationCountUseCase,
    MarkContactRequestResponseSeenUseCase,
)
from app.schemas.contact_request import (
    ContactRequestResponse,
    CreateContactRequestPayload,
    ContactAccessResponse,
    ApproveContactRequestPayload,
    RejectContactRequestPayload,
    ContactRequestNotificationCountResponse,
)
from app.schemas.pagination import Paginated
from fastapi import APIRouter, Depends, HTTPException, Query, status

router = APIRouter(prefix="/contact-requests", tags=["Contact Requests"])


@router.post("", response_model=ContactRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_contact_request(
    body: CreateContactRequestPayload,
    current_user: User = Depends(get_current_user),
    use_case: CreateContactRequestUseCase = Depends(
        get_create_contact_request_use_case
    )
):
    try:
        request = await use_case.execute(
            requester=current_user,
            report_id=body.report_id,
            report_type=body.report_type,
            message=body.message,
        )
        return ContactRequestResponse.model_validate(request)
    except (ValueError, ValidationError) as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(e)
        )

@router.get("", response_model=Paginated[ContactRequestResponse])
async def get_my_contact_requests(
    request_type: str = Query(...),  # incoming atau outgoing
    status_filter: Optional[RequestStatus] = Query(None, alias="status"),
    report_id: Optional[uuid.UUID] = Query(None),
    query: Optional[str] = Query(None, alias="search"),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    use_case: SearchContactRequestsUseCase = Depends(
        get_search_contact_requests_use_case
    ),
):
    requester_id = None
    target_user_id = None

    if request_type == "incoming":
        target_user_id = current_user.id
    elif request_type == "outgoing":
        requester_id = current_user.id
    else:
        raise HTTPException(
            status_code=400, detail="request_type must be 'incoming' or 'outgoing'"
        )

    result = await use_case.execute(
        page=page,
        limit=limit,
        requester_id=requester_id,
        target_user_id=target_user_id,
        report_id=report_id,
        status=status_filter,
        query=query,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return Paginated(
        items=[ContactRequestResponse.model_validate(req) for req in result.items],
        total_items=result.total_items,
        current_page=result.current_page,
        total_pages=result.total_pages,
        limit=result.limit,
    )


@router.post("/{request_id}/approve", response_model=ContactRequestResponse)
async def approve_request(
    request_id: uuid.UUID,
    body: ApproveContactRequestPayload,
    current_user: User = Depends(get_current_user),
    use_case: ApproveContactRequestUseCase = Depends(
        get_approve_contact_request_use_case
    ),
):
    try:
        request = await use_case.execute(
            actor=current_user,
            request_id=request_id,
            response_message=body.message,
        )
        return ContactRequestResponse.model_validate(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except (PermissionError, StateTransitionError) as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.post("/{request_id}/reject", response_model=ContactRequestResponse)
async def reject_request(
    request_id: uuid.UUID,
    body: RejectContactRequestPayload,
    current_user: User = Depends(get_current_user),
    use_case: RejectContactRequestUseCase = Depends(
        get_reject_contact_request_use_case
    ),
):
    try:
        request = await use_case.execute(
            actor=current_user,
            request_id=request_id,
            response_message=body.message,
        )
        return ContactRequestResponse.model_validate(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except (PermissionError, StateTransitionError) as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.post("/{request_id}/cancel", response_model=ContactRequestResponse)
async def cancel_request(
    request_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    use_case: CancelContactRequestUseCase = Depends(
        get_cancel_contact_request_use_case
    ),
):
    try:
        request = await use_case.execute(actor=current_user, request_id=request_id)
        return ContactRequestResponse.model_validate(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except (PermissionError, StateTransitionError) as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.get("/{request_id}/contact", response_model=ContactAccessResponse)
async def get_contact_access(
    request_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    use_case: GetContactAccessUseCase = Depends(
        get_contact_access_use_case
    ),
):
    try:
        request = await use_case.execute(
            actor=current_user,
            request_id=request_id,
        )

        if request.responded_at is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Approved request missing responded_at",
            )
        
        other_user = (
            request.target_user
            if request.requester.id == current_user.id
            else request.requester
        )

        return ContactAccessResponse(
            request_id=request.id,
            granted_at=request.responded_at,
            other_user=other_user,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )

    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )

@router.get("/notification-count", response_model=ContactRequestNotificationCountResponse)
async def get_notification_count(
    current_user: User = Depends(get_current_user),
    use_case: GetContactRequestNotificationCountUseCase = Depends(get_contact_request_notification_count_use_case),
):
    return await use_case.execute(current_user.id)


@router.post("/{request_id}/mark-response-seen", response_model=ContactRequestResponse)
async def mark_response_seen(
    request_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    use_case: MarkContactRequestResponseSeenUseCase = Depends(
        get_mark_contact_request_response_seen_use_case
    ),
):
    try:
        request = await use_case.execute(
            actor=current_user,
            request_id=request_id,
        )

        return ContactRequestResponse.model_validate(request)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )

    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )