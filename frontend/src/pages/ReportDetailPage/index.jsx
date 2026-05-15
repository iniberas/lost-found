import { useState, useEffect } from "react";
import {
	useNavigate,
	useParams,
	useSearchParams,
	useLocation,
} from "react-router-dom";

import {
	MapPin,
	Calendar,
	User as UserIcon,
	Phone,
	Mail,
	Image as ImageIcon,
	CheckCircle2,
	Edit,
	Trash2,
	Shield,
	FileText,
	ArrowLeft,
	QrCode,
} from "lucide-react";

import {
	MapContainer,
	TileLayer,
	Marker,
	Popup,
} from "react-leaflet";

import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import ImagePreviewModal from "../../components/ImagePreviewModal";
import Toast from "../../components/Toast";
import { IPB_COLORS } from "../../constants/colors";
import ConfirmModal from "../../components/ConfirmModal";
import ReportCard from "../../components/ReportCard";
import ViewDetailModal, { CopyButton } from "../../components/ViewDetailModal";
import ReportQrModal from "./ReportQrModal";

import ResolveModal from "./ResolveModal";
import ContactRequestModal from "./ContactRequestModal";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { apiFetch } from "../../utils/api";

const API_URL = import.meta.env.VITE_API_URL;
const DEFAULT_CENTER = [-6.5607, 106.7265];

const markerIcon = new L.Icon({
	iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
	iconRetinaUrl:
		"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
	shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
	iconSize: [25, 41],
	iconAnchor: [12, 41],
});

function InfoRow({ icon: Icon, text }) {
	return (
		<div className="flex items-center gap-3 text-sm text-gray-600">
			<div className="p-2 bg-gray-50 rounded-lg shrink-0">
				<Icon size={15} className="text-gray-400" />
			</div>

			<span className="font-medium break-rows">{text}</span>
		</div>
	);
}

export default function ReportDetailPage({ user, handleLogout }) {
	const navigate = useNavigate();
	const location = useLocation();

	const { id } = useParams();

	const [searchParams] = useSearchParams();
	const activeTab = searchParams.get("type") || "lost";
	const isFound = activeTab === "found";

	const [report, setReport] = useState(null);
	const [loading, setLoading] = useState(true);
	const [activePhotoIndex, setActivePhotoIndex] = useState(0);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showResolveModal, setShowResolveModal] = useState(false);
	const [resolving, setResolving] = useState(false);
	const [resolveNotes, setResolveNotes] = useState("");
	const [proofPhotos, setProofPhotos] = useState([]);
	const [proofPhotoPreviews, setProofPhotoPreviews] = useState([]);
	const [suggestedReports, setSuggestedReports] = useState([]);
	const [loadingSuggestions, setLoadingSuggestions] = useState(false);

	const [previewOpen, setPreviewOpen] = useState(false);
	const [confirmModal, setConfirmModal] = useState(false);

	const [showContactModal, setShowContactModal] = useState(false);
	const [contactMessage, setContactMessage] = useState("");
	const [submittingContact, setSubmittingContact] = useState(false);

	const [existingContactRequest, setExistingContactRequest] = useState(null);
	const [incomingRequestCount, setIncomingRequestCount] = useState(0);
	const [checkingContactRequest, setCheckingContactRequest] = useState(false);

	const [showRequestMessage, setShowRequestMessage] = useState(false);

	const [showQrModal, setShowQrModal] = useState(false);

	// contact info modal state
	const [contactInfoModal, setContactInfoModal] = useState({
		open: false,
		loading: false,
		data: null,
	});

	const fetchExistingContactRequest = async () => {
		try {
			setCheckingContactRequest(true);

			const params = new URLSearchParams({
				request_type: "outgoing",
				report_id: report.id,
				limit: 1,
			});

			const response = await apiFetch(`${API_URL}/api/v1/contact-requests?${params.toString()}`, {
				method: "GET",
				auth: "required",
			})
			if (!response.ok) {
				throw new Error("Failed to fetch contact request");
			}

			const data = await response.json();

			const existingRequest = data.items?.[0] ?? null;

			setExistingContactRequest(existingRequest);
		} catch (err) {
			console.error(
				"Failed to fetch contact request:",
				err
			);
		} finally {
			setCheckingContactRequest(false);
		}
	};

	const fetchIncomingRequests = async () => {
		try {
			const params = new URLSearchParams({
				request_type: "incoming",
				report_id: report.id,
				status: "pending",
				limit: 1,
			});

			const response = await apiFetch(`${API_URL}/api/v1/contact-requests?${params.toString()}`, {
				auth: "required"
			})

			if (!response.ok) {
				throw new Error();
			}

			const data = await response.json();

			setIncomingRequestCount(data.total_items || 0);
		} catch (err) {
			console.error(err);
		}
	};

	const handleOpenContact = async (requestId) => {
		try {
			setContactInfoModal({
				open: true,
				loading: true,
				data: null,
			});

			const response = await apiFetch(`${API_URL}/api/v1/contact-requests/${requestId}/contact`, {
				auth: "required"
			})

			const result = await response
				.json()
				.catch(() => ({}));

			if (!response.ok) {
				throw new Error(
					result.detail || "Failed to fetch contact"
				);
			}

			setContactInfoModal({
				open: true,
				loading: false,
				data: result,
			});
		} catch (err) {
			showToast(err.message, "error");

			setContactInfoModal({
				open: false,
				loading: false,
				data: null,
			});
		}
	};

	const [toast, setToast] = useState(null);
	const showToast = (message, type = "success") => {
		setToast({ message, type });
	};

	useEffect(() => {
		if (location.state?.toast) {
			showToast(
				location.state.toast.message,
				location.state.toast.type
			);

			navigate(
				`${location.pathname}${location.search}`,
				{ replace: true }
			);
		}
	}, [location, navigate]);

	useEffect(() => {
		window.scrollTo(0, 0);
	}, [id]);

	useEffect(() => {
		const fetchReport = async () => {
			setLoading(true);
			try {
				const endpoint = isFound
					? `/api/v1/found-reports/${id}`
					: `/api/v1/lost-reports/${id}`;

				const response = await apiFetch(`${API_URL}${endpoint}`, {
					auth: "optional"
				})

				if (!response.ok) {
					throw new Error(
						"Gagal mengambil data laporan",
					);
				}

				const data = await response.json();
				setReport(data);

				setActivePhotoIndex(0);
			} catch (err) {
				showToast(err.message);
			} finally {
				setLoading(false);
			}
		};

		if (id) fetchReport();
	}, [id, isFound]);

	useEffect(() => {
		if (report) {
			if (isOwnReport) fetchIncomingRequests();
			else if (user) fetchExistingContactRequest();
		}
	}, [report]);


	const isResolved = report?.report_status?.toLowerCase() === "resolved";
	const isClosed = report?.report_status?.toLowerCase() === "closed";

	useEffect(() => {
		const fetchPotentialMatches = async () => {
			if (!id) return;

			setLoadingSuggestions(true);

			try {
				const endpoint = isFound
					? `/api/v1/found-reports/${id}/potential-matches`
					: `/api/v1/lost-reports/${id}/potential-matches`;

				const response = await apiFetch(`${API_URL}${endpoint}`)

				if (!response.ok) throw new Error();

				const data = await response.json();

				setSuggestedReports(data);
			} catch {
				setSuggestedReports([]);
			} finally {
				setLoadingSuggestions(false);
			}
		};

		fetchPotentialMatches();
	}, [id, isFound]);

	const isOwnReport = report?.is_owner;

	const formatDate = (dateStr) => {
		if (!dateStr) return "-";

		return new Date(dateStr).toLocaleString(
			"id-ID",
			{
				day: "numeric",
				month: "long",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			},
		);
	};

	const handlePhotoUpload = (e) => {
		const files = Array.from(e.target.files);

		if (files.length + proofPhotos.length > 5) {
			showToast(
				"Maksimal 5 foto diperbolehkan.",
				"warning",
			);
			return;
		}

		setProofPhotos((prev) => [...prev, ...files]);

		const newPreviews = files.map(
			(file) => URL.createObjectURL(file),
		);

		setProofPhotoPreviews(
			(prev) => [...prev, ...newPreviews],
		);
	};

	const removeProofPhoto = (index) => {
		setProofPhotos((prev) =>
			prev.filter(
				(_, i) => i !== index,
			),
		);

		setProofPhotoPreviews(
			(prev) =>
				prev.filter(
					(_, i) => i !== index,
				),
		);
	};

	const handleResolveClick = () => {
		if (isFound) {
			setShowResolveModal(true);
		} else {
			setConfirmModal(true);
		}
	};

	const handleResolveReport = async () => {
		if (isFound && proofPhotos.length === 0) {
			showToast("Harap upload minimal 1 foto bukti", "error");
			return;
		}

		setResolving(true);

		try {
			const endpoint = isFound
				? `/api/v1/found-reports/${id}/resolve`
				: `/api/v1/lost-reports/${id}/resolve`;

			let response;

			if (isFound) {
				const formData = new FormData();

				if (!resolveNotes.trim()) {
					showToast("Catatan wajib diisi", "error");
					return;
				}
				formData.append("notes", resolveNotes);

				proofPhotos.forEach(
					(photo) => {
						formData.append("proof_photos", photo);
					},
				);

				response = await apiFetch(`${API_URL}${endpoint}`, {
					method: "POST",
					auth: "required",
					body: formData,
				})
			} else {
				response = await apiFetch(`${API_URL}${endpoint}`, {
					method: "POST",
					auth: "required"
				})
			}

			let result = null;

			try {
				result = await response.json();
			} catch {
				result = null;
			}

			if (!response.ok) {
				if (response.status === 404) {
					throw new Error("Laporan tidak ditemukan");
				}
				if (response.status === 403) {
					throw new Error("Anda tidak memiliki izin untuk menyelesaikan laporan ini");
				}
				if (response.status === 422) {
					throw new Error(result?.detail || "Status laporan tidak dapat diubah");
				}
				throw new Error(result?.detail || "Gagal menyelesaikan laporan");
			}

			setReport(result);

			showToast("Laporan berhasil diselesaikan", "success");

			setResolveNotes("");
			setProofPhotos([]);
			setProofPhotoPreviews([]);
			setShowResolveModal(false);
		} catch (err) {
			showToast(err.message, "error");
		} finally {
			setResolving(false);
		}
	};

	const handleDeleteReport = async () => {
		try {
			const endpoint = isFound
				? `/api/v1/found-reports/${id}`
				: `/api/v1/lost-reports/${id}`;

			const response = await apiFetch(`${API_URL}${endpoint}`, {
				method: "DELETE",
				auth: "required",
			})

			if (!response.ok) {
				throw new Error("Gagal menghapus laporan");
			}

			showToast("Laporan berhasil dihapus", "success");
		} catch (err) {
			showToast(err.message, "error");
		}
	};

	const handleContactRequest = async () => {
		try {
			setSubmittingContact(true);
			const response = await apiFetch(`${API_URL}/api/v1/contact-requests`, {
				method: "POST",
				auth: "required",
				body: JSON.stringify({
					report_id: report.id,
					report_type: report.report_type,
					message: contactMessage,
				}),
			})

			const data = await response.json();

			if (!response.ok) {
				throw new Error(
					data.detail ||
					"Failed to send contact request"
				);
			}

			showToast(
				"Contact request sent successfully",
				"success"
			);

			setExistingContactRequest(data);
			setShowContactModal(false);
			setContactMessage("");
		} catch (err) {
			showToast(err.message, "error");
		} finally {
			setSubmittingContact(false);
		}
	};

	const handleOpenContactModal = () => {
		if (!user) {
			navigate("/auth");
			return;
		}
		setShowContactModal(true);
	};

	if (loading) {
		return (
			<>
				<div className="min-h-screen flex items-center justify-center">
					<div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
				</div>
			</>
		);
	}

	if (!report) {
		return (
			<>
				<div className="min-h-screen flex items-center justify-center text-gray-500">
					Laporan tidak ditemukan.
				</div>
			</>
		);
	}

	return (
		<>
			<div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 space-y-6">
				{/* HEADER */}
				<div className="space-y-6">
					{/* TOP */}
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
						<div className="space-y-3">
							<PageHeader title="Report Details" />
						</div>

						{/* BADGES */}
						<div className="flex items-center gap-3">
							<span
								className={`px-4 py-1.5 rounded-lg text-sm font-black uppercase tracking-wider shadow-sm ${isFound
									? "bg-blue-50 text-blue-600 border border-blue-200"
									: "bg-red-50 text-red-600 border border-red-200"
									}`}
							>
								{isFound ? "FOUND ITEM" : "LOST ITEM"}
							</span>

							<StatusBadge
								variant={report.report_status?.toLowerCase()}
							/>
						</div>
					</div>

					{/* ITEM HEADER CARD */}
					<div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
						<div className="flex items-start justify-between gap-6 flex-col lg:flex-row">
							{/* LEFT */}
							<div className="flex items-start gap-5 min-w-0 w-full">
								<div
									className={`w-6 h-6 md:w-16 md:h-16 rounded-2xl flex items-center justify-center border shrink-0 ${isFound
										? "bg-blue-50 border-blue-100"
										: "bg-red-50 border-red-100"
										}`}
								>
									<FileText
										className={
											isFound
												? "text-blue-600 w-5 h-5 md:w-7 md:h-7"
												: "text-red-600 w-5 h-5 md:w-7 md:h-7"
										}
									/>
								</div>

								{/* TITLE */}
								<div className="space-y-3 min-w-0">
									<div>
										<h1 className="text-2xl font-black text-gray-800 leading-tight break-words">
											{report.title || "Untitled Item"}
										</h1>
									</div>

									{/* MINI INFO */}
									<div className="flex flex-wrap items-center gap-3 pt-1">
										<div className="flex items-center gap-2 text-sm text-gray-500">
											<Calendar size={15} />
											{formatDate(report.incident_date)}
										</div>

										<div className="w-1 h-1 rounded-full bg-gray-300" />

										<div className="flex items-center gap-2 text-sm text-gray-500 min-w-0">
											<MapPin size={15} className="shrink-0" />
											<span className="truncate">{report.location_name || "-"}</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* CONTENT */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

						{/* 1 mobile: PHOTO */}
						<div className="order-1 lg:col-span-2 lg:row-start-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
							<div className="relative h-[360px] rounded-2xl overflow-hidden bg-gray-100">
								{report.photos?.length > 0 ? (
									<img
										src={report.photos[activePhotoIndex]}
										alt="report"
										onClick={() => setPreviewOpen(true)}
										className="w-full h-full object-cover cursor-zoom-in"
									/>
								) : (
									<div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
										<ImageIcon size={40} />
										<span className="mt-2 text-sm">Tidak Ada Gambar</span>
									</div>
								)}
							</div>
							{report.photos?.length > 1 && (
								<div className="flex gap-3 mt-4 overflow-x-auto">
									{report.photos.map((photo, idx) => (
										<button
											key={idx}
											onClick={() => setActivePhotoIndex(idx)}
											className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 ${idx === activePhotoIndex ? "border-blue-500" : "border-gray-200"
												}`}
										>
											<img src={photo} alt="" className="w-full h-full object-cover" />
										</button>
									))}
								</div>
							)}
						</div>

						{/* 2 mobile: CATEGORY & DESC — mobile only */}
						<div className="order-2 lg:hidden bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
							<div>
								<h3 className="text-lg font-bold mb-2">Categories</h3>
								<div className="flex flex-wrap gap-2">
									{report.categories?.map((cat) => (
										<span key={cat.id} className="px-3 py-1.5 rounded-xl text-xs font-bold border bg-blue-50 border-blue-200 text-blue-700 shadow-sm">
											{cat.name}
										</span>
									))}
								</div>
							</div>
							<div>
								<h3 className="text-lg font-bold mb-2">Description</h3>
								<div className="w-full p-4 bg-white border border-gray-200 rounded-xl text-sm font-medium shadow-sm break-words whitespace-pre-wrap">
									{report.description || "-"}
								</div>
							</div>
						</div>

						{/* 3 mobile: LOCATION */}
						<div className="order-3 lg:col-span-2 lg:row-start-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
							<div className="flex items-center gap-2">
								<MapPin size={18} style={{ color: IPB_COLORS.blue.primary }} />
								<h3 className="text-lg font-bold">Location</h3>
							</div>
							<div className="w-full p-4 bg-white border border-gray-200 rounded-xl text-sm font-medium shadow-sm break-words">
								{report.location_name || "-"}
							</div>
							<div className="h-[400px] rounded-2xl overflow-hidden border border-gray-200">
								<MapContainer
									center={
										report.location_point
											? [report.location_point.latitude, report.location_point.longitude]
											: [DEFAULT_CENTER[0], DEFAULT_CENTER[1]]
									}
									zoom={16}
									scrollWheelZoom
									style={{ height: "100%", width: "100%" }}
								>
									<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
									{report.location_point && (
										<Marker
											icon={markerIcon}
											position={[report.location_point.latitude, report.location_point.longitude]}
										>
											<Popup>{report.location_name}</Popup>
										</Marker>
									)}
								</MapContainer>
							</div>
						</div>

						{/* SIDEBAR — order-4 mobile, col-start-3 row-start-1 row-span-2 desktop */}
						<div className="order-4 lg:col-start-3 lg:row-start-1 lg:row-span-2 flex flex-col gap-6 self-start">

							{/* Category & Desc — desktop only */}
							<div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
								<div>
									<h3 className="text-lg font-bold mb-2">Categories</h3>
									<div className="flex flex-wrap gap-2">
										{report.categories?.map((cat) => (
											<span key={cat.id} className="px-3 py-1.5 rounded-xl text-xs font-bold border bg-blue-50 border-blue-200 text-blue-700 shadow-sm">
												{cat.name}
											</span>
										))}
									</div>
								</div>
								<div>
									<h3 className="text-lg font-bold mb-2">Description</h3>
									<div className="w-full p-4 bg-white border border-gray-200 rounded-xl text-sm font-medium shadow-sm break-words whitespace-pre-wrap">
										{report.description || "-"}
									</div>
								</div>
							</div>

							{/* REPORTER / OWNER INFO */}
							<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
								<h3 className="text-base font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">
									{isOwnReport ? "Your Report" : "Reported By"}
								</h3>

								<div className="flex items-center gap-3">
									<div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
										<UserIcon size={18} className="text-blue-600" />
									</div>

									<div className="min-w-0">
										<p className="text-xs text-gray-400 mb-1">
											{isOwnReport ? "Owner" : "Reporter"}
										</p>

										<p className="font-semibold text-gray-800 truncate">
											{report.reporter?.name || "-"}
										</p>
									</div>
								</div>
							</div>

							{/* STORAGE LOCATION */}
							{isFound && report.storage_location && (
								<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
									<div>
										<h3 className="text-base font-bold text-gray-900">
											Storage Location
										</h3>

										<p className="text-sm text-gray-500 mt-1">
											Barang ini disimpan oleh admin dan saat ini berada di lokasi berikut.
										</p>
									</div>

									<div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
										<div className="flex items-start gap-3">
											<div className="p-2 rounded-xl bg-white border border-blue-100">
												<MapPin size={18} className="text-blue-600" />
											</div>

											<div className="min-w-0 flex-1">
												<h4 className="font-bold text-blue-900 break-words">
													{report.storage_location.name}
												</h4>

												<p className="text-sm text-blue-700 mt-1 whitespace-pre-wrap break-words">
													{report.storage_location.description || "-"}
												</p>
											</div>
										</div>
									</div>

									{report.storage_location.location_point && (
										<div className="h-[260px] rounded-2xl overflow-hidden border border-gray-200">
											<MapContainer
												center={[
													report.storage_location.location_point.latitude,
													report.storage_location.location_point.longitude,
												]}
												zoom={17}
												scrollWheelZoom
												style={{ height: "100%", width: "100%" }}
											>
												<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

												<Marker
													icon={markerIcon}
													position={[
														report.storage_location.location_point.latitude,
														report.storage_location.location_point.longitude,
													]}
												>
													<Popup>
														{report.storage_location.name}
													</Popup>
												</Marker>
											</MapContainer>
										</div>
									)}
								</div>
							)}

							{/* Actions */}
							<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:sticky lg:top-6">
								<h3 className="text-base font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">
									Actions
								</h3>
								{isClosed ? (
									<div className="rounded-2xl border border-red-200 bg-red-50 p-4">
										<div className="flex items-start gap-3">
											<div className="p-2 rounded-xl bg-red-100">
												<Trash2 size={18} className="text-red-600" />
											</div>
											<div>
												<h4 className="font-bold text-red-700">Laporan Sudah Dihapus</h4>
												<p className="text-sm text-red-600 mt-1">
													Laporan ini telah dihapus dan tidak dapat diubah lagi.
												</p>
											</div>
										</div>
									</div>
								) : isResolved ? (
									<div className="rounded-2xl border border-green-200 bg-green-50 p-4">
										<div className="flex items-start gap-3">
											<div className="p-2 rounded-xl bg-green-100">
												<CheckCircle2 size={18} className="text-green-600" />
											</div>
											<div>
												<h4 className="font-bold text-green-700">Laporan Sudah Diselesaikan</h4>
												<p className="text-sm text-green-600 mt-1">
													Laporan ini telah ditandai sebagai resolved dan tidak dapat diubah lagi.
												</p>
											</div>
										</div>
									</div>
								) : (
									<div className="flex flex-col gap-3">
										{isOwnReport ? (
											<>
												{incomingRequestCount > 0 && (
													<div className="mb-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
														<div className="flex items-start gap-3">
															<div className="p-2 rounded-xl bg-yellow-100">
																<UserIcon size={18} className="text-yellow-700" />
															</div>
															<div className="flex-1">
																<h4 className="font-bold text-yellow-800">
																	Ada {incomingRequestCount} contact request masuk
																</h4>
																<p className="text-sm text-yellow-700 mt-1">
																	Seseorang ingin menghubungimu terkait laporan ini.
																</p>
																<button
																	onClick={() => navigate(`/my-requests?tab=incoming&search=${encodeURIComponent(report.title || "")}`)}
																	className="mt-3 px-4 py-2 rounded-xl bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold transition-colors"
																>
																	Lihat Requests
																</button>
															</div>
														</div>
													</div>
												)}
												<button
													onClick={() => navigate(`/update-report/${id}?type=${activeTab}`)}
													className="w-full py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
													style={{ backgroundColor: IPB_COLORS.blue.primary }}
												>
													<Edit size={16} />
													Edit Report
												</button>

												{isFound && (
													<button
														onClick={() => setShowQrModal(true)}
														className="w-full py-2.5 rounded-xl text-sm font-semibold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
													>
														<QrCode size={16} />
														Show Handover QR
													</button>
												)}
												<button
													onClick={() => handleResolveClick()}
													className="w-full py-2.5 rounded-xl text-sm font-semibold bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
												>
													<CheckCircle2 size={16} />
													Resolve
												</button>
												<button
													onClick={() => setShowDeleteModal(true)}
													className="w-full py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
												>
													<Trash2 size={16} />
													Delete Report
												</button>
											</>
										) : (
											<div>
												{checkingContactRequest ? (
													<div className="w-full py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 text-sm font-medium text-center animate-pulse">
														Checking request status...
													</div>
												) : existingContactRequest ? (
													<div className="space-y-3">
														{existingContactRequest.status === "pending" && (
															<>
																<div className="w-full py-3 px-4 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm shadow-sm">
																	<p className="font-semibold">Kamu sudah mengirim contact request.</p>
																	<p className="text-xs mt-1 text-yellow-600">Menunggu respon dari pembuat laporan.</p>
																	{showRequestMessage && existingContactRequest.message && (
																		<div className="mt-3 p-3 rounded-lg bg-white/70 border border-yellow-100 text-gray-700 text-sm whitespace-pre-wrap">
																			{existingContactRequest.message}
																		</div>
																	)}
																</div>
																{existingContactRequest.message && (
																	<button
																		onClick={() => setShowRequestMessage(!showRequestMessage)}
																		className="w-full py-2 rounded-xl border border-yellow-200 bg-white text-yellow-700 text-sm font-medium hover:bg-yellow-50 transition-colors"
																	>
																		{showRequestMessage ? "Hide Message" : "Show Message"}
																	</button>
																)}
															</>
														)}
														{existingContactRequest.status === "approved" && (
															<>
																<div className="w-full py-3 px-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm shadow-sm">
																	<p className="font-semibold">Contact request disetujui.</p>
																	<p className="text-xs mt-1 text-green-600">Kamu sekarang bisa melihat kontak pembuat laporan.</p>
																</div>
																<button
																	onClick={() => handleOpenContact(existingContactRequest.id)}
																	className="w-full py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity"
																	style={{ backgroundColor: IPB_COLORS.blue.primary }}
																>
																	Lihat Kontak
																</button>
															</>
														)}
														{existingContactRequest.status === "rejected" && (
															<div className="space-y-3">
																<div className="w-full py-3 px-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm shadow-sm">
																	<p className="font-semibold">Contact request ditolak.</p>
																	<p className="text-xs mt-1 text-red-600">
																		Kamu sudah pernah membuat contact request, tapi ditolak oleh pembuat laporan.{" "}
																		<button
																			onClick={() => navigate(`/my-requests?tab=outgoing&search=${encodeURIComponent(report.title || "")}`)}
																			className="underline font-semibold hover:text-red-800 transition-colors"
																		>
																			Lihat selengkapnya
																		</button>
																	</p>
																	{showRequestMessage && existingContactRequest.response_message && (
																		<div className="mt-3 p-3 rounded-lg bg-white/70 border border-yellow-100 text-gray-700 text-sm whitespace-pre-wrap">
																			{existingContactRequest.response_message}
																		</div>
																	)}
																</div>
																{existingContactRequest.response_message && (
																	<button
																		onClick={() => setShowRequestMessage(!showRequestMessage)}
																		className="w-full py-2 rounded-xl border border-red-200 bg-white text-red-700 text-sm font-medium hover:bg-red-50 transition-colors"
																	>
																		{showRequestMessage ? "Hide Response Message" : "Show Response Message"}
																	</button>
																)}
																<button
																	onClick={handleOpenContactModal}
																	className="w-full py-2.5 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center gap-2"
																>
																	Kirim Ulang Request
																</button>
															</div>
														)}
														{existingContactRequest.status === "canceled" && (
															<div className="space-y-3">
																<div className="w-full py-3 px-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-sm shadow-sm">
																	<p className="font-semibold">Contact request dibatalkan.</p>
																	<p className="text-xs mt-1 text-gray-500">
																		Kamu sudah pernah membuat contact request, tapi dibatalkan.{" "}
																		<button
																			onClick={() => navigate(`/my-requests?tab=outgoing&search=${encodeURIComponent(report.title || "")}`)}
																			className="underline font-semibold hover:text-gray-700 transition-colors"
																		>
																			Lihat selengkapnya
																		</button>
																	</p>
																</div>
																<button
																	onClick={handleOpenContactModal}
																	className="w-full py-2.5 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center gap-2"
																>
																	Kirim Ulang Request
																</button>
															</div>
														)}
													</div>
												) : (
													<button
														onClick={handleOpenContactModal}
														className="w-full py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity"
														style={{ backgroundColor: IPB_COLORS.blue.primary }}
													>
														{isFound ? "Request Contact" : "Saya Menemukan Ini"}
													</button>
												)}
											</div>
										)}
									</div>
								)}
							</div>
						</div>

						{/* 5 mobile: BARANG SERUPA */}
						<div className="order-5 lg:col-span-2 lg:row-start-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
							<h3 className="text-lg font-bold mb-5">Barang Serupa</h3>
							{loadingSuggestions ? (
								<p className="text-sm text-gray-400">Memuat barang serupa...</p>
							) : suggestedReports.length === 0 ? (
								<p className="text-sm text-gray-400">Tidak ada barang serupa ditemukan.</p>
							) : (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
									{suggestedReports.map((item) => {
										const matchType = isFound ? "lost" : "found";
										return (
											<ReportCard
												key={item.id}
												item={item}
												compact
												onClick={() => navigate(`/report/${item.id}?type=${matchType}`)}
											/>
										);
									})}
								</div>
							)}
						</div>

					</div>
				</div>

				{/* CONFIRM MODAL (buat lost report) */}
				<ConfirmModal
					open={confirmModal}
					onClose={() => setConfirmModal(false)}
					onConfirm={() => {
						setConfirmModal(false);
						handleResolveReport();
					}}
					title="Selesaikan Laporan?"
					message="Laporan yang sudah diselesaikan tidak dapat diubah lagi."
					confirmText="Confirm"
					cancelText="Cancel"
					loading={resolving}
					icon={CheckCircle2}
					iconClassName="text-green-600"
					confirmButtonClassName="bg-green-600 hover:bg-green-700"
				/>

				{/* IMAGE PREVIEW MODAL */}
				<ImagePreviewModal
					open={previewOpen}
					photos={report.photos}
					activeIndex={activePhotoIndex}
					onClose={() =>
						setPreviewOpen(false)
					}
					onPrev={() =>
						setActivePhotoIndex((prev) =>
							prev === 0
								? report.photos.length - 1
								: prev - 1,
						)
					}
					onNext={() =>
						setActivePhotoIndex((prev) =>
							prev ===
								report.photos.length - 1
								? 0
								: prev + 1,
						)
					}
				/>

				<ConfirmModal
					open={showDeleteModal}
					onClose={() => setShowDeleteModal(false)}
					onConfirm={() => {
						setShowDeleteModal(false);
						handleDeleteReport();
					}}
					title="Hapus Laporan?"
					message="Laporan yang sudah dihapus tidak dapat dipulihkan lagi."
					confirmText="Delete"
					cancelText="Cancel"
					icon={Trash2}
					iconClassName="text-red-600"
					confirmButtonClassName="bg-red-600 hover:bg-red-700"
				/>

				{/* RESOLVE MODAL */}
				<ResolveModal
					isOpen={showResolveModal}
					onClose={() =>
						setShowResolveModal(false)
					}
					resolving={resolving}
					resolveNotes={resolveNotes}
					setResolveNotes={setResolveNotes}
					proofPhotos={proofPhotos}
					proofPhotoPreviews={proofPhotoPreviews}
					handlePhotoUpload={handlePhotoUpload}
					removeProofPhoto={removeProofPhoto}
					handleSubmit={handleResolveReport}
				/>

				{/* CONTACT REQUEST MODAL */}
				<ContactRequestModal
					isOpen={showContactModal}
					onClose={() => setShowContactModal(false)}
					submitting={submittingContact}
					message={contactMessage}
					setMessage={setContactMessage}
					handleSubmit={handleContactRequest}
					isFound={isFound}
				/>
			</div>

			{/* CONTACT INFO MODAL — using ViewDetailModal */}
			<ViewDetailModal
				open={contactInfoModal.open}
				onClose={() =>
					setContactInfoModal({ open: false, loading: false, data: null })
				}
				title="Kontak Pengguna"
				icon={UserIcon}
				iconClassName="text-blue-500"
			>
				{contactInfoModal.loading ? (
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
									<UserIcon size={15} className="text-gray-400" />
								</div>
								<p className="font-medium text-sm text-gray-800 flex-1">
									{contactInfoModal.data?.other_user?.name || "-"}
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
									{contactInfoModal.data?.other_user?.email || "-"}
								</p>
								{contactInfoModal.data?.other_user?.email && (
									<CopyButton value={contactInfoModal.data.other_user.email} />
								)}
							</div>
						</div>

						{/* PHONE */}
						<div>
							<p className="text-xs text-gray-400 mb-1">Phone number</p>
							<div className="flex items-center gap-2">
								<div className="p-2 bg-gray-50 rounded-lg shrink-0">
									<Phone size={15} className="text-gray-400" />
								</div>
								<p className="font-medium text-sm text-gray-800 flex-1">
									{contactInfoModal.data?.other_user?.phone_number || "-"}
								</p>
								{contactInfoModal.data?.other_user?.phone_number && (
									<CopyButton value={contactInfoModal.data.other_user.phone_number} />
								)}
							</div>
						</div>
					</div>
				)}
			</ViewDetailModal>

			<ReportQrModal
				open={showQrModal}
				onClose={() => setShowQrModal(false)}
				reportId={report.id}
			/>

			<Toast
				show={Boolean(toast)}
				message={toast?.message}
				type={toast?.type}
				onClose={() => setToast(null)}
			/>
		</>
	);
}