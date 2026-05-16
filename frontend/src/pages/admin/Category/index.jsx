import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Check, Loader2 } from "lucide-react";
import AdminDashboardLayout from "../../../layouts/AdminDashboard";
import AdminTable from "../../../components/admin/Table";
import AdminSearchFilter from "../../../components/admin/SearchFilter";
import AdminModal from "../../../components/admin/AdminModal";
import StatusBadge from "../../../components/admin/StatusBadge";
import { FilterSelect } from "../../../components/admin/FilterHelpers";
import { adminFetch, buildParams } from "../../../utils/adminApi";
import { useAdminTable } from "../../../hooks/useAdminTable";
import { IPB_COLORS } from "../../../constants/colors";

const DEFAULT_FILTERS = { is_active: "" };

const TABLE_HEADERS = [
  { label: "#", key: "no", sortable: false, className: "w-16" },
  { label: "Category Name", key: "name", sortable: true },
  { label: "Status", key: "is_active", sortable: true },
];

async function fetchCategories({ searchTerm, sortBy, sortOrder, filters }) {
  const qs = buildParams({
    ...(searchTerm && { query: searchTerm }),
    ...(filters.is_active !== "" && { is_active: filters.is_active }),
  });
  const data = await adminFetch(`/api/v1/admin/categories?${qs}`);
  const items = Array.isArray(data) ? data : (data?.items ?? []);

  items.sort((a, b) => {
    let va = a[sortBy] ?? "";
    let vb = b[sortBy] ?? "";
    if (typeof va === "string") va = va.toLowerCase();
    if (typeof vb === "string") vb = vb.toLowerCase();
    if (va < vb) return sortOrder === "asc" ? -1 : 1;
    if (va > vb) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  return { items, total_pages: 1 };
}

export default function AdminManageCategoriesPage({ user }) {
  const navigate = useNavigate(); 
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const table = useAdminTable({
    fetchFn: useCallback(fetchCategories, []),
    defaultSort: "name",
    defaultOrder: "asc",
    defaultFilters: DEFAULT_FILTERS,
  });

  const openCreate = () => {
    setNameInput("");
    setModalError("");
    setIsAddModalOpen(true);
  };
  
  const closeModal = () => {
    setIsAddModalOpen(false);
    setModalError("");
  };

  const handleSave = async () => {
    if (!nameInput.trim()) return;
    setIsSubmitting(true);
    setModalError("");
    try {
      await adminFetch("/api/v1/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ name: nameInput }),
      });
      closeModal();
      table.refresh();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setIsSubmitting(false);
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
              searchPlaceholder="Search by name…"
              filterTitle="Filter Categories"
              isFilterActive={table.isFilterActive}
              onApplyFilter={table.handleApplyFilter}
              onResetFilter={table.handleResetFilter}
            >
              <FilterSelect
                label="Status"
                value={table.filterInput.is_active}
                onChange={(v) =>
                  table.setFilterInput({ ...table.filterInput, is_active: v })
                }
                options={[
                  { value: "true", label: "Active Only" },
                  { value: "false", label: "Inactive Only" },
                ]}
              />
            </AdminSearchFilter>
          </div>
          <button
            onClick={openCreate}
            className="px-5 rounded-2xl text-white font-bold shadow-sm flex items-center gap-2 hover:opacity-90 transition-opacity text-sm shrink-0"
            style={{ backgroundColor: IPB_COLORS.blue.primary }}
          >
            <Plus size={18} /> Create Category
          </button>
        </div>

        <AdminTable
          headers={TABLE_HEADERS}
          isLoading={table.isLoading}
          sortBy={table.sortBy}
          sortOrder={table.sortOrder}
          onSort={table.handleSort}
          isEmpty={table.items.length === 0}
          emptyMessage="No categories found."
        >
          {table.items.map((row, i) => (
            <tr
              key={row.id}
              onClick={() => navigate(`/admin/categories/${row.id}`)}
              className="hover:bg-blue-50/30 transition-colors border-t border-gray-50 cursor-pointer"
            >
              <td className="px-6 py-4 text-gray-400 font-medium text-sm">
                {i + 1}
              </td>
              <td className="px-6 py-4 font-semibold text-gray-900">
                {row.name}
              </td>
              <td className="px-6 py-4">
                <StatusBadge
                  variant={row.is_active ? "green" : "red"}
                  label={row.is_active ? "Active" : "Inactive"}
                />
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>

      <AdminModal
        isOpen={isAddModalOpen}
        onClose={closeModal}
        title="Create New Category"
        footer={
          <>
            <button
              onClick={closeModal}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting || !nameInput.trim()}
              className="px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              style={{ backgroundColor: IPB_COLORS.blue.primary }}
            >
              {isSubmitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Check size={15} />
              )}
              Save
            </button>
          </>
        }
      >
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Category Name
          </label>
          <input
            type="text"
            autoFocus
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="e.g. Electronics, Wallet, Keys…"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition"
          />
          {modalError && (
            <p className="text-xs text-red-500 font-medium pt-1">
              {modalError}
            </p>
          )}
        </div>
      </AdminModal>
    </AdminDashboardLayout>
  );
}