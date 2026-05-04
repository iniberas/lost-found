import { useNavigate, useLocation } from "react-router-dom";
import { Home, Users, FileText, Tag, HandshakeIcon, ClipboardList, Archive } from "lucide-react";
import { ADMIN_COLORS } from "../../constants/colors";

const navItems = [
  { label: "Home", icon: Home, path: "/admin/home" },
  { label: "Manage Users", icon: Users, path: "/admin/users" },
  { label: "Manage Reports", icon: FileText, path: "/admin/reports" },
  { label: "Manage Category", icon: Tag, path: "/admin/categories" },
  { label: "Hand Over Report", icon: HandshakeIcon, path: "/admin/handover" },
  { 
    label: "View Audit Logs", 
    icon: ClipboardList, 
    path: "/admin/audit-logs", 
    requiredRole: "superadmin"
  },
  { 
    label: "Manage Storages", 
    icon: Archive, 
    path: "/admin/storage-locations", 
    requiredRole: "superadmin"
  },
];

const AdminSidebar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <aside
      className="w-[220px] h-full flex flex-col shrink-0 font-poppins overflow-y-auto"
      style={{ backgroundColor: ADMIN_COLORS.sidebarBg }}
    >
      <nav className="flex flex-col gap-3 p-3 flex-grow">
        {navItems.map(({ label, icon: Icon, path, requiredRole }) => {
          if (requiredRole && user?.role !== requiredRole) {
            return null;
          }

          const isActive = location.pathname.startsWith(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-all w-full
                ${
                  isActive
                    ? "bg-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              style={{
                color: isActive ? ADMIN_COLORS.sidebarActiveText : undefined,
              }}
            >
              <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
              {label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebar;