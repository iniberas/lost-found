import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { MapPin } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

export default function LocationMap({ lat, lng, locationName }) {
  if (!lat || !lng) {
    return (
      <div className="w-full h-48 bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center justify-center text-gray-400">
        <MapPin size={24} className="mb-2" />
        <p className="text-sm font-medium">Titik koordinat tidak tersedia.</p>
      </div>
    );
  }

  const position = [lat, lng];

  return (
    <div className="w-full h-64 rounded-xl overflow-hidden border border-gray-200 z-0 relative">
      <MapContainer 
        center={position} 
        zoom={16} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            <div className="font-semibold">{locationName || "Lokasi Laporan"}</div>
            <div className="text-xs text-gray-500">{lat}, {lng}</div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}