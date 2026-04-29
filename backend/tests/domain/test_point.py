import pytest
from app.domain.entities.point import Point
from app.domain.exceptions import ValidationError


@pytest.mark.parametrize(
    "latitude, longitude",
    [
        (0.0, 0.0),  # equator / prime meridian
        (90.0, 180.0),  # north pole + max longitude
        (-90.0, -180.0),  # south pole + min longitude
        (90.0, -180.0),
        (-90.0, 180.0),
        (-6.2, 106.816),  # Jakarta
        (51.5, -0.127),  # London
        (40.712, -74.006),  # New York
    ],
)
def test_create_point_success(latitude, longitude):
    p = Point(latitude=latitude, longitude=longitude)
    assert p.latitude == latitude
    assert p.longitude == longitude


@pytest.mark.parametrize(
    "latitude, expected_error",
    [
        (90.001, "Latitude must be between -90 and 90 degrees"),
        (-90.001, "Latitude must be between -90 and 90 degrees"),
        (180.0, "Latitude must be between -90 and 90 degrees"),
        (-180.0, "Latitude must be between -90 and 90 degrees"),
        (9999, "Latitude must be between -90 and 90 degrees"),
    ],
)
def test_create_point_fails_with_invalid_latitude(latitude, expected_error):
    with pytest.raises(ValidationError, match=expected_error):
        Point(latitude=latitude, longitude=0.0)


@pytest.mark.parametrize(
    "longitude, expected_error",
    [
        (180.001, "Longitude must be between -180 and 180 degrees"),
        (-180.001, "Longitude must be between -180 and 180 degrees"),
        (360.0, "Longitude must be between -180 and 180 degrees"),
        (-360.0, "Longitude must be between -180 and 180 degrees"),
        (9999, "Longitude must be between -180 and 180 degrees"),
    ],
)
def test_create_point_fails_with_invalid_longitude(longitude, expected_error):
    with pytest.raises(ValidationError, match=expected_error):
        Point(latitude=0.0, longitude=longitude)


def test_point_properties_are_accessible():
    p = Point(latitude=-6.2, longitude=106.816)
    assert p.latitude == -6.2
    assert p.longitude == 106.816


def test_point_equality_same_coordinates():
    p1 = Point(latitude=-6.2, longitude=106.816)
    p2 = Point(latitude=-6.2, longitude=106.816)
    assert p1 == p2


def test_point_inequality_different_coordinates():
    p1 = Point(latitude=-6.2, longitude=106.816)
    p2 = Point(latitude=-6.2, longitude=106.817)
    p3 = Point(latitude=-6.1, longitude=106.816)
    assert p1 != p2
    assert p1 != p3


def test_point_not_equal_to_non_point():
    p = Point(latitude=-6.2, longitude=106.816)
    assert p != "Point"
    assert p is not None


def test_point_repr():
    p = Point(latitude=-6.2, longitude=106.816)
    assert repr(p) == "Point(latitude=-6.2, longitude=106.816)"


def test_point_wkt_property():
    p = Point(latitude=-6.2, longitude=106.816)
    assert p.wkt == "POINT(106.816 -6.2)"
