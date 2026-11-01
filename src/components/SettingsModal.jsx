import React, { useState } from 'react';
import { Settings, Image, Check, X } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, currentConfig, onSave }) {
  const [nama, setNama] = useState(currentConfig?.nama || 'MI RIYADUSSHIBYAN');
  const [alamat, setAlamat] = useState(currentConfig?.alamat || 'Jl. KH. Noer Alie No. 45, Teluk Pucung, Kec. Bekasi Utara, Kota Bekasi, Jawa Barat 17121');
  const [nsm, setNsm] = useState(currentConfig?.nsm || '111232750089');
  const [npsn, setNpsn] = useState(currentConfig?.npsn || '69752311');
  const [telepon, setTelepon] = useState(currentConfig?.telepon || '(021) 88991234');
  const [email, setEmail] = useState(currentConfig?.email || 'info@mi-riyadusshibyan.sch.id');
  const [bendahara, setBendahara] = useState(currentConfig?.bendahara || 'Ustadzah Nurul Hidayah, S.Pd.I');
  const [kota, setKota] = useState(currentConfig?.kota || 'Bekasi');
  const [logoUrl, setLogoUrl] = useState(currentConfig?.logoUrl || 'https://images.unsplash.com/photo-1590076215667-873d328d49a7?auto=format&fit=crop&w=150&q=80');

  if (!isOpen) return null;

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
      logoUrl
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-emerald-100 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-emerald-900">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Settings className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-bold text-base">Konfigurasi Kop Surat Madrasah</h3>
              <p className="text-xs text-gray-500">Sesuaikan data identitas MI untuk format cetak</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 overflow-y-auto flex-1 pr-1">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Madrasah</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500"
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
            <label className="block text-xs font-semibold text-gray-700 mb-1">Alamat Lengkap</label>
            <textarea
              rows={2}
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Telepon</label>
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

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">URL Logo Madrasah</label>
            <div className="flex gap-3 items-center">
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500"
              />
              <div className="w-10 h-10 border border-gray-300 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-gray-50">
                {logoUrl ? (
                  <img src={logoUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  <Image className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
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
