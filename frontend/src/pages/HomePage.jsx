import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, PackageOpen, Calendar, MapPin, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';

const API_URL = import.meta.env.VITE_API_URL;

/*
CATATAN:
 - filter kategori belom dipake soalnya di endpoint ga nerima param kategori
 - yang kategorinya juga masih hardcode, lom ngambil data dari DB
 - maps juga belom diapa-apain
 - terus yg date filter buat found reports, lom ngaruh, soalnya di endpoint entah kenapa ga dipake (tinggal dipake aja sih kyknya)
 - itu date filternya tapi bingung deh, kan di backend kyk range (dari kapan sampe kapan), tapi di sini inputnya cuma 1 hari,
   terus jadinya cuma kayak dari pagi sampe malemnya hari itu doang
*/


// INI DATA DUMMY BUAT GUA NGETEST REPORT CARD DAN LAIN LAIN YAK, GUA JADIIN COMMENT AJAH< BUAT DI PAKE LAGI SOALNYA (FARID)
/*const dummyReports = [
  {
    id: 1,
    title: "Laptop Asus ROG Zephyrus",
    description: "Hilang di GWW. Warna abu-abu gelap, ada stiker Himalkom di pojok kanan bawah. Sangat penting untuk nugas.",
    photos: ["https://images.unsplash.com/photo-1598327105666-5b89351cb315?q=80&w=600&auto=format&fit=crop"]
  },
  {
    id: 2,
    title: "Dompet Kulit Coklat",
    description: "Ditemukan di parkiran motor FMIPA. Berisi KTM, KTP, dan beberapa kartu penting. Aman di tangan saya.",
    photos: ["https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=600&auto=format&fit=crop"]
  },
  {
    id: 3,
    title: "Kunci Motor Honda",
    description: "Ada gantungan kunci boneka beruang. Hilang sekitar jalan dari kosan menuju Fakultas.",
    photos: ["https://images.unsplash.com/photo-1582139329536-e7284fece509?q=80&w=600&auto=format&fit=crop"]
  },
  {
    id: 4,
    title: "Botol Minum Corkcicle",
    description: "Warna biru laut. Tertinggal di kelas saat mata kuliah pagi. Masih ada sisa air dinginnya sedikit.",
    photos: ["https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=600&auto=format&fit=crop"]
  },
  {
    id: 5,
    title: "TWS Sony WF-1000XM4",
    description: "Ditemukan di selasar perpustakaan. Casing warna hitam, ada sedikit lecet di bagian atas.",
    photos: ["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=600&auto=format&fit=crop"]
  },
  {
    id: 6,
    title: "Jaket Varsity",
    description: "Tertinggal di depan sekre. Ukuran L, warna dasar biru navy dengan garis putih di lengan.",
    photos: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop"]
  }
];*/

// REPORT CARD
const ReportCard = ({ item, onClick }) => (
  <div 
    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col h-full font-poppins cursor-pointer"
    onClick={onClick}
  >
    <div className="relative h-48 bg-gray-200">
      {item.photos && item.photos.length > 0 ? (
        <img src={item.photos[0]} alt={item.title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium bg-gray-100">No Image</div>
      )}
    </div>
    <div className="p-5 space-y-2 flex-grow">
      <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-1">{item.title}</h3>
      <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
        {item.description}
      </p>
      <div className="flex items-center gap-2 text-xs text-gray-400 pt-2">
        <MapPin size={14} />
        <span>{item.location_name || 'Lokasi tidak disebutkan'}</span>
      </div>
    </div>
    <div className="p-5 pt-0 mt-auto">
      <button className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-[#0C0B89] text-sm font-bold rounded-xl transition-colors border border-gray-200">
        Lihat Detail
      </button>
    </div>
  </div>
);

// HOMEPAGE
export default function HomePage({ user, handleLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('lost');
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    limit: 20
  });

  // Fetch reports dari API
  const fetchReports = async (page = pagination.current_page) => {
    setLoading(true);
    setError("");
    
    try {
      const endpoint = activeTab === 'lost' ? '/api/v1/lost-reports' : '/api/v1/found-reports';
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sort_by: 'created_at',
        sort_order: 'desc'
      });
 
      // Tambahkan filter jika ada
      if (searchQuery.trim()) {
        params.append('query', searchQuery.trim());
      }
      
      if (dateFilter) {
        const [year, month, day] = dateFilter.split('-').map(Number);

        const startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);

        params.append('incident_date_from', startDate.toISOString());
        params.append('incident_date_to', endDate.toISOString());
      }
 
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}${endpoint}?${params}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
 
      if (!response.ok) {
        throw new Error("Gagal mengambil data laporan");
      }
 
      const data = await response.json();
      
      setItems(data.items);
      setPagination({
        current_page: data.current_page,
        total_pages: data.total_pages,
        total_items: data.total_items,
        limit: data.limit
      });
 
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
 
  // Fetch data saat component mount atau activeTab berubah
  useEffect(() => {
    fetchReports();
  }, [activeTab, pagination.current_page]);
 
  // Handle apply filter
  const handleApplyFilter = () => {
    // Reset ke page 1 saat apply filter
    setPagination(prev => ({ ...prev, current_page: 1 }));
    fetchReports(1);
  };
 
  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Reset filters ketika ganti tab
    // setSearchQuery("");
    // setDateFilter("");
    // setSelectedCategory('Semua');
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar user={user} handleLogout={handleLogout} />

      {/* HERO SECTION */}
      <section className="bg-auth-pattern bg-repeat py-50 md:py-64 px-8 md:px-16 flex flex-col items-start text-left space-y-8 shadow-sm z-10 relative">
        <div className="w-full space-y-2">
          <h2 className="text-[48px] md:text-[62px] font-black text-[#0C0B89] leading-tight drop-shadow-md">
            {user ? `Halo, ${user.name}!` : "IPB Lost & Found"}
          </h2>
          <p className="text-[#768ADB] text-[20px] md:text-[22px] font-medium font-poppins drop-shadow-sm">
            Kehilangan atau Menemukan Barang di IPB?
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-[600px] pt-4">
          <button 
            onClick={() => user ? navigate('/lapor-hilang') : navigate('/auth')}
            className="flex-1 bg-[#0C0B89] hover:bg-[#09086e] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition-all active:scale-95 text-center text-[15px]"
          >
            Saya Kehilangan Barang
          </button>
          <button 
            onClick={() => user ? navigate('/lapor-temuan') : navigate('/auth')}
            className="flex-1 bg-[#0C0B89] hover:bg-[#09086e] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition-all active:scale-95 text-center text-[15px]"
          >
            Saya Menemukan Barang
          </button>
        </div>
      </section>

      {/* LIST SECTION */}
      <section className="bg-[#F3F4FF] flex-grow py-12 px-8 md:px-16">
        <div className="w-full max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-8 md:gap-12">
          
          <div className="flex-grow space-y-6">
            <div className="flex bg-white shadow-sm border border-gray-100 p-1.5 rounded-2xl w-fit">
              <button 
                onClick={() => handleTabChange('lost')}
                className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'lost' ? 'bg-[#0C0B89] text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                Daftar Barang Hilang
              </button>
              <button 
                onClick={() => handleTabChange('found')}
                className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'found' ? 'bg-[#0C0B89] text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                Daftar Barang Temuan
              </button>
            </div>

            {/* Notifikasi Error / Sukses */}
            {error && (
              <div className={`p-3 rounded-lg text-sm font-medium ${error.includes('Success') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {error}
              </div>
            )}

            {/* Render List Laporan atau pesan blum ada laporan */}
            {/* Loading State */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <Loader2 size={48} className="text-[#0C0B89] animate-spin mb-4" />
                <p className="text-sm text-gray-500">Memuat data...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <PackageOpen size={64} strokeWidth={1.5} className="text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-1">Belum ada laporan</h3>
                <p className="text-sm text-gray-500 text-center max-w-sm">
                  Saat ini belum ada barang yang dilaporkan {activeTab === 'lost' ? 'hilang' : 'ditemukan'}. Jadilah orang pertama yang melapor jika kamu membutuhkannya!
                  {searchQuery && " Coba ubah kata kunci pencarian atau filter yang digunakan."}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {items.map(item => (
                    <ReportCard 
                      key={item.id} 
                      item={item} 
                      onClick={() => navigate(`/report/${item.id}?type=${item.report_type}`)} 
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.total_pages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <button
                      onClick={() => {
                        if (pagination.current_page > 1) {
                          setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }));
                        }
                      }}
                      disabled={pagination.current_page === 1}
                      className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Sebelumnya
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-600">
                      Halaman {pagination.current_page} dari {pagination.total_pages}
                    </span>
                    <button
                      onClick={() => {
                        if (pagination.current_page < pagination.total_pages) {
                          setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }));
                        }
                      }}
                      disabled={pagination.current_page === pagination.total_pages}
                      className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Selanjutnya
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <aside className="w-full lg:w-[340px] shrink-0">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6 sticky top-28">
              <div className="flex items-center gap-2 font-bold text-gray-900 border-b border-gray-50 pb-4 text-lg">
                <Filter size={20} className="text-[#0C0B89]" />
                <span>Filter Laporan</span>
              </div>

              {/* Filter Cari Barang */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cari Barang</label>
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="KTM, Kunci, dll..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#0C0B89]/20 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleApplyFilter();
                      }
                    }}
                  />
                </div>
              </div>

              {/* Filter Tanggal */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Waktu Kejadian</label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="date" 
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#0C0B89]/20 transition-all text-gray-600"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </div>
              </div>

              {/* Filter Lokasi Maps */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Area Lokasi</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <button className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-left text-gray-500 hover:bg-gray-100 transition-all flex justify-between items-center group">
                    Pilih Titik Peta
                    <span className="text-[10px] font-bold bg-[#0C0B89] text-white px-2 py-1 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity">Maps</span>
                  </button>
                </div>
              </div>

              {/* Filter Kategori */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Kategori</label>
                <div className="space-y-3">
                  {['Semua', 'Elektronik', 'Dokumen', 'Pakaian', 'Lain-lain'].map((cat) => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="category"
                        className="w-5 h-5 accent-[#0C0B89]"
                        checked={selectedCategory === cat}
                        onChange={() => setSelectedCategory(cat)}
                      />
                      <span className="text-sm text-gray-600 group-hover:text-gray-900 font-medium transition-colors">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleApplyFilter}
                disabled={loading}
                className="w-full py-3.5 mt-2 bg-[#0C0B89] text-white rounded-2xl font-bold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all">
                Terapkan Filter
              </button>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}