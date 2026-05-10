import React from "react";
import {
  X,
  MessageSquareText,
  Send,
} from "lucide-react";

const ContactRequestModal = ({
  isOpen,
  onClose,
  submitting,
  message,
  setMessage,
  handleSubmit,
  isFound,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <MessageSquareText
              size={18}
              className="text-blue-600"
            />

            {isFound
              ? "Request Contact"
              : "Saya Menemukan Barang Ini"}
          </h3>

          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Pesan
            </label>

            <textarea
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={
                isFound
                  ? "Halo, saya ingin menghubungi Anda terkait barang temuan ini..."
                  : "Halo, saya rasa saya menemukan barang Anda..."
              }
              maxLength={1000}
            />

            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-400">
                Jelaskan detail yang relevan dengan sopan.
              </p>

              <span className="text-xs text-gray-400">
                {message.length}/1000
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
            <p className="text-sm text-blue-800 leading-relaxed">
              Setelah request dikirim dan disetujui,
              kontak akan dapat dibagikan untuk
              membantu proses pengembalian barang.
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-100 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={
              submitting ||
              message.trim().length === 0
            }
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition"
          >
            <Send size={15} />

            {submitting
              ? "Sending..."
              : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactRequestModal;