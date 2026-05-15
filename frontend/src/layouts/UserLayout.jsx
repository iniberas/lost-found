import React from "react";
import Navbar from "../components/Navbar";
import AdminSidebar from "../components/admin/Sidebar";
import { USER_COLORS } from "../constants/colors";

export default function UserLayout({ children, user, handleLogout, contactRequestNotificationCount }) {
  return (
    <div
      className="flex flex-col h-screen font-poppins"
      style={{ backgroundColor: USER_COLORS.background }}
    >
      <Navbar
        user={user}
        handleLogout={handleLogout}
        contactRequestNotificationCount={contactRequestNotificationCount}
      />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
    </div>
  );
}
