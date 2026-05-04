import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ADMIN_COLORS, IPB_COLORS } from "../../constants/colors";


export default function PageHeader({ title, onBack, children }) {
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => navigate(-1));

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={20} style={{ color: IPB_COLORS.blue.primary }} />
        </button>
        <h1 className="text-2xl font-bold" style={{ color: ADMIN_COLORS.headingText }}>
          {title}
        </h1>
      </div>
      {/* Optional right-side actions */}
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}