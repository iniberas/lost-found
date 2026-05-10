import React, { useCallback, useEffect, useRef, useState } from "react";
import {
	User,
	MessageSquare,
	CheckCircle2,
	XCircle,
	Clock3,
	Mail,
	Phone,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { buildParams } from "../../utils/adminApi";

import UserLayout from "../../layouts/UserLayout";
import PageHeader from "../../components/PageHeader";

import Table from "../../components/Table";
import SearchFilter from "../../components/SearchFilter";
import TabSelector from "../../components/admin/TabSelector";
import StatusBadge from "../../components/admin/StatusBadge";
import Toast from "../../components/Toast";
import ConfirmModal from "../../components/ConfirmModal";
import ViewDetailModal, { CopyButton } from "../../components/ViewDetailModal";

import {
	ActionBtn,
	FilterSelect,
	formatDate,
} from "../../components/admin/FilterHelpers";

import { useTable } from "../../hooks/useTable";

const API_URL = import.meta.env.VITE_API_URL;
const LIMIT = 15;

const TABS = [
	{ id: "incoming", label: "Incoming Requests" },
	{ id: "outgoing", label: "Outgoing Requests" },
];

const DEFAULT_FILTERS = {
	// status: "",
	status: "pending",
};

const HEADERS = [
	{
		label: "Requester / Target",
		key: "user",
		sortable: false,
	},
	{
		label: "Report",
		key: "report",
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

export default function MyContactRequestsPage({ user, handleLogout }) {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const urlSearch = searchParams.get("search") || "";
	const urlStatus = searchParams.get("status") || "";

	// Initialize tab & search from URL params
	const [activeTab, setActiveTab] = useState(
		searchParams.get("tab") || "incoming"
	);

	// contact info modal
	const [contactModal, setContactModal] = useState({
		open: false,
		loading: false,
		data: null,
	});

	// message detail modal
	const [messageModal, setMessageModal] = useState({
		open: false,
		data: null,
	});

	const [confirmModal, setConfirmModal] = useState({
		open: false,
		title: "",
		message: "",
		onConfirm: null,
		confirmText: "Confirm",
		confirmButtonClassName: "",
		icon: null,
		iconClassName: "",
	});

	const [toast, setToast] = useState(null);
	const showToast = (message, type = "success") => {
		setToast({ message, type });
	};

	const fetchFn = useCallback(
		async ({ page, searchTerm, sortBy, sortOrder, filters }) => {
			const token = localStorage.getItem("access_token");

			const qs = buildParams({
				page,
				limit: LIMIT,
				request_type: activeTab,

				...(filters.status && {
					status: filters.status,
				}),

				...(searchTerm && {
					search: searchTerm,
				}),

				sort_by: sortBy,
				sort_order: sortOrder,
			});

			const response = await fetch(
				`${API_URL}/api/v1/contact-requests?${qs}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.detail || "Failed");
			}

			return data;
		},
		[activeTab]
	);

	const openConfirmModal = ({
		title,
		message,
		onConfirm,
		confirmText = "Confirm",
		confirmButtonClassName = "",
		icon = null,
		iconClassName = "",
	}) => {
		setConfirmModal({
			open: true,
			title,
			message,
			onConfirm,
			confirmText,
			confirmButtonClassName,
			icon,
			iconClassName,
		});
	};

	const closeConfirmModal = () => {
		setConfirmModal((prev) => ({
			...prev,
			open: false,
		}));
	};

	const table = useTable({
		fetchFn,
		defaultSort: "created_at",
		defaultOrder: "desc",
		defaultSearch: urlSearch,
		defaultFilters: DEFAULT_FILTERS,
	});

	const handleTabChange = (tab) => {
		setActiveTab(tab);
		// table.handleResetFilter();

		setSearchParams((prev) => {
			const next = new URLSearchParams(prev);
			next.set("tab", tab);
			next.delete("search");
			return next;
		});
	};

	const handleResetFilterWithUrl = () => {
		table.handleResetFilter();

		setSearchParams((prev) => {
			const next = new URLSearchParams(prev);

			next.delete("search");
			next.delete("status");
			next.set("tab", activeTab);

			return next;
		});
	};

	const updateRequestStatus = (requestId, status) => {
		table.setItems((prev) =>
			prev.map((item) =>
				item.id === requestId
					? {
						...item,
						status,
						responded_at: new Date().toISOString(),
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
				throw new Error(data.detail || "Failed to approve request");
			}

			showToast("Contact request approved", "success");
			updateRequestStatus(requestId, "approved");
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
				throw new Error(data.detail || "Failed to reject request");
			}

			showToast("Contact request rejected", "success");
			updateRequestStatus(requestId, "rejected");
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
				throw new Error(data.detail || "Failed to cancel request");
			}

			showToast("Contact request canceled", "success");
			updateRequestStatus(requestId, "canceled");
		} catch (err) {
			console.error(err);

			showToast(err.message, "error");
		}
	};

	const handleOpenContact = async (requestId) => {
		try {
			setContactModal({
				open: true,
				loading: true,
				data: null,
			});

			const token = localStorage.getItem("access_token");

			const response = await fetch(
				`${API_URL}/api/v1/contact-requests/${requestId}/contact`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			const result = await response.json().catch(() => ({}));

			if (!response.ok) {
				throw new Error(result.detail || "Failed to fetch contact");
			}

			setContactModal({
				open: true,
				loading: false,
				data: result,
			});
		} catch (err) {
			showToast(err.message, "error");

			setContactModal({
				open: false,
				loading: false,
				data: null,
			});
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
		<UserLayout user={user} handleLogout={handleLogout}>
			<div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 space-y-6">
				{/* HEADER */}
				<div className="space-y-6">
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
						<div className="space-y-3">
							<PageHeader title="Permintaan Kontak" />
							<p className="text-sm text-gray-500">
								Kelola semua contact request Anda
							</p>
						</div>
					</div>

					{/* FILTER + TABS */}
					<div className="flex flex-col md:flex-row gap-4 items-stretch">
						<div className="flex-1 min-w-0">
							<SearchFilter
								searchValue={table.searchInput}
								onSearchChange={(e) => table.setSearchInput(e.target.value)}
								onSearchSubmit={(e) => {
									table.handleSearchSubmit(e);

									const params = {
										tab: activeTab,
									};

									if (table.searchInput) {
										params.search = table.searchInput;
									}

									if (table.filterInput.status) {
										params.status = table.filterInput.status;
									}

									setSearchParams(params);
								}}
								searchPlaceholder="Search request..."
								filterTitle="Filter Requests"
								isFilterActive={table.isFilterActive}
								onApplyFilter={() => {
									table.handleApplyFilter();

									const params = {
										tab: activeTab,
									};

									if (table.searchInput) {
										params.search = table.searchInput;
									}

									if (table.filterInput.status) {
										params.status = table.filterInput.status;
									}

									setSearchParams(params);
								}}
								onResetFilter={handleResetFilterWithUrl}
							>
								<FilterSelect
									label="Status"
									value={table.filterInput.status}
									onChange={(v) =>
										table.setFilterInput({
											...table.filterInput,
											status: v,
										})
									}
									options={[
										{ value: "pending", label: "Pending" },
										{ value: "approved", label: "Approved" },
										{ value: "rejected", label: "Rejected" },
										{ value: "canceled", label: "Canceled" },
									]}
								/>
							</SearchFilter>
						</div>

						<TabSelector
							tabs={TABS}
							activeTab={activeTab}
							onTabChange={handleTabChange}
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
						totalPages={table.totalPages}
						onPageChange={table.setPage}
						isEmpty={table.items.length === 0}
						emptyMessage="No contact requests found."
					>
						{table.items.map((row) => {
							const otherUser =
								activeTab === "incoming" ? row.requester : row.target_user;

							const canSeeUser =
								activeTab === "incoming" || row.status === "approved";

							const isProfileClickable =
								row.status === "approved";

							return (
								<tr
									key={row.id}
									className="hover:bg-blue-50/30 transition-colors border-t border-gray-50"
								>
									{/* USER */}
									<td className="px-6 py-4">
										<div className="flex items-center gap-3 min-w-0">
											<div
												className={`w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 ${isProfileClickable ? "cursor-pointer hover:bg-blue-100 transition-colors" : ""}`}
												onClick={() => {
													if (isProfileClickable) handleOpenContact(row.id);
												}}
											>
												<User size={18} className="text-blue-500" />
											</div>

											<div className="min-w-0">
												{canSeeUser ? (
													<>
														<p
															className={`font-semibold truncate max-w-[180px] ${isProfileClickable
																? "text-blue-600 cursor-pointer hover:underline"
																: "text-gray-800"
																}`}
															onClick={() => {
																if (isProfileClickable) handleOpenContact(row.id);
															}}
														>
															{otherUser?.name || "Unknown User"}
														</p>
														<p className="text-xs text-gray-400">
															{isProfileClickable ? "Klik untuk melihat kontak" : "Kontak akan terlihat setelah pemintaan kontak diapprove"}
														</p>
													</>
												) : (
													<>
														<p className="font-semibold text-gray-500">
															Hidden User
														</p>
														<p className="text-xs text-gray-400">
															User akan terlihat setelah request kamu diapprove
														</p>
													</>
												)}
											</div>
										</div>
									</td>

									{/* REPORT — clickable, navigates to report detail */}
									<td className="px-6 py-4">
										<div
											className="max-w-[240px] cursor-pointer group"
											onClick={() =>
												navigate(
													`/report/${row.report_id}?type=${row.report_type}`
												)
											}
										>
											<p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 group-hover:underline underline-offset-2 transition-colors">
												{row.report_title || "Untitled Report"}
											</p>

											<p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">
												{row.report_description || "—"}
											</p>
										</div>
									</td>

									{/* MESSAGE — clickable */}
									<td className="px-6 py-4">
										<div
											className={`max-w-[260px] ${row.message ? "cursor-pointer group" : ""}`}
											onClick={() => {
												if (row.message) {
													setMessageModal({ open: true, data: row });
												}
											}}
										>
											<div className="flex items-start gap-2">
												<MessageSquare
													size={14}
													className={`mt-0.5 shrink-0 transition-colors ${row.message ? "text-blue-400 group-hover:text-blue-600" : "text-gray-400"}`}
												/>

												<p className={`text-sm line-clamp-3 break-words transition-colors ${row.message ? "text-gray-600 group-hover:text-blue-600 group-hover:underline underline-offset-2" : "text-gray-400"}`}>
													{row.message || "—"}
												</p>
											</div>
										</div>
									</td>

									{/* STATUS */}
									<td className="px-6 py-4">
										<div className="flex items-center gap-2">
											{row.status === "pending" && (
												<Clock3 size={14} className="text-yellow-500" />
											)}

											{row.status === "approved" && (
												<CheckCircle2 size={14} className="text-green-500" />
											)}

											{(row.status === "rejected" ||
												row.status === "canceled") && (
													<XCircle size={14} className="text-red-500" />
												)}

											{renderStatus(row.status)}
										</div>
									</td>

									{/* CREATED */}
									<td className="px-6 py-4 text-sm text-gray-600">
										{formatDate(row.created_at)}
									</td>

									{/* RESPONDED */}
									<td className="px-6 py-4 text-sm text-gray-500">
										{row.responded_at ? formatDate(row.responded_at) : "—"}
									</td>

									{/* ACTION */}
									<td className="px-6 py-4">
										<div className="flex flex-wrap items-center justify-center gap-2">
											{/* incoming pending */}
											{activeTab === "incoming" && row.status === "pending" && (
												<>
													<ActionBtn
														title="Approve"
														icon={
															<CheckCircle2
																size={17}
																className="text-green-500"
															/>
														}
														onClick={() =>
															openConfirmModal({
																title: "Approve Contact Request?",
																message:
																	"Pengguna ini akan bisa melihat informasi kontakmu.",
																confirmText: "Approve",
																confirmButtonClassName:
																	"bg-green-600 hover:bg-green-700",
																icon: CheckCircle2,
																iconClassName: "text-green-600",
																onConfirm: () => handleApprove(row.id),
															})
														}
														hoverClass="hover:bg-green-100"
													/>

													<ActionBtn
														title="Reject"
														icon={
															<XCircle size={17} className="text-red-500" />
														}
														onClick={() =>
															openConfirmModal({
																title: "Reject Contact Request?",
																message:
																	"Pengguna tidak akan bisa melihat informasi kontakmu.",
																confirmText: "Reject",
																confirmButtonClassName:
																	"bg-red-600 hover:bg-red-700",
																icon: XCircle,
																iconClassName: "text-red-600",
																onConfirm: () => handleReject(row.id),
															})
														}
														hoverClass="hover:bg-red-100"
													/>
												</>
											)}

											{/* outgoing pending */}
											{activeTab === "outgoing" && row.status === "pending" && (
												<ActionBtn
													title="Cancel"
													icon={<XCircle size={17} className="text-red-500" />}
													onClick={() =>
														openConfirmModal({
															title: "Cancel Contact Request?",
															message:
																"Permintaan kontak akan dibatalkan.",
															confirmText: "Cancel Request",
															confirmButtonClassName:
																"bg-red-600 hover:bg-red-700",
															icon: XCircle,
															iconClassName: "text-red-600",
															onConfirm: () => handleCancel(row.id),
														})
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

			{/* CONTACT INFO MODAL */}
			<ViewDetailModal
				open={contactModal.open}
				onClose={() =>
					setContactModal({ open: false, loading: false, data: null })
				}
				title="Contact Information"
				icon={User}
				iconClassName="text-blue-500"
			>
				{contactModal.loading ? (
					<div className="py-10 flex justify-center">
						<div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
					</div>
				) : (
					<div className="space-y-4">
						{/* NAME */}
						<div>
							<p className="text-xs text-gray-400 mb-1">Name</p>
							<div className="flex items-center gap-2">
								<div className="p-2 bg-gray-50 rounded-lg shrink-0">
									<User size={15} className="text-gray-400" />
								</div>
								<p className="font-medium text-sm text-gray-800 flex-1">
									{contactModal.data?.other_user?.name || "-"}
								</p>
							</div>
						</div>

						{/* EMAIL */}
						<div>
							<p className="text-xs text-gray-400 mb-1">Email</p>
							<div className="flex items-center gap-2">
								<div className="p-2 bg-gray-50 rounded-lg shrink-0">
									<Mail size={15} className="text-gray-400" />
								</div>
								<p className="font-medium text-sm text-gray-800 flex-1 truncate">
									{contactModal.data?.other_user?.email || "-"}
								</p>
								{contactModal.data?.other_user?.email && (
									<CopyButton value={contactModal.data.other_user.email} />
								)}
							</div>
						</div>

						{/* PHONE */}
						<div>
							<p className="text-xs text-gray-400 mb-1">Phone number</p>
							<div className="flex items-center gap-2">
								<div className="p-2 bg-gray-50 rounded-lg shrink-0">
									<Mail size={15} className="text-gray-400" />
								</div>
								<p className="font-medium text-sm text-gray-800 flex-1">
									{contactModal.data?.other_user?.phone_number || "-"}
								</p>
								{contactModal.data?.other_user?.phone_number && (
									<CopyButton value={contactModal.data.other_user.phone_number} />
								)}
							</div>
						</div>
					</div>
				)}
			</ViewDetailModal>

			{/* MESSAGE DETAIL MODAL */}
			<ViewDetailModal
				open={messageModal.open}
				onClose={() => setMessageModal({ open: false, data: null })}
				title="Message Detail"
				icon={MessageSquare}
				iconClassName="text-blue-500"
			>
				{messageModal.data && (
					<div className="space-y-4">
						{/* REPORT CONTEXT */}
						<div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
							<p className="text-xs text-gray-400 mb-0.5">Report</p>
							<p className="text-sm font-semibold text-gray-800">
								{messageModal.data.report_title || "Untitled Report"}
							</p>
						</div>

						{/* FULL MESSAGE */}
						<div>
							<p className="text-xs text-gray-400 mb-1">Message</p>
							<p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
								{messageModal.data.message || "—"}
							</p>
						</div>
					</div>
				)}
			</ViewDetailModal>

			<ConfirmModal
				open={confirmModal.open}
				onClose={closeConfirmModal}
				onConfirm={() => {
					closeConfirmModal();
					if (confirmModal.onConfirm) {
						confirmModal.onConfirm();
					}
				}}
				title={confirmModal.title}
				message={confirmModal.message}
				confirmText={confirmModal.confirmText}
				icon={confirmModal.icon}
				iconClassName={confirmModal.iconClassName}
				confirmButtonClassName={confirmModal.confirmButtonClassName}
			/>

			<Toast
				show={Boolean(toast)}
				message={toast?.message}
				type={toast?.type}
				onClose={() => setToast(null)}
			/>
		</UserLayout>
	);
}