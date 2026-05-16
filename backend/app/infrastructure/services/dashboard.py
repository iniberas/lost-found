from datetime import datetime, time, timedelta

from app.domain.entities.report import ReportStatus
from app.infrastructure.database.models import ReportModel, UserModel
from geoalchemy2 import Geometry
from sqlalchemy import cast, extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession


class DashboardQueryService:
    def __init__(self, session: AsyncSession):
        self.session = session

    def _calculate_trend(self, current_total: int, previous_total: int) -> float:
        if previous_total == 0:
            return 100.0 if current_total > 0 else 0.0
        return round(((current_total - previous_total) / previous_total) * 100.0, 2)

    async def get_stats(self) -> dict:
        now = datetime.now()
        today = now.date()
        start_of_today = datetime.combine(today, time.min)
        start_of_yesterday = start_of_today - timedelta(days=1)

        new_today_query = select(func.count(ReportModel.id)).where(
            ReportModel.created_at >= start_of_today
        )
        new_yesterday_query = select(func.count(ReportModel.id)).where(
            ReportModel.created_at >= start_of_yesterday,
            ReportModel.created_at < start_of_today,
        )

        new_today = (await self.session.execute(new_today_query)).scalar() or 0
        new_yesterday = (await self.session.execute(new_yesterday_query)).scalar() or 0

        pending_current_query = select(func.count(ReportModel.id)).where(
            ReportModel.report_status == ReportStatus.OPEN
        )
        pending_past_query = select(func.count(ReportModel.id)).where(
            ReportModel.report_status == ReportStatus.OPEN,
            ReportModel.created_at < start_of_today,
        )

        pending_current = (
            await self.session.execute(pending_current_query)
        ).scalar() or 0
        pending_past = (await self.session.execute(pending_past_query)).scalar() or 0

        resolved_current_query = select(func.count(ReportModel.id)).where(
            ReportModel.report_status == ReportStatus.RESOLVED
        )
        resolved_past_query = select(func.count(ReportModel.id)).where(
            ReportModel.report_status == ReportStatus.RESOLVED,
            ReportModel.updated_at < start_of_today,
        )

        resolved_current = (
            await self.session.execute(resolved_current_query)
        ).scalar() or 0
        resolved_past = (await self.session.execute(resolved_past_query)).scalar() or 0

        users_current_query = select(func.count(UserModel.id)).where(
            UserModel.deleted_at.is_(None)
        )
        users_past_query = select(func.count(UserModel.id)).where(
            UserModel.deleted_at.is_(None), UserModel.created_at < start_of_today
        )

        users_current = (await self.session.execute(users_current_query)).scalar() or 0
        users_past = (await self.session.execute(users_past_query)).scalar() or 0

        return {
            "new_reports": {
                "total": new_today,
                "trend_percentage": self._calculate_trend(new_today, new_yesterday),
            },
            "pending_reports": {
                "total": pending_current,
                "trend_percentage": self._calculate_trend(
                    pending_current, pending_past
                ),
            },
            "resolved_reports": {
                "total": resolved_current,
                "trend_percentage": self._calculate_trend(
                    resolved_current, resolved_past
                ),
            },
            "active_users": {
                "total": users_current,
                "trend_percentage": self._calculate_trend(users_current, users_past),
            },
        }

    async def get_chart_data(self) -> dict:
        current_year = datetime.now().year

        query = (
            select(
                extract("month", ReportModel.created_at).label("month"),
                ReportModel.report_type,
                func.count(ReportModel.id).label("total"),
            )
            .where(
                extract("year", ReportModel.created_at) == current_year,
                ReportModel.deleted_at.is_(None),
            )
            .group_by("month", ReportModel.report_type)
        )

        result = await self.session.execute(query)
        records = result.all()

        months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ]
        chart_data = {
            "lost": [{"name": m, "value": 0} for m in months],
            "found": [{"name": m, "value": 0} for m in months],
        }

        for row in records:
            month_idx = int(row.month) - 1  # 1 = Jan, index 0
            tipe = row.report_type  # 'lost' atau 'found'
            chart_data[tipe][month_idx]["value"] = row.total

        return chart_data

    async def get_map_incidents(self) -> list:
        query = (
            select(
                ReportModel.id,
                ReportModel.title,
                ReportModel.report_type,
                func.ST_Y(cast(ReportModel.location_point, Geometry)).label("latitude"),
                func.ST_X(cast(ReportModel.location_point, Geometry)).label(
                    "longitude"
                ),
            )
            .where(
                ReportModel.location_point.is_not(None),
                ReportModel.deleted_at.is_(None),
            )
            .order_by(ReportModel.created_at.desc())
            .limit(50)
        )

        result = await self.session.execute(query)

        return [
            {
                "id": row.id,
                "title": row.title,
                "report_type": row.report_type,
                "latitude": row.latitude,
                "longitude": row.longitude,
            }
            for row in result.all()
        ]
