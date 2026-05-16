import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Trash2,
  ToggleRight,
  Check,
  Loader2,
  RotateCcw,
  MapPin,
  FileText,
  Database,
} from "lucide-react";
import AdminDashboardLayout from "../../../layouts/AdminDashboard";
import PageHeader from "../../../components/admin/PageHeader";
import StatusBadge from "../../../components/admin/StatusBadge";
import LocationPicker from "../../../components/admin/LocationPicker";
import { adminFetch } from "../../../utils/adminApi";
import { IPB_COLORS } from "../../../constants/colors";

const inputCls =
  "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all shadow-sm";

export default function AdminStorageLocationDetailPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    latitude: "",
    longitude: "",
  });
  const [initialForm, setInitialForm] = useState({
    name: "",
    description: "",
    latitude: "",
    longitude: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fetchDetail = useCallback(async () => {
    setIsLoading(true);
    setFetchError("");
    try {
      const data = await adminFetch(`/api/v1/admin/storage-locations/${id}`);
      setLocation(data);

      const formData = {
        name: data.name ?? "",
        description: data.description ?? "",
        latitude: data.location_point?.latitude ?? "",
        longitude: data.location_point?.longitude ?? "",
      };
      setForm(formData);
      setInitialForm(formData);
    } catch (err) {
      setFetchError(err.message || "Failed to load storage location details.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const patch = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const isFormChanged =
    form.name !== initialForm.name ||
    form.description !== initialForm.description ||
    form.latitude !== initialForm.latitude ||
    form.longitude !== initialForm.longitude;

  const handleCancel = () => {
    setForm(initialForm);
    setSubmitError("");
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setIsSubmitting(true);
    setSubmitError("");

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      location_point:
        form.latitude !== "" && form.longitude !== ""
          ? {
              latitude: Number(form.latitude),
              longitude: Number(form.longitude),
            }
          : null,
    };

    try {
      await adminFetch(`/api/v1/admin/storage-locations/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      await fetchDetail();
    } catch (err) {
      let errorMsg = err.message || "Failed to save changes.";
      if (err.detail && Array.isArray(err.detail)) {
        errorMsg = err.detail.map((e) => e.msg).join(", ");
      } else if (errorMsg.includes("[object Object]")) {
        errorMsg = "Ensure Name and Location are filled correctly.";
      }
      setSubmitError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    const action = location.is_active ? "Deactivate" : "Activate";
    if (!window.confirm(`${action} "${location.name}"?`)) return;

    try {
      if (location.is_active) {
        await adminFetch(`/api/v1/admin/storage-locations/${id}`, {
          method: "DELETE",
        });
      } else {
        await adminFetch(`/api/v1/admin/storage-locations/${id}/activate`, {
          method: "POST",
        });
      }
      fetchDetail();
    } catch (err) {
      alert(err.message);
    }
  };

  if (isLoading) {
    return (
      <AdminDashboardLayout user={user}>
        <div className="flex items-center justify-center h-[60vh] gap-3">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading details…</p>
        </div>
      </AdminDashboardLayout>
    );
  }

  if (fetchError || !location) {
    return (
      <AdminDashboardLayout user={user}>
        <div className="px-10 py-8 space-y-4">
          <PageHeader title="Storage Location Details" />
          <div className="bg-red-50 text-red-600 p-8 rounded-2xl border border-red-100 text-center space-y-1">
            <p className="font-bold text-base">Something went wrong</p>
            <p className="text-sm">{fetchError || "Location not found."}</p>
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout user={user}>
      <div className="px-10 py-8 space-y-6">
        <PageHeader title="Storage Location Details" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
              <div className="absolute top-5 right-5 z-10">
                <StatusBadge
                  variant={location.is_active ? "green" : "red"}
                  label={location.is_active ? "Active" : "Inactive"}
                />
              </div>

              <div className="flex items-center gap-4 mb-8 pr-24">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Database
                    size={26}
                    style={{ color: IPB_COLORS.blue.primary }}
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 truncate">
                    {location.name}
                  </h2>
                  <p className="text-xs font-mono text-gray-400 mt-0.5 uppercase tracking-wide">
                    ID: {location.id}
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <FormField label="Location Name" required>
                  <div className="relative">
                    <FileText
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      value={form.name}
                      onChange={patch("name")}
                      placeholder="e.g. FASILKOM Lost & Found Desk"
                      className={`${inputCls} pl-11`}
                    />
                  </div>
                </FormField>

                <FormField label="Description">
                  <textarea
                    value={form.description}
                    onChange={patch("description")}
                    placeholder="Optional description…"
                    className={`${inputCls} resize-none h-32 p-4`}
                  />
                </FormField>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={18} style={{ color: IPB_COLORS.blue.primary }} />
                <h3 className="text-lg font-bold text-gray-900">
                  Location <span className="text-red-500">*</span>
                </h3>
              </div>
              <div className="rounded-xl overflow-hidden">
                <LocationPicker
                  required={true}
                  label="Pin Lokasi"
                  value={
                    form.latitude !== "" && form.longitude !== ""
                      ? {
                          lat: Number(form.latitude),
                          lng: Number(form.longitude),
                        }
                      : null
                  }
                  onChange={(pos) => {
                    if (pos) {
                      setForm((f) => ({
                        ...f,
                        latitude: pos.lat,
                        longitude: pos.lng,
                      }));
                    } else {
                      setForm((f) => ({ ...f, latitude: "", longitude: "" }));
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 sticky top-6">
              <h3 className="text-base font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">
                Admin Actions
              </h3>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSubmitting || !form.name.trim() || !isFormChanged}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: IPB_COLORS.blue.primary }}
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>

                {isFormChanged && (
                  <button
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <RotateCcw size={16} /> Cancel Changes
                  </button>
                )}
                {location.is_active ? (
                  <button
                    onClick={handleToggleStatus}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Trash2 size={16} /> Deactivate
                  </button>
                ) : (
                  <button
                    onClick={handleToggleStatus}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <ToggleRight size={16} /> Activate
                  </button>
                )}
              </div>

              {submitError && (
                <p className="text-[13px] text-red-500 font-medium text-center animate-shake mt-2 bg-red-50 p-2 rounded-lg border border-red-100">
                  {submitError}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
}

function FormField({ label, children, required = false, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-[13px] font-bold text-gray-800">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
