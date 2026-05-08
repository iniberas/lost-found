import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import {
	UploadCloud,
	MapPin,
	Calendar,
	FileText,
	X,
	Crosshair,
} from "lucide-react";
import { MapContainer, TileLayer } from "react-leaflet";
import { LocationPicker } from "../../components/LocationPicker";
import { IPB_COLORS } from "../../constants/colors";
import ConfirmModal from "../../components/ConfirmModal";


const API_URL = import.meta.env.VITE_API_URL;

export default function CreateReportForm({ reportType = 'kehilangan', onSuccess, showToast }) {
	const navigate = useNavigate();

	const [categories, setCategories] = useState([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState({
		title: "",
		description: "",
		location_name: "",
		incident_date: "",
		category_ids: [],
	});
	const [photos, setPhotos] = useState([]);
	const [photoPreviews, setPhotoPreviews] = useState([]);

	const defaultCenter = { lat: -6.5921, lng: 106.7942 };
	const [mapCenter, setMapCenter] = useState(defaultCenter);
	const [selectedPosition, setSelectedPosition] = useState(null);
	const [locationStatus, setLocationStatus] = useState("");

	const [confirmModal, setConfirmModal] = useState(false);

	const isFoundReport = reportType === 'penemuan';

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const token = localStorage.getItem("access_token");
				const response = await fetch(
					`${API_URL}/api/v1/categories`,
					{
						headers: { Authorization: `Bearer ${token}` },
					},
				);
				if (response.ok) {
					const data = await response.json();
					setCategories(data.filter(cat => cat.is_active));
				}
			} catch (error) {
				console.error("Gagal mengambil kategori:", error);
			}
		};
		fetchCategories();
	}, []);

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const toggleCategory = (catId) => {
		setFormData((prev) => {
			const isSelected = prev.category_ids.includes(catId);
			if (isSelected) {
				return {
					...prev,
					category_ids: prev.category_ids.filter((id) => id !== catId),
				};
			} else {
				return { ...prev, category_ids: [...prev.category_ids, catId] };
			}
		});
	};

	const handlePhotoUpload = (e) => {
		const files = Array.from(e.target.files);
		if (files.length + photos.length > 5) {
			showToast("Maksimal 5 foto diperbolehkan.", "warning");
			return;
		}
		setPhotos((prev) => [...prev, ...files]);
		const newPreviews = files.map((file) => URL.createObjectURL(file));
		setPhotoPreviews((prev) => [...prev, ...newPreviews]);
	};

	const removePhoto = (index) => {
		setPhotos(photos.filter((_, i) => i !== index));
		setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
	};

	const handleAskLocation = () => {
		if (!navigator.geolocation) {
			showToast("Browser Anda tidak mendukung fitur Geolocation.", "warning");
			return;
		}
		setLocationStatus("Meminta izin...");
		navigator.geolocation.getCurrentPosition(
			(position) => {
				const currentPos = {
					lat: position.coords.latitude,
					lng: position.coords.longitude,
				};
				setMapCenter(currentPos);
				setSelectedPosition(currentPos);
				setLocationStatus("");
			},
			(error) => {
				let errorMsg = "Gagal mendapatkan lokasi.";
				if (error.code === error.PERMISSION_DENIED)
					errorMsg = "Izin lokasi ditolak oleh browser.";
				showToast(errorMsg, "error");
				setLocationStatus("");
			},
			{ enableHighAccuracy: true, timeout: 10000 },
		);
	};

	const validateForm = () => {
		if (
			!formData.title ||
			!formData.incident_date ||
			!formData.location_name ||
			formData.category_ids.length === 0
		) {
			showToast("Mohon lengkapi field yang wajib!", "warning");
			return false;
		}

		const selectedDate = new Date(formData.incident_date);
		const now = new Date();
		const minDate = new Date();
		minDate.setFullYear(now.getFullYear() - 10);

		if (selectedDate > now) {
			showToast("Waktu kejadian tidak boleh di masa depan.", "warning");
			return false;
		}

		if (selectedDate < minDate) {
			showToast(
				"Waktu kejadian maksimal 10 tahun terakhir.",
				"warning"
			);
			return false;
		}

		if (isFoundReport && photos.length === 0) {
			showToast("Laporan penemuan wajib memiliki minimal 1 foto.", "warning");
			return false;
		}

		return true;
	};
	const submitReport = async () => {
		setIsSubmitting(true);

		try {
			const token = localStorage.getItem("access_token");

			const endpoint =
				reportType === "penemuan"
					? "/api/v1/found-reports"
					: "/api/v1/lost-reports";

			const submitData = new FormData();

			submitData.append("title", formData.title);
			submitData.append("description", formData.description);
			submitData.append("location_name", formData.location_name);

			const dateISO = new Date(formData.incident_date).toISOString();
			submitData.append("incident_date", dateISO);

			if (selectedPosition) {
				submitData.append(
					"latitude",
					selectedPosition.lat.toString()
				);

				submitData.append(
					"longitude",
					selectedPosition.lng.toString()
				);
			}

			formData.category_ids.forEach((id) =>
				submitData.append("category_ids", id)
			);

			photos.forEach((photo) =>
				submitData.append("photos", photo)
			);

			const response = await fetch(`${API_URL}${endpoint}`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: submitData,
			});

			if (!response.ok) {
				const err = await response.json();
				throw new Error(
					err.detail || "Gagal membuat laporan"
				);
			}

			// sukses
			navigate("/home", {
				state: {
					toast: {
						type: "success",
						message: `Laporan ${reportType === "penemuan"
								? "penemuan barang"
								: "kehilangan barang"
							} berhasil dibuat!`,
					},
				},
			});
			onSuccess?.();

		} catch (error) {
			showToast(error.message, "error");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form className="p-8 md:p-10">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
				<div className="flex flex-col gap-6">
					<div>
						<label className="block text-[13px] font-bold text-gray-800 mb-2">
							Nama Barang <span className="text-red-500">*</span>
						</label>
						<div className="relative">
							<FileText
								className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
								size={18}
							/>
							<input
								required
								type="text"
								name="title"
								value={formData.title}
								onChange={handleInputChange}
								placeholder="Misal: Dompet Kulit Coklat"
								className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all shadow-sm"
							/>
						</div>
					</div>

					<div>
						<label className="block text-[13px] font-bold text-gray-800 mb-2">
							Deskripsi <span className="text-red-500">*</span>
						</label>
						<textarea
							name="description"
							value={formData.description}
							onChange={handleInputChange}
							rows="6"
							placeholder="Sebutkan ciri-ciri spesifik (merk, warna, isi di dalamnya, kondisi)..."
							className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all resize-none shadow-sm"
						></textarea>
					</div>

					<div>
						<label className="block text-[13px] font-bold text-gray-800 mb-2">
							Kategori <span className="text-red-500">*</span>
						</label>
						<div className="flex flex-wrap gap-2">
							{categories.map((cat) => (
								<button
									key={cat.id}
									type="button"
									onClick={() => toggleCategory(cat.id)}
									className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${formData.category_ids.includes(cat.id) ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm"}`}
								>
									{cat.name}
								</button>
							))}
							{categories.length === 0 && (
								<p className="text-xs text-gray-400 italic py-1.5">
									Memuat kategori...
								</p>
							)}
						</div>
					</div>

					{/*Waktu Kejadian*/}
					<div>
						<label className="block text-[13px] font-bold text-gray-800 mb-2">
							Waktu Kejadian <span className="text-red-500">*</span>
						</label>
						<div className="relative">
							<Calendar
								className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
								size={18}
							/>
							<input
								required
								type="datetime-local"
								name="incident_date"
								value={formData.incident_date}
								onChange={handleInputChange}
								className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all shadow-sm"
							/>
						</div>
					</div>

					{/* Foto */}
					<div>
						<label className="block text-[13px] font-bold text-gray-800 mb-2">
							Foto
							{isFoundReport && (
								<span className="text-red-500 ml-1">*</span>
							)}

							<span className="text-gray-400 font-normal ml-1">
								(Maks 5)
							</span>
						</label>
						<div className="p-4 bg-white border-2 border-dashed border-gray-200 rounded-2xl shadow-sm flex flex-col gap-4">
							{photoPreviews.length > 0 && (
								<div className="flex gap-3 overflow-x-auto pb-2">
									{photoPreviews.map((src, idx) => (
										<div
											key={idx}
											className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 shrink-0 group"
										>
											<img
												src={src}
												alt="Preview"
												className="w-full h-full object-cover"
											/>
											<button
												type="button"
												onClick={() => removePhoto(idx)}
												className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
											>
												<X size={12} />
											</button>
										</div>
									))}
								</div>
							)}

							{photoPreviews.length < 5 && (
								<label className="cursor-pointer bg-gray-50 border border-gray-200 rounded-xl py-4 flex flex-col items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition-colors w-full">
									<UploadCloud className="text-blue-500 mb-1" size={20} />
									<span className="text-[11px] font-bold text-gray-500">
										{isFoundReport
											? "Klik untuk memilih foto (minimal 1)"
											: "Klik untuk memilih foto (opsional)"}
									</span>
									<input
										type="file"
										accept="image/*"
										multiple
										onChange={handlePhotoUpload}
										className="hidden"
									/>
								</label>
							)}
						</div>
					</div>
				</div>

				<div className="flex flex-col gap-6">
					<div className="flex flex-col gap-3">
						<label className="block text-[13px] font-bold text-gray-800">
							Lokasi Kejadian <span className="text-red-500">*</span>
						</label>

						<div className="relative">
							<MapPin
								className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
								size={18}
							/>
							<input
								required
								type="text"
								name="location_name"
								value={formData.location_name}
								onChange={handleInputChange}
								placeholder="Ketik nama lokasi (Misal: Kantin, Perpustakaan)..."
								className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all shadow-sm"
							/>
						</div>

						<div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mt-1 shadow-sm">
							<div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
								<span className="text-[11px] text-gray-500 font-medium">
									Klik peta untuk pin lokasi (Opsional)
								</span>
								<div className="flex items-center gap-2">
									{selectedPosition && (
										<button
											type="button"
											onClick={() => setSelectedPosition(null)}
											className="text-[11px] font-bold text-red-600 bg-white hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border border-red-200 shadow-sm"
										>
											<X size={12} /> Reset Peta
										</button>
									)}
									<button
										type="button"
										onClick={handleAskLocation}
										className="text-[11px] font-bold text-blue-600 bg-white hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border border-blue-200 shadow-sm"
									>
										<Crosshair size={12} /> Lokasi Saat Ini
									</button>
								</div>
							</div>

							{locationStatus && (
								<div className="px-4 py-2 bg-amber-50 text-amber-700 text-[11px] font-medium border-b border-amber-100 flex items-center gap-2">
									<span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
									{locationStatus}
								</div>
							)}

							<div className="h-[400px] w-full bg-gray-100 z-0 relative">
								<MapContainer
									center={mapCenter}
									zoom={13}
									scrollWheelZoom={true}
									style={{ height: "100%", width: "100%" }}
								>
									<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
									<LocationPicker
										position={selectedPosition}
										setPosition={setSelectedPosition}
										center={mapCenter}
									/>
								</MapContainer>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="mt-10 pt-6 border-t border-gray-100 flex justify-end">
				<button
					type="button"
					disabled={isSubmitting}
					className="w-full py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity"
					style={{ backgroundColor: IPB_COLORS.blue.primary }}
					onClick={() => {
						const isValid = validateForm();

						if (isValid) {
							setConfirmModal(true);
						}
					}}
				>
					{isSubmitting ? "Menyimpan Data..." : "Submit"}
				</button>
			</div>
			<ConfirmModal
				open={confirmModal}
				onClose={() => setConfirmModal(false)}
				onConfirm={() => {
					setConfirmModal(false);
					submitReport();
				}}
				title="Submit Laporan?"
				message="Pastikan data yang dimasukkan sudah benar."
				loading={isSubmitting}
			/>
		</form>

	);
}