import React from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const MapClickHandler = ({ setFilterLocation }) => {
  useMapEvents({
    click(e) {
      setFilterLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

const MapModal = ({
  isOpen,
  onClose,
  filterLocation,
  setFilterLocation,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-[600px] animate-in fade-in zoom-in duration-200">
        <h3 className="text-xl font-bold mb-4 text-[#0C0B89]">
          Pilih Titik Pencarian
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Klik pada peta untuk menentukan area barang yang ingin kamu cari.
        </p>

        <div className="h-[350px] w-full rounded-2xl overflow-hidden border-2 border-gray-100 relative z-0">
          {/* Koordinat tengah di-set ke area IPB Dramaga */}
          <MapContainer
            center={[-6.5607, 106.7265]}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <MapClickHandler setFilterLocation={setFilterLocation} />
            {filterLocation && <Marker position={filterLocation} />}
          </MapContainer>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => {
              setFilterLocation(null);
              onClose();
            }}
            className="px-5 py-2.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl font-bold transition-colors"
          >
            Reset / Batal
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#0C0B89] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            Simpan Titik Lokasi
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapModal;
