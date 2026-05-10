import React, { useEffect } from "react";
import {
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  TriangleAlert,
} from "lucide-react";

export default function Toast({
  show,
  onClose,
  message,
  type = "info",
  duration = 4000,
}) {
  useEffect(() => {
    if (!show) return;

    const timer = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [show, duration, onClose]);

  if (!show) return null;

  const variants = {
    success: {
      icon: CheckCircle2,
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-700",
      iconColor: "text-green-600",
    },

    error: {
      icon: AlertCircle,
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      iconColor: "text-red-600",
    },

    warning: {
      icon: TriangleAlert,
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
      iconColor: "text-amber-600",
    },

    info: {
      icon: Info,
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      iconColor: "text-blue-600",
    },
  };

  const style = variants[type] || variants.info;
  const Icon = style.icon;

  return (
<div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-3 fade-in duration-300 w-[calc(100%-2rem)] sm:w-auto">      <div
        className={`
          min-w-[320px]
          max-w-[420px]
          rounded-2xl
          border
          shadow-xl
          backdrop-blur
          px-4
          py-3
          flex
          items-start
          gap-3
          ${style.bg}
          ${style.border}
        `}
      >
        <div className="pt-0.5 shrink-0">
          <Icon size={20} className={style.iconColor} />
        </div>

        <div className="flex-1">
          <p className={`text-sm font-semibold ${style.text}`}>
            {message}
          </p>
        </div>

        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}