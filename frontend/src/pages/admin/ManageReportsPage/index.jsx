import React, { useCallback } from "react";
import { Eye, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminDashboardLayout from "../../../layouts/AdminDashboard";
import AdminTable from "../../../components/admin/Table";
import AdminSearchFilter from "../../../components/admin/SearchFilter";
import TabSelector from "../../../components/admin/TabSelector";
import StatusBadge from "../../../components/admin/StatusBadge";
import {
  FilterSelect,
  FilterDate,
  ActionBtn,
  formatDate,
} from "../../../components/admin/FilterHelpers";
import { adminFetch, buildParams } from "../../../utils/adminApi";
import { useAdminTable } from "../../../hooks/useAdminTable";
import { useState } from "react";

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
  { label: "Title", key: "title", sortable: true },
  { label: "Location", key: "location_name", sortable: false },
  { label: "Incident Date", key: "incident_date", sortable: true },
  { label: "Status", key: "report_status", sortable: false },
  { label: "Reporter", key: "reporter", sortable: false },
  { label: "Created At", key: "created_at", sortable: true },
  { label: "Action", key: "action", sortable: false, className: "text-center" },
];

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
      <div className="px-10 py-8 space-y-6">
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
          {table.items.map((row) => (
            <tr
              key={row.id}
              className="hover:bg-blue-50/30 transition-colors border-t border-gray-50"
            >
              <td className="px-6 py-4">
                <p
                  className="font-semibold text-gray-900 truncate max-w-[200px]"
                  title={row.title}
                >
                  {row.title}
                </p>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5 uppercase tracking-wide">
                  {row.id.slice(0, 8)}
                </p>
              </td>

              <td className="px-6 py-4">
                <span className="flex items-center gap-1.5 text-gray-600 text-sm">
                  <MapPin size={13} className="text-gray-400 shrink-0" />
                  <span className="truncate max-w-[140px]">
                    {row.location_name ?? "—"}
                  </span>
                </span>
              </td>

              <td className="px-6 py-4 text-gray-600 text-sm">
                {formatDate(row.incident_date)}
              </td>

              <td className="px-6 py-4">
                <StatusBadge variant={row.report_status} />
              </td>

              {activeTab === "found" && (
                <td className="px-6 py-4">
                  <StatusBadge variant={row.found_status} />
                </td>
              )}

              <td className="px-6 py-4">
                {row.reporter ? (
                  <div>
                    <p className="text-sm font-medium text-gray-800 truncate max-w-[140px]">
                      {row.reporter.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate max-w-[140px]">
                      {row.reporter.email}
                    </p>
                  </div>
                ) : (
                  <span className="text-gray-400 italic text-sm">Unknown</span>
                )}
              </td>

              <td className="px-6 py-4 text-gray-500 text-sm">
                {formatDate(row.created_at)}
              </td>

              <td className="px-6 py-4 flex justify-center">
                <ActionBtn
                  title="View Report Details"
                  icon={
                    <Eye
                      size={17}
                      className="text-blue-400 group-hover:text-blue-700"
                    />
                  }
                  onClick={() =>
                    navigate(`/admin/reports/${row.id}`, {
                      state: { reportType: row.report_type ?? activeTab },
                    })
                  }
                  hoverClass="hover:bg-blue-100"
                />
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>
    </AdminDashboardLayout>
  );
}
