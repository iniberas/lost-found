import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const API_URL = import.meta.env.VITE_API_URL;

/*
CATATAN:
 - list kategorinya ga sesuai hifi, benerin plsplspls
 - 
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
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
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
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
    }
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
    
    if (selectedFile) {
      dataToSend.append('photos', selectedFile);
    }

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

      alert("Laporan berhasil dibuat!");
      navigate('/home'); // Alihkan setelah sukses
      
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
                  <div className="text-sm text-gray-500">Memuat kategori...</div>
                ) : (
                  <div className="border border-gray-300 rounded-md p-4 space-y-2 max-h-48 overflow-y-auto bg-white">
                    {categories.length === 0 ? (
                      <div className="text-sm text-gray-500">Tidak ada kategori tersedia</div>
                    ) : (
                      categories.map((category) => (
                        <label key={category.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={formData.category_ids.includes(category.id)}
                            onChange={() => handleCategoryChange(category.id)}
                            className="w-4 h-4 text-[#364b98] border-gray-300 rounded focus:ring-[#364b98]"
                          />
                          <span className="text-sm text-gray-700">{category.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                )}
                {formData.category_ids.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
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
                <div className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50/50 min-h-[140px]">
                  
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
                        onClick={() => {setPreviewImage(null); setSelectedFile(null); }}
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
                type="submit"
                disabled={loading}
                className="bg-[#364b98] text-white px-12 py-3 rounded-md font-medium hover:bg-[#2a3a75] transition-colors shadow-sm w-full md:w-auto"
              >
                {loading ? "Submitting.." : "Submit"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}