import { useNavigate } from 'react-router-dom';
import { User as UserIcon, LogOut } from 'lucide-react';
import LogoWaldo from '../assets/logo-waldo.png';

const Navbar = ({ user, handleLogout }) => {
  const navigate = useNavigate();
  
  return (
    <nav className="flex items-center justify-between px-8 md:px-16 py-4 bg-[#314CBB] shadow-md font-poppins sticky top-0 z-50">
      {/* Logo Waldo */}
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20">
              <UserIcon size={16} className="text-white" />
              <span className="text-sm font-medium text-white">{user.name}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-white/80 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
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