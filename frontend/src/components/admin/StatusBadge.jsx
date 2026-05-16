import React from "react";

const COLOR_VARIANTS = {
  green: "bg-green-100 text-green-600",
  red: "bg-red-100 text-red-600",
  gray: "bg-gray-100 text-gray-600",
  blue: "bg-blue-100 text-blue-600",
  purple: "bg-purple-100 text-purple-600",
  yellow: "bg-yellow-100 text-yellow-600",
  amber: "bg-amber-100 text-amber-600",
  orange: "bg-orange-100 text-orange-600",
  emerald: "bg-emerald-100 text-emerald-600",
};

export default function StatusBadge({
  variant = "gray",
  label,
  children,
  className = "",
}) {
  const key = variant?.toLowerCase().trim();
  const style = COLOR_VARIANTS[key] || COLOR_VARIANTS.gray;

  const text = label || children || "UNKNOWN";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide rounded-md ${style} ${className}`}
    >
      {text}
    </span>
  );
}
