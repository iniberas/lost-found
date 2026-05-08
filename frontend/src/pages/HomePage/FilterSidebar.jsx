import React from "react";
import { Search, Filter, Calendar, MapPin } from "lucide-react";

const FilterSidebar = ({
  searchQuery,
  setSearchQuery,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  selectedCategory,
  setSelectedCategory,
  selectedStatuses,
  handleStatusChange,
  handleAllStatusChange,
  filterLocation,
  setIsMapModalOpen,
  handleApplyFilter,
  loading,
}) => {
  const statusOptions = [
    { value: "open", label: "Open" },
    { value: "resolved", label: "Selesai" },
    { value: "closed", label: "Ditutup" },
  ];

  const categories = ["Semua", "Elektronik", "Dokumen", "Pakaian", "Lain-lain"];

  return (
    <aside className="w-full lg:w-[340px] shrink-0">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6 sticky top-28">
        <div className="flex items-center gap-2 font-bold text-gray-900 border-b border-gray-50 pb-4 text-lg">
          <Filter size={20} className="text-[#0C0B89]" />
          <span>Filter Laporan</span>
        </div>

        {/* Filter Cari Barang */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Cari Barang
          </label>
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="KTM, Kunci, dll..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#0C0B89]/20 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleApplyFilter();
                }
              }}
            />
          </div>
        </div>

        {/* Filter Status Laporan */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Status Laporan
          </label>
          <div className="space-y-3">
            {/* Semua checkbox */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="w-5 h-5 accent-[#0C0B89] rounded"
                checked={selectedStatuses.length === statusOptions.length}
                onChange={handleAllStatusChange}
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 font-medium transition-colors">
                Semua
              </span>
            </label>

            {/* Individual status checkboxes */}
            {statusOptions.map((status) => (
              <label
                key={status.value}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-[#0C0B89] rounded"
                  checked={selectedStatuses.includes(status.value)}
                  onChange={() => handleStatusChange(status.value)}
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 font-medium transition-colors">
                  {status.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Filter Tanggal */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Waktu Kejadian
          </label>
          <div className="flex items-center gap-2 min-w-0">
          {/* Tanggal Awal */}
          <div className="relative w-full min-w-0">
            <Calendar
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="date"
              className="w-full min-w-0 pl-9 pr-2 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0C0B89]/20 transition-all text-gray-600"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Dari Tanggal"
            />
          </div>

          <span className="text-gray-400 font-bold shrink-0">-</span>

          {/* Tanggal Akhir */}
          <div className="relative w-full min-w-0">
            <Calendar
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="date"
              className="w-full min-w-0 pl-9 pr-2 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0C0B89]/20 transition-all text-gray-600"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="Sampai Tanggal"
            />
          </div>
        </div>
        </div>

        {/* Filter Lokasi Maps */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Area Lokasi
          </label>
          <div className="relative">
            <MapPin
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <button
              onClick={() => setIsMapModalOpen(true)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-left text-gray-500 hover:bg-gray-100 transition-all flex justify-between items-center group"
            >
              {/* Ubah teks jika lokasi sudah terpilih */}
              <span className="truncate">
                {filterLocation
                  ? `Terpilih: ${filterLocation.lat.toFixed(4)}, ${filterLocation.lng.toFixed(4)}`
                  : "Pilih Titik Peta"}
              </span>
              <span className="text-[10px] font-bold bg-[#0C0B89] text-white px-2 py-1 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity">
                Maps
              </span>
            </button>
          </div>
        </div>

        {/* Filter Kategori */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Kategori
          </label>
          <div className="space-y-3">
            {categories.map((cat) => (
              <label
                key={cat}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="radio"
                  name="category"
                  className="w-5 h-5 accent-[#0C0B89]"
                  checked={selectedCategory === cat}
                  onChange={() => setSelectedCategory(cat)}
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 font-medium transition-colors">
                  {cat}
                </span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleApplyFilter}
          disabled={loading}
          className="w-full py-3.5 mt-2 bg-[#0C0B89] text-white rounded-2xl font-bold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
        >
          Terapkan Filter
        </button>
      </div>
    </aside>
  );
};

export default FilterSidebar;
