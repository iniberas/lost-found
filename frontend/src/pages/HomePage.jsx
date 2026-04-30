import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, LogOut, User as UserIcon, PackageOpen } from 'lucide-react';
import Navbar from '../components/Navbar';


// REPORT CARD
const ReportCard = ({ item }) => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col h-full font-poppins">
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
  

  const [items, setItems] = useState([]); 

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar user={user} handleLogout={handleLogout} />

      {/* HERO SECTION */}
      <section className="bg-auth-pattern bg-repeat py-58 md:py-66 px-8 md:px-16 flex flex-col items-start text-left space-y-8 shadow-sm z-10 relative">
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
                onClick={() => setActiveTab('lost')}
                className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'lost' ? 'bg-[#0C0B89] text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                Daftar Barang Hilang
              </button>
              <button 
                onClick={() => setActiveTab('found')}
                className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'found' ? 'bg-[#0C0B89] text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                Daftar Barang Temuan
              </button>
            </div>

            {/* Render List Laporan atau pesan blum ada laporan*/}
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <PackageOpen size={64} strokeWidth={1.5} className="text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-1">Belum ada laporan</h3>
                <p className="text-sm text-gray-500 text-center max-w-sm">
                  Saat ini belum ada barang yang dilaporkan {activeTab === 'lost' ? 'hilang' : 'ditemukan'}. Jadilah orang pertama yang melapor jika kamu membutuhkannya!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {items.map(item => (
                  <ReportCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>

          <aside className="w-full lg:w-[340px] shrink-0">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6 sticky top-28">
              <div className="flex items-center gap-2 font-bold text-gray-900 border-b border-gray-50 pb-4 text-lg">
                <Filter size={20} className="text-[#0C0B89]" />
                <span>Filter Laporan</span>
              </div>

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
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Kategori</label>
                <div className="space-y-3">
                  {['Semua', 'Elektronik', 'Dokumen', 'Pakaian', 'Lain-lain'].map((cat) => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                      <input type="radio" name="category" className="w-5 h-5 accent-[#0C0B89]" defaultChecked={cat === 'Semua'} />
                      <span className="text-sm text-gray-600 group-hover:text-gray-900 font-medium transition-colors">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button className="w-full py-3.5 mt-2 bg-[#0C0B89] text-white rounded-2xl font-bold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all">
                Terapkan Filter
              </button>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}