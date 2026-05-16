import React from "react";
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminDashboardLayout from "../../../layouts/AdminDashboard";
import AdminTable from "../../../components/admin/Table";
import AdminSearchFilter from "../../../components/admin/SearchFilter";
import StatusBadge from "../../../components/admin/StatusBadge";
import { adminFetch, buildParams } from "../../../utils/adminApi";
import { useAdminTable } from "../../../hooks/useAdminTable";

const LIMIT = 15;

const TABLE_HEADERS = [
  { label: "#", key: "no", sortable: false, className: "w-16" },
  { label: "Actor", key: "actor_id", sortable: false },
  { label: "Entity Type", key: "entity_type", sortable: false },
  { label: "Entity", key: "entity_id", sortable: false },
  { label: "Action", key: "action", sortable: false },
  { label: "Created At", key: "created_at", sortable: true },
];

function fetchAuditLogs({ page, searchTerm, sortBy, sortOrder, filters }) {
  const formattedFilters = { ...(filters || {}) };
  if (formattedFilters.created_at_from) {
    formattedFilters.created_at_from = `${formattedFilters.created_at_from}T00:00:00Z`;
  }
  if (formattedFilters.created_at_to) {
    formattedFilters.created_at_to = `${formattedFilters.created_at_to}T23:59:59Z`;
  }

  const qs = buildParams({
    page,
    limit: LIMIT,
    sort_by: sortBy,
    sort_order: sortOrder,
    ...(searchTerm && { actor_id: searchTerm }),
    ...formattedFilters,
  });

  return adminFetch(`/api/v1/admin/audit-logs?${qs}`);
}

const DetailObjectButton = ({ onClick, text, title }) => (
  <button
    onClick={onClick}
    title={title}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
  >
    <ExternalLink size={16} />
    <span className="font-mono font-semibold">{text}</span>
  </button>
);

export default function AdminViewAuditLogsPage({ user }) {
  const navigate = useNavigate();

  const table = useAdminTable({
    fetchFn: fetchAuditLogs,
    defaultSort: "created_at",
    defaultOrder: "desc",
    defaultFilters: {
      entity_type: "",
      action: "",
      created_at_from: "",
      created_at_to: "",
    },
  });

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionBadgeColor = (actionType) => {
    switch (actionType?.toLowerCase()) {
      case "create":
        return "green";
      case "update":
        return "blue";
      case "delete":
        return "red";
      case "status_change":
        return "yellow";
      case "handover":
        return "purple";
      default:
        return "gray";
    }
  };

  const getEntityUrl = (type, id) => {
    if (!id || !type) return null;
    const lowerType = type.toLowerCase();

    if (lowerType === "user" || lowerType === "admin") return `/admin/users/${id}`;
    if (lowerType === "lost_report" || lowerType === "found_report") return `/admin/reports/${id}`;
    if (lowerType === "category") return `/admin/categories/${id}`;
    if (lowerType === "storage_location") return `/admin/storage-locations/${id}`;

    return null;
  };

  const handleOpenLink = (e, url) => {
    e.stopPropagation();
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <AdminDashboardLayout user={user}>
      <div className="px-10 py-8 space-y-5">
        <div className="flex gap-4 items-stretch">
          <div className="flex-1">
            <AdminSearchFilter
              searchValue={table.searchInput}
              onSearchChange={(e) => table.setSearchInput(e.target.value)}
              onSearchSubmit={table.handleSearchSubmit}
              isFilterActive={table.isFilterActive}
              onApplyFilter={table.handleApplyFilter}
              onResetFilter={table.handleResetFilter}
              searchPlaceholder="Search logs by exact Actor UUID..."
              filterTitle="Filter Audit Logs"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">
                  Entity Type
                </label>
                <select
                  value={table.filterInput.entity_type}
                  onChange={(e) =>
                    table.setFilterInput({
                      ...table.filterInput,
                      entity_type: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-blue-500 uppercase"
                >
                  <option value="">All Entities</option>
                  <option value="user">USER</option>
                  <option value="admin">ADMIN</option>
                  <option value="category">CATEGORY</option>
                  <option value="lost_report">LOST_REPORT</option>
                  <option value="found_report">FOUND_REPORT</option>
                  <option value="storage_location">STORAGE_LOCATION</option>
                  <option value="contact_request">CONTACT_REQUEST</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">
                  Action Type
                </label>
                <select
                  value={table.filterInput.action}
                  onChange={(e) =>
                    table.setFilterInput({
                      ...table.filterInput,
                      action: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-blue-500 uppercase"
                >
                  <option value="">All Actions</option>
                  <option value="create">CREATE</option>
                  <option value="update">UPDATE</option>
                  <option value="delete">DELETE</option>
                  <option value="status_change">STATUS_CHANGE</option>
                  <option value="handover">HANDOVER</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">
                  Date From
                </label>
                <input
                  type="date"
                  value={table.filterInput.created_at_from}
                  onChange={(e) =>
                    table.setFilterInput({
                      ...table.filterInput,
                      created_at_from: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-blue-500 text-gray-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">
                  Date Until
                </label>
                <input
                  type="date"
                  value={table.filterInput.created_at_to}
                  onChange={(e) =>
                    table.setFilterInput({
                      ...table.filterInput,
                      created_at_to: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-blue-500 text-gray-700"
                />
              </div>
            </AdminSearchFilter>
          </div>
        </div>

        <AdminTable
          headers={TABLE_HEADERS}
          isLoading={table.isLoading}
          sortBy={table.sortBy}
          sortOrder={table.sortOrder}
          onSort={table.handleSort}
          page={table.page}
          totalPages={table.totalPages}
          onPageChange={table.setPage}
          isEmpty={table.items.length === 0}
          emptyMessage="No audit logs found."
        >
          {table.items.map((row, i) => (
            <tr
              key={row.id}
              onClick={() => navigate(`/admin/audit-logs/${row.id}`)}
              className="hover:bg-blue-50/30 transition-colors border-t border-gray-50 cursor-pointer"
            >
              <td className="px-6 py-4 text-gray-400 font-medium text-sm">
                {(table.page - 1) * LIMIT + i + 1}
              </td>

              <td className="px-6 py-4">
                {row.actor_id ? (
                  <DetailObjectButton
                    onClick={(e) =>
                      handleOpenLink(e, `/admin/users/${row.actor_id}`)
                    }
                    text={`${row.actor_id.substring(0, 8)}...`} 
                    title={row.actor_id}
                  />
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </td>

              <td className="px-6 py-4 uppercase font-semibold text-[12px] text-gray-700">
                {row.entity_type ? row.entity_type.replace("_", " ") : "-"}
              </td>

              <td className="px-6 py-4">
                {(() => {
                  if (!row.entity_id)
                    return <span className="text-gray-500">-</span>;

                  const url = getEntityUrl(row.entity_type, row.entity_id);
                  const shortId = `${row.entity_id.substring(0, 8)}...`;

                  if (url) {
                    return (
                      <DetailObjectButton
                        onClick={(e) => handleOpenLink(e, url)}
                        text={shortId}
                        title={row.entity_id}
                      />
                    );
                  }

                  return <span className="text-gray-500">{shortId}</span>;
                })()}
              </td>

              <td className="px-6 py-4">
                <StatusBadge
                  variant={getActionBadgeColor(row.action)}
                  label={row.action ? row.action.replace("_", " ") : "UNKNOWN"}
                />
              </td>

              <td className="px-6 py-4 text-gray-500 text-sm whitespace-nowrap">
                {formatDateTime(row.created_at)}
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>
    </AdminDashboardLayout>
  );
}
