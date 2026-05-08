import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export function useReportDetail(id, activeTab) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;

      setLoading(true);
      setError("");

      try {
        const endpoint =
          activeTab === "found"
            ? `/api/v1/found-reports/${id}`
            : `/api/v1/lost-reports/${id}`;

        const response = await fetch(`${API_URL}${endpoint}`);

        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.detail || "Gagal mengambil data laporan");
        }

        const data = await response.json();
        setReport(data);
        setActivePhotoIndex(0);
      } catch (err) {
        setError(err.message || "Terjadi kesalahan");
        setReport(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id, activeTab]);

  return {
    report,
    setReport,
    loading,
    error,
    setError,
    activePhotoIndex,
    setActivePhotoIndex,
  };
}