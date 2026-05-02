import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { X, Upload } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

/*
CATATAN:
 - errornya di atas form, terus kan ngisi form discroll ke bawah gitu yah, jadi ga keliatan kalo error (mending kyk popup aja gasi?)
 */



export default function CreateReportPage({ user, handleLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [reportType, setReportType] = useState('kehilangan');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location_name: '',
    incident_date: '',
    category_ids: [],
    latitude: null,
    longitude: null
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const fileInputRef = useRef(null);

  // Fetch categories dari API
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${API_URL}/api/v1/categories`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error("Gagal mengambil data kategori");
        }
        
        const data = await response.json();
        // Filter hanya kategori yang aktif
        setCategories(data.filter(cat => cat.is_active));
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Gagal memuat kategori");
      } finally {
        setLoadingCategories(false);
      }
    };
 
    fetchCategories();
  }, []);


  useEffect(() => {
    if (location.pathname.includes('lapor-temuan')) {
      setReportType('penemuan');
    } else {
      setReportType('kehilangan');
    }
  }, [location]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setSelectedFiles(prev => [...prev, ...files]);
    setPreviewImages(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const handleRemovePhoto = (index) => {
    URL.revokeObjectURL(previewImages[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryChange = (categoryId) => {
    setFormData(prev => {
      const currentCategories = prev.category_ids;
      const isSelected = currentCategories.includes(categoryId);
      
      return {
        ...prev,
        category_ids: isSelected
          ? currentCategories.filter(id => id !== categoryId)
          : [...currentCategories, categoryId]
      };
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = reportType === 'penemuan' ? "/api/v1/found-reports" : "/api/v1/lost-reports";

    // Validasi
    if (!formData.title || formData.category_ids.length === 0 || !formData.incident_date) {
      setError("Mohon lengkapi data yang wajib diisi.");
      setLoading(false);
      return;
    }

    const convertToISO = (datetimeLocal) => {
      if (!datetimeLocal) return null;
      const date = new Date(datetimeLocal);
      return date.toISOString(); // Format: "2024-05-01T07:30:00.000Z"
    };


    // Gunakan FormData karena ada upload file
    const dataToSend = new FormData();
    dataToSend.append('title', formData.title);
    dataToSend.append('description', formData.description);
    dataToSend.append('location_name', formData.location_name);
    dataToSend.append('incident_date', convertToISO(formData.incident_date));

    formData.category_ids.forEach(id => {
      dataToSend.append('category_ids', id);
    });

    if (formData.latitude) dataToSend.append('latitude', formData.latitude);
    if (formData.longitude) dataToSend.append('longitude', formData.longitude);
    
    selectedFiles.forEach(file => dataToSend.append('photos', file));

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}` 
        },
        body: dataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Gagal membuat laporan");
      }

      // alert("Laporan berhasil dibuat!");
      // navigate('/home'); // Alihkan setelah sukses
      setShowSuccessModal(true);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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

        {/* Notifikasi Error / Sukses */}
        {error && (
          <div className={`p-3 rounded-lg text-sm font-medium ${error.includes('Success') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            
            {/* Kolom Kiri */}
            <div className="space-y-6">
              {/* Nama Barang */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Nama Barang</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-[#364b98] focus:border-[#364b98] outline-none transition-all"
                />
              </div>

              {/* Kategori */}
              {/* <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Kategori</label>
                <select
                  value={formData.category_ids}
                  onChange={handleChange}
                  className="w-1/2 border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-[#364b98] outline-none bg-white"
                >
                  <option value="">Pilih...</option>
                  <option value="elektronik">Elektronik</option>
                  <option value="dokumen">Dokumen</option>
                  <option value="aksesoris">Aksesoris</option>
                </select>
              </div> */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Kategori <span className="text-red-500">*</span>
                </label>

                {loadingCategories ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 animate-pulse">
                    <div className="w-4 h-4 border-2 border-t-transparent border-[#314CBB] rounded-full animate-spin"></div>
                    Memuat kategori...
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {categories.length === 0 ? (
                      <div className="text-sm text-gray-500 italic">Tidak ada kategori tersedia</div>
                    ) : (
                      categories.map((category) => {
                        const isSelected = formData.category_ids.includes(category.id);
                        return (
                          <button
                            key={category.id}
                            type="button" // Penting agar tidak trigger submit form
                            onClick={() => handleCategoryChange(category.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                              isSelected
                                ? 'bg-[#314CBB] text-white border-[#314CBB] shadow-sm'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-[#314CBB] hover:text-[#314CBB]'
                            }`}
                          >
                            {category.name}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}

                {formData.category_ids.length > 0 && (
                  <div className="mt-3 flex items-center text-xs font-medium text-[#314CBB]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#314CBB] mr-2"></span>
                    {formData.category_ids.length} kategori dipilih
                  </div>
                )}
              </div>


              {/* Waktu */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Waktu</label>
                <input
                  type="datetime-local"
                  name="incident_date"
                  value={formData.incident_date}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-[#364b98] outline-none"
                />
              </div>

              {/* Lokasi */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Lokasi</label>
                <input 
                  type="text" 
                  name="location_name"
                  value={formData.location_name}
                  onChange={handleChange}
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
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full flex-grow min-h-[200px] border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-[#364b98] outline-none resize-none"
                ></textarea>
              </div>

              {/* Upload Foto */}
              <div className="mt-auto pt-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">Upload Foto</label>
                
                {previewImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {previewImages.map((url, i) => (
                      <div key={url} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                        <img src={url} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(i)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label className="w-full h-12 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors gap-2 text-gray-400 text-sm">
                  <Upload size={16} />
                  <span>Tambah Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>

            {/* Tombol Submit */}
            <div className="md:col-span-2 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#364b98] text-white px-12 py-3 rounded-md font-medium hover:bg-[#2a3a75] transition-colors shadow-sm w-full md:w-auto"
              >
                {loading ? "Submitting.." : "Submit"}
              </button>
            </div>

          </form>
        </div>
        {showSuccessModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Laporan Berhasil Dibuat!</h3>
      <p className="text-sm text-gray-600 mb-6">
        Laporan {reportType === 'penemuan' ? 'penemuan' : 'kehilangan'} kamu sudah berhasil dikirim.
      </p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={() => {
            setShowSuccessModal(false);
            navigate('/home');
          }}
          className="px-4 py-2 text-sm font-medium text-white bg-[#314CBB] rounded-md hover:bg-[#273d96]"
        >
          Oke
        </button>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  );
}