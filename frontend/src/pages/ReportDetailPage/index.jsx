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
	X,
	FileText,
	Camera,
	ArrowLeft,
} from "lucide-react";

import {
	MapContainer,
	TileLayer,
	Marker,
	Popup,
} from "react-leaflet";

import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/admin/StatusBadge";
import Toast from "../../components/Toast";
import { IPB_COLORS } from "../../constants/colors";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import UserLayout from "../../layouts/UserLayout";

const API_URL = import.meta.env.VITE_API_URL;

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

			<span className="font-medium truncate">{text}</span>
		</div>
	);
}

function ResolveModal({
	isOpen,
	onClose,
	resolving,
	resolveNotes,
	setResolveNotes,
	proofPhotos,
	handlePhotoChange,
	handleSubmit,
}) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
			<div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
				<div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
					<h3 className="font-bold text-gray-900 flex items-center gap-2">
						<CheckCircle2 size={18} className="text-green-600" />
						Resolve
					</h3>

					<button
						onClick={onClose}
						className="p-1 hover:bg-gray-100 rounded-lg"
					>
						<X size={18} />
					</button>
				</div>

				<div className="p-6 space-y-5">
					<div>
						<label className="block text-sm font-semibold mb-2">
							Proof Photo
						</label>

						<label className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition">
							<Camera className="text-gray-400 mb-2" size={24} />

							<span className="text-sm text-gray-500">
								Upload proof photo
							</span>

							<input
								type="file"
								multiple
								accept="image/*"
								className="hidden"
								onChange={handlePhotoChange}
							/>
						</label>

						<p className="text-xs text-gray-500 mt-2">
							{proofPhotos.length > 0
								? `${proofPhotos.length} photo selected`
								: "Upload minimal 1 photo"}
						</p>
					</div>

					<div>
						<label className="block text-sm font-semibold mb-2">
							Resolution Notes
						</label>

						<textarea
							value={resolveNotes}
							onChange={(e) =>
								setResolveNotes(e.target.value)
							}
							className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Jelaskan bagaimana barang dikembalikan..."
						/>
					</div>
				</div>

				<div className="p-4 border-t border-gray-100 flex justify-end gap-3">
					<button
						onClick={onClose}
						className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-100"
					>
						Cancel
					</button>

					<button
						onClick={handleSubmit}
						disabled={resolving || proofPhotos.length === 0}
						className="px-4 py-2 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
					>
						{resolving ? "Processing..." : "Confirm"}
					</button>
				</div>
			</div>
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
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [activePhotoIndex, setActivePhotoIndex] = useState(0);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showResolveModal, setShowResolveModal] = useState(false);
	const [resolving, setResolving] = useState(false);
	const [resolveNotes, setResolveNotes] = useState("");
	const [proofPhotos, setProofPhotos] = useState([]);
	const [suggestedReports, setSuggestedReports] = useState([]);
	const [loadingSuggestions, setLoadingSuggestions] = useState(false);

	const defaultCenter = {
		lat: -6.5921,
		lng: 106.7942,
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

			// hapus state biar ga muncul lagi pas refresh
			navigate(location.pathname, { replace: true });
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

				const response = await fetch(
					`${API_URL}${endpoint}`,
				);

				if (!response.ok) {
					throw new Error(
						"Gagal mengambil data laporan",
					);
				}

				const data = await response.json();

				setReport(data);

				setActivePhotoIndex(0);
			} catch (err) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		if (id) fetchReport();
	}, [id, isFound]);

	useEffect(() => {
		const fetchPotentialMatches = async () => {
			if (!id) return;

			setLoadingSuggestions(true);

			try {
				const endpoint = isFound
					? `/api/v1/found-reports/${id}/potential-matches`
					: `/api/v1/lost-reports/${id}/potential-matches`;

				const response = await fetch(
					`${API_URL}${endpoint}`,
				);

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

	const isOwnReport =
		user &&
		report &&
		user.id === report.reporter?.id;

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

	const handlePhotoChange = (e) => {
		const files = Array.from(e.target.files);

		setProofPhotos(files);
	};

	const handleResolveSubmit = async () => {
		try {
			setResolving(true);

			setTimeout(() => {
				setResolving(false);
				setShowResolveModal(false);
				showToast("EHH INI LOM DIIMPLEMENT, BOONGAN DOANG BEJIR", "error");
				// showToast("Laporan berhasil diselesaikan");
			}, 1500);
		} catch {
			setResolving(false);
		}
	};

	if (loading) {
		return (
			<UserLayout
				user={user}
				handleLogout={handleLogout}
			>
				<div className="min-h-screen flex items-center justify-center">
					<div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
				</div>
			</UserLayout>
		);
	}

	if (!report) {
		return (
			<UserLayout
				user={user}
				handleLogout={handleLogout}
			>
				<div className="min-h-screen flex items-center justify-center text-gray-500">
					Laporan tidak ditemukan.
				</div>
			</UserLayout>
		);
	}

	return (
		<UserLayout
			user={user}
			handleLogout={handleLogout}
		>
			<Toast
				show={Boolean(toast)}
				message={toast?.message}
				type={toast?.type}
				onClose={() => setToast(null)}
			/>
			<div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 space-y-6">
				{/* HEADER */}
				<div className="space-y-6">
					{/* TOP */}
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
						<div className="space-y-3">

							{/* PAGE HEADER */}
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
							<div className="flex items-start gap-5">
								<div
									className={`w-16 h-16 rounded-2xl flex items-center justify-center border shrink-0 ${isFound
										? "bg-blue-50 border-blue-100"
										: "bg-red-50 border-red-100"
										}`}
								>
									<FileText
										size={28}
										className={
											isFound
												? "text-blue-600"
												: "text-red-600"
										}
									/>
								</div>

								{/* TITLE*/}
								<div className="space-y-3">
									<div>
										<h1 className="text-2xl font-black text-gray-800 leading-tight">
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

										<div className="flex items-center gap-2 text-sm text-gray-500">
											<MapPin size={15} />
											{report.location_name || "-"}
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* CONTENT */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{/* LEFT */}
						<div className="lg:col-span-2 space-y-6">
							{/* PHOTO */}
							<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
								<div className="relative h-[360px] rounded-2xl overflow-hidden bg-gray-100">
									{report.photos?.length > 0 ? (
										<img
											src={
												report.photos[
												activePhotoIndex
												]
											}
											alt="report"
											className="w-full h-full object-cover"
										/>
									) : (
										<div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
											<ImageIcon size={40} />

											<span className="mt-2 text-sm">
												Tidak Ada Gambar
											</span>
										</div>
									)}
								</div>

								{report.photos?.length > 1 && (
									<div className="flex gap-3 mt-4 overflow-x-auto">
										{report.photos.map(
											(photo, idx) => (
												<button
													key={idx}
													onClick={() =>
														setActivePhotoIndex(
															idx,
														)
													}
													className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 ${idx ===
														activePhotoIndex
														? "border-blue-500"
														: "border-gray-200"
														}`}
												>
													<img
														src={photo}
														alt=""
														className="w-full h-full object-cover"
													/>
												</button>
											),
										)}
									</div>
								)}
							</div>

							{/* LOCATION */}
							<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
								<div className="flex items-center gap-2">
									<MapPin size={18} style={{ color: IPB_COLORS.blue.primary }} />
									<h3 className="text-lg font-bold">
										Location
									</h3>
								</div>

								<div className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all resize-none shadow-sm">
									{report.location_name || "-"}
								</div>

								<div className="h-[400px] rounded-2xl overflow-hidden border border-gray-200">
									<MapContainer
										center={
											report.location_point
												? [
													report.location_point
														.latitude,
													report.location_point
														.longitude,
												]
												: [
													defaultCenter.lat,
													defaultCenter.lng,
												]
										}
										zoom={13}
										scrollWheelZoom
										style={{
											height: "100%",
											width: "100%",
										}}
									>
										<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

										{report.location_point && (
											<Marker
												icon={markerIcon}
												position={[
													report.location_point
														.latitude,
													report.location_point
														.longitude,
												]}
											>
												<Popup>
													{report.location_name}
												</Popup>
											</Marker>
										)}
									</MapContainer>
								</div>
							</div>

							{/* SUGGESTIONS */}
							<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
								<h3 className="text-lg font-bold mb-5">
									Barang Serupa
								</h3>

								{loadingSuggestions ? (
									<p className="text-sm text-gray-400">
										Memuat barang serupa...
									</p>
								) : suggestedReports.length ===
									0 ? (
									<p className="text-sm text-gray-400">
										Tidak ada barang serupa
										ditemukan.
									</p>
								) : (
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
										{suggestedReports.map(
											(item) => {
												const matchType =
													isFound
														? "lost"
														: "found";

												return (
													<button
														key={item.id}
														onClick={() =>
															navigate(
																`/report/${item.id}?type=${matchType}`,
															)
														}
														className="text-left border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition"
													>
														<div className="h-44 bg-gray-100">
															{item.photos?.[0] ? (
																<img
																	src={
																		item.photos[0]
																	}
																	alt={item.title}
																	className="w-full h-full object-cover"
																/>
															) : (
																<div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
																	Tidak Ada Gambar
																</div>
															)}
														</div>

														<div className="p-4">
															<h4 className="font-bold line-clamp-1">
																{item.title}
															</h4>

															<p className="text-sm text-gray-500 mt-2 line-clamp-2">
																{
																	item.description
																}
															</p>
														</div>
													</button>
												);
											},
										)}
									</div>
								)}
							</div>
						</div>

						{/* SIDEBAR */}
						<div className="space-y-6">
							{/* DETAILS */}
							<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
								<div>
									<h3 className="text-lg font-bold mb-2">
										Categories
									</h3>

									<div className="flex flex-wrap gap-2">
										{report.categories?.map(
											(cat) => (
												<span
													key={cat.id}
													// className="px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 border border-blue-200 text-blue-700"
													className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
												>
													{cat.name}
												</span>
											),
										)}
									</div>
								</div>

								<div>
									<h3 className="text-lg font-bold mb-2">
										Description
									</h3>

									<div className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all resize-none shadow-sm">
										{report.description || "-"}
									</div>
								</div>
							</div>

							{/* ACTIONS */}
							<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-6">
								<h3 className="text-base font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">
									Actions
								</h3>

								<div className="flex flex-col gap-3">
									{isOwnReport ? (
										<>
											<button
												onClick={() => navigate(`/update-report/${id}?type=${activeTab}`)}
												className="w-full py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
												style={{ backgroundColor: IPB_COLORS.blue.primary }}
											>
												<Edit size={16} />
												Edit Report
											</button>

											<button
												onClick={() => setShowResolveModal(true)}
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
										<button
											className="w-full py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity"
											style={{ backgroundColor: IPB_COLORS.blue.primary }}
										>
											{isFound ? "Request Contact" : "Saya Menemukan Ini"}
										</button>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* DELETE MODAL */}
				{showDeleteModal && (
					<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
						<div className="bg-white rounded-2xl w-full max-w-md p-6">
							<h3 className="text-lg font-bold">
								Hapus Laporan
							</h3>

							<p className="text-sm text-gray-500 mt-2">
								Apakah Anda yakin ingin menghapus
								laporan ini?
							</p>

							<div className="flex justify-end gap-3 mt-6">
								<button
									onClick={() =>
										setShowDeleteModal(false)
									}
									className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-100"
								>
									Cancel
								</button>

								<button className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700">
									Delete
								</button>
							</div>
						</div>
					</div>
				)}

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
					handlePhotoChange={handlePhotoChange}
					handleSubmit={handleResolveSubmit}
				/>
			</div>
		</UserLayout>
	);
}