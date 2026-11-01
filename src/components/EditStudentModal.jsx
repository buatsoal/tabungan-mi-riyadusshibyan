import React, { useState, useEffect } from 'react';
import { LIST_KELAS, TAHUN_AJARAN_LIST, formatRupiah } from '../utils/formatters';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Edit3, Check, X, AlertCircle, Loader2 } from 'lucide-react';

export default function EditStudentModal({ isOpen, onClose, student, onSuccess }) {
  const [nama, setNama] = useState('');
  const [kelas, setKelas] = useState('1A');
  const [tahunAjaran, setTahunAjaran] = useState('2025/2026');
  const [tahunMasuk, setTahunMasuk] = useState('2025');
  const [status, setStatus] = useState('aktif');
  const [saldoSaatIni, setSaldoSaatIni] = useState(0);
  const [totalSetoranAwal, setTotalSetoranAwal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (student) {
      setNama(student.nama || '');
      setKelas(student.kelasSaatIni || '1A');
      setTahunAjaran(student.tahunAjaran || '2025/2026');
      setTahunMasuk(student.tahunMasuk || new Date().getFullYear().toString());
      setStatus(student.status || 'aktif');
      setSaldoSaatIni(Number(student.saldoSaatIni) || 0);
      setTotalSetoranAwal(Number(student.totalSetoranAwal) || 0);
      setError('');
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanNama = nama.trim();
    if (!cleanNama) {
      setError('Nama siswa tidak boleh kosong.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const studentId = student.id || student.NIS;
      const studentRef = doc(db, 'students', studentId);

      const updatePayload = {
        nama: cleanNama,
        kelasSaatIni: kelas,
        tahunAjaran: tahunAjaran,
        tahunMasuk: tahunMasuk || '',
        status: status,
        saldoSaatIni: Number(saldoSaatIni) || 0,
        totalSetoranAwal: Number(totalSetoranAwal) || 0,
      };

      await updateDoc(studentRef, updatePayload);

      const updatedStudent = {
        ...student,
        ...updatePayload,
      };

      if (onSuccess) {
        onSuccess(updatedStudent);
      }
      onClose();
    } catch (err) {
      console.error('Gagal memperbarui data siswa:', err);
      setError('Gagal menyimpan perubahan: ' + (err.message || 'Terjadi kesalahan sistem'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-emerald-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5 text-emerald-900">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Edit3 className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-bold text-base">Edit Data Siswa</h3>
              <p className="text-xs text-gray-500">
                Koreksi data profil & tabungan NIS: <span className="font-mono font-semibold text-gray-800">{student.id || student.NIS}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="cursor-pointer p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
          {/* NIS (Read Only untuk konsistensi ID dokumen) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nomor Induk Siswa (NIS)
            </label>
            <input
              type="text"
              value={student.id || student.NIS}
              disabled
              className="w-full px-3.5 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-600 cursor-not-allowed"
            />
            <span className="text-[10px] text-gray-400 mt-0.5 block">
              * NIS adalah pengenal unik dokumen dan tidak dapat diubah secara langsung.
            </span>
          </div>

          {/* Nama Siswa */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nama Lengkap Siswa *
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 uppercase font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Kelas */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Kelas Saat Ini</label>
              <select
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
              >
                {LIST_KELAS.map((k) => (
                  <option key={k} value={k}>
                    Kelas {k}
                  </option>
                ))}
              </select>
            </div>

            {/* Tahun Ajaran */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Tahun Ajaran</label>
              <select
                value={tahunAjaran}
                onChange={(e) => setTahunAjaran(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
              >
                {TAHUN_AJARAN_LIST.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Tahun Masuk */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Tahun Masuk</label>
              <input
                type="number"
                value={tahunMasuk}
                onChange={(e) => setTahunMasuk(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Status Rekening */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Status Rekening</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
              >
                <option value="aktif">Aktif</option>
                <option value="ditutup">Ditutup</option>
                <option value="lulus">Lulus</option>
              </select>
            </div>
          </div>

          {/* Bagian Koreksi Saldo & Setoran Awal (Bila terjadi kesalahan input awal) */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-3">
            <span className="text-[11px] font-bold text-amber-900 block uppercase tracking-wider">
              Koreksi Keuangan Saldo / Setoran (Opsional)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Saldo Saat Ini (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={saldoSaatIni}
                  onChange={(e) => setSaldoSaatIni(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white rounded-lg border border-gray-300 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] text-gray-500 mt-0.5 block">
                  {formatRupiah(saldoSaatIni)}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Total Setoran Awal (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={totalSetoranAwal}
                  onChange={(e) => setTotalSetoranAwal(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white rounded-lg border border-gray-300 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] text-gray-500 mt-0.5 block">
                  {formatRupiah(totalSetoranAwal)}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-amber-800 italic block">
              * Ubah nominal di atas jika terjadi kesalahan input angka saldo pada saat pendaftaran awal.
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="cursor-pointer px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
