import React, { useCallback, useState } from "react";
import {
	Eye,
	User,
	MessageSquare,
	CheckCircle2,
	XCircle,
	Clock3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import UserLayout from "../../layouts/UserLayout";
import PageHeader from "../../components/PageHeader";

import Table from "../../components/Table";
import AdminSearchFilter from "../../components/admin/SearchFilter";
import TabSelector from "../../components/admin/TabSelector";
import StatusBadge from "../../components/admin/StatusBadge";
import Toast from "../../components/Toast";

import {
	ActionBtn,
	FilterSelect,
	formatDate,
} from "../../components/admin/FilterHelpers";

import { useAdminTable } from "../../hooks/useAdminTable";

const API_URL = import.meta.env.VITE_API_URL;
const LIMIT = 15;

const TABS = [
	{ id: "incoming", label: "Incoming Requests" },
	{ id: "outgoing", label: "Outgoing Requests" },
];

const DEFAULT_FILTERS = {
	status: "",
};

const HEADERS = [
	{
		label: "Requester / Target",
		key: "user",
		sortable: false,
	},
	{
		label: "Message",
		key: "message",
		sortable: false,
	},
	{
		label: "Status",
		key: "status",
		sortable: false,
	},
	{
		label: "Created At",
		key: "created_at",
		sortable: true,
	},
	{
		label: "Responded At",
		key: "responded_at",
		sortable: true,
	},
	{
		label: "Action",
		key: "action",
		sortable: false,
		className: "text-center",
	},
];

export default function MyContactRequestsPage({
	user,
	handleLogout,
}) {
	const navigate = useNavigate();

	const [activeTab, setActiveTab] =
		useState("incoming");

	const [toast, setToast] = useState(null);
	const showToast = (message, type = "success") => {
		setToast({ message, type });
	};

	const fetchFn = useCallback(
		async ({
			page,
			searchTerm,
			sortBy,
			sortOrder,
			filters,
		}) => {
			try {
				const token =
					localStorage.getItem(
						"access_token"
					);

				const response = await fetch(
					`${API_URL}/api/v1/contact-requests?page=${page}&limit=${LIMIT}&request_type=${activeTab}&sort_by=${sortBy}&sort_order=${sortOrder}${filters.status
						? `&status=${filters.status}`
						: ""
					}`,
					{
						method: "GET",
						headers: {
							"Content-Type":
								"application/json",
							Authorization: `Bearer ${token}`,
						},
					},
				);

				const data =
					await response.json();

				if (!response.ok) {
					throw new Error(
						data.detail ||
						"Failed to fetch contact requests"
					);
				}

				let items = data.items ?? [];

				// frontend search sementara
				if (searchTerm) {
					const keyword =
						searchTerm.toLowerCase();

					items = items.filter(
						(item) => {
							const otherUser =
								activeTab ===
									"incoming"
									? item.requester
									: item.target_user;

							return (
								otherUser?.name
									?.toLowerCase()
									.includes(
										keyword,
									) ||
								item.message
									?.toLowerCase()
									.includes(
										keyword,
									)
							);
						},
					);
				}

				return {
					items,
					total_pages:
						data.total_pages,
					current_page:
						data.current_page,
					total_items:
						data.total_items,
				};
			} catch (err) {
				console.error(err);

				showToast(
					err.message,
					"error"
				);

				return {
					items: [],
					total_pages: 1,
					current_page: 1,
					total_items: 0,
				};
			}
		},
		[activeTab],
	);

	const table = useAdminTable({
		fetchFn,
		defaultSort: "created_at",
		defaultOrder: "desc",
		defaultFilters: DEFAULT_FILTERS,
	});

	const handleTabChange = (tab) => {
		setActiveTab(tab);
		table.handleResetFilter();
	};

	const updateRequestStatus = (
		requestId,
		status
	) => {
		table.setItems((prev) =>
			prev.map((item) =>
				item.id === requestId
					? {
						...item,
						status,
						responded_at:
							new Date().toISOString(),
					}
					: item
			)
		);
	};
	const handleApprove = async (requestId) => {
		try {
			const token = localStorage.getItem("access_token");

			const response = await fetch(
				`${API_URL}/api/v1/contact-requests/${requestId}/approve`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
				}
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(
					data.detail ||
					"Failed to approve request"
				);
			}
			showToast(
				"Contact request approved",
				"success"
			);
			updateRequestStatus(requestId, "approved")
		} catch (err) {
			console.error(err);

			showToast(err.message, "error");
		}
	};

	const handleReject = async (requestId) => {
		try {
			const token = localStorage.getItem("access_token");

			const response = await fetch(
				`${API_URL}/api/v1/contact-requests/${requestId}/reject`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
				}
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(
					data.detail ||
					"Failed to reject request"
				);
			}

			showToast(
				"Contact request rejected",
				"success"
			);
			updateRequestStatus(requestId, "rejected")
		} catch (err) {
			console.error(err);

			showToast(err.message, "error");
		}
	};

	const handleCancel = async (requestId) => {
		try {
			const token = localStorage.getItem("access_token");

			const response = await fetch(
				`${API_URL}/api/v1/contact-requests/${requestId}/cancel`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
				}
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(
					data.detail ||
					"Failed to cancel request"
				);
			}

			showToast(
				"Contact request canceled",
				"success"
			);
			updateRequestStatus(requestId, "canceled")
		} catch (err) {
			console.error(err);

			showToast(err.message, "error");
		}
	};
	const renderStatus = (status) => {
		const variants = {
			pending: "warning",
			approved: "success",
			rejected: "danger",
			canceled: "secondary",
		};

		const labels = {
			pending: "Pending",
			approved: "Approved",
			rejected: "Rejected",
			canceled: "Canceled",
		};

		return (
			<StatusBadge
				variant={variants[status] ?? "secondary"}
				label={labels[status] ?? status}
			/>
		);
	};
	return (
		<UserLayout
			user={user}
			handleLogout={handleLogout}
		>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 space-y-6">
				{/* HEADER */}
				<div className="space-y-6">
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
						<div className="space-y-3">
							<PageHeader title="Permintaan Kontak" />
							<p className="text-sm text-gray-500">
								Kelola semua laporan barang hilang dan temuan Anda
							</p>
						</div>
					</div>

					{/* FILTER + TABS */}
					<div className="flex flex-col md:flex-row gap-4 items-stretch">
						<div className="flex-1 min-w-0">
							<AdminSearchFilter
								searchValue={
									table.searchInput
								}
								onSearchChange={(e) =>
									table.setSearchInput(
										e.target.value,
									)
								}
								onSearchSubmit={
									table.handleSearchSubmit
								}
								searchPlaceholder="Search request..."
								filterTitle="Filter Requests"
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
								<FilterSelect
									label="Status"
									value={
										table.filterInput
											.status
									}
									onChange={(v) =>
										table.setFilterInput(
											{
												...table.filterInput,
												status:
													v,
											},
										)
									}
									options={[
										{
											value:
												"pending",
											label:
												"Pending",
										},
										{
											value:
												"approved",
											label:
												"Approved",
										},
										{
											value:
												"rejected",
											label:
												"Rejected",
										},
										{
											value:
												"canceled",
											label:
												"Canceled",
										},
									]}
								/>
							</AdminSearchFilter>
						</div>

						<TabSelector
							tabs={TABS}
							activeTab={activeTab}
							onTabChange={
								handleTabChange
							}
						/>
					</div>

					{/* TABLE */}
					<Table
						headers={HEADERS}
						isLoading={table.isLoading}
						sortBy={table.sortBy}
						sortOrder={table.sortOrder}
						onSort={table.handleSort}
						page={table.page}
						totalPages={
							table.totalPages
						}
						onPageChange={
							table.setPage
						}
						isEmpty={
							table.items.length === 0
						}
						emptyMessage="No contact requests found."
					>
						{table.items.map((row) => {
							const otherUser =
								activeTab === "incoming"
									? row.requester
									: row.target_user;

							const canSeeUser =
								activeTab === "incoming" ||
								row.status === "approved";

							return (
								<tr
									key={row.id}
									className="hover:bg-blue-50/30 transition-colors border-t border-gray-50"
								>
									{/* USER */}
									<td className="px-6 py-4">
										<div className="flex items-center gap-3 min-w-0">
											<div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
												<User
													size={18}
													className="text-blue-500"
												/>
											</div>

											<div className="min-w-0">
												{canSeeUser ? (
													<>
														<p className="font-semibold text-gray-800 truncate max-w-[180px]">
															{otherUser?.name || "Unknown User"}
														</p>

														<p className="text-xs text-gray-400 truncate max-w-[180px]">
															{otherUser?.email || "—"}
														</p>
													</>
												) : (
													<>
														<p className="font-semibold text-gray-500">
															Hidden User
														</p>

														<p className="text-xs text-gray-400">
															Approve request to view
														</p>
													</>
												)}
											</div>
										</div>
									</td>

									{/* MESSAGE */}
									<td className="px-6 py-4">
										<div className="max-w-[260px]">
											<div className="flex items-start gap-2">
												<MessageSquare
													size={
														14
													}
													className="text-gray-400 mt-0.5 shrink-0"
												/>

												<p className="text-sm text-gray-600 line-clamp-3 break-words">
													{row.message ||
														"—"}
												</p>
											</div>
										</div>
									</td>

									{/* STATUS */}
									<td className="px-6 py-4">
										<div className="flex items-center gap-2">
											{row.status ===
												"pending" && (
													<Clock3
														size={
															14
														}
														className="text-yellow-500"
													/>
												)}

											{row.status ===
												"approved" && (
													<CheckCircle2
														size={
															14
														}
														className="text-green-500"
													/>
												)}

											{(row.status ===
												"rejected" ||
												row.status ===
												"canceled") && (
													<XCircle
														size={
															14
														}
														className="text-red-500"
													/>
												)}

											{
												renderStatus(
													row.status
												)
											}
										</div>
									</td>

									{/* CREATED */}
									<td className="px-6 py-4 text-sm text-gray-600">
										{formatDate(
											row.created_at,
										)}
									</td>

									{/* RESPONDED */}
									<td className="px-6 py-4 text-sm text-gray-500">
										{row.responded_at
											? formatDate(
												row.responded_at,
											)
											: "—"}
									</td>

									{/* ACTION */}
									<td className="px-6 py-4">
										<div className="flex flex-wrap items-center justify-center gap-2">
											<ActionBtn
												title="View Report"
												icon={
													<Eye
														size={
															17
														}
														className="text-blue-400 group-hover:text-blue-700"
													/>
												}
												onClick={() =>
													navigate(
														`/report/${row.report_id}?type=${row.report_type}`,
													)
												}
												hoverClass="hover:bg-blue-100"
											/>

											{/* incoming pending */}
											{activeTab ===
												"incoming" &&
												row.status ===
												"pending" && (
													<>
														<ActionBtn
															title="Approve"
															icon={
																<CheckCircle2
																	size={
																		17
																	}
																	className="text-green-500"
																/>
															}
															onClick={() =>
																handleApprove(
																	row.id,
																)
															}
															hoverClass="hover:bg-green-100"
														/>

														<ActionBtn
															title="Reject"
															icon={
																<XCircle
																	size={
																		17
																	}
																	className="text-red-500"
																/>
															}
															onClick={() =>
																handleReject(
																	row.id,
																)
															}
															hoverClass="hover:bg-red-100"
														/>
													</>
												)}

											{/* outgoing pending */}
											{activeTab ===
												"outgoing" &&
												row.status ===
												"pending" && (
													<ActionBtn
														title="Cancel"
														icon={
															<XCircle
																size={
																	17
																}
																className="text-red-500"
															/>
														}
														onClick={() =>
															handleCancel(
																row.id,
															)
														}
														hoverClass="hover:bg-red-100"
													/>
												)}
										</div>
									</td>
								</tr>
							);
						})}
					</Table>
				</div>
			</div>
			<Toast
				show={Boolean(toast)}
				message={toast?.message}
				type={toast?.type}
				onClose={() => setToast(null)}
			/>
		</UserLayout>
	);
}