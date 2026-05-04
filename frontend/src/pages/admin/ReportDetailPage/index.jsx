import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  Calendar,
  User as UserIcon,
  Phone,
  Mail,
  Image as ImageIcon,
  CheckCircle2,
  Edit,
  Trash2,
  Shield,
  X,
  UploadCloud,
  FileText,
  Database,
  Crosshair,
  Camera,
} from "lucide-react";
import AdminDashboardLayout from "../../../layouts/AdminDashboard";
import PageHeader from "../../../components/admin/PageHeader";
import StatusBadge from "../../../components/admin/StatusBadge";
import { LocationPicker } from "../../../components/admin/LocationPicker";
import { IPB_COLORS, ADMIN_COLORS } from "../../../constants/colors";
import { adminFetch } from "../../../utils/adminApi";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const API_URL = "http://127.0.0.1:8000";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function InfoRow({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3 text-sm text-gray-600">
      <div className="p-2 bg-gray-50 rounded-lg shrink-0">
        <Icon size={15} className="text-gray-400" />
      </div>
      <span className="font-medium truncate">{text}</span>
    </div>
  );
}

function ResolveModal({ isOpen, onClose, onDummySubmit, isFound }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-green-600" /> Mark as
            Resolved
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-md text-gray-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {isFound && (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-[13px] font-bold text-gray-800 mb-2">
                Proof Photo <span className="text-red-500">*</span>
              </label>
              <label className="cursor-pointer bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl py-6 flex flex-col items-center justify-center hover:bg-blue-50 transition-colors">
                <Camera className="text-gray-400 mb-2" size={24} />
                <span className="text-xs font-semibold text-gray-500">
                  Click to upload proof
                </span>
                <input type="file" accept="image/*" className="hidden" />
              </label>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-gray-800 mb-2">
                Resolution Notes
              </label>
              <textarea
                placeholder={"Jelaskan bagaimana barang dikembalikan..."}
                className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all resize-none shadow-sm h-24"
              ></textarea>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onDummySubmit}
            className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
          >
            <CheckCircle2 size={16} /> Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminReportDetailPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location_name: "",
    incident_date: "",
    category_ids: [],
    report_type: "lost",
    status: "",
    storage_location_id: "",
    finder_name: "",
    finder_contact: "",
    created_at: "",
  });
  const [reporterInfo, setReporterInfo] = useState(null);

  const [existingPhotos, setExistingPhotos] = useState([]);
  const [photosToRemove, setPhotosToRemove] = useState([]);
  const [photosToAdd, setPhotosToAdd] = useState([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState([]);
  const defaultCenter = { lat: -6.5921, lng: 106.7942 };
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [locationStatus, setLocationStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchReportDetail();
  }, [id]);

  const fetchCategories = async () => {
    try {
      const data = await adminFetch("/api/v1/admin/categories?is_active=true");
      setCategories(data);
    } catch (err) {
      console.error("Gagal load kategori:", err);
    }
  };

  const fetchReportDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let reportData;
      let type = "found";

      try {
        reportData = await adminFetch(
          `/api/v1/admin/reports/found-reports/${id}`,
        );
      } catch (e) {
        reportData = await adminFetch(
          `/api/v1/admin/reports/lost-reports/${id}`,
        );
        type = "lost";
      }

      const dateStr = reportData.incident_date
        ? new Date(reportData.incident_date).toISOString().slice(0, 16)
        : "";

      setFormData({
        title: reportData.title || "",
        description: reportData.description || "",
        location_name: reportData.location_name || "",
        incident_date: dateStr,
        category_ids: reportData.categories?.map((c) => c.id) || [],
        report_type: type,
        status: reportData.status || reportData.report_status,
        storage_location_id: reportData.storage_location_id || "",
        finder_name: reportData.finder_name || "",
        finder_contact: reportData.finder_contact || "",
        created_at: reportData.created_at,
      });

      setExistingPhotos(reportData.photos || []);
      setPhotosToRemove([]);
      setPhotosToAdd([]);
      setNewPhotoPreviews([]);

      if (reportData.location_point) {
        const pos = {
          lat: reportData.location_point.latitude,
          lng: reportData.location_point.longitude,
        };
        setSelectedPosition(pos);
        setMapCenter(pos);
      }

      setReporterInfo(reportData.reporter);
    } catch (err) {
      setError("Gagal memuat detail laporan atau data tidak ditemukan.");
    } finally {
      setIsLoading(false);
    }
  };

  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleCategory = (catId) => {
    setFormData((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(catId)
        ? prev.category_ids.filter((id) => id !== catId)
        : [...prev.category_ids, catId],
    }));
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

  const handleRemoveExistingPhoto = (photoUrl) => {
    setPhotosToRemove((prev) => [...prev, photoUrl]);
    setExistingPhotos((prev) => prev.filter((p) => p !== photoUrl));
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + existingPhotos.length + photosToAdd.length > 5) {
      return alert("Maksimal 5 foto.");
    }
    setPhotosToAdd((prev) => [...prev, ...files]);
    setNewPhotoPreviews((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const handleRemoveNewPhoto = (index) => {
    setPhotosToAdd((prev) => prev.filter((_, i) => i !== index));
    setNewPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      const submitData = new FormData();

      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      submitData.append("location_name", formData.location_name);
      submitData.append(
        "incident_date",
        new Date(formData.incident_date).toISOString(),
      );

      formData.category_ids.forEach((id) =>
        submitData.append("category_ids", id),
      );

      if (selectedPosition) {
        submitData.append("latitude", selectedPosition.lat.toString());
        submitData.append("longitude", selectedPosition.lng.toString());
      }

      if (formData.report_type === "found") {
        submitData.append("finder_name", formData.finder_name);
        submitData.append("finder_contact", formData.finder_contact);
        if (formData.storage_location_id)
          submitData.append(
            "storage_location_id",
            formData.storage_location_id,
          );
      }

      photosToRemove.forEach((url) =>
        submitData.append("photos_to_remove", url),
      );
      photosToAdd.forEach((file) => submitData.append("photos_to_add", file));

      const res = await fetch(
        `${API_URL}/api/v1/admin/reports/${formData.report_type}-reports/${id}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: submitData,
        },
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Gagal menyimpan laporan");
      }

      alert("Laporan berhasil diperbarui!");
      fetchReportDetail();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDummyResolve = () => {
    alert(
      "Tombol Resolve UI aktif!\nDi sini nanti kita integrasikan API untuk Upload Proof dan Note.",
    );
    setIsResolveModalOpen(false);
  };

  
  if (isLoading) {
    return (
      <AdminDashboardLayout user={user}>
        <div className="flex items-center justify-center h-[60vh] gap-3">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading report details…</p>
        </div>
      </AdminDashboardLayout>
    );
  }

  if (error) {
    return (
      <AdminDashboardLayout user={user}>
        <div className="px-10 py-8 space-y-4">
          <PageHeader title="Report Details" />
          <div className="bg-red-50 text-red-600 p-8 rounded-2xl border border-red-100 text-center space-y-1">
            <p className="font-bold text-base">Something went wrong</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  const isFound = formData.report_type === "found";
  const isOpen = formData.status === "open" || formData.status === "unresolved";

  return (
    <AdminDashboardLayout user={user}>
      <div className="px-10 py-8 space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <PageHeader title="Report Details" />
          <div className="flex items-center gap-3">
            <span
              className={`px-4 py-1.5 rounded-lg text-sm font-black uppercase tracking-wider shadow-sm ${isFound ? "bg-blue-50 text-blue-600 border border-blue-200" : "bg-red-50 text-red-600 border border-red-200"}`}
            >
              {isFound ? "FOUND ITEM" : "LOST ITEM"}
            </span>
            <StatusBadge variant={formData.status?.toLowerCase()} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <div>
                <label className="block text-[13px] font-bold text-gray-800 mb-2">
                  Item Name <span className="text-red-500">*</span>
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
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-gray-800 mb-2">
                  Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${formData.category_ids.includes(cat.id) ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm"}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-gray-800 mb-2">
                    Incident Date <span className="text-red-500">*</span>
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
                      className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all shadow-sm"
                    />
                  </div>
                </div>
                {isFound && (
                  <div>
                    <label className="block text-[13px] font-bold text-gray-800 mb-2">
                      Storage Location ID
                    </label>
                    <div className="relative">
                      <Database
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        type="text"
                        name="storage_location_id"
                        value={formData.storage_location_id}
                        onChange={handleInputChange}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all shadow-sm"
                        placeholder="Opsional..."
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[13px] font-bold text-gray-800 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all resize-none shadow-sm"
                ></textarea>
              </div>
            </div>

            
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={18} style={{ color: IPB_COLORS.blue.primary }} />
                <h3 className="text-lg font-bold text-gray-900">Location</h3>
              </div>
              <input
                required
                type="text"
                name="location_name"
                value={formData.location_name}
                onChange={handleInputChange}
                placeholder="Location name..."
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all shadow-sm"
              />

              
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
                    zoom={13}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%", zIndex: 0 }}
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

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon
                    size={18}
                    style={{ color: IPB_COLORS.blue.primary }}
                  />
                  <h3 className="text-lg font-bold text-gray-900">Photos</h3>
                </div>
                <span className="text-xs font-medium text-gray-500">
                  {existingPhotos.length + newPhotoPreviews.length}/5 Photos
                </span>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-wrap gap-4">
                {existingPhotos.map((url, idx) => (
                  <div
                    key={`exist-${idx}`}
                    className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group bg-white shadow-sm"
                  >
                    <img
                      src={url}
                      alt="existing"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingPhoto(url)}
                      className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {newPhotoPreviews.map((src, idx) => (
                  <div
                    key={`new-${idx}`}
                    className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-blue-400 group bg-white shadow-sm"
                  >
                    <img
                      src={src}
                      alt="new"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveNewPhoto(idx)}
                      className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                {existingPhotos.length + newPhotoPreviews.length < 5 && (
                  <label className="cursor-pointer w-24 h-24 bg-white border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:bg-blue-50 hover:border-blue-300 transition-colors">
                    <UploadCloud className="text-blue-500 mb-1" size={20} />
                    <span className="text-[10px] font-bold text-gray-500">
                      Upload
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

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Reporter Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                Reporter Details
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <UserIcon
                    size={20}
                    style={{ color: IPB_COLORS.blue.primary }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5 truncate">
                    {reporterInfo?.name || "Unknown"}
                    {reporterInfo?.role === "admin" && (
                      <Shield size={14} className="text-blue-500" />
                    )}
                  </p>
                  <p className="text-xs font-medium text-gray-500 capitalize">
                    {reporterInfo?.role || "User"}
                  </p>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <InfoRow icon={Mail} text={reporterInfo?.email || "-"} />
                <InfoRow
                  icon={Phone}
                  text={reporterInfo?.phone_number || "-"}
                />
              </div>
            </div>

            {/* Finder Info Form (If Found Report) */}
            {isFound && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                  Finder Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">
                      Finder Name
                    </label>
                    <input
                      type="text"
                      name="finder_name"
                      value={formData.finder_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">
                      Finder Contact
                    </label>
                    <input
                      type="text"
                      name="finder_contact"
                      value={formData.finder_contact}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Panel */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3 sticky top-6">
              <h3 className="text-base font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">
                Admin Actions
              </h3>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: IPB_COLORS.blue.primary }}
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Edit size={16} />
                )}
                {isSaving ? "Saving..." : "Save Changes"}
              </button>

              {isOpen && (
                <button
                  onClick={() => setIsResolveModalOpen(true)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <CheckCircle2 size={16} /> Mark as Resolved
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ResolveModal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        onDummySubmit={handleDummyResolve}
        isFound={isFound}
      />
    </AdminDashboardLayout>
  );
}
