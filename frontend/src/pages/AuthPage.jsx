import React, { useState } from "react";
import { Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

const AuthInput = ({ icon: Icon, type, ...props }) => {
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

export default function AuthPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ name: "", phone_number: "", email: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!isLogin && formData.password.length < 6) {
      setError("Password should have at least 6 characters");
      return;
    }

    setLoading(true);
    const endpoint = isLogin ? "/api/v1/auth/login" : "/api/v1/auth/register";

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (Array.isArray(data.detail)) {
          throw new Error(data.detail[0].msg);
        }
        throw new Error(data.detail || "An unexpected error occurred.");
      }

      if (isLogin) {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        if(onLoginSuccess) onLoginSuccess();
      } else {
        setIsLogin(true);
        setError("Success! Login now."); 
      }
    } catch (err) { 
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
            {isLogin ? 'Sign In' : 'Sign Up'}
          </h1>
        </div>

        {/* Notifikasi Error / Sukses */}
        {error && (
          <div className={`p-3 rounded-lg text-sm font-medium ${error.includes('Success') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {error}
          </div>
        )}

        {/* -- */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Name</label>
                <AuthInput icon={User} type="text" placeholder="Enter your name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Phone Number</label>
                <AuthInput icon={Phone} type="tel" placeholder="Enter phone number" value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} required />
              </div>
            </>
          )}
          
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Email</label>
            <AuthInput icon={Mail} type="email" placeholder="Enter your email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
          </div>
          
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Password</label>
            <AuthInput icon={Lock} type="password" placeholder={isLogin ? "Enter your password" : "Min. 6 characters"} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ipb-dark hover:bg-black text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition duration-200 text-sm active:scale-[0.98] flex justify-center items-center h-[44px] mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              isLogin ? "Sign In" : "Sign Up"
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-[11px] text-gray-600">
            {isLogin ? "Don’t have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(""); 
                setFormData({ name: "", phone_number: "", email: "", password: "" });
              }}
              className="font-semibold text-ipb-blue hover:underline focus:outline-none"
            >
              {isLogin ? 'Register/Sign up' : 'Log In'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}