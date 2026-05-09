import React from "react";
import { Search, Filter, Calendar, MapPin } from "lucide-react";
import { IPB_COLORS } from "../../constants/colors";

const FilterSidebar = ({
  searchQuery,
  setSearchQuery,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  categories,
  selectedCategories,
  toggleCategory,
  handleAllCategories,
  filterLocation,
  setIsMapModalOpen,
  handleApplyFilter,
  loading,
}) => {
  return (
    <aside className="w-full min-w-0">
      <div className="w-full bg-white p-6 md:p-7 rounded-3xl border border-gray-200 shadow-sm lg:sticky lg:top-28 space-y-7 overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center gap-3 pb-5 border-b border-gray-100">
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100">
            <Filter
              size={18}
              className="text-blue-600"
            />
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-800">
              Filter Laporan
            </h2>

            <p className="text-xs text-gray-400 font-medium">
              Cari laporan sesuai kebutuhanmu
            </p>
          </div>
        </div>

        {/* SEARCH */}
        <div className="space-y-2.5">
          <label className="block text-[13px] font-bold text-gray-800">
            Cari Barang
          </label>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="KTM, Dompet, Kunci..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleApplyFilter();
                }
              }}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all shadow-sm"
            />
          </div>
        </div>

        {/* DATE */}
        <div className="space-y-2.5">
          <label className="block text-[13px] font-bold text-gray-800">
            Waktu Kejadian
          </label>

          <div className="flex flex-col gap-3">

            {/* START */}
            <div className="relative w-full">
              <p className="text-xs text-gray-400 font-medium mb-1">
                dari tanggal
              </p>
              <Calendar
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-9 pr-3 py-3 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>

            {/* END */}
            <div className="relative w-full">
              <p className="text-xs text-gray-400 font-medium mb-1">
                sampai tanggal
              </p>
              <Calendar
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-9 pr-3 py-3 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* LOCATION */}
        <div className="space-y-2.5">
          <label className="block text-[13px] font-bold text-gray-800">
            Area Lokasi
          </label>

          <button
            onClick={() => setIsMapModalOpen(true)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all shadow-sm group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-red-50 border border-red-100 shrink-0">
                <MapPin
                  size={16}
                  className="text-red-500"
                />
              </div>

              <div className="text-left min-w-0">
                <p className="text-sm font-semibold text-gray-700 truncate">
                  {filterLocation
                    ? "Lokasi Dipilih"
                    : "Pilih Titik Lokasi"}
                </p>

                <p className="text-[11px] text-gray-400 truncate">
                  {filterLocation
                    ? `${filterLocation.lat.toFixed(4)}, ${filterLocation.lng.toFixed(4)}`
                    : "Klik untuk membuka"}
                </p>
              </div>
            </div>

            <span className="text-[10px] font-bold bg-[#0C0B89] text-white px-2 py-1 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
              Maps
            </span>
          </button>
        </div>

        {/* CATEGORY */}
        <div className="space-y-3">
          <label className="block text-[13px] font-bold text-gray-800">
            Kategori
          </label>

          <div className="flex flex-wrap gap-2">

            {/* Semua */}
            <button
              type="button"
              onClick={handleAllCategories}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm ${selectedCategories.length === 0
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
            >
              Semua
            </button>
            {categories.map((cat) => {
              const isSelected = selectedCategories.includes(cat.id);

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm ${isSelected
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  {cat.name}
                </button>
              );
            })}

            {categories.length === 0 && (
              <p className="text-xs text-gray-400 italic py-1">
                Memuat kategori...
              </p>
            )}
          </div>
        </div>

        {/* APPLY BUTTON */}
        <div className="pt-2">
          <button
            onClick={handleApplyFilter}
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{
              backgroundColor: IPB_COLORS.blue.primary,
            }}
          >
            {loading
              ? "Memuat Laporan..."
              : "Terapkan Filter"}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;