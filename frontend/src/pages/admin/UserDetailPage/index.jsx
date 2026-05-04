import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Mail,
  Phone,
  Calendar,
  User as UserIcon,
  Eye,
  Shield,
} from "lucide-react";
import AdminDashboardLayout from "../../../layouts/AdminDashboard";
import PageHeader from "../../../components/admin/PageHeader";
import StatusBadge from "../../../components/admin/StatusBadge";
import { ActionBtn, formatDate } from "../../../components/admin/FilterHelpers";
import { IPB_COLORS, ADMIN_COLORS } from "../../../constants/colors";
import { adminFetch, buildParams } from "../../../utils/adminApi";

export default function AdminUserDetailPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [userDetails, setUserDetails] = useState(null);
  const [userReports, setUserReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReportsLoading, setIsReportsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    loadUser();
    loadReports();
  }, [id]);

  const loadUser = async () => {
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
  };

  const loadReports = async () => {
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
      <div className="px-10 py-8 space-y-6">
        <PageHeader title="User Details" />

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
                  text={
                    <span className="capitalize">
                      {userDetails.role ?? "user"}
                    </span>
                  }
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
              variant={isDeleted ? "deleted" : "active"}
              label={isDeleted ? "Deleted Account" : "Active Account"}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/40">
            <h3
              className="font-bold text-gray-800"
              style={{ color: ADMIN_COLORS.headingText }}
            >
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
                    {[
                      "Report ID",
                      "Title",
                      "Type",
                      "Status",
                      "Date",
                      "Action",
                    ].map((h) => (
                      <th key={h} className="px-6 py-3 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {userReports.length > 0 ? (
                    userReports.map((report) => (
                      <tr
                        key={report.id}
                        className="border-t border-gray-50 hover:bg-blue-50/20 transition-colors"
                      >
                        <td className="px-6 py-3 font-mono text-xs text-gray-400">
                          #{report.id.slice(0, 8)}…
                        </td>
                        <td className="px-6 py-3 font-semibold text-gray-800 max-w-[220px] truncate">
                          {report.title}
                        </td>
                        <td className="px-6 py-3">
                          <StatusBadge variant={report.reportType} />
                        </td>
                        <td className="px-6 py-3">
                          <StatusBadge
                            variant={report.status?.toLowerCase() ?? "open"}
                          />
                        </td>
                        <td className="px-6 py-3 text-gray-500">
                          {formatDate(report.created_at)}
                        </td>
                        <td className="px-6 py-3">
                          <ActionBtn
                            title="View Report"
                            icon={
                              <Eye
                                size={17}
                                className="text-gray-400 group-hover:text-blue-600 transition-colors"
                              />
                            }
                            onClick={() =>
                              navigate(`/admin/reports/${report.id}`)
                            }
                            hoverClass="hover:bg-blue-100"
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <Eye size={28} className="text-gray-200 mb-1" />
                          <p className="font-medium text-sm text-gray-500">
                            No reports yet
                          </p>
                          <p className="text-xs">
                            This user hasn't submitted any reports.
                          </p>
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
