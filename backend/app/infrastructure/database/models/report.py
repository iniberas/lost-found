from sqlalchemy import Column, String
from app.infrastructure.database.models.base import Base


class CategoryModel(Base):
    # TODO: tambahin atribut + relasi disini
    pass


class ProofModel(Base):
    # TODO: tambahin atribut + relasi disini
    pass


class ReportModel(Base):
    # TODO: tambahin atribut + relasi disini
    pass


class LostReportModel(ReportModel):
    # TODO: tambahin atribut + relasi disini
    pass


class FoundReportModel(ReportModel):
    # TODO: tambahin atribut + relasi disini
    pass


class HandoverReportModel(ReportModel):
    # TODO: tambahin atribut + relasi disini
    pass