import React, { useState, useEffect } from "react";
import { Filter } from "lucide-react";
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

export default function HomePage({ user, handleLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const initialTab = params.get("tab") || "lost";
  const [activeTab, setActiveTab] = useState(initialTab);

  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const [radiusKm, setRadiusKm] = useState(5);
  const [filterLocation, setFilterLocation] = useState(null);
  // yg dipake fetch
  const [appliedFilterLocation, setAppliedFilterLocation] =
    useState(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
    categories,
    selectedCategories,
    setSelectedCategories,
    fetchReports,
  } = useReports(
    activeTab,
    null,
    false,
    appliedFilterLocation,
    radiusKm,
  );

  useEffect(() => {
  if (error) {
    showToast(error, "error");
  }
}, [error]);

  const handleApplyFilter = () => {
    setAppliedFilterLocation(filterLocation);

    setPagination((prev) => ({
      ...prev,
      current_page: 1,
    }));

    fetchReports(1);
  };

  const toggleCategory = (catId) => {
    setSelectedCategories((prev) => {
      if (prev.includes(catId)) {
        return prev.filter((id) => id !== catId);
      }

      return [...prev, catId];
    });
  };
  const handleAllCategories = () => {
    setSelectedCategories([]);
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);

    const params = new URLSearchParams(location.search);
    params.set("tab", tab);

    navigate(
      {
        pathname: location.pathname,
        search: params.toString(),
      },
      { replace: false }
    );

    setPagination((prev) => ({
      ...prev,
      current_page: 1,
    }));
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

      {/* Mobile Filter Floating Button */}
      <button
        onClick={() => setIsFilterOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 bg-[#0C0B89] text-white p-4 rounded-full shadow-lg active:scale-95 transition"
      >
        <Filter size={22} />
      </button>

      {/* LIST SECTION */}
      <section className="bg-[#F3F4FF] flex-grow py-12 px-4 md:px-8 lg:px-16">
        <div className="w-full max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-8 md:gap-12 items-start min-w-0">

          <div className="flex-1 min-w-0 space-y-6">

            {/* Tab Switcher */}
            <div className="flex bg-white shadow-sm border border-gray-100 p-1.5 rounded-2xl w-fit">
              <button
                onClick={() => handleTabChange("lost")}
                className={`px-4 md:px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "lost"
                  ? "bg-[#0C0B89] text-white shadow-md"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
              >
                Daftar Barang Hilang
              </button>

              <button
                onClick={() => handleTabChange("found")}
                className={`px-4 md:px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "found"
                  ? "bg-[#0C0B89] text-white shadow-md"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
              >
                Daftar Barang Temuan
              </button>
            </div>

            <ReportList
              items={items}
              loading={loading}
              activeTab={activeTab}
              searchQuery={searchQuery}
            />

            <Pagination
              pagination={pagination}
              setPagination={setPagination}
            />
          </div>

          {/* Desktop sidebar */}
          <div className="hidden lg:block lg:w-[320px] lg:sticky lg:top-6 max-h-[calc(100vh-48px)] overflow-y-auto">
            <FilterSidebar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              categories={categories}
              selectedCategories={selectedCategories}
              toggleCategory={toggleCategory}
              handleAllCategories={handleAllCategories}
              filterLocation={filterLocation}
              setIsMapModalOpen={setIsMapModalOpen}
              radiusKm={radiusKm}
              setRadiusKm={setRadiusKm}
              handleApplyFilter={handleApplyFilter}
              loading={loading}
            />
          </div>
        </div>
      </section>

      {isFilterOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40">
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto">

            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Filter</h2>

              <button
                onClick={() => setIsFilterOpen(false)}
                className="text-gray-500 text-xl"
              >
                ✕
              </button>
            </div>

            <FilterSidebar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              categories={categories}
              selectedCategories={selectedCategories}
              toggleCategory={toggleCategory}
              handleAllCategories={handleAllCategories}
              filterLocation={filterLocation}
              setIsMapModalOpen={setIsMapModalOpen}
              radiusKm={radiusKm}
              setRadiusKm={setRadiusKm}
              handleApplyFilter={() => {
                handleApplyFilter();
                setIsFilterOpen(false);
              }}
              loading={loading}
            />
          </div>
        </div>
      )}

      <MapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        filterLocation={filterLocation}
        setFilterLocation={setFilterLocation}
      />
    </UserLayout>
  );
}