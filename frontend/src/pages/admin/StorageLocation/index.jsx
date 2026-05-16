import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MapPin } from "lucide-react";
import AdminDashboardLayout from "../../../layouts/AdminDashboard";
import AdminTable from "../../../components/admin/Table";
import AdminSearchFilter from "../../../components/admin/SearchFilter";
import StatusBadge from "../../../components/admin/StatusBadge";
import { formatDate } from "../../../components/admin/FilterHelpers";
import { adminFetch, buildParams } from "../../../utils/adminApi";
import { useAdminTable } from "../../../hooks/useAdminTable";
import { IPB_COLORS } from "../../../constants/colors";
import CreateStorageLocationModal from "./CreateStorageLocationModal";
import Toast from "../../../components/Toast";

const LIMIT = 20;

const TABLE_HEADERS = [
  { label: "#", key: "no", sortable: false, className: "w-16" },
  { label: "Name", key: "name", sortable: true },
  { label: "Description", key: "description", sortable: false },
  { label: "Location", key: "coordinates", sortable: false },
  { label: "Status", key: "is_active", sortable: false },
  { label: "Created At", key: "created_at", sortable: true },
];

function fetchStorageLocations({
  page,
  searchTerm,
  sortBy,
  sortOrder,
  filters,
}) {
  const qs = buildParams({
    page,
    limit: LIMIT,
    sort_by: sortBy,
    sort_order: sortOrder,
    ...(searchTerm && { query: searchTerm }),
    ...(filters || {}),
  });

  return adminFetch(`/api/v1/admin/storage-locations?${qs}`);
}

export default function AdminManageStorageLocationsPage({ user }) {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info",
  });

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
  };

  const table = useAdminTable({
    fetchFn: fetchStorageLocations,
    defaultSort: "created_at",
    defaultOrder: "desc",
    defaultFilters: { is_active: "" },
  });

  return (
    <AdminDashboardLayout user={user}>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

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
              searchPlaceholder="Search storage location name…"
              filterTitle="Filter Storage Location"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">
                  Status
                </label>
                <select
                  value={table.filterInput.is_active}
                  onChange={(e) =>
                    table.setFilterInput({
                      ...table.filterInput,
                      is_active: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-blue-500 uppercase"
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </AdminSearchFilter>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 rounded-2xl text-white font-bold shadow-sm flex items-center gap-2 hover:opacity-90 transition-opacity text-sm shrink-0"
            style={{ backgroundColor: IPB_COLORS.blue.primary }}
          >
            <Plus size={18} /> Create Location
          </button>
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
          emptyMessage="No storage locations found."
        >
          {table.items.map((row, i) => (
            <tr
              key={row.id}
              onClick={() => navigate(`/admin/storage-locations/${row.id}`)}
              className="hover:bg-blue-50/30 transition-colors border-t border-gray-50 cursor-pointer"
            >
              <td className="px-6 py-4 text-gray-400 font-medium text-sm">
                {(table.page - 1) * LIMIT + i + 1}
              </td>

              <td className="px-6 py-4 font-semibold text-gray-900">
                {row.name}
              </td>

              <td className="px-6 py-4">
                <p
                  className="text-sm text-gray-500 max-w-[200px] truncate"
                  title={row.description}
                >
                  {row.description || (
                    <span className="italic text-gray-300">—</span>
                  )}
                </p>
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
                  <span className="text-gray-300 italic text-sm">—</span>
                )}
              </td>

              <td className="px-6 py-4">
                <StatusBadge
                  variant={row.is_active ? "green" : "red"}
                  label={row.is_active ? "Active" : "Inactive"}
                />
              </td>

              <td className="px-6 py-4 text-gray-500 text-sm">
                {formatDate(row.created_at)}
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>

      <CreateStorageLocationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => table.refresh()}
        showToast={showToast}
      />
    </AdminDashboardLayout>
  );
}
