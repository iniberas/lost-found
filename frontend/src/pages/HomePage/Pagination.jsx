import React from "react";
import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";

const Pagination = ({ pagination, setPagination }) => {
	const currentPage = pagination.current_page;
	const totalPages = pagination.total_pages;

	if (totalPages <= 1) return null;

	const goToPage = (page) => {
		if (page < 1 || page > totalPages) return;

		setPagination((prev) => ({
			...prev,
			current_page: page,
		}));
	};

	const renderPages = () => {
		const pages = [];

		let start = Math.max(currentPage - 1, 1);
		let end = Math.min(currentPage + 1, totalPages);

		// mobile-safe window
		if (currentPage === 1) {
			end = Math.min(3, totalPages);
		}

		if (currentPage === totalPages) {
			start = Math.max(totalPages - 2, 1);
		}

		for (let i = start; i <= end; i++) {
			pages.push(
				<button
					key={i}
					onClick={() => goToPage(i)}
					className={`min-w-[38px] h-9 sm:min-w-[42px] sm:h-10 rounded-xl text-sm font-semibold transition
						${
							currentPage === i
								? "bg-blue-600 text-white shadow-sm"
								: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
						}`}
				>
					{i}
				</button>
			);
		}

		return pages;
	};

	const baseBtn =
		"h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0";

	return (
		<div className="mt-8 flex flex-col items-center gap-3">
			<p className="text-xs sm:text-sm text-gray-500 text-center">
				Halaman{" "}
				<span className="font-semibold text-gray-800">
					{currentPage}
				</span>{" "}
				dari{" "}
				<span className="font-semibold text-gray-800">
					{totalPages}
				</span>
			</p>

			<div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
				{/* FIRST */}
				<button
					onClick={() => goToPage(1)}
					disabled={currentPage === 1}
					className={baseBtn}
				>
					<ChevronsLeft size={16} />
				</button>

				{/* PREV */}
				<button
					onClick={() => goToPage(currentPage - 1)}
					disabled={currentPage === 1}
					className={baseBtn}
				>
					<ChevronLeft size={16} />
				</button>

				{/* PAGE NUMBERS */}
				{renderPages()}

				{/* NEXT */}
				<button
					onClick={() => goToPage(currentPage + 1)}
					disabled={currentPage === totalPages}
					className={baseBtn}
				>
					<ChevronRight size={16} />
				</button>

				{/* LAST */}
				<button
					onClick={() => goToPage(totalPages)}
					disabled={currentPage === totalPages}
					className={baseBtn}
				>
					<ChevronsRight size={16} />
				</button>
			</div>
		</div>
	);
};

export default Pagination;