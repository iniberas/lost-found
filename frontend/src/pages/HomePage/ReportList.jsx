import React from "react";
import { useNavigate } from "react-router-dom";
import { PackageOpen, Loader2 } from "lucide-react";
import ReportCard from "./ReportCard";

const ReportList = ({ 
  items, 
  loading, 
  activeTab, 
  searchQuery 
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <Loader2 size={48} className="text-[#0C0B89] animate-spin mb-4" />
        <p className="text-sm text-gray-500">Memuat data...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <PackageOpen
          size={64}
          strokeWidth={1.5}
          className="text-gray-300 mb-4"
        />
        <h3 className="text-xl font-bold text-gray-800 mb-1">
          Belum ada laporan
        </h3>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          Saat ini belum ada barang yang dilaporkan{" "}
          {activeTab === "lost" ? "hilang" : "ditemukan"}. Jadilah orang
          pertama yang melapor jika kamu membutuhkannya!
          {searchQuery &&
            " Coba ubah kata kunci pencarian atau filter yang digunakan."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {items.map((item) => (
        <ReportCard
          key={item.id}
          item={item}
          onClick={() =>
            navigate(`/report/${item.id}?type=${item.report_type}`)
          }
        />
      ))}
    </div>
  );
};

export default ReportList;
