import React, { useState, useEffect, useRef } from "react";
import { QrCode, Search, X, AlertCircle, Loader2, Package, CheckCircle, ArrowLeft } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { adminFetch } from "../../../utils/adminApi";
import Toast from "../../../components/Toast";
import { IPB_COLORS } from "../../../constants/colors";

export default function HandOverExistingReport({ activeTab }) {
  const [searchCode, setSearchCode] = useState("");
  const [scanState, setScanState] = useState("idle");
  const [storageLocations, setStorageLocations] = useState([]);
  
  const [foundReport, setFoundReport] = useState(null);
  const [selectedStorageId, setSelectedStorageId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const html5QrCodeRef = useRef(null);

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    const fetchStorageLocations = async () => {
      try {
        const data = await adminFetch("/api/v1/admin/storage-locations?is_active=true&limit=100");
        setStorageLocations(data.items || data || []);
      } catch (err) {
        console.error("Failed to load storage locations:", err);
      }
    };
    fetchStorageLocations();
  }, []);

  useEffect(() => {
    if (activeTab !== "existing") {
      stopScanner();
    }
    return () => stopScanner();
  }, [activeTab]);

  const startScanner = async () => {
    setScanState("loading");
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader");
        await html5QrCodeRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          (decodedText) => {
            handleVerifyReportId(decodedText.trim());
            stopScanner();
          },
          () => {}
        );
        setScanState("scanning");
      } else {
        throw new Error("No camera devices found.");
      }
    } catch (err) {
      setScanState("error");
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
      html5QrCodeRef.current = null;
    }
    if (scanState === "scanning" || scanState === "loading") {
      setScanState("idle");
    }
  };

  const handleVerifyReportId = async (idToVerify) => {
    if (!idToVerify) return;
    setScanState("loading");
    try {
      const data = await adminFetch(`/api/v1/admin/reports/found-reports/${idToVerify}`);
      setFoundReport(data);
      setScanState("confirmed");
    } catch (err) {
      showToast("Invalid Report ID or report not found.", "error");
      setScanState("idle");
    }
  };

  const handleConfirmHandover = async () => {
    if (!selectedStorageId) {
      showToast("Please select a storage location!", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      await adminFetch(`/api/v1/admin/reports/found-reports/${foundReport.id}/hand-over`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ storage_location_id: selectedStorageId }),
      });

      showToast("Report handover successfully processed!", "success");
      setFoundReport(null);
      setSelectedStorageId("");
      setSearchCode("");
      setScanState("idle");
    } catch (err) {
      showToast(err.message || "Failed to process handover.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[500px]">
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      {scanState === "confirmed" && foundReport && (
        <div className="w-full max-w-xl bg-white border border-gray-100 shadow-xl rounded-3xl p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-200">
          <button 
            onClick={() => { setFoundReport(null); setScanState("idle"); }}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Scanner
          </button>

          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-xl font-bold text-gray-900 mt-2">{foundReport.title}</h3>
            <p className="text-xs font-mono text-gray-400 mt-0.5">ID: {foundReport.id}</p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-600 space-y-2">
            <p><strong>Finder Name:</strong> {foundReport.finder_name || "—"}</p>
            <p><strong>Found Location:</strong> {foundReport.location_name || "—"}</p>
            <p className="line-clamp-3"><strong>Description:</strong> {foundReport.description || "—"}</p>
          </div>

          <div className="space-y-2">
            <label className="block text-[13px] font-bold text-gray-800">
              Assign Storage Location <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select
                required
                value={selectedStorageId}
                onChange={(e) => setSelectedStorageId(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all shadow-sm appearance-none cursor-pointer"
              >
                <option value="" disabled>Select storage location...</option>
                {storageLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleConfirmHandover}
            disabled={isSubmitting || !selectedStorageId}
            className="w-full py-4 text-white rounded-2xl font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: IPB_COLORS.blue.primary }}
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
            {isSubmitting ? "Processing..." : "Confirm & Save Handover"}
          </button>
        </div>
      )}

      {scanState !== "confirmed" && (
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
              <p className="text-sm font-bold text-gray-500 group-hover:text-blue-600 text-center transition-colors">Click to Open Camera</p>
            </button>
          )}

          {scanState === "loading" && (
            <div className="bg-white border border-gray-200 rounded-3xl aspect-square flex flex-col items-center justify-center p-8 w-full shadow-sm">
              <Loader2 size={40} className="text-blue-500 animate-spin mb-4" />
              <p className="text-sm font-bold text-gray-700 text-center">Processing data...</p>
            </div>
          )}

          {scanState === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-3xl aspect-square flex flex-col items-center justify-center p-8 w-full shadow-sm">
              <AlertCircle size={40} className="text-red-500 mb-4" />
              <p className="text-sm font-bold text-red-700 text-center">Camera error or permission denied.</p>
              <button 
                onClick={() => setScanState("idle")}
                className="mt-6 px-6 py-2 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors"
              >
                Back
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
                <X size={18} /> Close Camera
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">OR MANUAL INPUT</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Enter Report ID / Receipt Code..."
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyReportId(searchCode.trim())}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-gray-700 transition-all placeholder:normal-case shadow-sm"
              />
            </div>
            <button 
              onClick={() => handleVerifyReportId(searchCode.trim())}
              disabled={!searchCode.trim()}
              className="px-6 py-3.5 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold transition-colors disabled:opacity-40"
            >
              Search
            </button>
          </div>
        </div>
      )}

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