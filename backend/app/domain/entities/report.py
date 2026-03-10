from datetime import datetime
from typing import List, Optional
from enum import Enum
from app.domain.entities.user import User


class Status(Enum):
    OPEN = 0
    RESOLVED = 1


class Category:
    def __init__(self, id: int, name: str):
        self._id = id
        self._name = name

    @property
    def id(self):
        return self._id
    
    @property
    def name(self):
        return self._name


class Proof:
    def __init__(
        self, 
        id: int, 
        date: datetime, 
        notes: str, 
        photos: List[str]
    ):
        self._id = id
        self._date = date
        self._notes = notes
        self._photos = photos
    
    @property
    def id(self):
        return self._id

    @property
    def date(self) -> datetime: 
        return self._date
    
    @property
    def notes(self) -> str: 
        return self._notes
    
    @property
    def photos(self) -> List[str]: 
        return self._photos


class Report:
    def __init__(
        self, 
        id: int, 
        title: str, 
        description: str, 
        date: datetime, 
        location: str, # NOTE: ini kayaknya yang bener pake class point atau apalah kayak class diagram. sowwy :3
        status: Status, 
        categories: List[Category],
        photos: List[str],
        user: User,
    ):
        self._id = id
        self._title = title
        self._description = description
        self._date = date
        self._location = location
        self._status = status
        self._categories = categories
        self._photos = photos
        self._user = user
    
    @property
    def id(self):
        return self._id

    @property
    def title(self):
        return self._title

    @property
    def description(self):
        return self._description

    @property
    def date(self):
        return self._date

    @property
    def location(self):
        return self._location

    @property
    def status(self):
        return self._status

    @property
    def categories(self):
        return self._categories

    @property
    def photos(self):
        return self._photos

    @property
    def user(self):
        return self._user
    
    def update_title(self, new_title: str):
        self._title = new_title
    
    def update_description(self, new_description: str):
        self._description = new_description
    
    def update_date(self, new_date: datetime):
        self._date = new_date
    
    def update_location(self, new_location: str):
        self._location = new_location

    def update_status(self, new_status: Status):
        self._status = new_status
    
    def add_category(self, new_category: Category):
        pass

    def remove_category(self, category: Category):
        pass

    def add_photo(self, new_photo: str):
        pass

    def remove_photo(self, photo: str):
        pass


class LostReport(Report):
    def __init__(
        self, 
        id: int, 
        title: str, 
        description: str, 
        date: datetime, 
        location: str, 
        status: Status, 
        categories: List[Category],
        photos: List[str],
        user: User,
    ):
        super().__init__(id, title, description, date, location, status, categories, photos, user)
    
    def confirm_found(self):
        pass


class FoundReport(Report):
    def __init__(
        self, 
        id: int, 
        title: str, 
        description: str, 
        date: datetime, 
        location: str, 
        status: Status, 
        categories: List[Category],
        photos: List[str],
        user: User,
        proof: Optional[Proof] = None
    ):
        super().__init__(id, title, description, date, location, status, categories, photos, user)
        self._proof = proof

    @property
    def proof(self):
        return self._proof

    def confirm_return(self, proof: Proof):
        pass


class HandoverReport(Report):
    def __init__(
        self, 
        id: int, 
        title: str, 
        description: str, 
        date: datetime, 
        location: str, 
        status: Status, 
        categories: List[Category],
        photos: List[str],
        user: User,
        notes: str,
        proof: Optional[Proof] = None
    ):
        super().__init__(id, title, description, date, location, status, categories, photos, user)
        self._notes = notes
        self._proof = proof

    @property
    def proof(self):
        return self._proof

    @property
    def notes(self) -> str: 
        return self._notes

    def confirm_return(self, proof: Proof):
        pass
