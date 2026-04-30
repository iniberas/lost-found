import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function UpdateReportPage({ user, handleLogout }) {
  const navigate = useNavigate();
  const { id } = useParams();

    const [formData, setFormData] = useState({
    title: "",
    category: "Elektronik", //default dropdown
    date: "",
    location: "",
    description: "",
    status: "Hilang",
    imagePreview: null
    });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Perubahan laporan berhasil disimpan!");
    navigate(`/report/${id || 123}`);
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] pb-12 font-sans flex flex-col">
      <Navbar user={user} handleLogout={handleLogout} />

      <main className="max-w-5xl mx-auto px-6 mt-10 w-full flex-grow">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Barang</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            
            {/* KOLOM KIRI */}
            <div className="space-y-5">
              
              {/* Foto Barang */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Gambar Barang</label>
                <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 relative overflow-hidden group cursor-pointer hover:bg-gray-100 transition-colors">
                  {formData.imagePreview ? (
                    <>
                      <img src={formData.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm font-medium flex items-center gap-2"><Upload size={16}/> Ganti Gambar</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center">
                      <Upload size={24} className="mb-2" />
                      <span className="text-sm">Klik untuk upload</span>
                    </div>
                  )}
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Kategori</label>
                <select 
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-1/2 border border-gray-300 rounded-md p-2.5 bg-white text-sm text-gray-700 outline-none focus:border-[#314CBB] focus:ring-1 focus:ring-[#314CBB] transition-all"
                >
                  <option value="Elektronik">Elektronik</option>
                  <option value="Dokumen">Dokumen</option>
                  <option value="Pakaian">Pakaian</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>

              {/* Waktu */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Waktu</label>
                <input 
                  type="date" 
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-1/2 border border-gray-300 rounded-md p-2.5 bg-white text-sm text-gray-700 outline-none focus:border-[#314CBB] focus:ring-1 focus:ring-[#314CBB] transition-all"
                />
              </div>

              {/* Lokasi */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Lokasi</label>
                <textarea 
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md p-2.5 bg-white text-sm text-gray-700 outline-none focus:border-[#314CBB] focus:ring-1 focus:ring-[#314CBB] transition-all resize-none min-h-[100px]"
                  required
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
                  className="w-full border border-gray-300 rounded-md p-2.5 bg-white text-sm text-gray-700 outline-none focus:border-[#314CBB] focus:ring-1 focus:ring-[#314CBB] transition-all"
                  required
                />
              </div>

              {/* Status Barang */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Status Barang</label>
                <select 
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-1/2 border border-gray-300 rounded-md p-2.5 bg-white text-sm font-semibold text-[#314CBB] outline-none focus:border-[#314CBB] focus:ring-1 focus:ring-[#314CBB] transition-all"
                >
                  <option value="Hilang">Hilang</option>
                  <option value="Ditemukan">Ditemukan</option>
                  <option value="Selesai">Selesai (Sudah Kembali)</option>
                </select>
              </div>

              {/* Deskripsi */}
              <div className="flex-grow flex flex-col">
                <label className="block text-sm font-medium text-gray-900 mb-1">Deskripsi Tambahan/Ciri-ciri</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full flex-grow border border-gray-300 rounded-md p-2.5 bg-white text-sm text-gray-700 outline-none focus:border-[#314CBB] focus:ring-1 focus:ring-[#314CBB] transition-all resize-none min-h-[150px]"
                  required
                />
              </div>

            </div>
          </div>

          {/* TOMBOL BAWAH */}
          <div className="mt-8 pt-4 flex flex-wrap gap-4 border-t border-gray-100">
            <button 
              type="submit"
              className="bg-[#314CBB] text-white px-8 py-2 rounded-md font-medium hover:bg-[#273d96] transition-colors text-sm shadow-sm"
            >
              Simpan Perubahan
            </button>
            <button 
              type="button"
              onClick={() => navigate(-1)}
              className="bg-white border border-gray-300 text-gray-700 px-8 py-2 rounded-md font-medium hover:bg-gray-50 transition-colors text-sm shadow-sm"
            >
              Batal
            </button>
          </div>
        </form>

      </main>
    </div>
  );
}