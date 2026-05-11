import React, { useState, useEffect } from "react";
import { Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminAuthInput from "./AuthInput";
const API_URL = import.meta.env.VITE_API_URL;

export default function AdminAuthPage({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const checkExistingSession = async () => {
      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          const verifyResponse = await fetch(`${API_URL}/api/v1/admin/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (verifyResponse.ok) {
            navigate("/admin");
          } else {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
          }
        } catch (error) {}
      }
    };
    checkExistingSession();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const loginResponse = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error(loginData.detail || "Login failed");
      }

      const token = loginData.access_token;

      const verifyResponse = await fetch(`${API_URL}/api/v1/admin/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (verifyResponse.status === 403) {
        throw new Error("Access Denied: You do not have Admin privileges.");
      }

      if (!verifyResponse.ok) {
        throw new Error("Failed to verify admin status.");
      }

      localStorage.setItem("access_token", token);
      localStorage.setItem("refresh_token", loginData.refresh_token);

      if (onLoginSuccess) onLoginSuccess();

      navigate("/admin");
    } catch (err) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-auth-pattern bg-repeat flex items-center justify-center p-4 font-poppins">
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl w-full max-w-[480px] space-y-7 border border-gray-100">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Admin Waldo
          </h1>
        </div>

        {error && (
          <div className="p-3 rounded-lg text-sm font-medium bg-red-50 text-red-600 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <AdminAuthInput
              icon={Mail}
              type="email"
              placeholder="admin@waldo.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <AdminAuthInput
              icon={Lock}
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0C0B89] hover:bg-[#111B41] text-white font-semibold py-3 rounded-xl shadow-md transition duration-200 text-sm active:scale-[0.98] flex justify-center items-center h-[44px] mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-[12px] text-gray-500">
            For internal admin access only.
          </p>
        </div>
      </div>
    </div>
  );
}
