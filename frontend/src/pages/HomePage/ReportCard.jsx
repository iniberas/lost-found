import React from "react";
import { MapPin } from "lucide-react";

const ReportCard = ({ item, onClick }) => {
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col h-full font-poppins cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-48 bg-gray-200">
        {item.photos && item.photos.length > 0 ? (
          <img
            src={item.photos[0]}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium bg-gray-100">
            No Image
          </div>
        )}
      </div>

      <div className="p-5 space-y-2 flex-grow">
        <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-1">
          {item.title}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        <div className="flex items-center gap-2 text-xs text-gray-400 pt-2">
          <MapPin size={14} />
          <span>{item.location_name || "Lokasi tidak disebutkan"}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 pt-2">
          <span>{item.report_status}</span>
        </div>
      </div>

      <div className="p-5 pt-0 mt-auto">
        <button className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-[#0C0B89] text-sm font-bold rounded-xl transition-colors border border-gray-200">
          Lihat Detail
        </button>
      </div>
    </div>
  );
};

export default ReportCard;
