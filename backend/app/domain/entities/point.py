from app.domain.exceptions import ValidationError


class Point:
    def __init__(self, latitude: float, longitude: float):
        self._validate_latitude(latitude)
        self._validate_longitude(longitude)

        self._latitude = latitude
        self._longitude = longitude

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Point):
            return NotImplemented
        return self.latitude == other.latitude and self.longitude == other.longitude

    def __repr__(self) -> str:
        return f"Point(latitude={self.latitude}, longitude={self.longitude})"

    @property
    def latitude(self) -> float:
        return self._latitude

    @property
    def longitude(self) -> float:
        return self._longitude

    @property
    def wkt(self) -> str:
        return f"POINT({self.longitude} {self.latitude})"

    def _validate_latitude(self, latitude: float):
        if latitude > 90 or latitude < -90:
            raise ValidationError("Latitude must be between -90 and 90 degrees")

    def _validate_longitude(self, longitude: float):
        if longitude > 180 or longitude < -180:
            raise ValidationError("Longitude must be between -180 and 180 degrees")
