import React from "react";
import AdminDashboardLayout from "../../../layouts/AdminDashboard";
import StatCard from "./StatCard";
import ChartCard from "./ChartCard";
import { ADMIN_COLORS } from "../../../constants/colors";

const lostData = [
  { name: "Jan", value: 40 },
  { name: "Feb", value: 65 },
  { name: "Mar", value: 50 },
  { name: "Apr", value: 90 },
  { name: "May", value: 75 },
  { name: "Jun", value: 110 },
  { name: "Jul", value: 95 },
  { name: "Aug", value: 130 },
  { name: "Sep", value: 115 },
  { name: "Oct", value: 145 },
  { name: "Nov", value: 160 },
  { name: "Dec", value: 140 },
];

const foundData = [
  { name: "Jan", value: 30 },
  { name: "Feb", value: 55 },
  { name: "Mar", value: 70 },
  { name: "Apr", value: 60 },
  { name: "May", value: 80 },
  { name: "Jun", value: 65 },
  { name: "Jul", value: 100 },
  { name: "Aug", value: 85 },
  { name: "Sep", value: 120 },
  { name: "Oct", value: 105 },
  { name: "Nov", value: 115 },
  { name: "Dec", value: 130 },
];

export default function AdminDashboardHomePage({ user }) {
  const stats = [
    { label: "Total Reports", value: "6,767" },
    { label: "Lost Reports", value: "6,767" },
    { label: "Found Reports", value: "6,767" },
    { label: "Resolved Reports", value: "6,767" },
  ];

  return (
    <AdminDashboardLayout user={user}>
      <div className="bg-auth-pattern bg-repeat px-10 py-14 relative">
        <h1
          className="text-5xl font-black drop-shadow-sm"
          style={{ color: ADMIN_COLORS.headingText }}
        >
          Halo, {user?.name ?? "Admin"}!
        </h1>
      </div>

      <div className="px-10 py-8 space-y-6">
        <div className="flex flex-wrap gap-4">
          {stats.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} />
          ))}
        </div>

        <ChartCard
          title="Laporan Kehilangan per Bulan"
          data={lostData}
          color={ADMIN_COLORS.chartLost}
        />
        <ChartCard
          title="Laporan Penemuan per Bulan"
          data={foundData}
          color={ADMIN_COLORS.chartFound}
        />
      </div>
    </AdminDashboardLayout>
  );
}