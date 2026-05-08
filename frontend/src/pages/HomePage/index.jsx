import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import UserLayout from "../../layouts/UserLayout";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Configure Leaflet default icon
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Import components
import HeroSection from "./HeroSection";
import FilterSidebar from "./FilterSidebar";
import MapModal from "./MapModal";
import ReportList from "./ReportList";
import Pagination from "./Pagination";
import Toast from "../../components/Toast";


// Import hooks
import { useReports } from "../../hooks/useReports";
import { useStatusFilter } from "../../hooks/useStatusFilter";

export default function HomePage({ user, handleLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("lost");
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [filterLocation, setFilterLocation] = useState(null);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };


  useEffect(() => {
    if (location.state?.toast) {
      showToast(
        location.state.toast.message,
        location.state.toast.type
      );

      // hapus state biar ga muncul lagi pas refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // Status filter hook
  const {
    selectedStatuses,
    setSelectedStatuses,
    handleStatusChange,
    handleAllStatusChange,
  } = useStatusFilter();

  // Reports data hook
  const {
    items,
    loading,
    error,
    pagination,
    setPagination,
    searchQuery,
    setSearchQuery,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedCategory,
    setSelectedCategory,
    handleApplyFilter,
  } = useReports(activeTab, selectedStatuses);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPagination((prev) => ({ ...prev, current_page: 1 }));
  };

  return (
    <UserLayout
      user={user}
      handleLogout={handleLogout}
    >
      <Toast
        show={Boolean(toast)}
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
      {/* HERO SECTION */}
      <HeroSection user={user} />

      {/* LIST SECTION */}
      <section className="bg-[#F3F4FF] flex-grow py-12 px-8 md:px-16">
        <div className="w-full max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-8 md:gap-12">

          <div className="flex-grow space-y-6">
            <div className="flex-grow space-y-6">
              {/* Tab Switcher */}
              <div className="flex bg-white shadow-sm border border-gray-100 p-1.5 rounded-2xl w-fit">
                <button
                  onClick={() => handleTabChange("lost")}
                  className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "lost"
                    ? "bg-[#0C0B89] text-white shadow-md"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  Daftar Barang Hilang
                </button>

                <button
                  onClick={() => handleTabChange("found")}
                  className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "found"
                    ? "bg-[#0C0B89] text-white shadow-md"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  Daftar Barang Temuan
                </button>
              </div>

              {/* Error Notification */}
              {error && (
                <div
                  className={`p-3 rounded-lg text-sm font-medium ${error.includes("Success")
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-600"
                    }`}
                >
                  {error}
                </div>
              )}

              {/* Report List */}
              <ReportList
                items={items}
                loading={loading}
                activeTab={activeTab}
                searchQuery={searchQuery}
              />

              {/* Pagination */}
              <Pagination
                pagination={pagination}
                setPagination={setPagination}
              />
            </div>
          </div>

          <FilterSidebar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedStatuses={selectedStatuses}
            handleStatusChange={handleStatusChange}
            handleAllStatusChange={handleAllStatusChange}
            filterLocation={filterLocation}
            setIsMapModalOpen={setIsMapModalOpen}
            handleApplyFilter={handleApplyFilter}
            loading={loading}
          />
        </div>
      </section>

      <MapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        filterLocation={filterLocation}
        setFilterLocation={setFilterLocation}
      />
    </UserLayout>
  );
}