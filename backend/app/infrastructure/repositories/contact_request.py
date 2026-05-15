import uuid
from typing import List, Optional

from app.domain.entities.contact_request import ContactRequest, RequestStatus
from app.domain.entities.user import Admin, SuperAdmin, User
from app.domain.entities.report import ReportType
from app.domain.interfaces.contact_request import IContactRequestRepository
from app.infrastructure.database.models.contact_request import ContactRequestModel
from app.infrastructure.database.models.report import LostReportModel, FoundReportModel
from app.infrastructure.database.models.user import UserModel, UserRole
from sqlalchemy import func, select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, aliased


def _user_from_model(m: UserModel) -> User:
    if m.role == UserRole.SUPERADMIN:
        cls = SuperAdmin
    elif m.role == UserRole.ADMIN:
        cls = Admin
    else:
        cls = User

    return cls(
        id=m.id,
        created_at=m.created_at,
        updated_at=m.updated_at,
        deleted_at=m.deleted_at,
        name=m.name,
        email=m.email,
        phone_number=m.phone_number,
        password_hash=m.password_hash,
    )


class ContactRequestRepository(IContactRequestRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: ContactRequestModel) -> ContactRequest:
        return ContactRequest(
            id=model.id,
            created_at=model.created_at,
            updated_at=model.updated_at,
            requester=_user_from_model(model.requester),
            target_user=_user_from_model(model.target_user),
            report_id=model.report_id,
            report_type=ReportType(model.report_type),
            status=RequestStatus(model.status),
            message=model.message,
            responded_at=model.responded_at,
            response_message=model.response_message,
            is_response_seen=model.is_response_seen,
        )

    async def save(self, request: ContactRequest) -> None:
        existing = await self.session.get(ContactRequestModel, request.id)

        if existing:
            existing.updated_at = request.updated_at
            existing.responded_at = request.responded_at
            existing.status = request.status.value
            existing.message = request.message
            existing.response_message = request.response_message
            existing.is_response_seen = request.is_response_seen
        else:
            self.session.add(
                ContactRequestModel(
                    id=request.id,
                    created_at=request.created_at,
                    updated_at=request.updated_at,
                    responded_at=request.responded_at,
                    requester_id=request.requester.id,
                    target_user_id=request.target_user.id,
                    report_id=request.report_id,
                    report_type=request.report_type.value,
                    status=request.status.value,
                    message=request.message,
                    response_message=request.response_message,
                )
            )
        await self.session.flush()

    async def get_by_id(self, request_id: uuid.UUID) -> Optional[ContactRequest]:
        stmt = (
            select(ContactRequestModel)
            .options(
                selectinload(ContactRequestModel.requester),
                selectinload(ContactRequestModel.target_user),
            )
            .where(ContactRequestModel.id == request_id)
        )
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def search(
        self,
        requester_id: Optional[uuid.UUID] = None,
        target_user_id: Optional[uuid.UUID] = None,
        report_id: Optional[uuid.UUID] = None,
        status: Optional[RequestStatus] = None,
        query: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        limit: int = 20,
        offset: int = 0,
    ) -> List[ContactRequest]:
        requester_alias = aliased(UserModel)
        target_alias = aliased(UserModel)

        lost_alias = aliased(LostReportModel)
        found_alias = aliased(FoundReportModel)

        stmt = (
            select(ContactRequestModel)

            # requester
            .join(
                requester_alias,
                ContactRequestModel.requester_id == requester_alias.id,
            )

            # target
            .join(
                target_alias,
                ContactRequestModel.target_user_id == target_alias.id,
            )

            # lost report
            .outerjoin(
                lost_alias,
                and_(
                    ContactRequestModel.report_id == lost_alias.id,
                    ContactRequestModel.report_type == "lost",
                )
            )

            # found report
            .outerjoin(
                found_alias,
                and_(
                    ContactRequestModel.report_id == found_alias.id,
                    ContactRequestModel.report_type == "found",
                )
            )

            .options(
                selectinload(ContactRequestModel.requester),
                selectinload(ContactRequestModel.target_user),
            )
        )
        stmt = self._apply_filters(
            stmt, requester_id, target_user_id, report_id, status
        )

        if query:
            search_term = f"%{query}%"

            stmt = stmt.where(
                or_(
                    ContactRequestModel.message.ilike(search_term),

                    requester_alias.name.ilike(search_term),
                    target_alias.name.ilike(search_term),

                    lost_alias.title.ilike(search_term),
                    found_alias.title.ilike(search_term),
                )
            )

        col = getattr(ContactRequestModel, sort_by, ContactRequestModel.created_at)
        stmt = stmt.order_by(col.asc() if sort_order == "asc" else col.desc())

        stmt = stmt.limit(limit).offset(offset)
        result = await self.session.execute(stmt)
        return [self._to_entity(m) for m in result.scalars().all()]
    
    async def count_search(
        self,
        requester_id: Optional[uuid.UUID] = None,
        target_user_id: Optional[uuid.UUID] = None,
        report_id: Optional[uuid.UUID] = None,
        status: Optional[RequestStatus] = None,
        query: Optional[str] = None,
    ) -> int:
        requester_alias = aliased(UserModel)
        target_alias = aliased(UserModel)

        lost_alias = aliased(LostReportModel)
        found_alias = aliased(FoundReportModel)

        stmt = (
            select(func.count())
            .select_from(ContactRequestModel)

            .join(
                requester_alias,
                ContactRequestModel.requester_id == requester_alias.id,
            )

            .join(
                target_alias,
                ContactRequestModel.target_user_id == target_alias.id,
            )

            .outerjoin(
                lost_alias,
                and_(
                    ContactRequestModel.report_id == lost_alias.id,
                    ContactRequestModel.report_type == "lost",
                )
            )

            .outerjoin(
                found_alias,
                and_(
                    ContactRequestModel.report_id == found_alias.id,
                    ContactRequestModel.report_type == "found",
                )
            )
        )

        stmt = self._apply_filters(
            stmt,
            requester_id,
            target_user_id,
            report_id,
            status,
        )

        if query:
            search_term = f"%{query}%"

            stmt = stmt.where(
                or_(
                    ContactRequestModel.message.ilike(search_term),

                    requester_alias.name.ilike(search_term),
                    target_alias.name.ilike(search_term),

                    lost_alias.title.ilike(search_term),
                    found_alias.title.ilike(search_term),
                )
            )

        result = await self.session.execute(stmt)

        return result.scalar_one()

    async def count_outgoing_unseen_updates(
        self,
        requester_id: uuid.UUID,
    ) -> dict[str, int]:
        stmt = (
            select(
                ContactRequestModel.status,
                func.count().label("count"),
            )
            .where(
                ContactRequestModel.requester_id == requester_id,
                ContactRequestModel.status.in_([
                    RequestStatus.APPROVED,
                    RequestStatus.REJECTED,
                    RequestStatus.CLOSED,
                ]),
                ContactRequestModel.is_response_seen == False,
            )
            .group_by(ContactRequestModel.status)
        )

        result = await self.session.execute(stmt)

        counts = {
            "approved": 0,
            "rejected": 0,
            "closed": 0,
        }

        for status, count in result.all():
            if status == RequestStatus.APPROVED:
                counts["approved"] = count
            elif status == RequestStatus.REJECTED:
                counts["rejected"] = count
            elif status == RequestStatus.CLOSED:
                counts["closed"] = count

        return counts

    def _apply_filters(self, stmt, requester_id, target_user_id, report_id, status):
        if requester_id:
            stmt = stmt.where(ContactRequestModel.requester_id == requester_id)
        if target_user_id:
            stmt = stmt.where(ContactRequestModel.target_user_id == target_user_id)
        if report_id:
            stmt = stmt.where(ContactRequestModel.report_id == report_id)
        if status:
            stmt = stmt.where(ContactRequestModel.status == status.value)
        return stmt

    async def delete(self, request_id: uuid.UUID) -> None:
        model = await self.session.get(ContactRequestModel, request_id)
        if model:
            await self.session.delete(model)
            await self.session.flush()
