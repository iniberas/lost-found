import React, { useState, useEffect } from "react";
import AdminDashboardLayout from "../../../layouts/AdminDashboard";
import { ADMIN_COLORS } from "../../../constants/colors";
import { adminFetch } from "../../../utils/adminApi";
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Users,
  MapPin,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const StatCard = ({ title, value, icon: Icon, trend, trendValue, bgClass, colorClass }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${bgClass} ${colorClass}`}>
        <Icon size={24} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${trend === "up" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
          {trend === "up" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{trendValue}%</span>
        </div>
      )}
    </div>
    <div>
      <h4 className="text-3xl font-black text-gray-900">{value}</h4>
      <p className="text-sm font-medium text-gray-500 mt-1">{title}</p>
    </div>
  </div>
);

const ChartCard = ({ title, data, color }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full">
    {title && <p className="text-sm font-bold text-gray-800 mb-6">{title}</p>}
    <div className="flex-grow">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={ADMIN_COLORS.chartGrid} vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: ADMIN_COLORS.chartAxis }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: ADMIN_COLORS.chartAxis }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "4 4" }}
          />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={3} fill={`url(#grad-${color})`} dot={false} activeDot={{ r: 5, fill: color, stroke: "#fff", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const createCustomIcon = (type) => {
  const isLost = type === "lost";
  const colorClass = isLost ? "bg-red-500" : "bg-blue-500";
  const shadowClass = isLost ? "shadow-red-500/50" : "shadow-blue-500/50";

  const html = `
    <div class="relative w-full h-full flex items-center justify-center">
      <div class="absolute -inset-1.5 ${colorClass} rounded-full opacity-40 animate-ping"></div>
      <div class="relative w-3 h-3 ${colorClass} rounded-full border-2 border-white shadow-lg ${shadowClass}"></div>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-map-marker',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -10]
  });
};

const IncidentMapCard = ({ mapData }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full relative overflow-hidden">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
        <MapPin size={18} className="text-gray-400" /> Live Incident Map
      </h3>
      <div className="flex gap-3 text-xs font-semibold text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Lost</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Found</span>
      </div>
    </div>
    
    <div className="flex-grow relative rounded-xl border border-gray-200 overflow-hidden h-[400px] min-h-[350px]">
      <MapContainer 
        center={[-6.5607, 106.7265]} 
        zoom={14} 
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer 
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
        />
        
        {mapData?.map((incident) => (
          <Marker 
            key={incident.id} 
            position={[incident.latitude, incident.longitude]}
            icon={createCustomIcon(incident.report_type)}
          >
            <Popup>
              <div className="text-xs font-poppins">
                <span className={`font-black uppercase ${incident.report_type === 'lost' ? 'text-red-500' : 'text-blue-500'}`}>
                  {incident.report_type}:
                </span>
                <p className="font-bold text-gray-900 mt-0.5">{incident.title}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  </div>
);

export default function AdminDashboardHomePage({ user }) {
  const [statsData, setStatsData] = useState(null);
  const [chartData, setChartData] = useState({ lost: [], found: [] });
  const [mapData, setMapData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, chartRes, mapRes] = await Promise.all([
          adminFetch("/api/v1/admin/dashboard/stats"),
          adminFetch("/api/v1/admin/dashboard/chart"),
          adminFetch("/api/v1/admin/dashboard/map-incidents")
        ]);

        setStatsData(statsRes);
        setChartData(chartRes);
        setMapData(Array.isArray(mapRes) ? mapRes : (mapRes?.items || []));
      } catch (error) {
        console.error("Gagal mengambil data dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const displayStats = statsData ? [
    {
      label: "New Reports Today",
      value: statsData.new_reports.total.toString(),
      icon: FileText,
      trend: statsData.new_reports.trend_percentage >= 0 ? "up" : "down",
      trendValue: Math.abs(statsData.new_reports.trend_percentage).toFixed(1),
      bgClass: "bg-blue-50",
      colorClass: "text-blue-600",
    },
    {
      label: "Unresolved (Open)",
      value: statsData.pending_reports.total.toString(),
      icon: AlertCircle,
      trend: statsData.pending_reports.trend_percentage >= 0 ? "up" : "down",
      trendValue: Math.abs(statsData.pending_reports.trend_percentage).toFixed(1),
      bgClass: "bg-red-50",
      colorClass: "text-red-500",
    },
    {
      label: "Resolved/Returned",
      value: statsData.resolved_reports.total.toString(),
      icon: CheckCircle,
      trend: statsData.resolved_reports.trend_percentage >= 0 ? "up" : "down",
      trendValue: Math.abs(statsData.resolved_reports.trend_percentage).toFixed(1),
      bgClass: "bg-green-50",
      colorClass: "text-green-600",
    },
    {
      label: "Total Active Users",
      value: statsData.active_users.total.toString(),
      icon: Users,
      trend: statsData.active_users.trend_percentage >= 0 ? "up" : "down",
      trendValue: Math.abs(statsData.active_users.trend_percentage).toFixed(1),
      bgClass: "bg-amber-50",
      colorClass: "text-amber-600",
    },
  ] : [];

  if (isLoading) {
    return (
      <AdminDashboardLayout user={user}>
        <div className="flex items-center justify-center h-full min-h-[60vh] gap-3">
          <Loader2 size={32} className="text-blue-500 animate-spin" />
          <p className="text-gray-500 font-medium">Loading dashboard data…</p>
        </div>
      </AdminDashboardLayout>
    );
  }

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
          {displayStats.map((s, index) => (
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

        <div className="w-full">
          <IncidentMapCard mapData={mapData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard 
            title="Lost Reports Overview" 
            data={chartData.lost} 
            color="#ef4444" 
          />
          <ChartCard 
            title="Found Reports Overview" 
            data={chartData.found} 
            color="#3b82f6" 
          />
        </div>
      </div>
    </AdminDashboardLayout>
  );
}