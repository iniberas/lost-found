import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export function useSuggestedReports(id, activeTab) {
  const [suggestedReports, setSuggestedReports] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    const fetchPotentialMatches = async () => {
      if (!id) return;

      setLoadingSuggestions(true);

      try {
        const endpoint =
          activeTab === "found"
            ? `/api/v1/found-reports/${id}/potential-matches`
            : `/api/v1/lost-reports/${id}/potential-matches`;

        const response = await fetch(`${API_URL}${endpoint}`);
        if (!response.ok) throw new Error("Gagal memuat laporan serupa");

        const data = await response.json();
        setSuggestedReports(Array.isArray(data) ? data : []);
      } catch {
        setSuggestedReports([]);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchPotentialMatches();
  }, [id, activeTab]);

  return { suggestedReports, loadingSuggestions };
}