from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from typing import List, Optional
from app.schemas.report import ReportRequest, ReportResponse
from app.domain.use_cases.report import ReportUseCase, ListReportUseCase
from app.api.dependencies import get_current_user, get_report_use_case, get_report_form_data, get_reports_list
from datetime import datetime
from app.domain.entities.report import Status, Category
from app.services.report import save_multiple_uploads

router = APIRouter()


@router.post("/report", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def report(
    request: ReportRequest = Depends(get_report_form_data),
    photos: Optional[List[UploadFile]] = File(None),
    user = Depends(get_current_user),
    use_case: ReportUseCase = Depends(get_report_use_case)
):
    photo_urls = save_multiple_uploads(photos)
    try:
        # report_date = datetime.fromisoformat(request.date)
        # report_date = datetime.fromisoformat("2026-03-23")
        report_date = request.date
        return use_case.execute(
            title=request.title,
            description=request.description,
            date=report_date,
            location=request.location,
            status=request.status,
            categories=request.categories,
            photos=photo_urls,
            user=user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/reports", response_model=List[ReportResponse])
def get_reports(
    use_case: ListReportUseCase = Depends(get_reports_list)
):
    try:
        return use_case.execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))