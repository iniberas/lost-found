import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Mail,
  Phone,
  Calendar,
  User as UserIcon,
  Eye,
  Shield,
  Trash2,
  Loader2,
} from "lucide-react";
import AdminDashboardLayout from "../../../layouts/AdminDashboard";
import PageHeader from "../../../components/admin/PageHeader";
import StatusBadge from "../../../components/admin/StatusBadge";
import Toast from "../../../components/Toast";
import { formatDate } from "../../../components/admin/FilterHelpers";
import { IPB_COLORS, ADMIN_COLORS } from "../../../constants/colors";
import { adminFetch, buildParams } from "../../../utils/adminApi";

const getAccountStatusColor = (isDeleted) => {
  return isDeleted ? "red" : "green";
};

const getReportTypeColor = (type) => {
  return type?.toLowerCase() === "lost" ? "red" : "blue";
};

const getReportStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "open": return "green";
    case "resolved": return "blue";
    case "closed": return "gray";
    default: return "gray";
  }
};

const formatStatusLabel = (status) => {
  if (!status) return "UNKNOWN";
  return status.replace(/_/g, " ");
};

export default function AdminUserDetailPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [userDetails, setUserDetails] = useState(null);
  const [userReports, setUserReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReportsLoading, setIsReportsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info",
  });

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
  };

  const loadUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminFetch(`/api/v1/admin/users/${id}`);
      setUserDetails(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const loadReports = useCallback(async () => {
    setIsReportsLoading(true);
    try {
      const qs = buildParams({ reporter_id: id, limit: 100 });
      const [lostData, foundData] = await Promise.all([
        adminFetch(`/api/v1/admin/reports/lost-reports?${qs}`),
        adminFetch(`/api/v1/admin/reports/found-reports?${qs}`),
      ]);

      const combined = [
        ...(lostData?.items ?? []).map((r) => ({ ...r, reportType: "lost" })),
        ...(foundData?.items ?? []).map((r) => ({ ...r, reportType: "found" })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setUserReports(combined);
    } catch (err) {
      console.error("[UserDetail] Failed to load reports:", err);
    } finally {
      setIsReportsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    loadUser();
    loadReports();
  }, [id, loadUser, loadReports]);

  const handleDeleteUser = async () => {
    if (!window.confirm(`Are you sure you want to delete user "${userDetails.name}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await adminFetch(`/api/v1/admin/users/${id}`, {
        method: "DELETE",
      });
      showToast("User successfully deleted", "success");
      await loadUser(); 
    } catch (err) {
      showToast(err.message || "Failed to delete user", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <AdminDashboardLayout user={user}>
        <div className="flex items-center justify-center h-[60vh] gap-3">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading user details…</p>
        </div>
      </AdminDashboardLayout>
    );
  }

  if (error || !userDetails) {
    return (
      <AdminDashboardLayout user={user}>
        <div className="px-10 py-8 space-y-4">
          <PageHeader title="User Details" />
          <div className="bg-red-50 text-red-600 p-8 rounded-2xl border border-red-100 text-center space-y-1">
            <p className="font-bold text-base">Something went wrong</p>
            <p className="text-sm">{error ?? "User data not available."}</p>
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  const isDeleted = !!userDetails.deleted_at;

  return (
    <AdminDashboardLayout user={user}>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <div className="px-10 py-8 space-y-6">
        <PageHeader title="User Details" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#EEF2FF" }}
                >
                  <UserIcon size={36} style={{ color: IPB_COLORS.blue.primary }} />
                </div>

                <div className="flex-1 space-y-4 min-w-0">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {userDetails.name}
                    </h2>
                    <p className="text-xs font-mono text-gray-400 mt-0.5 truncate">
                      ID: {userDetails.id}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <InfoRow icon={Mail} text={userDetails.email} />
                    <InfoRow icon={Phone} text={userDetails.phone_number || "—"} />
                    <InfoRow
                      icon={Shield}
                      text={<span className="capitalize">{userDetails.role ?? "user"}</span>}
                    />
                    <InfoRow
                      icon={Calendar}
                      text={`Joined ${formatDate(userDetails.created_at)}`}
                    />
                  </div>
                </div>
              </div>

              <div className="absolute top-5 right-5">
                <StatusBadge
                  variant={getAccountStatusColor(isDeleted)}
                  label={isDeleted ? "Deleted Account" : "Active Account"}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/40">
                <h3 className="font-bold text-gray-800" style={{ color: ADMIN_COLORS.headingText }}>
                  Reports by {userDetails.name}
                </h3>
                <span className="text-xs font-medium bg-white px-2.5 py-1 rounded-md border border-gray-200 text-gray-500">
                  {userReports.length} Total
                </span>
              </div>

              <div className="overflow-x-auto min-h-[160px]">
                {isReportsLoading ? (
                  <div className="flex items-center justify-center p-10 gap-3">
                    <div className="w-7 h-7 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-sm text-gray-400">Loading reports…</p>
                  </div>
                ) : (
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead>
                      <tr className="bg-gray-50/60 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                        {["Title", "Type", "Status", "Date"].map((h) => (
                          <th key={h} className="px-6 py-3 font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {userReports.length > 0 ? (
                        userReports.map((report) => (
                          <tr
                            key={report.id}
                            onClick={() => navigate(`/admin/reports/${report.id}`, { state: { reportType: report.reportType } })}
                            className="border-t border-gray-50 hover:bg-blue-50/40 transition-colors cursor-pointer"
                          >
                            <td className="px-6 py-3 font-semibold text-gray-800 max-w-[220px] truncate">
                              {report.title}
                            </td>
                            <td className="px-6 py-3">
                              <StatusBadge
                                variant={getReportTypeColor(report.reportType)}
                                label={report.reportType}
                              />
                            </td>
                            <td className="px-6 py-3">
                              <StatusBadge
                                variant={getReportStatusColor(report.status)}
                                label={formatStatusLabel(report.status ?? "open")}
                              />
                            </td>
                            <td className="px-6 py-3 text-gray-500">
                              {formatDate(report.created_at)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-16 text-center">
                            <div className="flex flex-col items-center gap-2 text-gray-400">
                              <Eye size={28} className="text-gray-200 mb-1" />
                              <p className="font-medium text-sm text-gray-500">No reports yet</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 sticky top-6">
              <h3 className="text-base font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">
                Admin Actions
              </h3>

              {!isDeleted ? (
                <button
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              ) : (
                <p className="text-xs text-gray-400 italic text-center py-2">
                  No further actions available for deleted accounts.
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </AdminDashboardLayout>
  );
}

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