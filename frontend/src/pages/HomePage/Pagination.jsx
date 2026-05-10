import React from "react";

const Pagination = ({ pagination, setPagination }) => {
  if (pagination.total_pages <= 1) return null;

  const handlePrevious = () => {
    if (pagination.current_page > 1) {
      setPagination((prev) => ({
        ...prev,
        current_page: prev.current_page - 1,
      }));
    }
  };

  const handleNext = () => {
    if (pagination.current_page < pagination.total_pages) {
      setPagination((prev) => ({
        ...prev,
        current_page: prev.current_page + 1,
      }));
    }
  };

  return (
    <div className="flex justify-center gap-2 mt-8">
      <button
        onClick={handlePrevious}
        disabled={pagination.current_page === 1}
        className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Sebelumnya
      </button>
      <span className="px-4 py-2 text-sm text-gray-600">
        Halaman {pagination.current_page} dari {pagination.total_pages}
      </span>
      <button
        onClick={handleNext}
        disabled={pagination.current_page === pagination.total_pages}
        className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Selanjutnya
      </button>
    </div>
  );
};

export default Pagination;
