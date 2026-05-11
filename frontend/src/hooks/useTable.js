import React, { useEffect, useState, useCallback } from "react";

export function useTable({
    fetchFn,
    defaultSort = "created_at",
    defaultOrder = "desc",
    defaultSearch = "",
    defaultFilters = {},
}) {
    const [items, setItems] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const [page, setPage] = useState(1);

    const [searchInput, setSearchInput] = useState(defaultSearch);
    const [searchTerm, setSearchTerm] = useState(defaultSearch);

    const [sortBy, setSortBy] = useState(defaultSort);
    const [sortOrder, setSortOrder] = useState(defaultOrder);

    const [filterInput, setFilterInput] = useState(defaultFilters);
    const [appliedFilters, setAppliedFilters] = useState(defaultFilters);

    const load = useCallback(async () => {
        setIsLoading(true);

        try {
            const data = await fetchFn({
                page,
                searchTerm,
                sortBy,
                sortOrder,
                filters: appliedFilters,
            });

            setItems(data?.items ?? []);
            setTotalPages(data?.total_pages ?? 1);
        } catch (err) {
            console.error("[useTable]", err);
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
        const emptyFilters = Object.keys(defaultFilters).reduce((acc, key) => {
            const value = defaultFilters[key];
            if (Array.isArray(value)) {
                acc[key] = [];
            } else {
                acc[key] = "";
            }

            return acc;
        }, {});

        setFilterInput(emptyFilters);
        setAppliedFilters(emptyFilters);

        setSearchInput("");
        setSearchTerm("");

        setPage(1);
    };

    const isFilterActive = Object.values(appliedFilters).some(
        (v) => v !== ""
    );

    return {
        items,
        setItems,
        totalPages,
        isLoading,
        refresh: load,

        page,
        setPage,

        searchInput,
        setSearchInput,
        searchTerm,
        handleSearchSubmit,

        sortBy,
        sortOrder,
        handleSort,

        filterInput,
        setFilterInput,
        appliedFilters,
        handleApplyFilter,
        handleResetFilter,

        isFilterActive,
    };
}