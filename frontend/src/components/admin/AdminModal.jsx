import React, { useEffect } from "react";
import { X } from "lucide-react";

export default function AdminModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = "max-w-sm",
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div
        className={`bg-white rounded-2xl shadow-xl w-full ${maxWidth} overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">{children}</div>

        {footer && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}