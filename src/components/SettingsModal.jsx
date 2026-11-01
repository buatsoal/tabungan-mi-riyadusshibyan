import React, { useState, useRef } from 'react';
import { Settings, Image as ImageIcon, Upload, Trash2, Check, X, AlertCircle } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, currentConfig, onSave }) {
  const [nama, setNama] = useState(currentConfig?.nama || 'MI RIYADUSSHIBYAN');
  const [alamat, setAlamat] = useState(currentConfig?.alamat || 'Jl. KH. Noer Alie No. 45, Teluk Pucung, Kec. Bekasi Utara, Kota Bekasi, Jawa Barat 17121');
  const [nsm, setNsm] = useState(currentConfig?.nsm || '111232750089');
  const [npsn, setNpsn] = useState(currentConfig?.npsn || '69752311');
  const [telepon, setTelepon] = useState(currentConfig?.telepon || '(021) 88991234');
  const [email, setEmail] = useState(currentConfig?.email || 'info@mi-riyadusshibyan.sch.id');
  const [bendahara, setBendahara] = useState(currentConfig?.bendahara || 'Ustadzah Nurul Hidayah, S.Pd.I');
  const [kota, setKota] = useState(currentConfig?.kota || 'Bekasi');
  const [logoUrl, setLogoUrl] = useState(currentConfig?.logoUrl || '');
  const [uploadError, setUploadError] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Membaca file gambar dari perangkat dan resize ke Base64 Data URL
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('File harus berupa gambar (JPG, PNG, atau WEBP).');
      return;
    }

    setIsProcessingImage(true);
    setUploadError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Kompresi resolusi ke proporsional max 320px agar hemat memori & tersimpan mulus di localStorage
          const maxDim = 320;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Simpan sebagai Base64 PNG
          const base64Data = canvas.toDataURL('image/png', 0.9);
          setLogoUrl(base64Data);
          setIsProcessingImage(false);
        } catch (err) {
          console.error('Error compressing image:', err);
          // Fallback ke raw data URL jika canvas gagal
          setLogoUrl(event.target.result);
          setIsProcessingImage(false);
        }
      };
      img.onerror = () => {
        setUploadError('Gagal memproses file gambar. Silakan gunakan format JPG atau PNG lainnya.');
        setIsProcessingImage(false);
      };
      img.src = event.target.result;
    };
    reader.onerror = () => {
      setUploadError('Gagal membaca file dari perangkat.');
      setIsProcessingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updated = {
      nama,
      alamat,
      nsm,
      npsn,
      telepon,
      email,
      bendahara,
      kota,
      logoUrl,
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-emerald-100 flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-emerald-900">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Settings className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-bold text-base">Konfigurasi Madrasah & Kop Surat</h3>
              <p className="text-xs text-gray-500">Kelola identitas madrasah dan unggah logo resmi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
          {/* UPLOAD LOGO MADRASAH DARI PERANGKAT (JPG/PNG - TANPA URL) */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
            <label className="block text-xs font-bold text-emerald-950 mb-2">
              Logo Madrasah (Upload File JPG / PNG dari Perangkat)
            </label>

            {uploadError && (
              <div className="mb-2 p-2 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-1.5 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="flex items-center gap-4">
              {/* Kotak Preview Logo */}
              <div className="w-20 h-20 border-2 border-dashed border-emerald-300 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center bg-white shadow-xs">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo Preview"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400 p-2 text-center">
                    <ImageIcon className="w-6 h-6 mb-1 text-emerald-400" />
                    <span className="text-[9px] font-sans">Belum ada logo</span>
                  </div>
                )}
              </div>

              {/* Tombol Aksi Upload / Hapus */}
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingImage}
                    className="cursor-pointer px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isProcessingImage ? 'Memproses...' : logoUrl ? 'Ganti Logo' : 'Upload Logo (JPG/PNG)'}</span>
                  </button>

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="cursor-pointer px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Hapus logo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-gray-500 leading-tight">
                  Pilih file gambar logo dari HP atau komputer Anda. Logo otomatis tampil di header aplikasi dan kop surat dokumen tabungan/laporan.
                </p>
              </div>
            </div>
          </div>

          {/* Form Identitas Madrasah */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Madrasah *</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 uppercase font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nomor Statistik (NSM)</label>
              <input
                type="text"
                value={nsm}
                onChange={(e) => setNsm(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">NPSN</label>
              <input
                type="text"
                value={npsn}
                onChange={(e) => setNpsn(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Alamat Lengkap Madrasah</label>
            <textarea
              rows={2}
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nomor Telepon</label>
              <input
                type="text"
                value={telepon}
                onChange={(e) => setTelepon(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Resmi</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Bendahara / Petugas</label>
              <input
                type="text"
                value={bendahara}
                onChange={(e) => setBendahara(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Kota Penandatanganan</label>
              <input
                type="text"
                value={kota}
                onChange={(e) => setKota(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="cursor-pointer px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
