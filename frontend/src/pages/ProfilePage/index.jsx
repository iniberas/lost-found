import React, { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Pencil,
} from "lucide-react";

import UserLayout from "../../layouts/UserLayout";
import PageHeader from "../../components/PageHeader";
import Toast from "../../components/Toast";

import { formatDate } from "../../components/FilterHelpers";

import EditProfileModal from "./EditProfileModal";

const API_URL = import.meta.env.VITE_API_URL;

export default function ProfilePage({
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

      const token =
        localStorage.getItem("access_token");

      const response = await fetch(
        `${API_URL}/api/v1/users/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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

      const token =
        localStorage.getItem("access_token");

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

      const response = await fetch(
        `${API_URL}/api/v1/users/me`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

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

  if (loading) {
    return (
      <UserLayout
        user={user}
        handleLogout={handleLogout}
      >
        <div className="flex items-center justify-center h-[60vh] gap-3">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />

          <p className="text-gray-500 font-medium">
            Loading profile...
          </p>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout
      user={user}
      handleLogout={handleLogout}
    >
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-10 space-y-6">
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

              <div className="pt-2">
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

      <Toast
        show={Boolean(toast)}
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </UserLayout>
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