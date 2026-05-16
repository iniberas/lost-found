import React from "react";
import AdminNavbar from "../components/admin/Navbar";
import AdminSidebar from "../components/admin/Sidebar";
import { ADMIN_COLORS } from "../constants/colors";

export default function AdminDashboardLayout({ children, user }) {
  return (
    <div
      className="flex flex-col h-screen font-poppins relative"
      style={{ backgroundColor: ADMIN_COLORS.background }}
    >
      {/* Navbar Desktop - Sembunyi di Mobile */}
      <div className="hidden md:block">
        <AdminNavbar user={user} isMobile={false} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar user={user} />

        {/* Tambahkan pb-20 (padding bottom) untuk layar HP agar konten tidak tertutup navbar bawah */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* Navbar Mobile - Nempel di Bawah */}
      <div className="block md:hidden fixed bottom-0 left-0 w-full z-[100]">
        <AdminNavbar user={user} isMobile={true} />
      </div>
    </div>
  );
}