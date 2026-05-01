import { useNavigate } from 'react-router-dom';
import { User as UserIcon } from 'lucide-react';
import LogoWaldo from '../../assets/logo-waldo.png';
import { ADMIN_COLORS } from '../../constants/colors';

const AdminNavbar = ({ user }) => {
  const navigate = useNavigate();

  return (
    <nav 
      className="flex items-center justify-between px-6 py-3 border-b border-white/10 font-poppins sticky top-0 z-50"
      style={{ backgroundColor: ADMIN_COLORS.navbarBg }}
    >
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/admin')}>
        <img src={LogoWaldo} alt="Waldo Logo" className="h-8 object-contain mix-blend-screen" />
      </div>

      <div className="w-8 h-8 rounded-md bg-white/10 border border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors">
        <UserIcon size={16} className="text-white" />
      </div>
    </nav>
  );
};

export default AdminNavbar;