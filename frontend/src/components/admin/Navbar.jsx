import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  User as UserIcon,
  LogOut,
  Menu,
  X,   
  ChevronDown,
  ChevronUp,
  UserCircle,
} from "lucide-react";
import LogoWaldo from "../../assets/logo-waldo.png";
import { ADMIN_COLORS } from "../../constants/colors";
import { navItems } from "./Sidebar";

const AdminNavbar = ({ user, isMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    window.location.href = "/admin/auth";
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const reversedNavItems = [...navItems].reverse();

  return (
    <nav
      className={`flex items-center justify-between px-6 py-3 font-poppins ${
        isMobile ? "border-t border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]" : "border-b border-white/10 sticky top-0 z-2000"
      }`}
      style={{ backgroundColor: ADMIN_COLORS.navbarBg }}
    >
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => navigate("/admin")}
      >
        <img
          src={LogoWaldo}
          alt="Waldo Logo"
          className="h-8 object-contain mix-blend-screen"
        />
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-3 p-1.5 pr-2.5 rounded-xl hover:bg-white/10 transition-colors focus:outline-none"
        >
          {!isMobile && (
            <div className="w-8 h-8 rounded-md bg-white/10 border border-white/20 flex items-center justify-center">
              <UserIcon size={16} className="text-white" />
            </div>
          )}
          
          <span className="text-sm font-medium text-white hidden sm:block">
            {user?.name || "Admin"}
          </span>

          {isMobile ? (
            isDropdownOpen ? <X size={24} className="text-white" /> : <Menu size={24} className="text-white" />
          ) : (
            isDropdownOpen ? <ChevronUp size={14} className="text-white/70" /> : <ChevronDown size={14} className="text-white/70" />
          )}
        </button>

        {isDropdownOpen && (
          <div 
            className={`z-[200] overflow-hidden animate-in fade-in duration-200 ${
              isMobile 
                ? "fixed top-0 left-0 right-0 bottom-[60px] w-full flex flex-col p-8 slide-in-from-bottom-5" 
                : "absolute right-0 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 mt-2 slide-in-from-top-2"
            }`}
            style={{ backgroundColor: isMobile ? ADMIN_COLORS.sidebarBg : "white" }} 
          >
            <div className={`px-2 space-y-2 flex-grow overflow-y-auto ${isMobile ? "pb-10" : ""}`}>
              {(isMobile ? reversedNavItems : []).map(({ label, icon: Icon, path, requiredRole }) => {
                if (requiredRole && user?.role !== requiredRole) return null;
                const isActive = location.pathname.startsWith(path);
                
                return (
                  <button
                    key={path}
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate(path);
                    }}
                    className={`w-full text-left px-4 py-4 rounded-2xl text-base flex items-center gap-4 transition-all font-semibold ${
                      isActive 
                        ? "bg-white text-blue-700 shadow-lg" 
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    {label}
                  </button>
                );
              })}

              {isMobile && <div className="h-px bg-white/10 my-4 mx-2" />}

              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  navigate("/admin/profile");
                }}
                className={`w-full text-left px-4 py-1.5 rounded-2xl text-base flex items-center gap-4 transition-all font-semibold ${
                  isMobile ? "text-white/80 hover:bg-white/10" : "text-gray-700 hover:bg-blue-50"
                }`}
              >
                <UserCircle size={20} />
                My Profile
              </button>

              <button
                onClick={handleLogout}
                className={`w-full text-left px-4 py-1.5 rounded-2xl text-base flex items-center gap-4 transition-all font-semibold ${
                  isMobile ? "bg-red-500/30 text-red-400 mt-4" : "text-red-600 hover:bg-red-50"
                }`}
              >
                <LogOut size={20} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default AdminNavbar;