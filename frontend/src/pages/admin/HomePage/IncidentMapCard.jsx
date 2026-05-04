import React from "react";
import { MapPin } from "lucide-react";

const MapPinDot = ({ top, left, type, label }) => {
  const isLost = type === "lost";
  const colorClass = isLost ? "bg-red-500" : "bg-blue-500";
  const shadowClass = isLost ? "shadow-red-500/50" : "shadow-blue-500/50";

  return (
    <div className="absolute group cursor-pointer" style={{ top, left }}>
      
      <div className={`absolute -inset-1.5 ${colorClass} rounded-full opacity-40 animate-ping`}></div>
      
      <div className={`relative w-3 h-3 ${colorClass} rounded-full border-2 border-white shadow-lg ${shadowClass}`}></div>
      
      
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        <span className={isLost ? "text-red-400" : "text-blue-400"}>
          {isLost ? "LOST:" : "FOUND:"}
        </span>{" "}
        {label}
        
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
};

const IncidentMapCard = () => {
  
  const mapData = [
    { id: 1, type: "lost", label: "Dompet Kulit (CCR)", top: "35%", left: "42%" },
    { id: 2, type: "lost", label: "Kunci Motor (GWW)", top: "60%", left: "65%" },
    { id: 3, type: "found", label: "KTM IPB (LSI)", top: "45%", left: "75%" },
    { id: 4, type: "lost", label: "Laptop Asus (Faperta)", top: "25%", left: "20%" },
    { id: 5, type: "found", label: "Jam Tangan (Fapet)", top: "75%", left: "30%" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 z-10">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <MapPin size={18} className="text-gray-400" /> Live Incident Map (This Week)
        </h3>
        <div className="flex gap-3 text-xs font-semibold text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Lost</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Found</span>
        </div>
      </div>

      
      <div className="flex-grow relative bg-gray-50 rounded-xl border border-gray-200 overflow-hidden min-h-[300px]">
        
        <div 
          className="absolute inset-0 opacity-20" 
          style={{ 
            backgroundImage: "radial-gradient(#94a3b8 2px, transparent 2px)", 
            backgroundSize: "24px 24px" 
          }}
        ></div>
        
        
        {mapData.map((data) => (
          <MapPinDot key={data.id} top={data.top} left={data.left} type={data.type} label={data.label} />
        ))}
      </div>
    </div>
  );
};

export default IncidentMapCard;