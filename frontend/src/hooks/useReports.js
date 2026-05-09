import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export const useReports = (activeTab, userId = null, allStatus = false) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    limit: 20,
  });

  // FILTERS
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // CATEGORY
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  
  // FETCH CATEGORY
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(
          `${API_URL}/api/v1/categories`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (response.ok) {
          const data = await response.json();
          setCategories(data.filter((cat) => cat.is_active));
        }
      } catch (error) {
        console.error("Gagal mengambil kategori:", error);
      }
    };
    fetchCategories();
  }, []);

  const fetchReports = async (page = pagination.current_page) => {
    setLoading(true);
    setError("");
    try {
      const endpoint =
        activeTab === "lost"
          ? "/api/v1/lost-reports"
          : "/api/v1/found-reports";

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sort_by: "created_at",
        sort_order: "desc",
      });

      // SEARCH
      if (searchQuery.trim()) {
        params.append("query", searchQuery.trim());
      }

      // DATE
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        params.append(
          "incident_date_from",
          start.toISOString(),
        );
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        params.append(
          "incident_date_to",
          end.toISOString(),
        );
      }

      // STATUS (default open doang)
      if (!allStatus) {
        params.append("report_status", "open");
      }

      // CATEGORY
      if (selectedCategories.length > 0) {
        selectedCategories.forEach((id) => {
          params.append("category_ids", id);
        });
      }

      // USER FILTER (untuk My Reports)
      if (userId) {
        params.append("user_ids", userId);
      }

      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_URL}${endpoint}?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Gagal mengambil data laporan");
      }

      const data = await response.json();
      setItems(data.items);
      setPagination({
        current_page: data.current_page,
        total_pages: data.total_pages,
        total_items: data.total_items,
        limit: data.limit,
      });
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeTab, pagination.current_page]);

  const handleApplyFilter = () => {
    setPagination((prev) => ({
      ...prev,
      current_page: 1,
    }));
    fetchReports(1);
  };

  return {
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
    handleApplyFilter,
  };
};