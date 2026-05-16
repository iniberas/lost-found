import React, { useCallback, useState } from "react";
import { MapPin, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminDashboardLayout from "../../../layouts/AdminDashboard";
import AdminTable from "../../../components/admin/Table";
import AdminSearchFilter from "../../../components/admin/SearchFilter";
import TabSelector from "../../../components/admin/TabSelector";
import StatusBadge from "../../../components/admin/StatusBadge";
import {
  FilterSelect,
  FilterDate,
  formatDate,
} from "../../../components/admin/FilterHelpers";
import { adminFetch, buildParams } from "../../../utils/adminApi";
import { useAdminTable } from "../../../hooks/useAdminTable";

const LIMIT = 15;

const TABS = [
  { id: "lost", label: "Lost Reports" },
  { id: "found", label: "Found Reports" },
];

const DEFAULT_FILTERS = {
  report_status: "",
  found_status: "",
  incident_date_from: "",
  incident_date_to: "",
};

const BASE_HEADERS = [
  { label: "#", key: "no", sortable: false, className: "w-16" },
  { label: "Title", key: "title", sortable: true },
  { label: "Location", key: "location_name", sortable: false },
  { label: "Incident Date", key: "incident_date", sortable: true },
  { label: "Status", key: "report_status", sortable: false },
  { label: "Reporter", key: "reporter", sortable: false },
  { label: "Created At", key: "created_at", sortable: true },
];

const getReportStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "open":
      return "green";
    case "resolved":
      return "blue";
    case "closed":
      return "gray";
    default:
      return "gray";
  }
};

const getFoundStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "held_by_finder":
      return "amber";
    case "held_by_admin":
      return "purple";
    case "returned_to_owner":
      return "emerald";
    default:
      return "gray";
  }
};

const formatStatusLabel = (status) => {
  if (!status) return "UNKNOWN";
  return status.replace(/_/g, " ");
};

export default function AdminManageReportsPage({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("lost");

  const fetchFn = useCallback(
    ({ page, searchTerm, sortBy, sortOrder, filters }) => {
      const qs = buildParams({
        page,
        limit: LIMIT,
        sort_by: sortBy,
        sort_order: sortOrder,
        ...(searchTerm && { query: searchTerm }),
        ...(filters.report_status && { report_status: filters.report_status }),
        ...(filters.incident_date_from && {
          incident_date_from: `${filters.incident_date_from}T00:00:00Z`,
        }),
        ...(filters.incident_date_to && {
          incident_date_to: `${filters.incident_date_to}T23:59:59Z`,
        }),
        ...(activeTab === "found" &&
          filters.found_status && {
            found_status: filters.found_status,
          }),
      });
      const endpoint =
        activeTab === "lost"
          ? "/api/v1/admin/reports/lost-reports"
          : "/api/v1/admin/reports/found-reports";
      return adminFetch(`${endpoint}?${qs}`);
    },
    [activeTab],
  );

  const table = useAdminTable({
    fetchFn,
    defaultSort: "created_at",
    defaultOrder: "desc",
    defaultFilters: DEFAULT_FILTERS,
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    table.handleResetFilter();
  };

  const handleOpenLink = (e, url) => {
    e.stopPropagation();
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleOpenMap = (e, row) => {
    e.stopPropagation();
    if (!row.location_name) return;

    const query =
      row.latitude && row.longitude
        ? `${row.latitude},${row.longitude}`
        : row.location_name;

    window.open(
      `https://maps.google.com/?q=${encodeURIComponent(query)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const tableHeaders =
    activeTab === "found"
      ? [
          ...BASE_HEADERS.slice(0, 4),
          { label: "Found Status", key: "found_status", sortable: false },
          ...BASE_HEADERS.slice(4),
        ]
      : BASE_HEADERS;

  return (
    <AdminDashboardLayout user={user}>
      <div className="px-10 py-8 space-y-5">
        <div className="flex flex-col md:flex-row gap-4 items-stretch">
          <div className="flex-1 min-w-0">
            <AdminSearchFilter
              searchValue={table.searchInput}
              onSearchChange={(e) => table.setSearchInput(e.target.value)}
              onSearchSubmit={table.handleSearchSubmit}
              searchPlaceholder={`Search ${activeTab} reports by title or description…`}
              filterTitle="Filter Reports"
              isFilterActive={table.isFilterActive}
              onApplyFilter={table.handleApplyFilter}
              onResetFilter={table.handleResetFilter}
            >
              <FilterSelect
                label="Report Status"
                value={table.filterInput.report_status}
                onChange={(v) =>
                  table.setFilterInput({
                    ...table.filterInput,
                    report_status: v,
                  })
                }
                options={[
                  { value: "open", label: "Open / Unresolved" },
                  { value: "resolved", label: "Resolved" },
                  { value: "closed", label: "Closed" },
                ]}
              />
              {activeTab === "found" && (
                <FilterSelect
                  label="Found Status"
                  value={table.filterInput.found_status}
                  onChange={(v) =>
                    table.setFilterInput({
                      ...table.filterInput,
                      found_status: v,
                    })
                  }
                  options={[
                    { value: "held_by_finder", label: "Held by Finder" },
                    { value: "held_by_admin", label: "Held by Admin" },
                    { value: "returned_to_owner", label: "Returned to Owner" },
                  ]}
                />
              )}
              <FilterDate
                label="Incident Date From"
                value={table.filterInput.incident_date_from}
                onChange={(v) =>
                  table.setFilterInput({
                    ...table.filterInput,
                    incident_date_from: v,
                  })
                }
              />
              <FilterDate
                label="Incident Date To"
                value={table.filterInput.incident_date_to}
                onChange={(v) =>
                  table.setFilterInput({
                    ...table.filterInput,
                    incident_date_to: v,
                  })
                }
              />
            </AdminSearchFilter>
          </div>

          <TabSelector
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>

        <AdminTable
          headers={tableHeaders}
          isLoading={table.isLoading}
          sortBy={table.sortBy}
          sortOrder={table.sortOrder}
          onSort={table.handleSort}
          page={table.page}
          totalPages={table.totalPages}
          onPageChange={table.setPage}
          isEmpty={table.items.length === 0}
          emptyMessage={`No ${activeTab} reports found.`}
        >
          {table.items.map((row, i) => (
            <tr
              key={row.id}
              onClick={() =>
                navigate(`/admin/reports/${row.id}`, {
                  state: { reportType: row.report_type ?? activeTab },
                })
              }
              className="hover:bg-blue-50/30 transition-colors border-t border-gray-50 cursor-pointer"
            >
              <td className="px-6 py-4 text-gray-400 font-medium text-sm">
                {(table.page - 1) * LIMIT + i + 1}
              </td>
              <td className="px-6 py-4 font-semibold text-gray-900">
                {row.title}
              </td>

              <td className="px-6 py-4">
                {row.location_point ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${row.location_point.latitude},${row.location_point.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors group/mapbtn"
                    title={`${row.location_point.latitude}, ${row.location_point.longitude}`}
                  >
                    <MapPin
                      size={14}
                      className="shrink-0 group-hover/mapbtn:animate-bounce"
                    />
                    <span className="text-xs font-semibold whitespace-nowrap">
                      View Map
                    </span>
                  </a>
                ) : (
                  <span className="text-gray-400 italic text-sm">—</span>
                )}
              </td>

              <td className="px-6 py-4 text-gray-600 text-sm">
                {formatDate(row.incident_date)}
              </td>

              <td className="px-6 py-4">
                <StatusBadge
                  variant={getReportStatusColor(row.report_status)}
                  label={formatStatusLabel(row.report_status)}
                />
              </td>

              {activeTab === "found" && (
                <td className="px-6 py-4">
                  <StatusBadge
                    variant={getFoundStatusColor(row.found_status)}
                    label={formatStatusLabel(row.found_status)}
                  />
                </td>
              )}

              <td className="px-6 py-4">
                {row.reporter ? (
                  <button
                    onClick={(e) =>
                      handleOpenLink(e, `/admin/users/${row.reporter.id}`)
                    }
                    title={row.reporter.email}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold hover:bg-blue-200 transition-colors focus:outline-none text-left"
                  >
                    <ExternalLink size={14} className="shrink-0" />
                    <span className="truncate max-w-[120px]">
                      {row.reporter.name}
                    </span>
                  </button>
                ) : (
                  <span className="text-gray-400 italic text-sm">Unknown</span>
                )}
              </td>

              <td className="px-6 py-4 text-gray-500 text-sm">
                {formatDate(row.created_at)}
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>
    </AdminDashboardLayout>
  );
}
