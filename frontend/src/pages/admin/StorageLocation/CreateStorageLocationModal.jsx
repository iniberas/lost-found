import React, { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import AdminModal from "../../../components/admin/AdminModal";
import LocationPicker from "../../../components/admin/LocationPicker";
import { adminFetch } from "../../../utils/adminApi";
import { IPB_COLORS } from "../../../constants/colors";

const EMPTY_FORM = { name: "", description: "", latitude: "", longitude: "" };

const inputCls =
  "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 " +
  "focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition";

function FormField({ label, children, className = "" }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function CreateStorageLocationModal({ isOpen, onClose, onSuccess, showToast }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
    }
  }, [isOpen]);

  const patch = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSaveCreate = async () => {
    if (!form.name.trim()) return;
    setIsSubmitting(true);

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
      await adminFetch("/api/v1/admin/storage-locations", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      showToast("Storage location created successfully!", "success");
      onSuccess();
      onClose();
    } catch (err) {
      let errorMsg = err.message || "Failed to save data.";

      if (err.detail && Array.isArray(err.detail)) {
        errorMsg = err.detail.map((e) => e.msg).join(", ");
      } else if (errorMsg.includes("[object Object]")) {
        errorMsg = "Ensure Name and Location are filled correctly.";
      }
      showToast(errorMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Storage Location"
      maxWidth="max-w-4xl"
      footer={
        <div className="flex items-center justify-end w-full gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveCreate}
            disabled={isSubmitting || !form.name.trim()}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            style={{ backgroundColor: IPB_COLORS.blue.primary }}
          >
            {isSubmitting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Check size={15} />
            )}
            Save
          </button>
        </div>
      }
    >
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-[350px] flex flex-col gap-4">
          <FormField label="Name">
            <input
              type="text"
              autoFocus
              value={form.name}
              onChange={patch("name")}
              onKeyDown={(e) => e.key === "Enter" && handleSaveCreate()}
              placeholder="e.g. FASILKOM Lost & Found Desk"
              className={inputCls}
            />
          </FormField>

          <FormField label="Description" className="flex-1 flex flex-col">
            <textarea
              value={form.description}
              onChange={patch("description")}
              placeholder="Optional description…"
              className={`${inputCls} resize-none flex-1`}
            />
          </FormField>
        </div>

        <div className="flex-1 w-full min-h-[350px] flex flex-col">
          <FormField label="Location" className="flex-1 flex flex-col">
            <div className="flex-1 rounded-xl overflow-hidden">
              <LocationPicker
                required={true}
                label="Storage Location Pin"
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
          </FormField>
        </div>
      </div>
    </AdminModal>
  );
}