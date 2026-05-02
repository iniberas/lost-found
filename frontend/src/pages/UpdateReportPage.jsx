import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Upload, X } from 'lucide-react';
import Navbar from '../components/Navbar';

const API_URL = import.meta.env.VITE_API_URL;

export default function UpdateReportPage({ user, handleLogout }) {
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
  const [existingPhotos, setExistingPhotos] = useState([]); // URL strings dari API
  const [photosToRemove, setPhotosToRemove] = useState([]);  // URL strings yg mau dihapus
  const [newPhotos, setNewPhotos] = useState([]);            // File objects baru
  const [newPhotosPreviews, setNewPhotosPreviews] = useState([]); // Preview URL baru

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch report data + categories
  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError('');
      try {
        const endpoint =
          activeTab === 'found'
            ? `/api/v1/found-reports/${id}`
            : `/api/v1/lost-reports/${id}`;

        const response = await fetch(`${API_URL}${endpoint}`);
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.detail || 'Gagal mengambil data laporan');
        }

        const data = await response.json();

        // Format ke datetime-local (YYYY-MM-DDTHH:mm)
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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/categories`);
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (_) {
        // silently fail
      }
    };

    if (id) {
      fetchReport();
      fetchCategories();
    }
  }, [id, activeTab]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryToggle = (catId) => {
    setFormData((prev) => {
      const already = prev.category_ids.includes(catId);
      return {
        ...prev,
        category_ids: already
          ? prev.category_ids.filter((c) => c !== catId)
          : [...prev.category_ids, catId],
      };
    });
  };

  // Hapus foto lama
  const handleRemoveExistingPhoto = (photoUrl) => {
    setPhotosToRemove((prev) => [...prev, photoUrl]);
    setExistingPhotos((prev) => prev.filter((p) => p !== photoUrl));
  };

  // Tambah foto baru
  const handleNewPhotosChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setNewPhotos((prev) => [...prev, ...files]);
    const previews = files.map((f) => URL.createObjectURL(f));
    setNewPhotosPreviews((prev) => [...prev, ...previews]);
  };

  // Hapus foto baru (belum diupload)
  const handleRemoveNewPhoto = (index) => {
    URL.revokeObjectURL(newPhotosPreviews[index]);
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
    setNewPhotosPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

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

      navigate(`/report/${id}?type=${activeTab}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const allPhotoPreviews = [
    ...existingPhotos.map((url) => ({ type: 'existing', url })),
    ...newPhotosPreviews.map((url, i) => ({ type: 'new', url, index: i })),
  ];

  return (
    <div className="min-h-screen bg-[#f4f6fb] pb-12 font-sans flex flex-col">
      <Navbar user={user} handleLogout={handleLogout} />

      <main className="max-w-5xl mx-auto px-6 mt-10 w-full flex-grow">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Barang</h1>

        {error && (
          <div className="p-3 rounded-lg text-sm font-medium bg-red-50 text-red-600 mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex items-center justify-center min-h-[300px]">
            <p className="text-gray-500 text-sm">Memuat data laporan...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">

              {/* KOLOM KIRI */}
              <div className="space-y-5">

                {/* Foto Barang */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Gambar Barang</label>

                  {/* Grid foto existing + new */}
                  {allPhotoPreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {allPhotoPreviews.map((photo) => (
                        <div key={photo.url} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                          <img src={photo.url} alt="Foto" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() =>
                              photo.type === 'existing'
                                ? handleRemoveExistingPhoto(photo.url)
                                : handleRemoveNewPhoto(photo.index)
                            }
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload button */}
                  <label className="w-full h-12 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors gap-2 text-gray-400 text-sm">
                    <Upload size={16} />
                    <span>Tambah Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleNewPhotosChange}
                    />
                  </label>
                </div>

                {/* Kategori */}
                {categories.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Kategori</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => {
                        const selected = formData.category_ids.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleCategoryToggle(cat.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                              selected
                                ? 'bg-[#314CBB] text-white border-[#314CBB]'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-[#314CBB]'
                            }`}
                          >
                            {cat.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Waktu */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Waktu</label>
                  <input
                    type="datetime-local"
                    name="incident_date"
                    value={formData.incident_date}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md p-2.5 bg-white text-sm text-gray-700 outline-none focus:border-[#314CBB] focus:ring-1 focus:ring-[#314CBB] transition-all"
                  />
                </div>

                {/* Lokasi */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Lokasi</label>
                  <textarea
                    name="location_name"
                    value={formData.location_name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md p-2.5 bg-white text-sm text-gray-700 outline-none focus:border-[#314CBB] focus:ring-1 focus:ring-[#314CBB] transition-all resize-none min-h-[100px]"
                  />
                </div>
              </div>

              {/* KOLOM KANAN */}
              <div className="space-y-5 flex flex-col">

                {/* Nama Barang */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Nama Barang</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md p-2.5 bg-white text-sm text-gray-700 outline-none focus:border-[#314CBB] focus:ring-1 focus:ring-[#314CBB] transition-all"
                  />
                </div>

                {/* Found-only fields */}
                {activeTab === 'found' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Nama Penemu</label>
                      <input
                        type="text"
                        name="finder_name"
                        value={formData.finder_name}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md p-2.5 bg-white text-sm text-gray-700 outline-none focus:border-[#314CBB] focus:ring-1 focus:ring-[#314CBB] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Kontak Penemu</label>
                      <input
                        type="text"
                        name="finder_contact"
                        value={formData.finder_contact}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md p-2.5 bg-white text-sm text-gray-700 outline-none focus:border-[#314CBB] focus:ring-1 focus:ring-[#314CBB] transition-all"
                      />
                    </div>
                  </>
                )}

                {/* Deskripsi */}
                <div className="flex-grow flex flex-col">
                  <label className="block text-sm font-medium text-gray-900 mb-1">Deskripsi Tambahan/Ciri-ciri</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full flex-grow border border-gray-300 rounded-md p-2.5 bg-white text-sm text-gray-700 outline-none focus:border-[#314CBB] focus:ring-1 focus:ring-[#314CBB] transition-all resize-none min-h-[150px]"
                  />
                </div>
              </div>
            </div>

            {/* TOMBOL BAWAH */}
            <div className="mt-8 pt-4 flex flex-wrap gap-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#314CBB] text-white px-8 py-2 rounded-md font-medium hover:bg-[#273d96] transition-colors text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => navigate(`/report/${id}?type=${activeTab}`)}
                className="bg-white border border-gray-300 text-gray-700 px-8 py-2 rounded-md font-medium hover:bg-gray-50 transition-colors text-sm shadow-sm disabled:opacity-50"
              >
                Batal
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}