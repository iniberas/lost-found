from app.domain.exceptions import ValidationError


class Point:
    def __init__(self, latitude: float, longitude: float):
        self._validate_latitude(latitude)
        self._validate_longitude(longitude)

        self._latitude = latitude
        self._longitude = longitude

    @property
    def latitude(self) -> float:
        return self._latitude

    @property
    def longitude(self) -> float:
        return self._longitude

    def _validate_latitude(self, latitude: float):
        if latitude > 90 or latitude < -90:
            raise ValidationError("Latitude must be between -90 and 90 degrees")

    def _validate_longitude(self, longitude: float):
        if longitude > 180 or longitude < -180:
            raise ValidationError("Longitude must be between -180 and 180 degrees")
