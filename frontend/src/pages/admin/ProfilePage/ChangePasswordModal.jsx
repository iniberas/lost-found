import React, { useState } from "react";

import {
  X,
  Lock,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";

import { IPB_COLORS } from "../../../constants/colors";

export default function ChangePasswordModal({
  isOpen,
  onClose,
  submitting,
  handleSubmit,
}) {
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] =
    useState(false);

  const emptyForm = {
    old_password: "",
    new_password: "",
    confirm_password: "",
  };

  const [form, setForm] = useState(emptyForm);

  const handleClose = () => {
    setForm(emptyForm);
    onClose();
  };

  if (!isOpen) return null;

  const passwordsMatch =
    form.new_password ===
    form.confirm_password;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            Change Password
          </h3>

          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-5">
          <PasswordInput
            label="Old Password"
            value={form.old_password}
            onChange={(v) =>
              setForm((prev) => ({
                ...prev,
                old_password: v,
              }))
            }
            show={showOld}
            setShow={setShowOld}
          />

          <PasswordInput
            label="New Password"
            value={form.new_password}
            onChange={(v) =>
              setForm((prev) => ({
                ...prev,
                new_password: v,
              }))
            }
            show={showNew}
            setShow={setShowNew}
          />

          <div>
            <PasswordInput
              label="Confirm New Password"
              value={form.confirm_password}
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  confirm_password: v,
                }))
              }
              show={showConfirm}
              setShow={setShowConfirm}
            />

            {form.confirm_password &&
              !passwordsMatch && (
                <p className="mt-2 text-sm text-red-500">
                  Password confirmation does not match
                </p>
              )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-100 transition"
          >
            Cancel
          </button>

          <button
            onClick={async () => {
              const success = await handleSubmit({
                old_password: form.old_password,
                new_password: form.new_password,
              });

              if (success) {
                setForm(emptyForm);
              }
            }}
            disabled={
              submitting ||
              !passwordsMatch ||
              !form.old_password ||
              !form.new_password
            }
              className="px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              style={{ backgroundColor: IPB_COLORS.blue.primary }}
          >
            <Save size={15} />

            {submitting
              ? "Saving..."
              : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  show,
  setShow,
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2">
        {label}
      </label>

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <Lock
            size={16}
            className="text-gray-400"
          />
        </div>

        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          className="w-full border border-gray-200 rounded-xl pl-10 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? (
            <EyeOff size={16} />
          ) : (
            <Eye size={16} />
          )}
        </button>
      </div>
    </div>
  );
}