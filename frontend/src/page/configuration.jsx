
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import notify from "../utils/toast";
import API from "../apis/axios";
import { FiArrowLeft, FiSave, FiUpload, FiTrash2, FiGlobe, FiImage, FiCheckCircle } from 'react-icons/fi';

export default function Configuration({ onBack }) {
  const [logoPreview, setLogoPreview] = useState(null);
  const [siteName, setSiteName] = useState("CTHMC");
  const [saving, setSaving] = useState(false);


  // Fetch config from backend
  const fetchConfig = async () => {
    try {
      const res = await API.get("/api/config");
      setLogoPreview(res.data.logo || null);
      setSiteName(res.data.siteName || "CTHMC");
    } catch (err) {
      setLogoPreview(null);
      setSiteName("CTHMC");
    }
  };

  // Fetch config on mount and listen for real-time updates
  useEffect(() => {
    fetchConfig();
    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:8000", {
      transports: ["websocket"]
    });
    socket.on("config-updated", () => {
      fetchConfig();
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  // Compress image using canvas to stay under storage limits
  const compressImage = (file, maxBytes = 450000) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = () => {
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Resize to max dimension while keeping aspect ratio
            const maxDim = 1200;
            let { width, height } = img;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Try decreasing quality until under maxBytes or minimum quality reached
            let quality = 0.9;
            const minQuality = 0.45;

            const attempt = () => {
              const dataUrl = canvas.toDataURL('image/jpeg', quality);
              // approx bytes = (length * 3)/4 (base64)
              const approxBytes = Math.round((dataUrl.length * 3) / 4);
              if (approxBytes <= maxBytes || quality <= minQuality) {
                resolve(dataUrl);
              } else {
                quality -= 0.15;
                attempt();
              }
            };

            attempt();
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = (e) => reject(e);
        img.src = reader.result;
      };

      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  const handleLogoChange = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;

    try {
      // If file is small, avoid compression; otherwise compress to reasonable size
      if (f.size <= 200000) {
        const reader = new FileReader();
        reader.onload = () => setLogoPreview(reader.result);
        reader.readAsDataURL(f);
      } else {
        const compressed = await compressImage(f, 450000);
        setLogoPreview(compressed);
        notify.info("Image compressed for storage");
      }
    } catch (err) {
      console.error("Image processing failed:", err);
      notify.error("Failed to process the image. Try a smaller file.");
    }
  };


  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await API.put(
        "/api/config",
        {
          siteName,
          logo: logoPreview,
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      notify.success("Configuration saved");
    } catch (err) {
      notify.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };


  const handleClearLogo = () => {
    setLogoPreview(null);
    // Do not call API here; only clear preview. Save will persist the removal.
  };

  return (
    <div className=" mx-auto">
  {/* Header Section */}
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
    <div className="flex items-center gap-4">
      <button 
        onClick={onBack} 
        className="group p-3 bg-white border border-gray-200 text-gray-400 hover:text-[#7e9e6c] hover:border-[#7e9e6c] rounded-xl transition-all shadow-sm active:scale-95"
        title="Go Back"
      >
        <FiArrowLeft className="text-xl group-hover:-translate-x-1 transition-transform" />
      </button>
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Configuration</h2>
      </div>
    </div>
    
    <button 
      onClick={handleSave} 
      disabled={saving} 
      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${
        saving 
        ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
        : "bg-[#7e9e6c] text-white hover:bg-[#6a8b5a] shadow-[#7e9e6c]/20"
      }`}
    >
      {saving ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Saving...</span>
        </div>
      ) : (
        <>
          <FiSave className="text-lg" />
          <span>Save Changes</span>
        </>
      )}
    </button>
  </div>

  <div>

    {/* Right Column: Cards */}
    <div className="space-y-6">
      
      {/* Company Name Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
          <FiGlobe className="text-[#7e9e6c]" />
          Company Name
        </label>
        <div className="relative">
          <input 
            value={siteName} 
            onChange={(e) => setSiteName(e.target.value)} 
            placeholder="e.g. Acme Corp"
            className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:ring-4 focus:ring-[#7e9e6c]/10 focus:border-[#7e9e6c] outline-none transition-all font-medium"
          />
        </div>
      </div>

      {/* Company Logo Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-4">
          <FiImage className="text-[#7e9e6c]" />
          Company Logo
        </label>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Logo Preview Wrapper */}
          <div className="relative group">
            <div className="w-32 h-32 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden transition-colors group-hover:border-[#7e9e6c]/50">
              {logoPreview ? (
                <img src={logoPreview} alt="Site Logo" className="object-contain h-full w-full p-2" />
              ) : (
                <div className="flex flex-col items-center text-gray-300">
                  <FiImage size={32} />
                  <span className="text-[10px] uppercase font-bold mt-1">No Logo</span>
                </div>
              )}
            </div>
            {logoPreview && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                <FiCheckCircle className="text-white text-3xl" />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 w-full sm:w-auto">
            <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold cursor-pointer hover:bg-gray-50 transition-all active:scale-95 shadow-sm">
              <FiUpload />
              <span>{logoPreview ? "Change Logo" : "Upload Logo"}</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleLogoChange} 
                className="hidden" 
              />
            </label>

            {logoPreview && (
              <button
                onClick={handleClearLogo}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all active:scale-95"
              >
                <FiTrash2 />
                <span>Remove Logo</span>
              </button>
            )}
            <p className="text-[11px] text-gray-400 px-1">
              Recommended: Square PNG or SVG, max 2MB.
            </p>
          </div>
        </div>
      </div>

    </div>
  </div>
</div>
  );
}
