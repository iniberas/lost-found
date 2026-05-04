import React, { useState } from "react";
import { Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react";

const AdminAuthInput = ({ icon: Icon, type, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="space-y-1.5 w-full font-poppins">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
          <Icon size={18} strokeWidth={2.5} />
        </div>
        <input
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          className="w-full pl-11 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ipb-blue focus:border-ipb-blue outline-none transition duration-150"
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminAuthInput