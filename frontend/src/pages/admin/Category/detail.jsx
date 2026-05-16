import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Trash2, Check, Loader2, RotateCcw, Tag, FileText } from "lucide-react";
import AdminDashboardLayout from "../../../layouts/AdminDashboard";
import PageHeader from "../../../components/admin/PageHeader";
import StatusBadge from "../../../components/admin/StatusBadge";
import Toast from "../../../components/Toast";
import { adminFetch } from "../../../utils/adminApi";
import { IPB_COLORS } from "../../../constants/colors";

const inputCls =
  "w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all shadow-sm";

export default function AdminCategoryDetailPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);
  const [nameInput, setNameInput] = useState("");
  const [initialName, setInitialName] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info",
  });

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
  };

  const fetchDetail = useCallback(async () => {
    setIsLoading(true);
    setFetchError("");
    try {
      const data = await adminFetch(`/api/v1/admin/categories/${id}`);
      setCategory(data);
      setNameInput(data.name || "");
      setInitialName(data.name || "");
    } catch (err) {
      setFetchError(err.message || "Failed to load category details.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleCancel = () => {
    setNameInput(initialName);
  };

  const handleSave = async () => {
    if (!nameInput.trim()) return;
    setIsSubmitting(true);

    try {
      await adminFetch(`/api/v1/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ name: nameInput.trim() }),
      });

      setInitialName(nameInput.trim());
      showToast("Category updated successfully!", "success");
      fetchDetail();
    } catch (err) {
      showToast(err.message || "Failed to update category.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to deactivate category "${category.name}"?`,
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      await adminFetch(`/api/v1/admin/categories/${id}`, {
        method: "DELETE",
      });
      showToast("Category deactivated successfully!", "success");
      navigate("/admin/categories");
    } catch (err) {
      showToast(err.message || "Failed to deactivate category.", "error");
      setIsSubmitting(false);
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

  if (fetchError || !category) {
    return (
      <AdminDashboardLayout user={user}>
        <div className="px-10 py-8 space-y-4">
          <PageHeader title="Category Details" />
          <div className="bg-red-50 text-red-600 p-8 rounded-2xl border border-red-100 text-center space-y-1">
            <p className="font-bold text-base">Something went wrong</p>
            <p className="text-sm">{fetchError || "Category not found."}</p>
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  const isChanged = nameInput.trim() !== initialName;

  return (
    <AdminDashboardLayout user={user}>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <div className="px-10 py-8 space-y-6">
        <PageHeader title="Category Details" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
              <div className="absolute top-5 right-5 z-10">
                <StatusBadge
                  variant={category.is_active ? "green" : "red"}
                  label={category.is_active ? "Active" : "Inactive"}
                />
              </div>

              <div className="flex items-center gap-4 mb-8 pr-24">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Tag size={26} style={{ color: IPB_COLORS.blue.primary }} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 truncate">
                    {category.name}
                  </h2>
                  <p className="text-xs font-mono text-gray-400 mt-0.5 uppercase tracking-wide">
                    ID: {category.id}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[13px] font-bold text-gray-800">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="e.g. Electronics, Wallet, Keys…"
                    className={inputCls}
                  />
                </div>
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
                  disabled={isSubmitting || !nameInput.trim() || !isChanged}
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

                {isChanged && (
                  <button
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <RotateCcw size={16} /> Cancel Changes
                  </button>
                )}

                {category.is_active ? (
                  <button
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    Deactivate Category
                  </button>
                ) : (
                  ""
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
}
