import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User as UserIcon,
  LogOut,
  ChevronDown,
  FileText,
  Inbox,
  UserCircle
} from 'lucide-react';
import LogoWaldo from '../assets/logo-waldo.png';
import { USER_COLORS } from '../constants/colors';
const API_URL = import.meta.env.VITE_API_URL;


const Navbar = ({ user, handleLogout, contactRequestNotificationCount }) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fungsi Click Outside agar dropdown tertutup otomatis
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
      style={{ backgroundColor: USER_COLORS.navbarBg }}
    >      {/* LOGO */}
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/home')}>
        <img
          src={LogoWaldo}
          alt="Waldo Logo"
          className="h-8 object-contain mix-blend-screen"
        />
      </div>

      {/* USER SECTION */}
      <div className="flex items-center gap-6">

        {user ? (
          <div className="relative" ref={dropdownRef}>
            {/* Tombol Profil */}
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 p-1.5 pr-2.5 rounded-xl hover:bg-white/10 transition-colors focus:outline-none"
            >
              <div className="w-8 h-8 rounded-md bg-white/10 border border-white/20 flex items-center justify-center">
                <UserIcon size={16} className="text-white" />
              </div>
              <span className="text-sm font-medium text-white hidden sm:block">
                {user?.name || "User"}
              </span>
              <ChevronDown
                size={14}
                className={`text-white/70 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
              {/* Blob notif request */}
              <div className="absolute top-1 right-1 flex items-center">
                {contactRequestNotificationCount.incoming_pending > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 ring-2 ring-[#314CBB] z-30" />
                )}

                {contactRequestNotificationCount.outgoing_rejected > 0 && (
                  <span className="-ml-1 w-2.5 h-2.5 rounded-full bg-red-400 ring-2 ring-[#314CBB] z-20" />
                )}

                {contactRequestNotificationCount.outgoing_approved > 0 && (
                  <span className="-ml-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#314CBB] z-10" />
                )}
              </div>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-2 space-y-1">

                  {/* Laporan Saya */}
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate('/my-reports');
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 transition-colors font-medium"
                  >
                    <FileText size={16} className="text-[#314CBB]" />
                    Laporan Saya
                  </button>

                  {/* Permintaan Kontak */}
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate('/my-requests?tab=incoming');
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between transition-colors font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <Inbox size={16} className="text-[#314CBB]" />
                      Permintaan Kontak

                      {contactRequestNotificationCount.incoming_pending > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-yellow-400 text-white text-[10px] font-bold">
                          {contactRequestNotificationCount.incoming_pending}
                        </span>
                      )}

                      {contactRequestNotificationCount.outgoing_rejected > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-red-400 text-white text-[10px] font-bold">
                          {contactRequestNotificationCount.outgoing_rejected}
                        </span>
                      )}

                      {contactRequestNotificationCount.outgoing_approved > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-400 text-white text-[10px] font-bold">
                          {contactRequestNotificationCount.outgoing_approved}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Profile */}
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate('/my-profile');
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 transition-colors font-medium"
                  >
                    <UserCircle size={16} className="text-[#314CBB]" />
                    Profile Saya
                  </button>

                  {/* Garis Pemisah */}
                  <div className="h-px bg-gray-100 my-1 mx-2" />

                  {/* Logout */}
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors font-semibold"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Tombol Login Guest */
          <button
            onClick={() => navigate('/auth')}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 py-2 rounded-xl text-sm font-semibold transition-all"
          >
            Sign in
          </button>
        )}
      </div>

    </nav>
  );
};

export default Navbar;