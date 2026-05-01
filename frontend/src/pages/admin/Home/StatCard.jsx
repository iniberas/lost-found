import React from "react";

const StatCard = ({ label, value }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex flex-col items-center gap-1 min-w-[140px] flex-1">
      <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
        {value}
      </span>
      <span className="text-xs font-medium text-gray-400 text-center">
        {label}
      </span>
    </div>
  );
};

export default StatCard;