import React, { useState } from "react";
import { Search, Filter } from "lucide-react";
import AdminDashboardLayout from "../../../layouts/AdminDashboard";
import { IPB_COLORS, ADMIN_COLORS } from "../../../constants/colors";

const mockUsers = Array.from({ length: 40 }).map((_, index) => ({
  id: index + 1,
  name: "Joko Subianto",
  email: "jok@gmail.com",
  phone: "+6201234567890",
  createdAt: "2026-04-30",
  updatedAt: "2026-04-30",
  deletedAt: "2026-04-30",
}));

export default function ManageUsersPage({ user }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const totalPages = Math.ceil(mockUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = mockUsers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <AdminDashboardLayout user={user}>
      <div className="px-10 py-8 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: IPB_COLORS.blue.primary }}
              size={18}
            />
            <input
              type="text"
              placeholder="Search Here"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:border-transparent text-sm font-medium transition-all"
              style={{
                color: IPB_COLORS.blue.primary,
                caretColor: IPB_COLORS.blue.primary,
              }}
            />
          </div>
          <button className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center">
            <Filter size={18} style={{ color: IPB_COLORS.blue.primary }} />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead>
                <tr style={{ color: IPB_COLORS.blue[400] }}>
                  <th className="px-6 py-4 font-medium">No</th>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Phone Number</th>
                  <th className="px-6 py-4 font-medium">Created At</th>
                  <th className="px-6 py-4 font-medium">Updated At</th>
                  <th className="px-6 py-4 font-medium">Deleted At</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((row, index) => (
                  <tr
                    key={row.id}
                    className="hover:bg-blue-50/30 transition-colors"
                    style={{ color: IPB_COLORS.blue.primary }}
                  >
                    <td className="px-6 py-2.5">{startIndex + index + 1}</td>
                    <td className="px-6 py-2.5">{row.name}</td>
                    <td className="px-6 py-2.5">{row.email}</td>
                    <td className="px-6 py-2.5">{row.phone}</td>
                    <td className="px-6 py-2.5">{row.createdAt}</td>
                    <td className="px-6 py-2.5">{row.updatedAt}</td>
                    <td className="px-6 py-2.5">{row.deletedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex justify-end">
          <div className="flex gap-2">
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNumber = i + 1;
              const isActive = currentPage === pageNumber;

              return (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-colors`}
                  style={{
                    backgroundColor: isActive
                      ? IPB_COLORS.blue.primary
                      : "transparent",
                    color: isActive ? ADMIN_COLORS.white : IPB_COLORS.blue[400],
                  }}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
}
