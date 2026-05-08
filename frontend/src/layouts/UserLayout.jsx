import React from "react";
import Navbar from "../components/Navbar";
import AdminSidebar from "../components/admin/Sidebar";
import { ADMIN_COLORS } from "../constants/colors";

export default function UserLayout({ children, user, handleLogout }) {
  return (
    <div
      className="flex flex-col h-screen font-poppins"
      style={{ backgroundColor: ADMIN_COLORS.background }}
    >
      <Navbar
        user={user}
        handleLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
