import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Loader2, 
  ExternalLink,
  ClipboardList,
  User as UserIcon,
  Database,
  Clock,
  Tag
} from "lucide-react";
import AdminDashboardLayout from "../../../layouts/AdminDashboard";
import PageHeader from "../../../components/admin/PageHeader";
import StatusBadge from "../../../components/admin/StatusBadge";
import { IPB_COLORS, ADMIN_COLORS } from "../../../constants/colors";
import { adminFetch } from "../../../utils/adminApi";

const DetailObjectButton = ({ onClick, text, title }) => (
  <button
    onClick={onClick}
    title={title}
    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold hover:bg-blue-200 transition-colors focus:outline-none"
  >
    <ExternalLink size={14} />
    <span className="font-mono">{text}</span>
  </button>
);

export default function AdminAuditLogDetailPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [log, setLog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const fetchDetail = useCallback(async () => {
    setIsLoading(true);
    setFetchError("");
    try {
      const data = await adminFetch(`/api/v1/admin/audit-logs/${id}`);
      setLog(data);
    } catch (err) {
      setFetchError(err.message || "Failed to load audit log details.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getActionBadgeColor = (actionType) => {
    switch (actionType?.toLowerCase()) {
      case "create": return "green";
      case "update": return "blue";
      case "delete": return "red";
      case "status_change": return "yellow";
      case "handover": return "purple";
      default: return "gray";
    }
  };

  const getEntityUrl = (type, entityId) => {
    if (!entityId || !type) return null;
    const lowerType = type.toLowerCase();

    if (lowerType === "user" || lowerType === "admin") return `/admin/users/${entityId}`;
    if (lowerType === "lost_report" || lowerType === "found_report") return `/admin/reports/${entityId}`;
    if (lowerType === "category") return `/admin/categories/${entityId}`;
    if (lowerType === "storage_location") return `/admin/storage-locations/${entityId}`;
    
    return null;
  };

  const handleOpenLink = (url) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const renderChangeValue = (val) => {
    if (val === null || val === undefined) {
      return <span className="italic text-gray-400">null</span>;
    }
    if (typeof val !== "object") {
      return (
        <span className="font-mono text-gray-800 bg-gray-100 px-2.5 py-1 rounded-md text-xs border border-gray-200">
          {String(val)}
        </span>
      );
    }

    if (Array.isArray(val)) {
      return (
        <div className="flex flex-wrap gap-1.5">
          {val.map((v, i) => (
            <span key={i} className="font-mono text-gray-800 bg-gray-100 px-2.5 py-1 rounded-md text-xs border border-gray-200">
              {String(v)}
            </span>
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1.5">
        {Object.entries(val).map(([k, v]) => (
          <div key={k} className="flex text-xs bg-white border border-gray-200 rounded-md shadow-sm w-fit items-center overflow-hidden">
            <span className="text-gray-500 font-medium bg-gray-50 px-2.5 py-1.5 border-r border-gray-200">
              {k}
            </span>
            <span className="font-mono text-gray-800 px-2.5 py-1.5">
              {String(v)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <AdminDashboardLayout user={user}>
        <div className="flex items-center justify-center h-[60vh] gap-3">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading log details…</p>
        </div>
      </AdminDashboardLayout>
    );
  }

  if (fetchError || !log) {
    return (
      <AdminDashboardLayout user={user}>
        <div className="px-10 py-8 space-y-4">
          <PageHeader title="Audit Log Details" />
          <div className="bg-red-50 text-red-600 p-8 rounded-2xl border border-red-100 text-center space-y-1">
            <p className="font-bold text-base">Something went wrong</p>
            <p className="text-sm">{fetchError || "Audit log not found."}</p>
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout user={user}>
      <div className="px-10 py-8 space-y-6">
        
        <PageHeader title="Audit Log Details"/>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden h-fit">
              <div className="flex flex-col gap-6 items-start">
                
                <div className="flex items-center gap-4 w-full">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "#EEF2FF" }}
                  >
                    <ClipboardList size={28} style={{ color: IPB_COLORS.blue.primary }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold text-gray-900 truncate uppercase">
                      {log.action ? log.action.replace("_", " ") : "ACTION"}
                    </h2>
                    <p className="text-xs font-mono text-gray-400 mt-0.5 truncate uppercase">
                      ID: {log.id}
                    </p>
                  </div>
                </div>

                <div className="w-full space-y-4 pt-2 border-t border-gray-50">
                  <InfoRow icon={Clock} label="Timestamp">
                    <span className="text-gray-700 font-medium">{formatDateTime(log.created_at)}</span>
                  </InfoRow>

                  <InfoRow icon={UserIcon} label="Actor">
                    {log.actor_id ? (
                      <DetailObjectButton
                        onClick={() => handleOpenLink(`/admin/users/${log.actor_id}`)}
                        text={log.actor_id.substring(0, 12) + "..."}
                        title={log.actor_id}
                      />
                    ) : (
                      <span className="text-gray-500 italic text-sm">System / Unknown</span>
                    )}
                  </InfoRow>

                  <InfoRow icon={Tag} label="Entity Type">
                    <span className="uppercase font-bold text-[10px] tracking-wider text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md">
                      {log.entity_type ? log.entity_type.replace("_", " ") : "-"}
                    </span>
                  </InfoRow>

                  <InfoRow icon={Database} label="Entity Target">
                    {(() => {
                      if (!log.entity_id) return <span className="text-gray-500">-</span>;
                      const url = getEntityUrl(log.entity_type, log.entity_id);
                      if (url) {
                        return (
                          <DetailObjectButton
                            onClick={() => handleOpenLink(url)}
                            text={log.entity_id.substring(0, 12) + "..."}
                            title={log.entity_id}
                          />
                        );
                      }
                      return <span className="font-mono text-sm text-gray-700">{log.entity_id}</span>;
                    })()}
                  </InfoRow>
                </div>

              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/40">
                <h3 className="font-bold text-gray-800" style={{ color: ADMIN_COLORS?.headingText || "#1f2937" }}>
                  Payload / Changes
                </h3>
              </div>
              
              <div className="overflow-x-auto min-h-[160px]">
                {log.changes && Object.keys(log.changes).length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/60 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                        <th className="px-6 py-3 border-b border-gray-100 w-1/3">Field</th>
                        <th className="px-6 py-3 border-b border-gray-100">Value / Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                      {Object.entries(log.changes).map(([key, value]) => (
                        <tr key={key} className="hover:bg-blue-50/20 transition-colors">
                          <td className="px-6 py-4 text-sm font-semibold text-gray-700 align-top">
                            {key}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 align-top">
                            {renderChangeValue(value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-6 py-16 flex flex-col items-center justify-center gap-2 text-center">
                    <ClipboardList size={28} className="text-gray-200 mb-1" />
                    <span className="font-medium text-sm text-gray-500">No changes recorded</span>
                    <span className="text-xs text-gray-400">This audit log doesn't contain a payload.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </AdminDashboardLayout>
  );
}

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-gray-50 rounded-lg shrink-0 mt-0.5">
        <Icon size={16} className="text-gray-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          {label}
        </p>
        <div>{children}</div>
      </div>
    </div>
  );
}