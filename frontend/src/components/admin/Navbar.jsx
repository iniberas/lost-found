import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, LogOut, ChevronDown, UserCircle } from 'lucide-react';
import LogoWaldo from '../../assets/logo-waldo.png';
import { ADMIN_COLORS } from '../../constants/colors';

const AdminNavbar = ({ user }) => {
  const navigate = useNavigate();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    
    navigate('/admin/auth');
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

  return (
    <nav 
      className="flex items-center justify-between px-6 py-3 border-b border-white/10 font-poppins sticky top-0 z-50"
      style={{ backgroundColor: ADMIN_COLORS.navbarBg }}
    >
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/admin')}>
        <img src={LogoWaldo} alt="Waldo Logo" className="h-8 object-contain mix-blend-screen" />
      </div>

      <div className="relative" ref={dropdownRef}>
        
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-3 p-1.5 pr-2.5 rounded-xl hover:bg-white/10 transition-colors focus:outline-none"
        >
          <div className="w-8 h-8 rounded-md bg-white/10 border border-white/20 flex items-center justify-center">
            <UserIcon size={16} className="text-white" />
          </div>
          <span className="text-sm font-medium text-white hidden sm:block">
            {user?.name || "Admin"}
          </span>
          <ChevronDown 
            size={14} 
            className={`text-white/70 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-2 space-y-1">
              <button 
                onClick={() => {
                  setIsDropdownOpen(false);
                  navigate(user?.id ? `/admin/users/${user.id}` : '/admin/profile');
                }} 
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 transition-colors font-medium"
              >
                <UserCircle size={16} />
                My Profile
              </button>

              <button 
                onClick={handleLogout} 
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors font-semibold"
              >
                <LogOut size={16} />
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