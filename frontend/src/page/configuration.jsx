import React, { useEffect, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import notify from "../utils/toast";

export default function Configuration({ onBack }) {
  const [logoPreview, setLogoPreview] = useState(null);
  const [siteName, setSiteName] = useState("CTHMC");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const logo = localStorage.getItem("siteLogo");
    const sname = localStorage.getItem("siteName") || "CTHMC";
    setLogoPreview(logo);
    setSiteName(sname);
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
      if (logoPreview) {
        try {
          localStorage.setItem("siteLogo", logoPreview);
        } catch (err) {
          // likely quota exceeded
          console.error("Failed to save logo to localStorage:", err);
          notify.error("Logo too large to save. Please choose a smaller image.");
          setSaving(false);
          return;
        }
      } else {
        localStorage.removeItem("siteLogo");
      }

      if (siteName != null) localStorage.setItem("siteName", siteName);
      // notify other parts of the app
      window.dispatchEvent(new Event('siteConfigChanged'));
      notify.success("Configuration saved");
    } catch (err) {
      console.error(err);
      notify.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleClearLogo = () => {
    setLogoPreview(null);
    localStorage.removeItem("siteLogo");
    window.dispatchEvent(new Event('siteConfigChanged'));
    notify.success("Logo removed");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-3 bg-white border border-gray-100 text-gray-500 hover:text-[#7e9e6c] hover:border-[#7e9e6c] rounded-xl transition-all shadow-sm active:scale-95">
            <FiArrowLeft />
          </button>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Configuration</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-[#7e9e6c] text-white rounded-xl font-bold hover:bg-[#6a8b5a] transition-all">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6">
        <h3 className="text-lg font-bold mb-3">company Name</h3>
        <input value={siteName} onChange={(e) => setSiteName(e.target.value)} className="w-full border px-4 py-3 rounded-xl mb-4" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6">
        <h3 className="text-lg font-bold mb-3">company Logo</h3>
        <div className="flex items-center gap-4">
          <div className="w-28 h-28 rounded-lg bg-gray-50 border flex items-center justify-center overflow-hidden">
            {logoPreview ? (
              <img src={logoPreview} alt="Site Logo" className="object-contain h-full w-full" />
            ) : (
              <div className="text-gray-300">No logo</div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input type="file" accept="image/*" onChange={handleLogoChange} />
            {logoPreview && (
              <button onClick={handleClearLogo} className="px-3 py-1 bg-red-50 text-red-600 rounded-lg font-semibold">Remove Logo</button>
            )}
          </div>
        </div>
      </div>


    </div>
  );
}
