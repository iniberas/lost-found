import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { X, Crosshair } from "lucide-react";

const MapEvents = ({ position, setPosition, center }) => {
  const map = useMap();

  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  useEffect(() => {
    if (center) {
      map.flyTo(center, map.getZoom() || 16);
    }
  }, [center, map]);

  return position ? <Marker position={position} /> : null;
};

export default function LocationPicker({
  value,
  onChange,
  required = false,
  label = "Klik peta untuk pin lokasi",
  defaultCenter = { lat: -6.5921, lng: 106.7942 },
}) {
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [locationStatus, setLocationStatus] = useState("");

  useEffect(() => {
    if (value && value.lat && value.lng) {
      setMapCenter(value);
    }
  }, []);

  const handleAskLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung fitur Geolocation.");
      return;
    }
    setLocationStatus("Meminta izin...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setMapCenter(currentPos);
        onChange(currentPos);
        setLocationStatus("");
      },
      (error) => {
        let errorMsg = "Gagal mendapatkan lokasi.";
        if (error.code === error.PERMISSION_DENIED)
          errorMsg = "Izin lokasi ditolak oleh browser.";
        alert(errorMsg);
        setLocationStatus("");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mt-1 shadow-sm">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <span className="text-[11px] text-gray-500 font-medium">
            {label} {required ? "" : "(Optional)"}
          </span>
          <div className="flex items-center gap-2">
            {value && !required && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="text-[11px] font-bold text-red-600 bg-white hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border border-red-200 shadow-sm"
              >
                <X size={12} /> Reset Map
              </button>
            )}
            <button
              type="button"
              onClick={handleAskLocation}
              className="text-[11px] font-bold text-blue-600 bg-white hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border border-blue-200 shadow-sm"
            >
              <Crosshair size={12} /> Current Location
            </button>
          </div>
        </div>

        {locationStatus && (
          <div className="px-4 py-2 bg-amber-50 text-amber-700 text-[11px] font-medium border-b border-amber-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            {locationStatus}
          </div>
        )}

        <div className="h-[400px] w-full bg-gray-100 z-0 relative">
          <MapContainer
            center={mapCenter}
            zoom={13}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapEvents
              position={value}
              setPosition={onChange}
              center={mapCenter}
            />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
