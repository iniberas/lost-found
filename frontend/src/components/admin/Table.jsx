import React from "react";
import { ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import { IPB_COLORS, ADMIN_COLORS } from "../../constants/colors";

export default function AdminTable({
  headers, // [{ label: "Name", key: "name", sortable: true }, ...]
  isLoading,
  sortBy,
  sortOrder,
  onSort,
  page,
  totalPages,
  onPageChange,
  isEmpty,
  emptyMessage = "No data found.",
  children,
}) {
  const handleHeaderClick = (header) => {
    if (header.sortable && onSort) {
      onSort(header.key);
    }
  };

  const SortIcon = ({ columnKey }) => {
    if (sortBy !== columnKey) {
      return <ArrowUpDown size={14} className="text-gray-400 opacity-50 ml-1 inline" />;
    }
    return sortOrder === "asc" ? (
      <ChevronUp size={14} className="ml-1 inline text-blue-600" />
    ) : (
      <ChevronDown size={14} className="ml-1 inline text-blue-600" />
    );
  };

  return (
    <div className="space-y-4">
      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: IPB_COLORS.blue.primary }}></div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/50" style={{ color: IPB_COLORS.blue[400] }}>
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className={`px-6 py-4 font-medium ${
                      header.sortable ? "cursor-pointer hover:bg-gray-100 transition-colors select-none" : ""
                    } ${header.className || ""}`}
                    onClick={() => handleHeaderClick(header)}
                  >
                    {header.label} {header.sortable && <SortIcon columnKey={header.key} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isEmpty ? (
                <tr>
                  <td colSpan={headers.length} className="px-6 py-8 text-center text-gray-400">
                    {!isLoading && emptyMessage}
                  </td>
                </tr>
              ) : (
                children // Ini adalah baris-baris <tr> yang akan kita isi dari halaman utama
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION BAR */}
      {totalPages > 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex justify-end">
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNumber = i + 1;
              const isActive = page === pageNumber;
              return (
                <button
                  key={pageNumber}
                  onClick={() => onPageChange(pageNumber)}
                  className={`w-8 h-8 flex shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors`}
                  style={{
                    backgroundColor: isActive ? IPB_COLORS.blue.primary : "transparent",
                    color: isActive ? ADMIN_COLORS.white : IPB_COLORS.blue[400],
                  }}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}