import React, { useState, useEffect, useRef } from "react";
import { Search, Filter, X } from "lucide-react";
import { IPB_COLORS } from "../../constants/colors";

export default function AdminSearchFilter({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = "Type to search...",
  isFilterActive = false,
  onApplyFilter,
  onResetFilter,
  filterTitle = "Filter Options",
  children,
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleApply = () => {
    if (onApplyFilter) onApplyFilter();
    setIsFilterOpen(false);
  };

  const handleReset = () => {
    if (onResetFilter) onResetFilter();
    setIsFilterOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-3 items-center relative">
      <form onSubmit={onSearchSubmit} className="flex-1 relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110"
          style={{ color: IPB_COLORS.blue.primary }}
          size={18}
          onClick={onSearchSubmit}
        />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={onSearchChange}
          className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:border-transparent text-sm font-medium transition-all"
          style={{
            color: IPB_COLORS.blue.primary,
            caretColor: IPB_COLORS.blue.primary,
          }}
        />
      </form>

      <div className="relative" ref={filterRef}>
        <button
          type="button"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`p-3 border rounded-xl transition-colors flex items-center justify-center gap-2 ${
            isFilterOpen || isFilterActive
              ? "bg-blue-50 border-blue-200 text-blue-600"
              : "border-gray-200 hover:bg-gray-50 text-gray-500"
          }`}
          title="Filter Data"
        >
          <Filter
            size={18}
            style={{
              color:
                isFilterOpen || isFilterActive
                  ? IPB_COLORS.blue.primary
                  : undefined,
            }}
          />
        </button>

        {isFilterOpen && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-5 z-50 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-2">
              <h3 className="font-bold text-gray-800">{filterTitle}</h3>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">{children}</div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 px-4 py-2 bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-semibold transition-colors"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 px-4 py-2 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm hover:opacity-90"
                style={{ backgroundColor: IPB_COLORS.blue.primary }}
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
