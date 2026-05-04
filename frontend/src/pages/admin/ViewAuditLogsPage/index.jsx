import React, { useState, useEffect } from "react";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminDashboardLayout from "../../../layouts/AdminDashboard";
import AdminTable from "../../../components/admin/Table";
import AdminSearchFilter from "../../../components/admin/SearchFilter";
import { IPB_COLORS } from "../../../constants/colors";

const API_URL = "http://127.0.0.1:8000";

export default function AdminViewAuditLogsPage({ user }) {
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [page, setPage] = useState(1);
  const limit = 15;
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [sortOrder, setSortOrder] = useState("desc");

  const [filterInput, setFilterInput] = useState({
    entity_type: "",
    action: "",
    created_at_from: "",
    created_at_to: "",
  });

  const [appliedFilters, setAppliedFilters] = useState({
    entity_type: "",
    action: "",
    created_at_from: "",
    created_at_to: "",
  });

  const fetchLogsFromBackend = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("access_token");

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort_order: sortOrder,
      });

      if (searchTerm) {
        params.append("actor_id", searchTerm);
      }

      if (appliedFilters.created_at_from) {
        params.append(
          "created_at_from",
          `${appliedFilters.created_at_from}T00:00:00Z`,
        );
      }
      if (appliedFilters.created_at_to) {
        params.append(
          "created_at_to",
          `${appliedFilters.created_at_to}T23:59:59Z`,
        );
      }
      if (appliedFilters.entity_type !== "") {
        params.append("entity_type", appliedFilters.entity_type);
      }
      if (appliedFilters.action !== "") {
        params.append("action", appliedFilters.action);
      }

      const response = await fetch(
        `${API_URL}/api/v1/admin/audit-logs?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Gagal mengambil data audit logs dari server.");
      }

      const data = await response.json();
      setLogs(data.items || []);
      setTotalPages(data.total_pages || 1);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogsFromBackend();
  }, [page, searchTerm, sortOrder, appliedFilters]);

  const handleSort = (columnKey) => {
    if (columnKey === "created_at") {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
      setPage(1);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setSearchTerm(searchInput);
    setPage(1);
  };

  const handleApplyFilter = () => {
    setAppliedFilters(filterInput);
    setPage(1);
  };

  const handleResetFilter = () => {
    const emptyFilter = {
      entity_type: "",
      action: "",
      created_at_from: "",
      created_at_to: "",
    };
    setFilterInput(emptyFilter);
    setAppliedFilters(emptyFilter);
    setPage(1);
  };

  const isFilterActive =
    appliedFilters.entity_type !== "" ||
    appliedFilters.action !== "" ||
    appliedFilters.created_at_from !== "" ||
    appliedFilters.created_at_to !== "";

  const tableHeaders = [
    { label: "No", key: "no", sortable: false },
    { label: "Actor ID", key: "actor_id", sortable: false },
    { label: "Entity Type", key: "entity_type", sortable: false },
    { label: "Entity ID", key: "entity_id", sortable: false },
    { label: "Action", key: "action", sortable: false },
    { label: "Created At", key: "created_at", sortable: true },
    {
      label: "Details",
      key: "action_detail",
      sortable: false,
      className: "text-center",
    },
  ];

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
    switch (actionType) {
      case "create":
        return "bg-green-50 text-green-600";
      case "update":
        return "bg-blue-50 text-blue-600";
      case "delete":
        return "bg-red-50 text-red-600";
      case "status_change":
        return "bg-yellow-50 text-yellow-600";
      case "handover":
        return "bg-purple-50 text-purple-600";
      default:
        return "bg-gray-50 text-gray-600";
    }
  };

  return (
    <AdminDashboardLayout user={user}>
      <div className="px-10 py-8 space-y-4 relative">
        <AdminSearchFilter
          searchValue={searchInput}
          onSearchChange={(e) => setSearchInput(e.target.value)}
          onSearchSubmit={handleSearchSubmit}
          searchPlaceholder="Search logs by exact Actor UUID..."
          filterTitle="Filter Audit Logs"
          isFilterActive={isFilterActive}
          onApplyFilter={handleApplyFilter}
          onResetFilter={handleResetFilter}
        >
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">
              Entity Type
            </label>
            <select
              value={filterInput.entity_type}
              onChange={(e) =>
                setFilterInput({ ...filterInput, entity_type: e.target.value })
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
              value={filterInput.action}
              onChange={(e) =>
                setFilterInput({ ...filterInput, action: e.target.value })
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
              value={filterInput.created_at_from}
              onChange={(e) =>
                setFilterInput({
                  ...filterInput,
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
              value={filterInput.created_at_to}
              onChange={(e) =>
                setFilterInput({
                  ...filterInput,
                  created_at_to: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-blue-500 text-gray-700"
            />
          </div>
        </AdminSearchFilter>

        <AdminTable
          headers={tableHeaders}
          isLoading={isLoading}
          sortBy="created_at"
          sortOrder={sortOrder}
          onSort={handleSort}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          isEmpty={logs.length === 0}
          emptyMessage="No audit logs found matching your filters."
        >
          {logs.map((row, index) => (
            <tr
              key={row.id}
              className="hover:bg-blue-50/30 transition-colors border-t border-gray-50"
              style={{ color: IPB_COLORS.blue.primary }}
            >
              <td className="px-6 py-3">{(page - 1) * limit + index + 1}</td>
              <td
                className="px-6 py-3 font-mono text-xs text-gray-500"
                title={row.actor_id}
              >
                {row.actor_id ? `${row.actor_id.substring(0, 8)}...` : "-"}
              </td>
              <td className="px-6 py-3 uppercase font-medium text-[12px] text-gray-700">
                {row.entity_type ? row.entity_type.replace("_", " ") : "-"}
              </td>
              <td
                className="px-6 py-3 font-mono text-xs text-gray-500"
                title={row.entity_id}
              >
                {row.entity_id ? `${row.entity_id.substring(0, 8)}...` : "-"}
              </td>
              <td className="px-6 py-3">
                <span
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md ${getActionBadgeColor(row.action)}`}
                >
                  {row.action ? row.action.replace("_", " ") : "UNKNOWN"}
                </span>
              </td>
              <td className="px-6 py-3 text-gray-600 whitespace-nowrap">
                {formatDateTime(row.created_at)}
              </td>
              <td className="px-6 py-3 flex justify-center space-x-2">
                <button
                  onClick={() => navigate(`/admin/audit-logs/${row.id}`)}
                  className="p-1.5 rounded-md hover:bg-blue-100 transition-colors"
                  title="View Log Details"
                >
                  <Eye size={18} style={{ color: IPB_COLORS.blue.primary }} />
                </button>
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>
    </AdminDashboardLayout>
  );
}
