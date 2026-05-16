import React, { useState, useEffect } from "react";
import {
  UploadCloud,
  MapPin,
  Calendar,
  FileText,
  User,
  Phone,
  X,
  Package,
} from "lucide-react";
import LocationPicker from "../../../components/admin/LocationPicker";
import Toast from "../../../components/Toast";

const API_URL = import.meta.env.VITE_API_URL;

export default function CreateReportForm() {
  const [categories, setCategories] = useState([]);
  const [storageLocations, setStorageLocations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location_name: "",
    incident_date: "",
    finder_name: "",
    finder_contact: "",
    category_ids: [],
    storage_location_id: "",
  });
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState(null);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info", 
  });

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const headers = { Authorization: `Bearer ${token}` };

        const catRes = await fetch(
          `${API_URL}/api/v1/admin/categories?is_active=true`,
          { headers },
        );
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData);
        }

        const storageRes = await fetch(
          `${API_URL}/api/v1/admin/storage-locations?is_active=true&limit=100`,
          { headers },
        );
        if (storageRes.ok) {
          const storageData = await storageRes.json();
          setStorageLocations(storageData.items || storageData || []);
        }
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      }
    };

    fetchInitialData();
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
      showToast("Maximum of 5 photos allowed.", "warning");
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

  const handleSubmitWalkin = async (e) => {
    e.preventDefault();
    if (
      !formData.title ||
      !formData.incident_date ||
      !formData.location_name ||
      !formData.finder_name ||
      !formData.finder_contact ||
      !formData.storage_location_id ||
      formData.category_ids.length === 0
    ) {
      showToast(
        "Please fill in all required fields!",
        "error",
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
      submitData.append("storage_location_id", formData.storage_location_id);

      const dateISO = new Date(formData.incident_date).toISOString();
      submitData.append("incident_date", dateISO);

      submitData.append("finder_name", formData.finder_name);
      submitData.append("finder_contact", formData.finder_contact);

      if (selectedPosition && selectedPosition.lat && selectedPosition.lng) {
        submitData.append("latitude", selectedPosition.lat.toString());
        submitData.append("longitude", selectedPosition.lng.toString());
      }

      formData.category_ids.forEach((id) =>
        submitData.append("category_ids", id),
      );
      photos.forEach((photo) => submitData.append("photos", photo));

      const response = await fetch(
        `${API_URL}/api/v1/admin/reports/found-reports/hand-over`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: submitData,
        },
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to create handover report");
      }

      showToast("Handover report created successfully!", "success");

      setFormData({
        title: "",
        description: "",
        location_name: "",
        incident_date: "",
        finder_name: "",
        finder_contact: "",
        category_ids: [],
        storage_location_id: "",
      });
      setSelectedPosition(null);
      setPhotos([]);
      setPhotoPreviews([]);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <form onSubmit={handleSubmitWalkin} className="p-8 md:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
          <div className="flex flex-col gap-6">
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
                  placeholder="e.g., Brown Leather Wallet"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-gray-800 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="6"
                placeholder="Mention specific characteristics (brand, color, contents, condition)..."
                className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all resize-none shadow-sm"
              ></textarea>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-gray-800 mb-2">
                Category <span className="text-red-500">*</span>
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
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-gray-800 mb-2">
                Time Found <span className="text-red-500">*</span>
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
                Storage Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Package
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <select
                  required
                  name="storage_location_id"
                  value={formData.storage_location_id}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all shadow-sm appearance-none"
                >
                  <option value="" disabled>
                    Select storage location...
                  </option>
                  {storageLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-gray-800 mb-2">
                Finder Name <span className="text-red-500">*</span>
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
                  placeholder="Finder's name"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-gray-800 mb-2">
                Finder Contact <span className="text-red-500">*</span>
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
                  placeholder="Phone / WhatsApp Number"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <label className="block text-[13px] font-bold text-gray-800">
                Found Location <span className="text-red-500">*</span>
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
                  placeholder="Type location name (e.g., Cafeteria, Library)..."
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all shadow-sm"
                />
              </div>

              <LocationPicker
                value={selectedPosition}
                onChange={setSelectedPosition}
                required={false}
                label="Click map to pin location"
                defaultCenter={{ lat: -6.5607, lng: 106.7265 }}
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-gray-800 mb-2">
                Photos <span className="text-red-500">*</span>
                <span className="text-gray-400 font-normal ml-1">(Max 5)</span>
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
                      Click to select photos
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
            {isSubmitting ? "Saving Data..." : "Save Handover Report"}
          </button>
        </div>
      </form>
    </>
  );
}
