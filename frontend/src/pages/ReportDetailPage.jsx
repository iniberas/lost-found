import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';

const API_URL = import.meta.env.VITE_API_URL;


/*
CATATAN:
 - yg suggestion lom diapa-apain
*/

export default function ReportDetailPage({ user, handleLogout }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get('type') || 'lost');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // const [isOwnReport, setIsOwnReport] = useState(false);

  const suggestedReports = [1, 2, 3, 4, 5, 6];

  // Supaya ga ke scoll aneh gajelas ga ngerti gitu lah
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const fetchReport = async () => {
        console.log("hiaii")

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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchReport();
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
          <div className={`p-3 rounded-lg text-sm font-medium ${error.includes('Success') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {error}
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
                <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                  {report.photos && report.photos.length > 0 ? (
                    <img
                      src={report.photos[0]}
                      alt="Foto Barang"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 font-medium text-sm">Tidak Ada Gambar</span>
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
              {isOwnReport ? (
                <>
                  <button className="bg-[#314CBB] text-white px-8 py-2 rounded-md font-medium hover:bg-[#273d96] text-sm shadow-sm">Resolve</button>
                  <button onClick={() => navigate(`/update-report/${id}`)} className="bg-amber-500 text-white px-8 py-2 rounded-md font-medium hover:bg-amber-600 text-sm shadow-sm">Edit Report</button>
                  <button className="bg-[#B30000] text-white px-8 py-2 rounded-md font-medium hover:bg-[#8a0000] text-sm shadow-sm">Delete Report</button>
                </>
              ) : (
                <button className="bg-[#314CBB] text-white px-8 py-2 rounded-md font-medium hover:bg-[#273d96] text-sm shadow-sm">Request Contact</button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-10">Laporan tidak ditemukan.</div>
        )}

        {/* BARANG SUGESTI */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Barang Serupa</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestedReports.map((item) => (
              <div 
                key={item} 
                onClick={() => handleSuggestionClick(item)} 
                className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col"
              >
                <div className="h-48 w-full bg-gray-200 overflow-hidden relative">
                  <img 
                    src={`https://images.unsplash.com/photo-1598327105666-5b89351cb315?q=80&w=600&auto=format&fit=crop&sig=${item}`} 
                    alt="Barang" 
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-bold text-sm text-gray-900 line-clamp-1">Smartphone Samsung Galaxy</h3>
                  <p className="text-xs text-gray-600 mt-2 line-clamp-3 leading-relaxed">
                    Report description Report description Report description Report description Report description
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}