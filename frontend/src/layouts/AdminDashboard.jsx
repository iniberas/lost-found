import React from "react";
import AdminNavbar from "../components/admin/Navbar";
import AdminSidebar from "../components/admin/Sidebar";
import { ADMIN_COLORS } from "../constants/colors";

export default function AdminDashboardLayout({ children, user }) {
  return (
    <div
      className="flex flex-col h-screen font-poppins"
      style={{ backgroundColor: ADMIN_COLORS.background }}
    >
      <AdminNavbar user={user} />

      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar user={user} />

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
