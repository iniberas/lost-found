import React from "react";
import AdminDashboardLayout from "../../../layouts/AdminDashboard";
import StatCard from "./StatCard";
import ChartCard from "./ChartCard";
import IncidentMapCard from "./IncidentMapCard";
import { ADMIN_COLORS } from "../../../constants/colors";
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Users,
  Package,
} from "lucide-react";

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

const myHandovers = [
  {
    id: "HO-001",
    title: "Dompet Hitam (FASILKOM)",
    date: "Today, 09:30 AM",
    status: "Waiting Owner",
  },
  {
    id: "HO-002",
    title: "KTM a.n. Budi Santoso",
    date: "Yesterday, 14:15 PM",
    status: "Waiting Owner",
  },
  {
    id: "HO-003",
    title: "Kunci Motor Honda",
    date: "28 Apr 2026",
    status: "Waiting Owner",
  },
  {
    id: "HO-004",
    title: "MacBook Charger (CCR)",
    date: "26 Apr 2026",
    status: "Waiting Owner",
  },
  {
    id: "HO-005",
    title: "Botol Minum Tupperware",
    date: "25 Apr 2026",
    status: "Waiting Owner",
  },
];

export default function AdminDashboardHomePage({ user }) {
  const stats = [
    {
      label: "New Reports Today",
      value: "24",
      icon: FileText,
      trend: "up",
      trendValue: "12",
      bgClass: "bg-blue-50",
      colorClass: "text-blue-600",
    },
    {
      label: "Unresolved (Pending)",
      value: "156",
      icon: AlertCircle,
      trend: "down",
      trendValue: "4",
      bgClass: "bg-red-50",
      colorClass: "text-red-500",
    },
    {
      label: "Resolved/Returned",
      value: "1,432",
      icon: CheckCircle,
      trend: "up",
      trendValue: "18",
      bgClass: "bg-green-50",
      colorClass: "text-green-600",
    },
    {
      label: "Total Active Users",
      value: "4,890",
      icon: Users,
      trend: "up",
      trendValue: "5",
      bgClass: "bg-amber-50",
      colorClass: "text-amber-600",
    },
  ];

  return (
    <AdminDashboardLayout user={user}>
      <div className="bg-auth-pattern bg-repeat px-10 py-12 relative border-b border-gray-100">
        <h1
          className="text-4xl md:text-5xl font-black drop-shadow-sm tracking-tight"
          style={{ color: ADMIN_COLORS.headingText }}
        >
          Halo, {user?.name ?? "Admin"}!
        </h1>
        <p className="mt-2 text-gray-600 font-medium text-sm md:text-base">
          Here is what's happening with Waldo today.
        </p>
      </div>

      <div className="px-10 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {stats.map((s, index) => (
            <StatCard
              key={index}
              title={s.label}
              value={s.value}
              icon={s.icon}
              trend={s.trend}
              trendValue={s.trendValue}
              bgClass={s.bgClass}
              colorClass={s.colorClass}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <IncidentMapCard />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full max-h-[400px]">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3 shrink-0">
              <h3 className="text-sm font-bold text-gray-800">
                Items Held by You
              </h3>
              <span className="bg-blue-50 text-blue-600 text-[11px] font-black px-2 py-1 rounded-md uppercase tracking-wide">
                {myHandovers.length} Items
              </span>
            </div>

            <div
              className="space-y-3 overflow-y-auto pr-2 flex-grow"
              style={{ scrollbarWidth: "thin" }}
            >
              {myHandovers.length > 0 ? (
                myHandovers.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                      <Package size={18} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] font-medium text-gray-500 mt-0.5">
                        {item.date}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <span className="text-[10px] font-bold uppercase bg-amber-50 text-amber-600 border border-amber-200 px-2 py-1 rounded-md">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                  <Package size={32} className="text-gray-300" />
                  <p className="text-sm font-medium text-gray-500">
                    You are not holding any items right now.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Lost Reports Overview (2026)"
            data={lostData}
            color="#ef4444"
          />
          <ChartCard
            title="Found Reports Overview (2026)"
            data={foundData}
            color="#3b82f6"
          />
        </div>
      </div>
    </AdminDashboardLayout>
  );
}
