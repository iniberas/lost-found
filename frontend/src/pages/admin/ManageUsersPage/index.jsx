import React from "react";
import { Eye, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminDashboardLayout from "../../../layouts/AdminDashboard";
import AdminTable from "../../../components/admin/Table";
import AdminSearchFilter from "../../../components/admin/SearchFilter";
import StatusBadge from "../../../components/admin/StatusBadge";
import {
  FilterSelect,
  FilterDate,
  ActionBtn,
  formatDate,
} from "../../../components/admin/FilterHelpers";
import { IPB_COLORS } from "../../../constants/colors";
import { adminFetch, buildParams } from "../../../utils/adminApi";
import { useAdminTable } from "../../../hooks/useAdminTable";

const LIMIT = 15;

const DEFAULT_FILTERS = {
  role: "",
  is_deleted: "",
  created_at_from: "",
  created_at_to: "",
};

const TABLE_HEADERS = [
  { label: "#", key: "no", sortable: false, className: "w-16" },
  { label: "Name", key: "name", sortable: true },
  { label: "Email", key: "email", sortable: true },
  { label: "Phone", key: "phone_number", sortable: false },
  { label: "Role", key: "role", sortable: true },
  { label: "Joined", key: "created_at", sortable: true },
  { label: "Status", key: "deleted_at", sortable: false },
  { label: "Action", key: "action", sortable: false, className: "text-center" },
];

function fetchUsers({ page, searchTerm, sortBy, sortOrder, filters }) {
  const qs = buildParams({
    page,
    limit: LIMIT,
    sort_by: sortBy,
    sort_order: sortOrder,
    ...(searchTerm && { query: searchTerm }),
    ...(filters.role && { role: filters.role }),
    ...(filters.is_deleted !== "" && { is_deleted: filters.is_deleted }),
    ...(filters.created_at_from && {
      created_at_from: `${filters.created_at_from}T00:00:00Z`,
    }),
    ...(filters.created_at_to && {
      created_at_to: `${filters.created_at_to}T23:59:59Z`,
    }),
  });
  return adminFetch(`/api/v1/admin/users?${qs}`);
}

export default function AdminManageUsersPage({ user }) {
  const navigate = useNavigate();

  const table = useAdminTable({
    fetchFn: fetchUsers,
    defaultSort: "created_at",
    defaultOrder: "desc",
    defaultFilters: DEFAULT_FILTERS,
  });

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Delete user "${userName}"? This cannot be undone.`))
      return;
    try {
      await adminFetch(`/api/v1/admin/users/${userId}`, { method: "DELETE" });
      table.refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <AdminDashboardLayout user={user}>
      <div className="px-10 py-8 space-y-4">
        <AdminSearchFilter
          searchValue={table.searchInput}
          onSearchChange={(e) => table.setSearchInput(e.target.value)}
          onSearchSubmit={table.handleSearchSubmit}
          searchPlaceholder="Search by name or email…"
          filterTitle="Filter Users"
          isFilterActive={table.isFilterActive}
          onApplyFilter={table.handleApplyFilter}
          onResetFilter={table.handleResetFilter}
        >
          <FilterSelect
            label="Role"
            value={table.filterInput.role}
            onChange={(v) =>
              table.setFilterInput({ ...table.filterInput, role: v })
            }
            options={[
              { value: "user", label: "User" },
              { value: "admin", label: "Admin" },
              { value: "superadmin", label: "Superadmin" },
            ]}
          />
          <FilterSelect
            label="Account Status"
            value={table.filterInput.is_deleted}
            onChange={(v) =>
              table.setFilterInput({ ...table.filterInput, is_deleted: v })
            }
            options={[
              { value: "false", label: "Active" },
              { value: "true", label: "Deleted" },
            ]}
          />
          <FilterDate
            label="Joined From"
            value={table.filterInput.created_at_from}
            onChange={(v) =>
              table.setFilterInput({ ...table.filterInput, created_at_from: v })
            }
          />
          <FilterDate
            label="Joined Until"
            value={table.filterInput.created_at_to}
            onChange={(v) =>
              table.setFilterInput({ ...table.filterInput, created_at_to: v })
            }
          />
        </AdminSearchFilter>

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
          emptyMessage="No users found matching your search / filters."
        >
          {table.items.map((row, i) => (
            <tr
              key={row.id}
              className="hover:bg-blue-50/30 transition-colors border-t border-gray-50"
            >
              <td className="px-6 py-3 text-gray-400 font-medium text-sm">
                {(table.page - 1) * LIMIT + i + 1}
              </td>
              <td className="px-6 py-3 font-semibold text-gray-900">
                {row.name}
              </td>
              <td className="px-6 py-3 text-gray-600">{row.email}</td>
              <td className="px-6 py-3 text-gray-600">
                {row.phone_number || "—"}
              </td>
              <td className="px-6 py-3">
                <StatusBadge variant={row.role} />
              </td>
              <td className="px-6 py-3 text-gray-500 text-sm">
                {formatDate(row.created_at)}
              </td>
              <td className="px-6 py-3">
                <StatusBadge variant={row.deleted_at ? "deleted" : "active"} />
              </td>
              <td className="px-6 py-3">
                <div className="flex justify-center gap-1">
                  <ActionBtn
                    title="View Details"
                    icon={
                      <Eye
                        size={17}
                        className="text-blue-500 group-hover:text-blue-700"
                      />
                    }
                    onClick={() => navigate(`/admin/users/${row.id}`)}
                    hoverClass="hover:bg-blue-100"
                  />
                  {!row.deleted_at && (
                    <ActionBtn
                      title="Delete User"
                      icon={
                        <Trash2
                          size={17}
                          className="text-red-400 group-hover:text-red-600"
                        />
                      }
                      onClick={() => handleDelete(row.id, row.name)}
                      hoverClass="hover:bg-red-100"
                    />
                  )}
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>
    </AdminDashboardLayout>
  );
}
