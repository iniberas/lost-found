import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function ReportDetailPage({ user, handleLogout }) {
  const navigate = useNavigate();
  const [isOwnReport, setIsOwnReport] = useState(false);

  const suggestedReports = [1, 2, 3, 4, 5, 6];

  const handleSuggestionClick = (id) => {
    navigate(`/report/${id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

        {/* DETAIL BARANG UTAMA */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            
            {/* Kolom Kiri */}
            <div className="space-y-5">
              <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 text-gray-400 font-medium">
                Gambar Barang
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Kategori</label>
                <div className="w-1/2 border border-gray-300 rounded-md p-2.5 bg-white text-sm text-gray-700 min-h-[42px]">
                  Elektronik
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Waktu</label>
                <div className="w-1/2 border border-gray-300 rounded-md p-2.5 bg-white text-sm text-gray-700 min-h-[42px]">
                  12 Oktober 2025, 14:00
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Lokasi</label>
                <div className="w-full border border-gray-300 rounded-md p-2.5 bg-white text-sm text-gray-700 min-h-[100px]">
                  Tertinggal di kursi barisan belakang GWW saat acara seminar.
                </div>
              </div>
            </div>

            {/* Kolom Kanan */}
            <div className="space-y-5 flex flex-col">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Nama Barang</label>
                <div className="w-full border border-gray-300 rounded-md p-2.5 bg-white text-sm text-gray-700 min-h-[42px]">
                  Laptop Asus ROG Zephyrus
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Status Barang</label>
                <div className="w-1/2 border border-gray-300 rounded-md p-2.5 bg-white text-sm text-gray-700 min-h-[42px] font-semibold text-red-600">
                  Hilang
                </div>
              </div>

              <div className="flex-grow flex flex-col">
                <label className="block text-sm font-medium text-gray-900 mb-1">Deskripsi Tambahan/Ciri-ciri</label>
                <div className="w-full flex-grow border border-gray-300 rounded-md p-2.5 bg-white text-sm text-gray-700 min-h-[150px]">
                  Warna abu-abu gelap. Ada stiker Himalkom di pojok kanan bawah lid cover. Charger tidak ikut hilang.
                </div>
              </div>
            </div>
          </div>

          {/* Kolom Tombol Bawah */}
          <div className="mt-8 pt-4 flex flex-wrap gap-4">
            {isOwnReport ? (
              <>
                <button className="bg-[#314CBB] text-white px-8 py-2 rounded-md font-medium hover:bg-[#273d96] transition-colors text-sm shadow-sm">
                  Resolve
                </button>
                <button 
                  onClick={() => navigate(`/update-report/123`)}
                  className="bg-amber-500 text-white px-8 py-2 rounded-md font-medium hover:bg-amber-600 transition-colors text-sm shadow-sm"
                >
                  Edit Report
                </button>
                <button className="bg-[#314CBB] text-white px-8 py-2 rounded-md font-medium hover:bg-[#273d96] transition-colors text-sm shadow-sm">
                  Handover
                </button>
                <button className="bg-[#B30000] text-white px-8 py-2 rounded-md font-medium hover:bg-[#8a0000] transition-colors text-sm shadow-sm">
                  Delete Report
                </button>
              </>
            ) : (
              <button className="bg-[#314CBB] text-white px-8 py-2 rounded-md font-medium hover:bg-[#273d96] transition-colors text-sm shadow-sm">
                Request Contact
              </button>
            )}
          </div>
        </div>

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