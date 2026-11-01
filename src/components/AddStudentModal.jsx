import React, { useState } from 'react';
import { LIST_KELAS, TAHUN_AJARAN_LIST } from '../utils/formatters';
import { db, serverTimestamp } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserPlus, AlertCircle, X } from 'lucide-react';

export default function AddStudentModal({ isOpen, onClose, onSuccess }) {
  const [nis, setNis] = useState('');
  const [nama, setNama] = useState('');
  const [kelas, setKelas] = useState('1A');
  const [tahunAjaran, setTahunAjaran] = useState('2025/2026');
  const [tahunMasuk, setTahunMasuk] = useState('2025');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanNis = nis.trim();
    const cleanNama = nama.trim();

    if (!cleanNis || !cleanNama) {
      setError('NIS dan Nama Siswa wajib diisi.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Check if NIS already exists
      const docRef = doc(db, 'students', cleanNis);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setError(`Siswa dengan NIS ${cleanNis} sudah terdaftar di sistem!`);
        return;
      }

      await setDoc(docRef, {
        nama: cleanNama,
        kelasSaatIni: kelas,
        tahunAjaran: tahunAjaran,
        tahunMasuk: tahunMasuk || new Date().getFullYear().toString(),
        saldoSaatIni: 0,
        totalSetoranAwal: 0,
        status: 'aktif',
        riwayatKelas: [kelas],
        createdAt: serverTimestamp()
      });

      onSuccess({
        id: cleanNis,
        NIS: cleanNis,
        nama: cleanNama,
        kelasSaatIni: kelas,
        tahunAjaran: tahunAjaran,
        saldoSaatIni: 0,
        totalSetoranAwal: 0,
        status: 'aktif'
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError('Gagal mendaftarkan siswa: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-100">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-emerald-900">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <UserPlus className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-bold text-base">Tambah Siswa Baru</h3>
              <p className="text-xs text-gray-500">Daftarkan buku tabungan siswa baru</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nomor Induk Siswa (NIS) *
            </label>
            <input
              type="text"
              value={nis}
              onChange={(e) => setNis(e.target.value)}
              placeholder="Contoh: 2025001"
              required
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nama Lengkap Siswa *
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Muhammad Farhan"
              required
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Kelas Masuk</label>
              <select
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
              >
                {LIST_KELAS.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Tahun Ajaran</label>
              <select
                value={tahunAjaran}
                onChange={(e) => setTahunAjaran(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
              >
                {TAHUN_AJARAN_LIST.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tahun Masuk Madrasah</label>
            <input
              type="number"
              value={tahunMasuk}
              onChange={(e) => setTahunMasuk(e.target.value)}
              placeholder="Contoh: 2025"
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
            />
          </div>

          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-[11px] leading-relaxed">
            * Rekening siswa baru otomatis dimulai dengan saldo Rp 0 dan status Aktif.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              {loading ? 'Mendaftarkan...' : 'Daftarkan Siswa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
