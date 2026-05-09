import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { Crosshair, X } from "lucide-react";
import "leaflet/dist/leaflet.css";

import { LocationPicker } from "../../components/LocationPicker";

const DEFAULT_CENTER = [-6.5607, 106.7265];

const MapModal = ({
  isOpen,
  onClose,
  filterLocation,
  setFilterLocation,
}) => {
  const [locationStatus, setLocationStatus] = useState("");

  // draft state di modal
  const [tempLocation, setTempLocation] = useState(filterLocation);

  // sync setiap modal dibuka
  useEffect(() => {
    if (isOpen) {
      setTempLocation(filterLocation);
    }
  }, [isOpen, filterLocation]);

  // center map
  const mapCenter = tempLocation
    ? [tempLocation.lat, tempLocation.lng]
    : DEFAULT_CENTER;

  const handleAskLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus(
        "Browser tidak mendukung fitur geolocation.",
      );
      return;
    }

    setLocationStatus("Mengambil lokasi saat ini...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setTempLocation(currentPos);

        setLocationStatus(
          "Lokasi berhasil ditemukan.",
        );

        setTimeout(() => {
          setLocationStatus("");
        }, 2000);
      },

      (error) => {
        let errorMsg =
          "Gagal mendapatkan lokasi.";

        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          errorMsg =
            "Izin lokasi ditolak oleh browser.";
        }

        setLocationStatus(errorMsg);
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  const handleSave = () => {
    setFilterLocation(tempLocation);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-[600px] animate-in fade-in zoom-in duration-200">
        <h3 className="text-xl font-bold mb-4 text-[#0C0B89]">
          Pilih Titik Pencarian
        </h3>

        <p className="text-sm text-gray-500 mb-4">
          Klik pada peta untuk menentukan area barang
          yang ingin kamu cari.
        </p>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          
          {/* TOP BAR */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <span className="text-[11px] text-gray-500 font-medium">
              Klik peta untuk pin lokasi
            </span>

            <div className="flex items-center gap-2">
              
              {tempLocation && (
                <button
                  type="button"
                  onClick={() =>
                    setTempLocation(null)
                  }
                  className="text-[11px] font-bold text-red-600 bg-white hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border border-red-200 shadow-sm"
                >
                  <X size={12} />
                  Reset Peta
                </button>
              )}

              <button
                type="button"
                onClick={handleAskLocation}
                className="text-[11px] font-bold text-blue-600 bg-white hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border border-blue-200 shadow-sm"
              >
                <Crosshair size={12} />
                Lokasi Saat Ini
              </button>
            </div>
          </div>

          {/* STATUS */}
          {locationStatus && (
            <div className="px-4 py-2 bg-amber-50 text-amber-700 text-[11px] font-medium border-b border-amber-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>

              {locationStatus}
            </div>
          )}

          {/* MAP */}
          <div className="h-[350px] w-full bg-gray-100 z-0 relative">
            <MapContainer
              center={mapCenter}
              zoom={15}
              scrollWheelZoom={true}
              style={{
                height: "100%",
                width: "100%",
              }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              <LocationPicker
                position={tempLocation}
                setPosition={setTempLocation}
                center={mapCenter}
              />
            </MapContainer>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl font-bold transition-colors"
          >
            Batal
          </button>

          <button
            onClick={handleSave}
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