import React, { useState, useEffect } from "react";
import {
  UploadCloud,
  MapPin,
  Calendar,
  FileText,
  User,
  Phone,
  X,
  Crosshair,
} from "lucide-react";
import { MapContainer, TileLayer } from "react-leaflet";
import { LocationPicker } from "../../../components/LocationPicker";

const API_URL = import.meta.env.VITE_API_URL;
const DEFAULT_CENTER = [-6.5607, 106.7265];

export default function CreateReportForm() {
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location_name: "",
    incident_date: "",
    finder_name: "",
    finder_contact: "",
    category_ids: [],
  });
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [locationStatus, setLocationStatus] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(
          `${API_URL}/api/v1/admin/categories?is_active=true`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Gagal mengambil kategori:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleCategory = (catId) => {
    setFormData((prev) => {
      const isSelected = prev.category_ids.includes(catId);
      if (isSelected) {
        return {
          ...prev,
          category_ids: prev.category_ids.filter((id) => id !== catId),
        };
      } else {
        return { ...prev, category_ids: [...prev.category_ids, catId] };
      }
    });
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + photos.length > 5) {
      alert("Maksimal 5 foto diperbolehkan.");
      return;
    }
    setPhotos((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
  };

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
        setSelectedPosition(currentPos);
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

  const handleSubmitWalkin = async (e) => {
    e.preventDefault();
    if (
      !formData.title ||
      !formData.incident_date ||
      !formData.location_name ||
      !formData.finder_name ||
      !formData.finder_contact ||
      formData.category_ids.length === 0
    ) {
      alert(
        "Mohon lengkapi field yang wajib (Title, Date, Location, Finder Name, Finder Contact, dan Kategori)!",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("access_token");

      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      submitData.append("location_name", formData.location_name);

      const dateISO = new Date(formData.incident_date).toISOString();
      submitData.append("incident_date", dateISO);

      submitData.append("finder_name", formData.finder_name);
      submitData.append("finder_contact", formData.finder_contact);

      if (selectedPosition) {
        submitData.append("latitude", selectedPosition.lat.toString());
        submitData.append("longitude", selectedPosition.lng.toString());
      }

      formData.category_ids.forEach((id) =>
        submitData.append("category_ids", id),
      );
      photos.forEach((photo) => submitData.append("photos", photo));

      // const response = await fetch(`${API_URL}/api/v1/admin/reports/handover`, {
      const response = await fetch(`${API_URL}/api/v1/admin/reports/found-reports/hand-over`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: submitData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Gagal membuat handover report");
      }

      alert("Laporan Handover berhasil dibuat!");
      setFormData({
        title: "",
        description: "",
        location_name: "",
        incident_date: "",
        finder_name: "",
        finder_contact: "",
        category_ids: [],
      });
      setSelectedPosition(null);
      setPhotos([]);
      setPhotoPreviews([]);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmitWalkin} className="p-8 md:p-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
        <div className="flex flex-col gap-6">
          <div>
            <label className="block text-[13px] font-bold text-gray-800 mb-2">
              Nama Barang <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FileText
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                required
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Misal: Dompet Kulit Coklat"
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all shadow-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-bold text-gray-800 mb-2">
              Deskripsi <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="6"
              placeholder="Sebutkan ciri-ciri spesifik (merk, warna, isi di dalamnya, kondisi)..."
              className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all resize-none shadow-sm"
            ></textarea>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-gray-800 mb-2">
              Kategori <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    formData.category_ids.includes(cat.id)
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
              {categories.length === 0 && (
                <p className="text-xs text-gray-400 italic py-1.5">
                  Memuat kategori...
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-gray-800 mb-2">
              Waktu Ditemukan <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                required
                type="datetime-local"
                name="incident_date"
                value={formData.incident_date}
                onChange={handleInputChange}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all shadow-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-bold text-gray-800 mb-2">
              Nama Penemu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                required
                type="text"
                name="finder_name"
                value={formData.finder_name}
                onChange={handleInputChange}
                placeholder="Nama penemu"
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all shadow-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-bold text-gray-800 mb-2">
              Kontak Penemu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                required
                type="text"
                name="finder_contact"
                value={formData.finder_contact}
                onChange={handleInputChange}
                placeholder="No. HP / WA"
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label className="block text-[13px] font-bold text-gray-800">
              Lokasi Penemuan <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <MapPin
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                required
                type="text"
                name="location_name"
                value={formData.location_name}
                onChange={handleInputChange}
                placeholder="Ketik nama lokasi (Misal: Kantin, Perpustakaan)..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all shadow-sm"
              />
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mt-1 shadow-sm">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <span className="text-[11px] text-gray-500 font-medium">
                  Klik peta untuk pin lokasi (Opsional)
                </span>
                <div className="flex items-center gap-2">
                  {selectedPosition && (
                    <button
                      type="button"
                      onClick={() => setSelectedPosition(null)}
                      className="text-[11px] font-bold text-red-600 bg-white hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border border-red-200 shadow-sm"
                    >
                      <X size={12} /> Reset Peta
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAskLocation}
                    className="text-[11px] font-bold text-blue-600 bg-white hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border border-blue-200 shadow-sm"
                  >
                    <Crosshair size={12} /> Lokasi Saat Ini
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
                  zoom={16}
                  scrollWheelZoom={true}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationPicker
                    position={selectedPosition}
                    setPosition={setSelectedPosition}
                    center={mapCenter}
                  />
                </MapContainer>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-gray-800 mb-2">
              Foto <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-1">(Maks 5)</span>
            </label>
            <div className="p-4 bg-white border-2 border-dashed border-gray-200 rounded-2xl shadow-sm flex flex-col gap-4">
              {photoPreviews.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {photoPreviews.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 shrink-0 group"
                    >
                      <img
                        src={src}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {photoPreviews.length < 5 && (
                <label className="cursor-pointer bg-gray-50 border border-gray-200 rounded-xl py-4 flex flex-col items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition-colors w-full">
                  <UploadCloud className="text-blue-500 mb-1" size={20} />
                  <span className="text-[11px] font-bold text-gray-500">
                    Klik untuk memilih foto
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting ? "Menyimpan Data..." : "Simpan Handover Report"}
        </button>
      </div>
    </form>
  );
}
