import { useState, useEffect, useCallback } from "react";

export function useAdminTable({
  fetchFn,
  defaultSort = "created_at",
  defaultOrder = "desc",
  defaultFilters = {},
}) {
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState(defaultSort);
  const [sortOrder, setSortOrder] = useState(defaultOrder);
  const [filterInput, setFilterInput] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchFn({ page, searchTerm, sortBy, sortOrder, filters: appliedFilters });
      setItems(data?.items ?? []);
      setTotalPages(data?.total_pages ?? 1);
    } catch (err) {
      console.error("[useAdminTable]", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm, sortBy, sortOrder, appliedFilters, fetchFn]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setSearchTerm(searchInput);
    setPage(1);
  };

  const handleApplyFilter = () => {
    setAppliedFilters(filterInput);
    setPage(1);
  };

  const handleResetFilter = () => {
    setFilterInput(defaultFilters);
    setAppliedFilters(defaultFilters);
    setSearchInput("");
    setSearchTerm("");
    setPage(1);
  };

  const isFilterActive = Object.values(appliedFilters).some((v) => v !== "");

  return {
    // data
    items,
    totalPages,
    isLoading,
    refresh: load,
    // pagination
    page,
    setPage,
    // search
    searchInput,
    setSearchInput,
    searchTerm,
    handleSearchSubmit,
    // sort
    sortBy,
    sortOrder,
    handleSort,
    // filters
    filterInput,
    setFilterInput,
    appliedFilters,
    handleApplyFilter,
    handleResetFilter,
    isFilterActive,
  };
}