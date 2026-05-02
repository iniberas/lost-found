import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';

const API_URL = import.meta.env.VITE_API_URL;


export default function ReportDetailPage({ user, handleLogout }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  // const [activeTab, setActiveTab] = useState(searchParams.get('type') || 'lost');
  const activeTab = searchParams.get('type') || 'lost'; // keknya gini juga bisa

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resolving, setResolving] = useState(false);
  
  // For found report resolve
  const [resolveNotes, setResolveNotes] = useState('');
  const [proofPhotos, setProofPhotos] = useState([]);

  const [suggestedReports, setSuggestedReports] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Supaya ga ke scoll aneh gajelas ga ngerti gitu lah
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('access_token');
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
        setReport(data);
        setActivePhotoIndex(0);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchReport();
  }, [id, activeTab]);

  useEffect(() => {
    const fetchPotentialMatches = async () => {
      if (!id) return;
      setLoadingSuggestions(true);
      try {
        const endpoint =
          activeTab === 'found'
            ? `/api/v1/found-reports/${id}/potential-matches`
            : `/api/v1/lost-reports/${id}/potential-matches`;

        const response = await fetch(`${API_URL}${endpoint}`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        setSuggestedReports(data);
      } catch (_) {
        setSuggestedReports([]);
      } finally {
        setLoadingSuggestions(false);
      }
    };
    fetchPotentialMatches();
  }, [id, activeTab]);

  const isOwnReport = user && report && user.id === report.reporter?.id;

  const handleSuggestionClick = (id, type = 'lost') => {
    navigate(`/report/${id}?type=${type}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const foundStatusConfig = {
    held_by_finder: {
      label: "Dibawa Penemu",
    },
    held_by_admin: {
      label: "Dititipkan di Admin",
    },
    returned_to_owner: {
      label: "Sudah Dikembalikan",
    }
};

  // Delete Report Handler
  const handleDeleteReport = async () => {
    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      const endpoint =
        activeTab === 'found'
          ? `/api/v1/found-reports/${id}`
          : `/api/v1/lost-reports/${id}`;

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Laporan tidak ditemukan');
        } else if (response.status === 403) {
          throw new Error('Anda tidak memiliki izin untuk menghapus laporan ini');
        } else {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.detail || 'Gagal menghapus laporan');
        }
      }

      // Success - redirect to home or reports list
      setSuccess('Laporan berhasil dihapus');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Resolve Lost Report Handler (simple POST)
  const handleResolveLostReport = async () => {
    setResolving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      const endpoint = `/api/v1/lost-reports/${id}/resolve`;

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Laporan tidak ditemukan');
        } else if (response.status === 403) {
          throw new Error('Anda tidak memiliki izin untuk menyelesaikan laporan ini');
        } else if (response.status === 422) {
          const result = await response.json();
          throw new Error(result.detail || 'Status laporan tidak dapat diubah');
        } else {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.detail || 'Gagal menyelesaikan laporan');
        }
      }

      const data = await response.json();
      setReport(data);
      setSuccess('Laporan berhasil diselesaikan');
    } catch (err) {
      setError(err.message);
    } finally {
      setResolving(false);
      setShowResolveModal(false);
    }
  };

  // Resolve Found Report Handler (needs FormData with photos and notes)
  const handleResolveFoundReport = async () => {
    if (proofPhotos.length === 0) {
      setError('Harap upload minimal 1 foto bukti');
      return;
    }

    setResolving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      const endpoint = `/api/v1/found-reports/${id}/resolve`;

      const formData = new FormData();
      formData.append('notes', resolveNotes || '');
      
      // Append all proof photos
      proofPhotos.forEach((photo) => {
        formData.append('proof_photos', photo);
      });

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Laporan tidak ditemukan');
        } else if (response.status === 403) {
          throw new Error('Anda tidak memiliki izin untuk menyelesaikan laporan ini');
        } else if (response.status === 422) {
          const result = await response.json();
          throw new Error(result.detail || 'Status laporan tidak dapat diubah');
        } else {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.detail || 'Gagal menyelesaikan laporan');
        }
      }

      const data = await response.json();
      setReport(data);
      setSuccess('Laporan berhasil diselesaikan');
      setResolveNotes('');
      setProofPhotos([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setResolving(false);
      setShowResolveModal(false);
    }
  };

  const handleResolveClick = () => {
    if (activeTab === 'found') {
      setShowResolveModal(true);
    } else {
      // Lost report - no modal needed, directly resolve
      handleResolveLostReport();
    }
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    setProofPhotos(files);
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] pb-12 font-sans">
      
      <Navbar user={user} handleLogout={handleLogout} />

      {/* <div className="bg-yellow-100 border-b border-yellow-300 p-2 text-center text-sm font-medium text-yellow-800">
        Mode Tampilan: {isOwnReport ? "Laporan Milik Sendiri (Self)" : "Laporan Orang Lain"} 
        <button 
          onClick={() => setIsOwnReport(!isOwnReport)}
          className="ml-4 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded transition-colors"
        >
          Ganti Mode
        </button>
      </div> */}

      <div className="max-w-5xl mx-auto px-6 mt-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Detail Barang</h1>

        {/* Notifikasi Error / Sukses */}
        {error && (
          <div className="p-3 rounded-lg text-sm font-medium bg-red-50 text-red-600 mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded-lg text-sm font-medium bg-green-50 text-green-600 mb-4">
            {success}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex items-center justify-center min-h-[300px]">
            <p className="text-gray-500 text-sm">Memuat data laporan...</p>
          </div>
        ) : report ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {/* Kolom Kiri */}
              <div className="space-y-5">
                <div className="relative w-full h-48 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 overflow-hidden">
                  {report.photos && report.photos.length > 0 ? (
                    <>
                      <img
                        src={report.photos[activePhotoIndex]}
                        alt="Foto Barang"
                        className="w-full h-full object-cover"
                      />
                      {report.photos.length > 1 && (
                        <>
                          {/* Tombol kiri */}
                          <button
                            onClick={() => setActivePhotoIndex(i => (i - 1 + report.photos.length) % report.photos.length)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center transition-colors"
                          >
                            ‹
                          </button>
                          {/* Tombol kanan */}
                          <button
                            onClick={() => setActivePhotoIndex(i => (i + 1) % report.photos.length)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center transition-colors"
                          >
                            ›
                          </button>
                          {/* Dots */}
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                            {report.photos.map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setActivePhotoIndex(i)}
                                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === activePhotoIndex ? 'bg-white' : 'bg-white/50'}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-400 font-medium text-sm">Tidak Ada Gambar</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Kategori</label>
                  <div className="border border-gray-300 rounded-md p-2.5 bg-white text-sm text-gray-700 min-h-[42px]">
                    {report.categories?.length > 0 ? report.categories.map((c) => c.name).join(', ') : '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Waktu</label>
                  <div className="border border-gray-300 rounded-md p-2.5 bg-white text-sm text-gray-700 min-h-[42px]">
                    {formatDate(report.incident_date)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Lokasi</label>
                  <div className="border border-gray-300 rounded-md p-2.5 bg-white text-sm text-gray-700 min-h-[100px]">
                    {report.location_name || '-'}
                  </div>
                </div>
              </div>

              {/* Kolom Kanan */}
              <div className="space-y-5 flex flex-col">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Nama Barang</label>
                  <div className="border border-gray-300 rounded-md p-2.5 bg-white text-sm text-gray-700 min-h-[42px]">
                    {report.title || '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Status Laporan</label>
                  <div className="border border-gray-300 rounded-md p-2.5 bg-white text-sm font-semibold text-red-600">
                    <span className={`badge ${report.report_status}`}>
                      {(() => {
                        switch (report.report_status) {
                          case 'open': return 'Open';
                          case 'resolved': return 'Selesai';
                          case 'closed': return 'Ditutup';
                          default: return 'Status Tidak Dikenal';
                        }
                      })()}
                    </span>
                  </div>
                </div>

                {activeTab === 'found' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Status Penemuan</label>
                    <div className="border border-gray-300 rounded-md p-2.5 bg-white text-sm font-semibold text-gray-700">
                      {report.found_status ? (
                        <span>
                          {foundStatusConfig[report.found_status]?.label || report.found_status}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex-grow">
                  <label className="block text-sm font-medium text-gray-900 mb-1">Deskripsi Tambahan</label>
                  <div className="border border-gray-300 rounded-md p-2.5 bg-white text-sm text-gray-700 min-h-[150px]">
                    {report.description || '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="mt-8 pt-4 flex flex-wrap gap-4 border-t border-gray-100">
              {['resolved', 'closed'].includes(report.report_status) ? (
                <p className="text-sm text-gray-400 italic">
                  Laporan ini sudah {report.report_status === 'resolved' ? 'diselesaikan' : 'ditutup'} dan tidak dapat diubah.
                </p>
              ) : isOwnReport ? (
                <>
                  <button
                    onClick={handleResolveClick}
                    disabled={resolving}
                    className="bg-[#314CBB] text-white px-8 py-2 rounded-md font-medium hover:bg-[#273d96] text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resolving ? 'Memproses...' : 'Resolve'}
                  </button>
                  <button
                    onClick={() => navigate(`/update-report/${id}?type=${activeTab}`)}
                    className="bg-amber-500 text-white px-8 py-2 rounded-md font-medium hover:bg-amber-600 text-sm shadow-sm"
                  >
                    Edit Report
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    disabled={deleting}
                    className="bg-[#B30000] text-white px-8 py-2 rounded-md font-medium hover:bg-[#8a0000] text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? 'Menghapus...' : 'Delete Report'}
                  </button>
                </>
              ) : (
                <button className="bg-[#314CBB] text-white px-8 py-2 rounded-md font-medium hover:bg-[#273d96] text-sm shadow-sm">
                  {activeTab === 'found' ? <>Request Contact</> : <>Saya Menemukan Ini</>}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-10">Laporan tidak ditemukan.</div>
        )}

        {/* BARANG SUGESTI */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Barang Serupa</h2>

          {loadingSuggestions ? (
            <p className="text-sm text-gray-400">Memuat barang serupa...</p>
          ) : suggestedReports.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Tidak ada barang serupa ditemukan.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestedReports.map((item) => {
                // Kalau kita di lost report, matches-nya adalah found reports, dan sebaliknya
                const matchType = activeTab === 'lost' ? 'found' : 'lost';
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSuggestionClick(item.id, matchType)}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col"
                  >
                    <div className="h-48 w-full bg-gray-100 overflow-hidden">
                      {item.photos && item.photos.length > 0 ? (
                        <img
                          src={item.photos[0]}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                          Tidak Ada Gambar
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="font-bold text-sm text-gray-900 line-clamp-1">{item.title}</h3>
                      <p className="text-xs text-gray-600 mt-2 line-clamp-3 leading-relaxed">
                        {item.description || '-'}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">{item.location_name || ''}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Laporan</h3>
            <p className="text-sm text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteReport}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-[#B30000] rounded-md hover:bg-[#8a0000] disabled:opacity-50"
              >
                {deleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal for Found Reports */}
      {showResolveModal && activeTab === 'found' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Selesaikan Laporan Barang Temuan</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Foto Bukti Pengembalian <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#314CBB] file:text-white hover:file:bg-[#273d96]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {proofPhotos.length > 0 ? `${proofPhotos.length} foto dipilih` : 'Upload minimal 1 foto'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#314CBB]"
                  placeholder="Tambahkan catatan tentang pengembalian barang..."
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowResolveModal(false);
                  setResolveNotes('');
                  setProofPhotos([]);
                }}
                disabled={resolving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleResolveFoundReport}
                disabled={resolving || proofPhotos.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-[#314CBB] rounded-md hover:bg-[#273d96] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resolving ? 'Memproses...' : 'Selesaikan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}