import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function CreateReportPage({ user, handleLogout }) {
  const location = useLocation();
  const [reportType, setReportType] = useState('kehilangan');
  
  const [previewImage, setPreviewImage] = useState(null);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (location.pathname.includes('lapor-temuan')) {
      setReportType('penemuan');
    } else {
      setReportType('kehilangan');
    }
  }, [location]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] pb-12 font-sans">
      <Navbar user="{user}" handleLogout="{handleLogout}"/>
      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 mt-10">
        <h1 className="text-3xl font-bold text-black mb-6">
          Buat Laporan {reportType === 'penemuan' ? 'Penemuan' : 'Kehilangan'}
        </h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <form className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            
            {/* Kolom Kiri */}
            <div className="space-y-6">
              {/* Nama Barang */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Nama Barang</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-[#364b98] focus:border-[#364b98] outline-none transition-all"
                />
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Kategori</label>
                <select className="w-1/2 border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-[#364b98] outline-none bg-white">
                  <option value="">Pilih...</option>
                  <option value="elektronik">Elektronik</option>
                  <option value="dokumen">Dokumen</option>
                  <option value="aksesoris">Aksesoris</option>
                </select>
              </div>

              {/* Waktu */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Waktu</label>
                <input
                  type="datetime-local"
                  className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-[#364b98] outline-none"
                />
              </div>

              {/* Lokasi */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Lokasi</label>
                <input 
                  type="text" 
                  placeholder="Ketik nama lokasi (Cth: GWW IPB)..." 
                  className="w-full border border-gray-300 rounded-md p-3 mb-3 focus:ring-2 focus:ring-[#364b98] outline-none"
                />
                {/* Peta Placeholder */}
                <div className="w-full h-48 bg-gray-200 rounded-md overflow-hidden relative border border-gray-300">
                  <img 
                    src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=800&auto=format&fit=crop" 
                    alt="Map Placeholder" 
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="bg-white/80 px-3 py-1 rounded text-sm font-medium text-gray-700 shadow-sm">Peta Interaktif (Segera Hadir)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Kolom Kanan */}
            <div className="space-y-6 flex flex-col">
              {/* Deskripsi */}
              <div className="flex-grow flex flex-col">
                <label className="block text-sm font-medium text-gray-900 mb-2">Deskripsi Tambahan/Ciri-ciri</label>
                <textarea
                  className="w-full flex-grow min-h-[200px] border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-[#364b98] outline-none resize-none"
                ></textarea>
              </div>

              {/* Upload Foto */}
              <div className="mt-auto pt-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">Upload Foto</label>
                <div className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50/50 min-h-[140px]">
                  
                  {/* Input asli disembunyikan */}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />

                  {previewImage ? (
                    <div className="flex flex-col items-center w-full">
                      <img 
                        src={previewImage} 
                        alt="Preview" 
                        className="max-h-32 object-contain rounded mb-3 shadow-sm border border-gray-200"
                      />
                      <button 
                        type="button"
                        onClick={() => setPreviewImage(null)}
                        className="text-red-500 text-sm font-medium hover:underline"
                      >
                        Hapus Foto
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current.click()} // Tombol ini me-trigger input yang tersembunyi
                      className="bg-[#364b98] text-white px-6 py-2 rounded-md font-medium hover:bg-[#2a3a75] transition-colors"
                    >
                      Select Files
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tombol Submit */}
            <div className="md:col-span-2 pt-4">
              <button
                type="button"
                className="bg-[#364b98] text-white px-12 py-3 rounded-md font-medium hover:bg-[#2a3a75] transition-colors shadow-sm w-full md:w-auto"
              >
                Submit
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}