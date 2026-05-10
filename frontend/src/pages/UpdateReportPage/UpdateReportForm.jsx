import React, { useState, useEffect } from 'react';
import { replace, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  UploadCloud,
  X,
  FileText,
  Calendar,
  MapPin,
  User,
  Phone,
  Crosshair,
} from 'lucide-react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { LocationPicker } from '../../components/LocationPicker';
import { IPB_COLORS } from "../../constants/colors";

const API_URL = import.meta.env.VITE_API_URL;

export default function UpdateReportForm({ user, showToast }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('type') || 'lost';

  const [formData, setFormData] = useState({
    title: '',
    category_ids: [],
    incident_date: '',
    location_name: '',
    description: '',
    finder_name: '',
    finder_contact: '',
  });

  const [categories, setCategories] = useState([]);

  // Photo state
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [photosToRemove, setPhotosToRemove] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);
  const [newPhotosPreviews, setNewPhotosPreviews] = useState([]);

  // Map state
  const defaultCenter = { lat: -6.5921, lng: 106.7942 };
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [locationStatus, setLocationStatus] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
        try {
        const token = localStorage.getItem('access_token');
        const endpoint = (activeTab === 'found')
					? `/api/v1/found-reports/${id}`
					: `/api/v1/lost-reports/${id}`;

				const response = await fetch(
					`${API_URL}${endpoint}`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					},
				);

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.detail || 'Gagal mengambil data laporan');
        }

        const data = await response.json();

        if (!data.is_owner) {
          navigate("/home", {
            replace: true,
            state: {
              toast: {
                type: "warning",
                message: "EHH gabole asal ngedit laporan orang dong!!"
              },
            },
          });
          return;
        }

        if (data.report_status?.toLowerCase() === "resolved") {
          navigate(`/report/${id}?type=${activeTab}`, {
            replace: true,
            state: {
              toast: {
                type: "error",
                message: "Laporan yang sudah resolved tidak dapat diedit"
              },
            },
          });
          return;
        }

        const dateStr = data.incident_date
          ? new Date(data.incident_date).toISOString().slice(0, 16)
          : '';

        setFormData({
          title: data.title || '',
          category_ids: data.categories?.map((c) => c.id) || [],
          incident_date: dateStr,
          location_name: data.location_name || '',
          description: data.description || '',
          finder_name: data.finder_name || '',
          finder_contact: data.finder_contact || '',
        });
        setExistingPhotos(data.photos || []);

        if (data.latitude && data.longitude) {
          const pos = { lat: data.latitude, lng: data.longitude };
          setSelectedPosition(pos);
          setMapCenter(pos);
        }
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    };

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

    if (id && user) { // Pastikan user sudah ada sebelum fetch
      fetchReport();
      fetchCategories();
    } else {
      showToast("User tidak ditemukan", "error")
      // console.log(user)
    }
  }, [id, activeTab, user, navigate]); // Tambahkan user & navigate ke dependency

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

  const handleRemoveExistingPhoto = (photoUrl) => {
    setPhotosToRemove((prev) => [...prev, photoUrl]);
    setExistingPhotos((prev) => prev.filter((p) => p !== photoUrl));
  };

  const handleNewPhotosChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const totalPhotos = existingPhotos.length + newPhotos.length + files.length;
    if (totalPhotos > 5) {
      showToast("Maksimal 5 foto diperbolehkan.", "warning");
      return;
    }

    setNewPhotos((prev) => [...prev, ...files]);
    const previews = files.map((f) => URL.createObjectURL(f));
    setNewPhotosPreviews((prev) => [...prev, ...previews]);
  };

  const handleRemoveNewPhoto = (index) => {
    URL.revokeObjectURL(newPhotosPreviews[index]);
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
    setNewPhotosPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAskLocation = () => {
    if (!navigator.geolocation) {
      showToast("Browser Anda tidak mendukung fitur Geolocation.", "warning");
      return;
    }
    setLocationStatus('Meminta izin...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setMapCenter(currentPos);
        setSelectedPosition(currentPos);
        setLocationStatus('');
      },
      (error) => {
        let errorMsg = 'Gagal mendapatkan lokasi.';
        if (error.code === error.PERMISSION_DENIED)
          errorMsg = 'Izin lokasi ditolak oleh browser.';
        showToast(errorMsg, "error");
        setLocationStatus('');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    // setError('');

    try {
      const token = localStorage.getItem('access_token');
      const endpoint =
        activeTab === 'found'
          ? `/api/v1/found-reports/${id}`
          : `/api/v1/lost-reports/${id}`;

      const form = new FormData();
      form.append('title', formData.title);
      form.append('description', formData.description);
      form.append('location_name', formData.location_name);

      if (formData.incident_date) {
        form.append('incident_date', new Date(formData.incident_date).toISOString());
      }

      if (selectedPosition) {
        form.append('latitude', selectedPosition.lat.toString());
        form.append('longitude', selectedPosition.lng.toString());
      }

      formData.category_ids.forEach((cid) => form.append('category_ids', cid));
      photosToRemove.forEach((url) => form.append('photos_to_remove', url));
      newPhotos.forEach((file) => form.append('photos_to_add', file));

      if (activeTab === 'found') {
        if (formData.finder_name) form.append('finder_name', formData.finder_name);
        if (formData.finder_contact) form.append('finder_contact', formData.finder_contact);
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Anda tidak memiliki izin untuk mengedit laporan ini');
        } else if (response.status === 404) {
          throw new Error('Laporan tidak ditemukan');
        } else {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.detail || 'Gagal menyimpan perubahan');
        }
      }

      navigate(`/report/${id}?type=${activeTab}`, {
        replace: true,
        state: {
          toast: {
            type: "success",
            message: "Perubahan berhasil disimpan!",
          },
        },
      });
    } catch (err) {
      showToast(err.message, "error");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const allPhotoPreviews = [
    ...existingPhotos.map((url) => ({ type: 'existing', url })),
    ...newPhotosPreviews.map((url, i) => ({ type: 'new', url, index: i })),
  ];

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 md:p-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">

        {/* KOLOM KIRI */}
        <div className="flex flex-col gap-6">
          {/* Nama Barang */}
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

          {/* Deskripsi */}
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

          {/* Kategori */}
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

          {/* Waktu */}
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

          {/* Upload Foto */}
          <div>
            <label className="block text-[13px] font-bold text-gray-800 mb-2">
              Foto <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-1">(Maks 5)</span>
            </label>
            <div className="p-4 bg-white border-2 border-dashed border-gray-200 rounded-2xl shadow-sm flex flex-col gap-4">
              {allPhotoPreviews.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {allPhotoPreviews.map((photo) => (
                    <div
                      key={photo.url}
                      className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 shrink-0 group"
                    >
                      <img
                        src={photo.url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          photo.type === 'existing'
                            ? handleRemoveExistingPhoto(photo.url)
                            : handleRemoveNewPhoto(photo.index)
                        }
                        className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {allPhotoPreviews.length < 5 && (
                <label className="cursor-pointer bg-gray-50 border border-gray-200 rounded-xl py-4 flex flex-col items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition-colors w-full">
                  <UploadCloud className="text-blue-500 mb-1" size={20} />
                  <span className="text-[11px] font-bold text-gray-500">
                    Klik untuk memilih foto
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleNewPhotosChange}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Fields khusus Found Report */}
          {activeTab === 'found' && (
            <>
              <div>
                <label className="block text-[13px] font-bold text-gray-800 mb-2">
                  Nama Penemu
                </label>
                <div className="relative">
                  <User
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    name="finder_name"
                    value={formData.finder_name}
                    onChange={handleInputChange}
                    placeholder="Nama penemu"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all shadow-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-800 mb-2">
                  Kontak Penemu
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    name="finder_contact"
                    value={formData.finder_contact}
                    onChange={handleInputChange}
                    placeholder="No. HP / WA"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all shadow-sm"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* KOLOM KANAN */}
        <div className="flex flex-col gap-6">
          {/* Lokasi dengan Map */}
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
                  style={{ height: '100%', width: '100%' }}
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

      {/* Tombol Submit */}
      <div className="mt-10 pt-6 border-t border-gray-100 flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{ backgroundColor: IPB_COLORS.blue.primary }}
        >
          {submitting ? "Menyimpan Data..." : "Simpan Perubahan"}
        </button>

        <button
          type="button"
          disabled={submitting}
          onClick={() => navigate(`/report/${id}?type=${activeTab}`, {replace: true})}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-50"
        >
          Batal
        </button>
      </div>
    </form>
  );
}