from typing import List

from app.core.dependencies import get_session
from app.infrastructure.services.dashboard import DashboardQueryService
from app.schemas.admin import (
    DashboardChartResponse,
    DashboardStatsResponse,
    MapIncidentResponse,
)
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/dashboard")


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(session: AsyncSession = Depends(get_session)):
    query_service = DashboardQueryService(session)
    return await query_service.get_stats()


@router.get("/chart", response_model=DashboardChartResponse)
async def get_dashboard_chart(session: AsyncSession = Depends(get_session)):
    query_service = DashboardQueryService(session)
    return await query_service.get_chart_data()


@router.get("/map-incidents", response_model=List[MapIncidentResponse])
async def get_map_incidents(session: AsyncSession = Depends(get_session)):
    query_service = DashboardQueryService(session)
    return await query_service.get_map_incidents()
