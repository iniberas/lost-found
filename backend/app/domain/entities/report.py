import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Self

from app.domain.entities.category import Category
from app.domain.entities.point import Point
from app.domain.entities.proof import Proof
from app.domain.entities.user import Admin, User
from app.domain.exceptions import FutureDateError, StateTransitionError, ValidationError


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
    TITLE_MIN_LEN = 2
    TITLE_MAX_LEN = 255
    LOCATION_NAME_MIN_LEN = 2
    LOCATION_NAME_MAX_LEN = 255
    DESCRIPTION_MIN_LEN = 10
    DESCRIPTION_MAX_LEN = 2047
    MAX_PHOTOS_COUNT = 10

    def __init__(
        self,
        id: uuid.UUID,
        created_at: datetime,
        updated_at: datetime,
        reporter: User,
        report_status: ReportStatus,
        report_type: ReportType,
        incident_date: datetime,
        title: str,
        description: str,
        location_name: str,
        categories: List[Category],
        deleted_at: Optional[datetime] = None,
        location_point: Optional[Point] = None,  # optional biar ga maksa
        photos: Optional[List[str]] = None,
    ):
        title = self._clean_text(title, "Title")
        description = self._clean_text(description, "Description")
        location_name = self._clean_text(location_name, "Location name")
        categories = categories.copy()
        photos = photos.copy() if photos is not None else []

        self._validate_timestamp(created_at, "Created at")
        self._validate_timestamp(updated_at, "Updated at")
        if deleted_at is not None:
            self._validate_timestamp(deleted_at, "Deleted at")
        self._validate_title(title)
        self._validate_description(description)
        self._validate_location_name(location_name)
        self._validate_categories(categories)
        self._validate_photos(photos)
        self._validate_incident_date(incident_date)

        self._id = id
        self._created_at = created_at
        self._updated_at = updated_at
        self._deleted_at = deleted_at
        self._reporter = reporter
        self._report_status = report_status
        self._report_type = report_type
        self._incident_date = incident_date
        self._title = title
        self._description = description
        self._location_name = location_name
        self._location_point = location_point
        self._categories = categories
        self._photos = photos

    def __eq__(self, other):
        if not isinstance(other, Report):
            return False
        return self._id == other.id

    def __hash__(self):
        return hash(self._id)

    @property
    def id(self) -> uuid.UUID:
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
    def incident_date(self) -> datetime:
        return self._incident_date

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
    def location_point(self) -> Optional[Point]:
        return self._location_point

    @property
    def categories(self) -> List[Category]:
        return self._categories.copy()

    @property
    def photos(self) -> List[str]:
        return self._photos.copy()

    def update_title(self, new_title: str):
        self._ensure_active()

        new_title = self._clean_text(new_title, "Title")
        self._validate_title(new_title)
        self._title = new_title
        self._touch()

    def update_description(self, new_description: str):
        self._ensure_active()

        new_description = self._clean_text(new_description, "Description")
        self._validate_description(new_description)
        self._description = new_description
        self._touch()

    def update_incident_date(self, new_incident_date: datetime):
        self._ensure_active()

        self._validate_incident_date(new_incident_date)
        self._incident_date = new_incident_date
        self._touch()

    def update_location_name(
        self,
        new_location_name: str,
    ):
        self._ensure_active()

        new_location_name = self._clean_text(new_location_name, "Location name")
        self._validate_location_name(new_location_name)

        self._location_name = new_location_name
        self._touch()

    def update_location_point(self, new_location_point: Optional[Point]):
        self._ensure_active()

        self._location_point = new_location_point
        self._touch()

    def _update_report_status(self, new_report_status: ReportStatus):
        self._ensure_active()

        self._report_status = new_report_status
        self._touch()

    def update_categories(self, new_categories: List[Category]):
        self._ensure_active()

        self._validate_categories(new_categories)
        self._categories = new_categories
        self._touch()

    def update_photos(self, new_photos: List[str]):
        self._ensure_active()

        self._validate_photos(new_photos)
        self._photos = new_photos
        self._touch()

    def delete(self):
        self._ensure_active()

        self._deleted_at = datetime.now(timezone.utc)
        self._report_status = ReportStatus.CLOSED
        self._updated_at = self._deleted_at

    def _touch(self):
        self._updated_at = datetime.now(timezone.utc)

    def _ensure_active(self):
        if self._deleted_at is not None:
            raise StateTransitionError(
                "This report has been deleted and cannot be modified"
            )

    def _clean_text(self, text: str, field_name: str) -> str:
        if not text:
            raise ValidationError(f"{field_name} cannot be empty")

        cleaned_text = text.strip()
        if not cleaned_text:
            raise ValidationError(f"{field_name} cannot be empty")

        return cleaned_text

    def _validate_timestamp(self, dt: datetime, field_name: str):
        if dt.tzinfo is None:
            raise ValidationError(f"{field_name} must include timezone information")

    def _validate_incident_date(self, incident_date: datetime):
        self._validate_timestamp(incident_date, "Incident date")

        if incident_date > datetime.now(timezone.utc):
            raise FutureDateError("Incident date cannot be in the future")

    def _validate_title(self, title: str):
        if len(title) < self.TITLE_MIN_LEN:
            raise ValidationError(
                f"Title must be at least {self.TITLE_MIN_LEN} characters long"
            )
        if len(title) > self.TITLE_MAX_LEN:
            raise ValidationError(
                f"Title cannot exceed {self.TITLE_MAX_LEN} characters"
            )

    def _validate_description(self, description: str):
        if len(description) < self.DESCRIPTION_MIN_LEN:
            raise ValidationError(
                f"Description must be at least {self.DESCRIPTION_MIN_LEN} characters long"
            )
        if len(description) > self.DESCRIPTION_MAX_LEN:
            raise ValidationError(
                f"Description cannot exceed {self.DESCRIPTION_MAX_LEN} characters"
            )

    def _validate_location_name(self, location_name: str):
        if len(location_name) < self.LOCATION_NAME_MIN_LEN:
            raise ValidationError(
                f"Location name must be at least {self.LOCATION_NAME_MIN_LEN} characters long"
            )
        if len(location_name) > self.LOCATION_NAME_MAX_LEN:
            raise ValidationError(
                f"Location name cannot exceed {self.LOCATION_NAME_MAX_LEN} characters"
            )

    def _validate_categories(self, categories: List[Category]):
        if not categories:
            raise ValidationError("A report must have at least one category assigned")

    def _validate_photos(self, photos: List[str]):
        if len(photos) > self.MAX_PHOTOS_COUNT:
            raise ValidationError(
                f"A report cannot exceed the maximum limit of {self.MAX_PHOTOS_COUNT} photos"
            )


class LostReport(Report):
    def __init__(
        self,
        id: uuid.UUID,
        created_at: datetime,
        updated_at: datetime,
        reporter: User,
        report_status: ReportStatus,
        incident_date: datetime,
        title: str,
        description: str,
        location_name: str,
        categories: List[Category],
        deleted_at: Optional[datetime] = None,
        location_point: Optional[Point] = None,
        photos: Optional[List[str]] = None,  # lost report boleh ga ada fotonya ^v^
    ):
        super().__init__(
            id,
            created_at,
            updated_at,
            reporter,
            report_status,
            ReportType.LOST,
            incident_date,
            title,
            description,
            location_name,
            categories,
            deleted_at=deleted_at,
            location_point=location_point,
            photos=photos,
        )

    @classmethod
    def new_lost_report(
        cls,
        reporter: User,
        incident_date: datetime,
        title: str,
        description: str,
        location_name: str,
        categories: List[Category],
        location_point: Optional[Point] = None,
        photos: Optional[List[str]] = None,
    ) -> Self:
        has_inactive = any(not cat.is_active for cat in categories)
        if has_inactive:
            raise ValidationError("One or more assigned categories were not found")

        id = uuid.uuid4()
        created_at = datetime.now(timezone.utc)
        updated_at = created_at
        report_status = ReportStatus.OPEN

        return cls(
            id,
            created_at,
            updated_at,
            reporter,
            report_status,
            incident_date,
            title,
            description,
            location_name,
            categories,
            location_point=location_point,
            photos=photos,
        )

    def confirm_found(self):
        self._ensure_active()

        if self._report_status == ReportStatus.RESOLVED:
            raise StateTransitionError("This report is already marked as resolved")
        self._update_report_status(ReportStatus.RESOLVED)


class FoundReport(Report):
    FINDER_NAME_MIN_LEN = 2
    FINDER_NAME_MAX_LEN = 255
    FINDER_CONTACT_MIN_LEN = 2
    FINDER_CONTACT_MAX_LEN = 255

    def __init__(
        self,
        id: uuid.UUID,
        created_at: datetime,
        updated_at: datetime,
        reporter: User,
        report_status: ReportStatus,
        found_status: FoundStatus,
        incident_date: datetime,
        title: str,
        description: str,
        location_name: str,
        categories: List[Category],
        photos: List[str],  # found report harus ada fotonya biar ga boong ^v^
        holder: User,
        deleted_at: Optional[datetime] = None,
        handed_over_at: Optional[datetime] = None,
        location_point: Optional[Point] = None,
        proof: Optional[Proof] = None,
        finder_name: Optional[str] = None,
        finder_contact: Optional[str] = None,
    ):
        super().__init__(
            id,
            created_at,
            updated_at,
            reporter,
            report_status,
            ReportType.FOUND,
            incident_date,
            title,
            description,
            location_name,
            categories,
            deleted_at=deleted_at,
            location_point=location_point,
            photos=photos,
        )
        if handed_over_at is not None:
            self._validate_timestamp(handed_over_at, "Handed over at")

        if finder_name is not None:
            finder_name = self._clean_text(finder_name, "Finder name")
            self._validate_finder_name(finder_name)

        if finder_contact is not None:
            finder_contact = self._clean_text(finder_contact, "Finder contact")
            self._validate_finder_contact(finder_contact)

        self._handed_over_at = handed_over_at
        self._found_status = found_status
        self._holder = holder
        self._proof = proof
        self._finder_name = finder_name
        self._finder_contact = finder_contact

    @classmethod
    def new_found_report(
        cls,
        reporter: User,
        incident_date: datetime,
        title: str,
        description: str,
        location_name: str,
        categories: List[Category],
        photos: List[str],
        location_point: Optional[Point] = None,
    ) -> Self:
        has_inactive = any(not cat.is_active for cat in categories)
        if has_inactive:
            raise ValidationError("One or more assigned categories were not found")

        id = uuid.uuid4()
        created_at = datetime.now(timezone.utc)
        updated_at = created_at
        report_status = ReportStatus.OPEN
        found_status = FoundStatus.HELD_BY_FINDER
        holder = reporter

        return cls(
            id,
            created_at,
            updated_at,
            reporter,
            report_status,
            found_status,
            incident_date,
            title,
            description,
            location_name,
            categories,
            photos,
            holder,
            location_point=location_point,
        )

    @classmethod
    def new_hand_over_report(
        cls,
        reporter: Admin,
        incident_date: datetime,
        title: str,
        description: str,
        location_name: str,
        categories: List[Category],
        photos: List[str],
        finder_name: str,
        finder_contact: str,
        location_point: Optional[Point] = None,
    ) -> Self:
        if finder_name is None or finder_contact is None:
            raise ValidationError(
                "Finder name and contact are required for hand over reports"
            )

        has_inactive = any(not cat.is_active for cat in categories)
        if has_inactive:
            raise ValidationError("One or more assigned categories were not found")

        id = uuid.uuid4()
        created_at = datetime.now(timezone.utc)
        updated_at = created_at
        handed_over_at = created_at
        report_status = ReportStatus.OPEN
        found_status = FoundStatus.HELD_BY_ADMIN
        holder = reporter

        return cls(
            id,
            created_at,
            updated_at,
            reporter,
            report_status,
            found_status,
            incident_date,
            title,
            description,
            location_name,
            categories,
            photos,
            holder,
            handed_over_at=handed_over_at,
            location_point=location_point,
            finder_name=finder_name,
            finder_contact=finder_contact,
        )

    @property
    def found_status(self) -> FoundStatus:
        return self._found_status

    @property
    def holder(self) -> User:
        return self._holder

    @property
    def handed_over_at(self) -> Optional[datetime]:
        return self._handed_over_at

    @property
    def proof(self) -> Optional[Proof]:
        return self._proof

    @property
    def finder_name(self) -> Optional[str]:
        return self._finder_name

    @property
    def finder_contact(self) -> Optional[str]:
        return self._finder_contact

    def update_holder(self, new_holder: User):
        self._ensure_active()

        self._holder = new_holder
        self._touch()

    def _update_found_status(self, new_found_status: FoundStatus):
        self._ensure_active()

        self._found_status = new_found_status
        self._touch()

    def update_finder_name(self, new_finder_name: str):
        self._ensure_active()

        self._validate_finder_name(new_finder_name)
        self._finder_name = new_finder_name
        self._touch()

    def update_finder_contact(self, new_finder_contact: str):
        self._ensure_active()

        self._validate_finder_contact(new_finder_contact)
        self._finder_contact = new_finder_contact
        self._touch()

    def confirm_return(self, proof: Proof):
        self._ensure_active()

        if self._report_status == ReportStatus.RESOLVED:
            raise StateTransitionError("This item has already been marked as returned")

        self._proof = proof
        self._update_found_status(FoundStatus.RETURNED_TO_OWNER)
        self._update_report_status(ReportStatus.RESOLVED)

    def hand_over_to_admin(self, admin: Admin):
        self._ensure_active()

        if not isinstance(admin, Admin):
            raise ValidationError("Only an admin can accept a handed over item")

        if self._report_status == ReportStatus.RESOLVED:
            raise StateTransitionError(
                "Cannot hand over an item that has already been returned"
            )

        if self._found_status == FoundStatus.HELD_BY_ADMIN:
            raise StateTransitionError(
                "Cannot hand over an item that has already been handed over"
            )

        self._update_found_status(FoundStatus.HELD_BY_ADMIN)
        self._handed_over_at = datetime.now(timezone.utc)
        self.update_holder(admin)

    def _validate_finder_name(self, finder_name: str):
        if len(finder_name) < self.FINDER_NAME_MIN_LEN:
            raise ValidationError(
                f"Finder name must be at least {self.FINDER_NAME_MIN_LEN} characters long"
            )
        if len(finder_name) > self.FINDER_NAME_MAX_LEN:
            raise ValidationError(
                f"Finder name cannot exceed {self.FINDER_NAME_MAX_LEN} characters"
            )

    def _validate_finder_contact(self, finder_contact: str):
        if len(finder_contact) < self.FINDER_CONTACT_MIN_LEN:
            raise ValidationError(
                f"Finder contact must be at least {self.FINDER_CONTACT_MIN_LEN} characters long"
            )
        if len(finder_contact) > self.FINDER_CONTACT_MAX_LEN:
            raise ValidationError(
                f"Finder contact cannot exceed {self.FINDER_CONTACT_MAX_LEN} characters"
            )

    def _validate_photos(self, photos: List[str]):
        if not photos:
            raise ValidationError(
                "A found report must have at least one photo attached as proof"
            )
        super()._validate_photos(photos)
