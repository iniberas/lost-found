import React from "react";

export function FilterSelect({ label, value, onChange, options, allLabel = "All" }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-blue-500 text-gray-700"
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FilterDate({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-blue-500 text-gray-700"
      />
    </div>
  );
}

export function ActionBtn({ title, icon, onClick, hoverClass = "hover:bg-gray-100" }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded-md transition-colors group ${hoverClass}`}
    >
      {icon}
    </button>
  );
}

export function formatDate(dateString, includeTime = false) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(includeTime && { hour: "2-digit", minute: "2-digit" }),
  });
}