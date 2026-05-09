import React, {
	useCallback,
	useMemo,
	useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
	Eye,
	MapPin,
	Calendar,
	Package,
} from "lucide-react";

import UserLayout from "../../layouts/UserLayout";

import PageHeader from "../../components/PageHeader";
import Toast from "../../components/Toast";
import Table from "../../components/Table";

import AdminSearchFilter from "../../components/admin/SearchFilter";
import TabSelector from "../../components/admin/TabSelector";
import StatusBadge from "../../components/admin/StatusBadge";

import {
	FilterSelect,
	formatDate,
	ActionBtn,
} from "../../components/admin/FilterHelpers";

import { useAdminTable } from "../../hooks/useAdminTable";

const API_URL = import.meta.env.VITE_API_URL;
const LIMIT = 15;

const TABS = [
	{
		id: "lost",
		label: "Barang Hilang",
	},
	{
		id: "found",
		label: "Barang Temuan",
	},
];

const HEADERS = [
	{
		label: "Judul",
		key: "title",
		sortable: true,
	},
	{
		label: "Lokasi",
		key: "location_name",
		sortable: false,
	},
	{
		label: "Tanggal Kejadian",
		key: "incident_date",
		sortable: true,
	},
	{
		label: "Status",
		key: "report_status",
		sortable: true,
	},
	{
		label: "Kategori",
		key: "categories",
		sortable: false,
	},
	{
		label: "Aksi",
		key: "action",
		sortable: false,
		className: "text-center",
	},
];

export default function MyReportsPage({
	user,
	handleLogout,
}) {
	const navigate = useNavigate();

	const [activeTab, setActiveTab] =
		useState("lost");

	const [toast, setToast] =
		useState(null);

	const [categories, setCategories] =
		useState([]);

	const fetchFn = useCallback(
		async ({
			page,
			searchTerm,
			sortBy,
			sortOrder,
			filters,
		}) => {
			try {
				const params =
					new URLSearchParams({
						page,
						limit: LIMIT,
						sort_by: sortBy,
						sort_order: sortOrder,
					});

				if (searchTerm) {
					params.append(
						"query",
						searchTerm
					);
				}

				if (filters.start_date) {
					params.append(
						"incident_date_from",
						filters.start_date
					);
				}

				if (filters.end_date) {
					params.append(
						"incident_date_to",
						filters.end_date
					);
				}

				filters.categories?.forEach(
					(id) => {
						params.append(
							"category_ids",
							id
						);
					}
				);

				params.append(
					"user_ids",
					user.id
				);

				const endpoint =
					activeTab === "lost"
						? "lost-reports"
						: "found-reports";

				const response =
					await fetch(
						`${API_URL}/api/v1/${endpoint}?${params}`
					);

				const data =
					await response.json();

				if (!response.ok) {
					throw new Error(
						data.detail ||
							"Failed to fetch reports"
					);
				}

				// ambil categories sekali
				if (
					data.categories &&
					Array.isArray(
						data.categories
					)
				) {
					setCategories(
						data.categories
					);
				}

				return {
					items:
						data.items ?? [],
					total_pages:
						data.total_pages ??
						1,
					current_page:
						data.current_page ??
						1,
					total_items:
						data.total_items ??
						0,
				};
			} catch (err) {
				console.error(err);

				setToast({
					message:
						err.message,
					type: "error",
				});

				return {
					items: [],
					total_pages: 1,
					current_page: 1,
					total_items: 0,
				};
			}
		},
		[activeTab, user?.id]
	);

	const table = useAdminTable({
		fetchFn,
		defaultSort:
			"created_at",
		defaultOrder:
			"desc",
		defaultFilters: {
			start_date: "",
			end_date: "",
			categories: [],
		},
	});

	const renderStatus = (
		status
	) => {
		const variants = {
			open: "info",
			resolved:
				"success",
			closed:
				"secondary",
		};

		const labels = {
			open: "Terbuka",
			resolved:
				"Terselesaikan",
			closed:
				"Ditutup",
		};

		return (
			<StatusBadge
				variant={
					variants[
						status
					] ??
					"secondary"
				}
				label={
					labels[
						status
					] ?? status
				}
			/>
		);
	};

	const handleTabChange = (
		tab
	) => {
		setActiveTab(tab);

		table.handleResetFilter();
	};

	const toggleCategory =
		(categoryId) => {
			const current =
				table.filterInput
					.categories ??
				[];

			const updated =
				current.includes(
					categoryId
				)
					? current.filter(
							(
								id
							) =>
								id !==
								categoryId
					  )
					: [
							...current,
							categoryId,
					  ];

			table.setFilterInput({
				...table.filterInput,
				categories:
					updated,
			});
		};

	return (
		<UserLayout
			user={user}
			handleLogout={
				handleLogout
			}
		>
			<Toast
				show={Boolean(
					toast
				)}
				message={
					toast?.message
				}
				type={toast?.type}
				onClose={() =>
					setToast(
						null
					)
				}
			/>

			<div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 space-y-6">
				<div className="space-y-6">
					{/* HEADER */}
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
						<div className="space-y-3">
							<PageHeader title="Laporan Saya" />

							<p className="text-sm text-gray-500">
								Kelola semua
								laporan barang
								hilang dan
								temuan Anda
							</p>
						</div>
					</div>

					{/* FILTER + TAB */}
					<div className="flex flex-col md:flex-row gap-4 items-stretch">
						<div className="flex-1 min-w-0">
							<AdminSearchFilter
								searchValue={
									table.searchInput
								}
								onSearchChange={(
									e
								) =>
									table.setSearchInput(
										e
											.target
											.value
									)
								}
								onSearchSubmit={
									table.handleSearchSubmit
								}
								searchPlaceholder="Cari laporan..."
								filterTitle="Filter Laporan"
								isFilterActive={
									table.isFilterActive
								}
								onApplyFilter={
									table.handleApplyFilter
								}
								onResetFilter={
									table.handleResetFilter
								}
							>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									<div>
										<label className="text-xs font-bold text-gray-700 mb-1 block">
											Tanggal Mulai
										</label>

										<input
											type="date"
											value={
												table
													.filterInput
													.start_date
											}
											onChange={(
												e
											) =>
												table.setFilterInput(
													{
														...table.filterInput,
														start_date:
															e
																.target
																.value,
													}
												)
											}
											className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
										/>
									</div>

									<div>
										<label className="text-xs font-bold text-gray-700 mb-1 block">
											Tanggal Akhir
										</label>

										<input
											type="date"
											value={
												table
													.filterInput
													.end_date
											}
											onChange={(
												e
											) =>
												table.setFilterInput(
													{
														...table.filterInput,
														end_date:
															e
																.target
																.value,
													}
												)
											}
											className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
										/>
									</div>
								</div>

								{categories.length >
									0 && (
									<div className="mt-4">
										<p className="text-xs font-bold text-gray-700 mb-2">
											Kategori
										</p>

										<div className="flex flex-wrap gap-2">
											{categories.map(
												(
													cat
												) => (
													<button
														key={
															cat.id
														}
														type="button"
														onClick={() =>
															toggleCategory(
																cat.id
															)
														}
														className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
															table.filterInput.categories?.includes(
																cat.id
															)
																? "bg-blue-50 border-blue-200 text-blue-700"
																: "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
														}`}
													>
														{
															cat.name
														}
													</button>
												)
											)}
										</div>
									</div>
								)}
							</AdminSearchFilter>
						</div>

						<TabSelector
							tabs={TABS}
							activeTab={
								activeTab
							}
							onTabChange={
								handleTabChange
							}
						/>
					</div>

					{/* TABLE */}
					<Table
						headers={
							HEADERS
						}
						isLoading={
							table.isLoading
						}
						sortBy={
							table.sortBy
						}
						sortOrder={
							table.sortOrder
						}
						onSort={
							table.handleSort
						}
						page={
							table.page
						}
						totalPages={
							table.totalPages
						}
						onPageChange={
							table.setPage
						}
						isEmpty={
							table.items
								.length ===
							0
						}
						emptyMessage={`Belum ada laporan ${
							activeTab ===
							"lost"
								? "kehilangan"
								: "temuan"
						}`}
					>
						{table.items.map(
							(item) => (
								<tr
									key={
										item.id
									}
									className="hover:bg-blue-50/20 transition-colors border-t border-gray-50"
								>
									{/* TITLE */}
									<td className="px-6 py-4">
										<p className="text-sm font-semibold text-gray-900 truncate max-w-[240px]">
											{
												item.title
											}
										</p>

										<p className="text-[11px] text-gray-400 mt-0.5 font-mono uppercase tracking-wide">
											{item.id.slice(
												0,
												8
											)}
										</p>
									</td>

									{/* LOCATION */}
									<td className="px-6 py-4">
										<div className="flex items-center gap-1.5 text-gray-500">
											<MapPin
												size={
													13
												}
												className="text-gray-400 shrink-0"
											/>

											<span className="text-sm truncate max-w-[160px]">
												{item.location_name ||
													"—"}
											</span>
										</div>
									</td>

									{/* DATE */}
									<td className="px-6 py-4">
										<div className="flex items-center gap-1.5 text-gray-500">
											<Calendar
												size={
													13
												}
												className="text-gray-400 shrink-0"
											/>

											<span className="text-sm">
												{formatDate(
													item.incident_date
												)}
											</span>
										</div>
									</td>

									{/* STATUS */}
									<td className="px-6 py-4">
										{renderStatus(
											item.report_status
										)}
									</td>

									{/* CATEGORY */}
									<td className="px-6 py-4">
										{item.categories &&
										item
											.categories
											.length >
											0 ? (
											<div className="flex flex-wrap gap-1">
												{item.categories
													.slice(
														0,
														2
													)
													.map(
														(
															cat
														) => (
															<span
																key={
																	cat.id
																}
																className="inline-flex px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium"
															>
																{
																	cat.name
																}
															</span>
														)
													)}

												{item
													.categories
													.length >
													2 && (
													<span className="text-xs text-gray-400 self-center">
														+
														{item
															.categories
															.length -
															2}
													</span>
												)}
											</div>
										) : (
											<span className="text-gray-400 text-sm">
												—
											</span>
										)}
									</td>

									{/* ACTION */}
									<td className="px-6 py-4">
										<div className="flex justify-center">
											<ActionBtn
												title="Lihat Detail"
												icon={
													<Eye
														size={
															16
														}
														className="text-blue-500 group-hover:text-blue-700"
													/>
												}
												onClick={() =>
													navigate(
														`/report/${item.id}?type=${item.report_type}`
													)
												}
												hoverClass="hover:bg-blue-100"
											/>
										</div>
									</td>
								</tr>
							)
						)}
					</Table>
				</div>
			</div>
		</UserLayout>
	);
}