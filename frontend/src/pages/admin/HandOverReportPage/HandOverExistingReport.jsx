import React, { useState, useEffect, useRef } from "react";
import { QrCode, Search, X, AlertCircle, Loader2 } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

export default function HandOverExistingReport({ activeTab }) {
  const [searchCode, setSearchCode] = useState("");
  const [scanState, setScanState] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (activeTab !== "existing") {
      stopScanner();
    }
    return () => stopScanner();
  }, [activeTab]);

  const startScanner = async () => {
    setScanState("loading");
    setErrorMessage("");

    try {
      const devices = await Html5Qrcode.getCameras();
      
      if (devices && devices.length > 0) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader");
        await html5QrCodeRef.current.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            setSearchCode(decodedText);
            stopScanner();
          },
          (error) => {
          }
        );
        
        setScanState("scanning");
      } else {
        throw new Error("Tidak ada kamera yang ditemukan di perangkat ini.");
      }
    } catch (err) {
      console.error(err);
      setScanState("error");
      setErrorMessage("Izin kamera ditolak atau kamera tidak tersedia.");
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error("Gagal menghentikan scanner", err);
      }
      html5QrCodeRef.current = null;
    }
    setScanState("idle");
  };

  return (
    <div className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[500px]">
      <div className="w-full max-w-md space-y-8">
        {scanState === "idle" && (
          <button 
            onClick={startScanner}
            className="bg-gray-50 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 rounded-3xl aspect-square flex flex-col items-center justify-center p-8 relative overflow-hidden group w-full transition-all"
          >
            <div className="w-48 h-48 border-4 border-gray-200 group-hover:border-blue-300 rounded-3xl relative mb-6 transition-colors">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-gray-400 group-hover:border-blue-600 rounded-tl-2xl -mt-1 -ml-1 transition-colors"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-gray-400 group-hover:border-blue-600 rounded-tr-2xl -mt-1 -mr-1 transition-colors"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-gray-400 group-hover:border-blue-600 rounded-bl-2xl -mb-1 -ml-1 transition-colors"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-gray-400 group-hover:border-blue-600 rounded-br-2xl -mb-1 -mr-1 transition-colors"></div>
            </div>
            <QrCode size={32} className="text-gray-400 group-hover:text-blue-500 mb-2 transition-colors" />
            <p className="text-sm font-bold text-gray-500 group-hover:text-blue-600 text-center transition-colors">Klik untuk Buka Kamera</p>
          </button>
        )}
        {scanState === "loading" && (
          <div className="bg-white border border-gray-200 rounded-3xl aspect-square flex flex-col items-center justify-center p-8 w-full shadow-sm">
            <Loader2 size={40} className="text-blue-500 animate-spin mb-4" />
            <p className="text-sm font-bold text-gray-700 text-center">Meminta Izin Kamera...</p>
            <p className="text-xs text-gray-400 text-center mt-2">Mohon izinkan akses kamera pada pop-up browser Anda.</p>
          </div>
        )}
        {scanState === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-3xl aspect-square flex flex-col items-center justify-center p-8 w-full shadow-sm">
            <AlertCircle size={40} className="text-red-500 mb-4" />
            <p className="text-sm font-bold text-red-700 text-center">{errorMessage}</p>
            <button 
              onClick={() => setScanState("idle")}
              className="mt-6 px-6 py-2 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors"
            >
              Kembali
            </button>
          </div>
        )}
        <div className={`transition-all duration-300 ${scanState === "scanning" ? "block opacity-100" : "hidden opacity-0"}`}>
          <div className="bg-white border border-gray-200 shadow-xl rounded-3xl overflow-hidden p-4 relative">
            <div id="qr-reader" className="w-full aspect-square rounded-2xl overflow-hidden bg-black mb-4 flex items-center justify-center"></div>
            <button 
              onClick={stopScanner}
              className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <X size={18} /> Tutup Kamera
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">ATAU INPUT MANUAL</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Masukkan Kode Resi..."
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-gray-700 transition-all placeholder:normal-case"
            />
          </div>
          <button className="px-6 py-3.5 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold transition-colors">
            Cari
          </button>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        #qr-reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          border-radius: 1rem !important;
        }
      `}} />
    </div>
  );
}