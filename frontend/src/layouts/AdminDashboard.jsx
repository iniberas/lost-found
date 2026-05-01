import React from "react";
import AdminNavbar from "../components/admin/Navbar";
import AdminSidebar from "../components/admin/Sidebar";
import { ADMIN_COLORS } from "../constants/colors";

export default function AdminDashboardLayout({ children, user }) {
  return (
    <div
      className="flex flex-col min-h-screen font-poppins"
      style={{ backgroundColor: ADMIN_COLORS.background }}
    >
      <AdminNavbar user={user} />

      <div className="flex flex-grow overflow-hidden">
        <AdminSidebar />

        <main className="flex-grow overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}