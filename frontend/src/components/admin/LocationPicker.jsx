import React, { useEffect } from "react";
import { Marker, useMapEvents, useMap } from "react-leaflet";

export const LocationPicker = ({ position, setPosition, center }) => {
  const map = useMap();

  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  useEffect(() => {
    if (center) {
      map.flyTo(center, 16);
    }
  }, [center, map]);

  return position === null ? null : <Marker position={position} />;
};