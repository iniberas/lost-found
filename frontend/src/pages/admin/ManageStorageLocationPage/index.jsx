import React, { useState, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Check,
  Loader2,
  MapPin,
  ToggleRight,
} from "lucide-react";
import AdminDashboardLayout from "../../../layouts/AdminDashboard";
import AdminTable from "../../../components/admin/Table";
import AdminSearchFilter from "../../../components/admin/SearchFilter";
import AdminModal from "../../../components/admin/AdminModal";
import StatusBadge from "../../../components/admin/StatusBadge";
import { ActionBtn, formatDate } from "../../../components/admin/FilterHelpers";
import { adminFetch, buildParams } from "../../../utils/adminApi";
import { useAdminTable } from "../../../hooks/useAdminTable";
import { IPB_COLORS } from "../../../constants/colors";

const LIMIT = 20;

const TABLE_HEADERS = [
  { label: "#", key: "no", sortable: false, className: "w-16" },
  { label: "Name", key: "name", sortable: true },
  { label: "Description", key: "description", sortable: false },
  { label: "Coordinates", key: "coordinates", sortable: false },
  { label: "Status", key: "is_active", sortable: false },
  { label: "Created At", key: "created_at", sortable: true },
  {
    label: "Action",
    key: "action",
    sortable: false,
    className: "text-center w-32",
  },
];

const EMPTY_FORM = { name: "", description: "", latitude: "", longitude: "" };

const inputCls =
  "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 " +
  "focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition";

function fetchStorageLocations({ page, searchTerm, sortBy, sortOrder }) {
  const qs = buildParams({
    page,
    limit: LIMIT,
    sort_by: sortBy,
    sort_order: sortOrder,
    ...(searchTerm && { query: searchTerm }),
  });
  return adminFetch(`/api/v1/admin/storage-locations?${qs}`);
}

export default function AdminManageStorageLocationsPage({ user }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const table = useAdminTable({
    fetchFn: useCallback(fetchStorageLocations, []),
    defaultSort: "created_at",
    defaultOrder: "desc",
    defaultFilters: {},
  });

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setModalError("");
    setModal({ mode: "add" });
  };

  const openEdit = (loc) => {
    setForm({
      name: loc.name ?? "",
      description: loc.description ?? "",
      latitude: loc.location_point?.latitude ?? "",
      longitude: loc.location_point?.longitude ?? "",
    });
    setModalError("");
    setModal({ mode: "edit", location: loc });
  };

  const closeModal = () => {
    setModal(null);
    setModalError("");
  };
  const patch = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setIsSubmitting(true);
    setModalError("");

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      location_point:
        form.latitude !== "" && form.longitude !== ""
          ? {
              latitude: Number(form.latitude),
              longitude: Number(form.longitude),
            }
          : null,
    };

    try {
      if (modal.mode === "add") {
        await adminFetch("/api/v1/admin/storage-locations", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        await adminFetch(
          `/api/v1/admin/storage-locations/${modal.location.id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          },
        );
      }
      closeModal();
      table.refresh();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (loc) => {
    if (!window.confirm(`Deactivate "${loc.name}"?`)) return;
    try {
      await adminFetch(`/api/v1/admin/storage-locations/${loc.id}`, {
        method: "DELETE",
      });
      table.refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleActivate = async (loc) => {
    if (!window.confirm(`Activate "${loc.name}"?`)) return;
    try {
      await adminFetch(`/api/v1/admin/storage-locations/${loc.id}/activate`, {
        method: "POST",
      });
      table.refresh();
    } catch (err) {
      alert(err.message);
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
              searchPlaceholder="Search storage location name…"
              isFilterActive={false}
              onApplyFilter={() => {}}
              onResetFilter={table.handleResetFilter}
            />
          </div>
          <button
            onClick={openAdd}
            className="px-5 rounded-2xl text-white font-bold shadow-sm flex items-center gap-2 hover:opacity-90 transition-opacity text-sm shrink-0"
            style={{ backgroundColor: IPB_COLORS.blue.primary }}
          >
            <Plus size={18} /> Add Location
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
              className="hover:bg-blue-50/30 transition-colors border-t border-gray-50"
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
                  <span className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
                    <MapPin size={12} className="text-gray-400 shrink-0" />
                    {row.location_point.latitude.toFixed(5)},&nbsp;
                    {row.location_point.longitude.toFixed(5)}
                  </span>
                ) : (
                  <span className="text-gray-300 italic text-sm">—</span>
                )}
              </td>

              <td className="px-6 py-4">
                <StatusBadge
                  variant={row.is_active ? "active" : "deleted"}
                  label={row.is_active ? "Active" : "Inactive"}
                />
              </td>

              <td className="px-6 py-4 text-gray-500 text-sm">
                {formatDate(row.created_at)}
              </td>

              <td className="px-6 py-4">
                <div className="flex justify-center gap-1">
                  <ActionBtn
                    title="Edit"
                    icon={
                      <Edit
                        size={16}
                        className="text-blue-500 group-hover:text-blue-700"
                      />
                    }
                    onClick={() => openEdit(row)}
                    hoverClass="hover:bg-blue-100"
                  />
                  {row.is_active ? (
                    <ActionBtn
                      title="Deactivate"
                      icon={
                        <Trash2
                          size={16}
                          className="text-red-400 group-hover:text-red-600"
                        />
                      }
                      onClick={() => handleDeactivate(row)}
                      hoverClass="hover:bg-red-100"
                    />
                  ) : (
                    <ActionBtn
                      title="Activate"
                      icon={
                        <ToggleRight
                          size={16}
                          className="text-green-500 group-hover:text-green-700"
                        />
                      }
                      onClick={() => handleActivate(row)}
                      hoverClass="hover:bg-green-100"
                    />
                  )}
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>

      <AdminModal
        isOpen={!!modal}
        onClose={closeModal}
        title={
          modal?.mode === "add"
            ? "Add Storage Location"
            : "Edit Storage Location"
        }
        maxWidth="max-w-md"
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
              disabled={isSubmitting || !form.name.trim()}
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
        <FormField label="Location Name *">
          <input
            type="text"
            autoFocus
            value={form.name}
            onChange={patch("name")}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="e.g. FASILKOM Lost & Found Desk"
            className={inputCls}
          />
        </FormField>

        <FormField label="Description">
          <textarea
            rows={2}
            value={form.description}
            onChange={patch("description")}
            placeholder="Optional description…"
            className={`${inputCls} resize-none`}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Latitude">
            <input
              type="number"
              step="any"
              value={form.latitude}
              onChange={patch("latitude")}
              placeholder="-6.55944"
              className={inputCls}
            />
          </FormField>
          <FormField label="Longitude">
            <input
              type="number"
              step="any"
              value={form.longitude}
              onChange={patch("longitude")}
              placeholder="106.73417"
              className={inputCls}
            />
          </FormField>
        </div>

        {modalError && (
          <p className="text-xs text-red-500 font-medium">{modalError}</p>
        )}
      </AdminModal>
    </AdminDashboardLayout>
  );
}

function FormField({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}
