import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Inbox, FileText } from 'lucide-react';
import LogoWaldo from '../assets/logo-waldo.png';
import ProfilLogo from '../assets/profile_icon.png';

const Navbar = ({ user, handleLogout }) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  return (
    <nav className="flex items-center justify-between px-8 md:px-16 py-4 bg-[#314CBB] shadow-md font-poppins sticky top-0 z-50">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/home')}>
        <img 
          src={LogoWaldo} 
          alt="Waldo Logo" 
          className="h-10 object-contain mix-blend-screen" 
        />
      </div>

      {/* Info User / Login Button */}
      <div className="flex items-center gap-6">
        {user ? (
          <div className="relative">
            {/* Tombol Icon Profil */}
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-center bg-white rounded-md w-10 h-10 shadow-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <img src={ProfilLogo} alt="Profile" className="w-6 h-6 object-contain" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl py-2 border border-gray-100 flex flex-col transform origin-top-right transition-all">
                {/* Info singkat user */}
                <div className="px-4 py-3 border-b border-gray-100 text-left cursor-default">
                  <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                </div>

                {/* Menu Laporan Saya (My Report) */}
                <Link 
                  to="/my-reports"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left w-full border-b border-gray-50"
                >
                  <FileText size={18} className="text-[#314CBB]" />
                  Laporan Saya
                </Link>
                
                {/* Menu Permintaan Kontak (My Request) */}
                <Link 
                  to="/my-requests"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left w-full border-b border-gray-50"
                >
                  <Inbox size={18} className="text-[#314CBB]" />
                  Permintaan Kontak
                </Link>

                {/* Tombol Logout */}
                <button 
                  onClick={() => {
                    setIsDropdownOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left w-full"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Tombol Login/Daftar untuk Guest */
          <button 
            onClick={() => navigate('/auth')}
            className="bg-white text-[#314CBB] px-6 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 hover:bg-gray-100"
          >
            Login/Daftar
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;