import React, { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Pencil,
} from "lucide-react";

import AdminDashboardLayout from "../../../layouts/AdminDashboard";
import PageHeader from "../../../components/PageHeader";
import Toast from "../../../components/Toast";

import { formatDate } from "../../../components/FilterHelpers";

import EditProfileModal from "./EditProfileModal";
import ChangePasswordModal from "./ChangePasswordModal";
import { apiFetch } from "../../../utils/api";

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminProfilePage({
  user,
  handleLogout,
}) {
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState(null);

  const [editModal, setEditModal] = useState({
    open: false,
    submitting: false,
  });

  const [passwordModal, setPasswordModal] = useState({
    open: false,
    submitting: false,
  });

  const showToast = (
    message,
    type = "success"
  ) => {
    setToast({ message, type });
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`${API_URL}/api/v1/users/me`, {
        auth: "required"
      })

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to fetch profile"
        );
      }

      setProfile(data);
    } catch (err) {
      console.error(err);

      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (
    payload
  ) => {
    try {
      setEditModal((prev) => ({
        ...prev,
        submitting: true,
      }));

      const formData = new FormData();

      formData.append(
        "name",
        payload.name
      );

      formData.append(
        "email",
        payload.email
      );

      formData.append(
        "phone_number",
        payload.phone_number
      );

      const response = await apiFetch(`${API_URL}/api/v1/users/me`, {
        method: "PUT",
        auth: "required",
        body: formData,
      })

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to update profile"
        );
      }

      setProfile(data);

      setEditModal({
        open: false,
        submitting: false,
      });

      showToast(
        "Profile updated successfully"
      );
    } catch (err) {
      console.error(err);

      showToast(err.message, "error");

      setEditModal((prev) => ({
        ...prev,
        submitting: false,
      }));
    }
  };

  const handleChangePassword = async (payload) => {
    try {
      setPasswordModal((prev) => ({
        ...prev,
        submitting: true,
      }));

      const response = await apiFetch(
        `${API_URL}/api/v1/users/me/password`,
        {
          method: "PATCH",
          auth: "required",
          body: JSON.stringify({
            old_password: payload.old_password,
            new_password: payload.new_password,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
          data.detail || "Failed to change password"
        );
      }

      setPasswordModal({
        open: false,
        submitting: false,
      });

      showToast(
        "Password changed successfully",
        "success"
      );
      return true
    } catch (err) {
      console.error(err);

      showToast(err.message, "error");

      setPasswordModal((prev) => ({
        ...prev,
        submitting: false,
      }));
      return false
    }
  };

  if (loading) {
    return (
      <AdminDashboardLayout
        user={user}
        handleLogout={handleLogout}
      >
        <div className="px-10 py-8 space-y-5">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />

          <p className="text-gray-500 font-medium">
            Loading profile...
          </p>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout
      user={user}
      handleLogout={handleLogout}
    >
      <div className="px-10 py-8 space-y-5">
        <PageHeader title="Profil Saya" />

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
              <User
                size={36}
                className="text-blue-600"
              />
            </div>

            <div className="flex-1 space-y-5 min-w-0">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {profile?.name}
                </h2>

                <p className="text-sm text-gray-400 mt-1">
                  Kelola informasi akun Anda
                </p>
              </div>

              <div className="space-y-3">
                <InfoRow
                  icon={Mail}
                  label="Email"
                  value={profile?.email}
                />

                <InfoRow
                  icon={Phone}
                  label="Phone Number"
                  value={
                    profile?.phone_number || "-"
                  }
                />

                <InfoRow
                  icon={Calendar}
                  label="Joined"
                  value={formatDate(
                    profile?.created_at
                  )}
                />
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    setEditModal({
                      open: true,
                      submitting: false,
                    })
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0C0B89] text-white text-sm font-semibold hover:opacity-90 transition"
                >
                  <Pencil size={16} />
                  Edit Profile
                </button>

                <button
                  onClick={() =>
                    setPasswordModal({
                      open: true,
                      submitting: false,
                    })
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditProfileModal
        isOpen={editModal.open}
        onClose={() =>
          setEditModal({
            open: false,
            submitting: false,
          })
        }
        submitting={editModal.submitting}
        initialData={profile}
        handleSubmit={handleUpdateProfile}
      />

      <ChangePasswordModal
        isOpen={passwordModal.open}
        onClose={() =>
          setPasswordModal({
            open: false,
            submitting: false,
          })
        }
        submitting={passwordModal.submitting}
        handleSubmit={handleChangePassword}
      />
      <Toast
        show={Boolean(toast)}
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />

    </AdminDashboardLayout>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2.5 bg-gray-50 rounded-xl shrink-0">
        <Icon
          size={16}
          className="text-gray-400"
        />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-gray-400">
          {label}
        </p>

        <p className="text-sm font-medium text-gray-800 truncate">
          {value}
        </p>
      </div>
    </div>
  );
}