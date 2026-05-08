import React, { useEffect } from "react";
import {
  X,
  TriangleAlert,
} from "lucide-react";
import { IPB_COLORS } from "../constants/colors";


export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Konfirmasi",
  message = "fr??",
  confirmText = "Confirm",
  cancelText = "Batal",
  loading = false,
}) {
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      
      {/* MODAL */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">

        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <TriangleAlert
              size={18}
              className="text-amber-500"
            />
            {title}
          </h3>

          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-4">
          <p className="text-sm leading-relaxed text-gray-800">
            {message}
          </p>
        </div>

        {/* ACTIONS */}
        <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            style={{ backgroundColor: IPB_COLORS.blue.primary }}
          >
            {loading
              ? "Memproses..."
              : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}