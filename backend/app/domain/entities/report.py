from enum import Enum
from datetime import datetime, timezone
from typing import List, Optional
from app.domain.entities.user import User, Admin
from app.domain.entities.category import Category
from app.domain.entities.proof import Proof
from uuid import UUID


class ReportType(str, Enum):
    LOST = "lost"
    FOUND = "found"


class ReportStatus(str, Enum):
    OPEN = "open"
    RESOLVED = "resolved"
    CLOSED = "closed"  # resolve klo ketemu, closed klo dihapus/kelamaan


class FoundStatus(str, Enum):
    HELD_BY_FINDER = "held_by_finder"
    HELD_BY_ADMIN = "held_by_admin"
    RETURNED_TO_OWNER = "returned_to_owner"


class Report:
    def __init__(
        self,
        id: UUID,
        created_at: datetime,
        updated_at: datetime,
        reporter: User,
        report_status: ReportStatus,
        report_type: ReportType,
        date: datetime,
        title: str,
        description: str,
        location_name: str,
        categories: List[Category],
        deleted_at: Optional[datetime] = None,
        latitude: Optional[float] = None,  # optional biar ga maksa
        longitude: Optional[float] = None,
        photos: Optional[List[str]] = None,
    ):
        clean_title = self._clean_text(title, "Title")
        clean_location_name = self._clean_text(location_name, "Location name")

        self._validate_categories(categories)

        self._id = id
        self._created_at = created_at
        self._updated_at = updated_at
        self._deleted_at = deleted_at
        self._reporter = reporter
        self._report_status = report_status
        self._report_type = report_type
        self._date = date
        self._title = clean_title
        self._description = description
        self._location_name = clean_location_name
        self._latitude = latitude
        self._longitude = longitude
        self._categories = categories.copy()
        self._photos = photos.copy() if photos is not None else []

    @property
    def id(self) -> UUID:
        return self._id

    @property
    def created_at(self) -> datetime:
        return self._created_at

    @property
    def updated_at(self) -> datetime:
        return self._updated_at

    @property
    def deleted_at(self) -> Optional[datetime]:
        return self._deleted_at

    @property
    def reporter(self) -> User:
        return self._reporter

    @property
    def report_status(self) -> ReportStatus:
        return self._report_status

    @property
    def report_type(self) -> ReportType:
        return self._report_type

    @property
    def date(self) -> datetime:
        return self._date

    @property
    def title(self) -> str:
        return self._title

    @property
    def description(self) -> str:
        return self._description

    @property
    def location_name(self) -> str:
        return self._location_name

    @property
    def latitude(self) -> Optional[float]:
        return self._latitude

    @property
    def longitude(self) -> Optional[float]:
        return self._longitude

    @property
    def categories(self) -> List[Category]:
        return self._categories.copy()

    @property
    def photos(self) -> List[str]:
        return self._photos.copy()

    def update_title(self, new_title: str):
        new_title = self._clean_text(new_title, "Title")
        self._title = new_title
        self._touch()

    def update_description(self, new_description: str):
        self._description = new_description
        self._touch()

    def update_date(self, new_date: datetime):
        self._date = new_date
        self._touch()

    def update_location(
        self, new_location_name: str, new_latitude: float, new_longitude: float
    ):
        new_location_name = self._clean_text(new_location_name, "Location name")
        self._location_name = new_location_name
        self._latitude = new_latitude
        self._longitude = new_longitude
        self._touch()

    def update_report_status(self, new_status: ReportStatus):
        self._report_status = new_status
        self._touch()

    def add_category(self, new_category: Category):
        if new_category in self._categories:
            raise ValueError("Category already exists in this report")

        self._categories.append(new_category)
        self._touch()

    def remove_category(self, category: Category):
        if category in self._categories:
            proposed_categories = self._categories.copy()
            proposed_categories.remove(category)
            self._validate_categories(proposed_categories)
            self._categories = proposed_categories
            self._touch()

    def add_photo(self, new_photo: str):
        if new_photo in self._photos:
            return
        
        if len(self._photos) >= 5:
            raise ValueError("Maximum photo limit reached")
            
        self._photos.append(new_photo)
        self._touch()
        
    def remove_photo(self, photo: str):
        if photo in self._photos:
            self._photos.remove(photo)
            self._touch()

    def delete(self):
        if self._deleted_at is not None:
            raise ValueError("Report is already deleted")

        self._deleted_at = datetime.now()
        self._touch()
        self.update_report_status(ReportStatus.CLOSED)
    
    def _touch(self):
        self._updated_at = datetime.now(timezone.utc)

    def _clean_text(self, text: str, field_name: str) -> str:
        if not text:
            raise ValueError(f"{field_name} cannot be empty")
            
        cleaned_text = text.strip()
        if not cleaned_text:
            raise ValueError(f"{field_name} cannot be empty")
            
        return cleaned_text

    def _validate_categories(self, categories: List[Category]):
        if not categories:
            raise ValueError("A report must have at least one category")


class LostReport(Report):
    def __init__(
        self,
        id: UUID,
        created_at: datetime,
        updated_at: datetime,
        reporter: User,
        report_status: ReportStatus,
        date: datetime,
        title: str,
        description: str,
        location_name: str,
        categories: List[Category],
        deleted_at: Optional[datetime] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        photos: Optional[List[str]] = None,  # lost report boleh ga ada fotonya ^v^
    ):
        super().__init__(
            id,
            created_at,
            updated_at,
            reporter,
            report_status,
            ReportType.LOST,
            date,
            title,
            description,
            location_name,
            categories,
            deleted_at=deleted_at,
            latitude=latitude,
            longitude=longitude,
            photos=photos,
        )

    def confirm_found(self):
        if self.report_status == ReportStatus.RESOLVED:
            raise ValueError("Report is already resolved")
        self.update_report_status(ReportStatus.RESOLVED)


class FoundReport(Report):
    def __init__(
        self,
        id: UUID,
        created_at: datetime,
        updated_at: datetime,
        reporter: User,
        report_status: ReportStatus,
        found_status: FoundStatus,
        date: datetime,
        title: str,
        description: str,
        location_name: str,
        categories: List[Category],
        photos: List[str],  # found report harus ada fotonya biar ga boong ^v^
        holder: User,
        deleted_at: Optional[datetime] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        proof: Optional[Proof] = None,
        finder_name: Optional[str] = None,
        finder_contact: Optional[str] = None,
    ):
        self._validate_photo(photos)

        super().__init__(
            id,
            created_at,
            updated_at,
            reporter,
            report_status,
            ReportType.FOUND,
            date,
            title,
            description,
            location_name,
            categories,
            deleted_at=deleted_at,
            latitude=latitude,
            longitude=longitude,
            photos=photos,
        )

        self._found_status = found_status
        self._holder = holder
        self._proof = proof
        self._finder_name = finder_name
        self._finder_contact = finder_contact

    @property
    def found_status(self) -> FoundStatus:
        return self._found_status

    @property
    def holder(self) -> User:
        return self._holder

    @property
    def proof(self) -> Optional[Proof]:
        return self._proof

    @property
    def finder_name(self) -> Optional[str]:
        return self._finder_name

    @property
    def finder_contact(self) -> Optional[str]:
        return self._finder_contact

    def update_holder(self, new_holder):
        self._holder = new_holder
        self._touch()

    def confirm_return(self, proof: Proof):
        if self.report_status == ReportStatus.RESOLVED:
            raise ValueError("Item has already been returned")

        self._proof = proof
        self._found_status = FoundStatus.RETURNED_TO_OWNER
        self.update_report_status(ReportStatus.RESOLVED)

    def remove_photo(self, photo: str):
        if photo in self._photos:
            proposed_photos = self._photos.copy()
            proposed_photos.remove(photo)
            self._validate_photo(proposed_photos)
            self._photos = proposed_photos
            self._touch()

    def transfer_to_admin(self, admin: Admin):
        if self.report_status == ReportStatus.RESOLVED:
            raise ValueError("Cannot transfer an item that has already been returned")
        self._found_status = FoundStatus.HELD_BY_ADMIN
        self.update_holder(admin)

    def _validate_photo(self, photos: List[str]):
        if not photos:
            raise ValueError("A found report must have at least one photo")
