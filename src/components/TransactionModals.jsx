import React, { useState } from 'react';
import { formatRupiah } from '../utils/formatters';
import { db, serverTimestamp } from '../firebase';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, CheckCircle2, ShieldAlert, X } from 'lucide-react';

export function SetoranModal({ isOpen, onClose, student, adminName, onSuccess }) {
  const [jumlah, setJumlah] = useState('');
  const [keterangan, setKeterangan] = useState('Setoran tabungan rutin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !student) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nominal = Number(jumlah);
    if (!nominal || nominal <= 0) {
      setError('Nominal setoran harus lebih dari Rp 0');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const newSaldo = (Number(student.saldoSaatIni) || 0) + nominal;
      const newTotalSetoran = (Number(student.totalSetoranAwal) || 0) + nominal;

      // 1. Update student document
      const studentRef = doc(db, 'students', student.id || student.NIS);
      await updateDoc(studentRef, {
        saldoSaatIni: newSaldo,
        totalSetoranAwal: newTotalSetoran,
      });

      // 2. Add transaction record
      const transRef = collection(db, 'students', student.id || student.NIS, 'transactions');
      await addDoc(transRef, {
        type: 'masuk',
        jumlah: nominal,
        biayaAdmin: 0,
        jumlahDiterima: nominal,
        tanggal: serverTimestamp(),
        keterangan: keterangan || 'Setoran Tabungan',
        tahunAjaran: student.tahunAjaran || '2025/2026',
        petugasAdmin: adminName || 'Admin MI'
      });

      onSuccess({
        ...student,
        saldoSaatIni: newSaldo,
        totalSetoranAwal: newTotalSetoran,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError('Gagal memproses setoran: ' + (err.message || 'Terjadi kesalahan sistem'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-100">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-emerald-800">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <ArrowDownLeft className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-bold text-base">Tambah Setoran Masuk</h3>
              <p className="text-xs text-gray-500">{student.nama} ({student.id || student.NIS})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-2 border border-red-200">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nominal Setoran (Rp) *
            </label>
            <input
              type="number"
              min="1000"
              step="500"
              value={jumlah}
              onChange={(e) => setJumlah(e.target.value)}
              placeholder="Contoh: 50000"
              required
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-base font-semibold"
            />
            {jumlah > 0 && (
              <p className="text-xs text-emerald-700 font-medium mt-1">
                Terbaca: {formatRupiah(jumlah)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Keterangan Transaksi
            </label>
            <input
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Setoran rutin tabungan harian"
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <div className="flex justify-between">
              <span>Saldo Sekarang:</span>
              <span className="font-mono">{formatRupiah(student.saldoSaatIni || 0)}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-emerald-200 pt-1">
              <span>Estimasi Saldo Baru:</span>
              <span className="font-mono">{formatRupiah((Number(student.saldoSaatIni) || 0) + (Number(jumlah) || 0))}</span>
            </div>
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Setoran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TarikSebagianModal({ isOpen, onClose, student, adminName, onSuccess }) {
  const [jumlah, setJumlah] = useState('');
  const [keterangan, setKeterangan] = useState('Tarik tabungan untuk keperluan sekolah');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !student) return null;

  const currentSaldo = Number(student.saldoSaatIni) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nominal = Number(jumlah);
    if (!nominal || nominal <= 0) {
      setError('Nominal penarikan harus lebih dari Rp 0');
      return;
    }
    if (nominal > currentSaldo) {
      setError(`Saldo tidak mencukupi! Saldo saat ini hanya ${formatRupiah(currentSaldo)}`);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const newSaldo = currentSaldo - nominal;

      // 1. Update student document (totalSetoranAwal TETAP tidak berubah sesuai spek)
      const studentRef = doc(db, 'students', student.id || student.NIS);
      await updateDoc(studentRef, {
        saldoSaatIni: newSaldo,
        // totalSetoranAwal tetap tidak berubah
      });

      // 2. Add transaction record
      const transRef = collection(db, 'students', student.id || student.NIS, 'transactions');
      await addDoc(transRef, {
        type: 'tarik_sebagian',
        jumlah: nominal,
        biayaAdmin: 0,
        jumlahDiterima: nominal,
        tanggal: serverTimestamp(),
        keterangan: keterangan || 'Tarik Sebagian',
        tahunAjaran: student.tahunAjaran || '2025/2026',
        petugasAdmin: adminName || 'Admin MI'
      });

      onSuccess({
        ...student,
        saldoSaatIni: newSaldo,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError('Gagal memproses penarikan: ' + (err.message || 'Terjadi kesalahan sistem'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-blue-100">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-blue-900">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ArrowUpRight className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h3 className="font-bold text-base">Tarik Sebagian Tabungan</h3>
              <p className="text-xs text-gray-500">{student.nama} ({student.id || student.NIS})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Note: Tarik Sebagian tanpa biaya admin */}
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-800">
          <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Info Kebijakan Madrasah:</span> Tarik Sebagian <span className="font-semibold underline">tanpa potongan biaya admin</span>. Total setoran awal siswa tetap utuh.
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-2 border border-red-200">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-gray-700">Nominal Tarik (Rp) *</label>
              <span className="text-[11px] text-gray-500 font-mono">Tersedia: {formatRupiah(currentSaldo)}</span>
            </div>
            <input
              type="number"
              min="1000"
              max={currentSaldo}
              step="500"
              value={jumlah}
              onChange={(e) => setJumlah(e.target.value)}
              placeholder="Contoh: 25000"
              required
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-base font-semibold"
            />
            {jumlah > 0 && (
              <p className="text-xs text-blue-700 font-medium mt-1">
                Terbaca: {formatRupiah(jumlah)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Keterangan Keperluan
            </label>
            <input
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Beli seragam / buku madrasah"
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-800 space-y-1">
            <div className="flex justify-between">
              <span>Sisa Saldo Setelah Tarik:</span>
              <span className="font-mono font-bold text-gray-900">
                {formatRupiah(Math.max(0, currentSaldo - (Number(jumlah) || 0)))}
              </span>
            </div>
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
              disabled={loading || currentSaldo <= 0}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {loading ? 'Memproses...' : 'Tarik Sekarang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TutupTabunganModal({ isOpen, onClose, student, adminName, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !student) return null;

  const currentSaldo = Number(student.saldoSaatIni) || 0;
  const totalSetoran = Number(student.totalSetoranAwal) || 0;

  // Rumus spesifikasi:
  // biayaAdmin = totalSetoranAwal * 0.10
  // jumlahDiterima = saldoSaatIni - biayaAdmin
  const biayaAdmin = Math.round(totalSetoran * 0.10);
  const jumlahDiterima = currentSaldo - biayaAdmin;
  const canClose = currentSaldo >= biayaAdmin;

  const handleConfirmClose = async () => {
    if (!canClose) {
      setError(`Transaksi ditolak: Saldo tabungan (${formatRupiah(currentSaldo)}) lebih kecil dari potongan biaya administrasi 10% (${formatRupiah(biayaAdmin)})!`);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 1. Update student document
      const studentRef = doc(db, 'students', student.id || student.NIS);
      await updateDoc(studentRef, {
        saldoSaatIni: 0,
        status: 'ditutup',
      });

      // 2. Add transaction record
      const transRef = collection(db, 'students', student.id || student.NIS, 'transactions');
      await addDoc(transRef, {
        type: 'tarik_semuanya',
        jumlah: currentSaldo,
        biayaAdmin: biayaAdmin,
        jumlahDiterima: Math.max(0, jumlahDiterima),
        tanggal: serverTimestamp(),
        keterangan: 'Tutup buku tabungan siswa definitif (Potongan admin 10% dari akumulasi setoran awal)',
        tahunAjaran: student.tahunAjaran || '2025/2026',
        petugasAdmin: adminName || 'Admin MI'
      });

      onSuccess({
        ...student,
        saldoSaatIni: 0,
        status: 'ditutup',
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError('Gagal menutup tabungan: ' + (err.message || 'Terjadi kesalahan sistem'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-4 border-red-500 overflow-hidden relative">
        <div className="flex items-center gap-3 text-red-600 mb-4 pb-3 border-b border-red-100">
          <div className="p-3 bg-red-100 rounded-2xl">
            <ShieldAlert className="w-8 h-8 text-red-600 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-xl text-red-700 tracking-tight">KONFIRMASI TUTUP TABUNGAN</h3>
            <p className="text-xs text-red-500 font-medium">Tindakan ini akan mengakhiri rekening tabungan siswa secara permanen</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 text-xs rounded-xl flex items-center gap-2 border border-red-300 font-medium">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-700" />
            <span>{error}</span>
          </div>
        )}

        {/* Ringkasan Perhitungan Keuangan */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5 mb-5 space-y-3">
          <div className="flex justify-between items-center text-xs pb-2 border-b border-red-200">
            <span className="text-gray-600">Nama Siswa:</span>
            <span className="font-bold text-gray-900 uppercase">{student.nama}</span>
          </div>
          <div className="flex justify-between items-center text-xs pb-2 border-b border-red-200">
            <span className="text-gray-600">Nomor Induk Siswa (NIS):</span>
            <span className="font-mono font-bold text-gray-900">{student.id || student.NIS}</span>
          </div>
          <div className="flex justify-between items-center text-xs pb-2 border-b border-red-200">
            <span className="text-gray-600">Kelas Saat Ini:</span>
            <span className="font-bold text-emerald-800">{student.kelasSaatIni}</span>
          </div>
          <div className="flex justify-between items-center text-xs pb-2 border-b border-red-200">
            <span className="text-gray-600">Total Akumulasi Setoran Awal:</span>
            <span className="font-mono font-bold text-gray-800">{formatRupiah(totalSetoran)}</span>
          </div>
          <div className="flex justify-between items-center text-xs pb-2 border-b border-red-200 text-amber-900 bg-amber-50 p-2 rounded-lg">
            <span className="font-semibold">Potongan Biaya Admin 10% (dari Setoran Awal):</span>
            <span className="font-mono font-bold text-red-600">-{formatRupiah(biayaAdmin)}</span>
          </div>
          <div className="flex justify-between items-center text-xs pb-2 border-b border-red-200">
            <span className="text-gray-600">Saldo Rekening Saat Ini:</span>
            <span className="font-mono font-bold text-gray-900">{formatRupiah(currentSaldo)}</span>
          </div>

          {/* BOX UANG DITERIMA SISWA BESAR */}
          <div className="bg-emerald-600 text-white rounded-xl p-4 text-center mt-3 shadow-md">
            <p className="text-xs uppercase tracking-wider font-semibold opacity-90">
              UANG BERSIH DITERIMA SISWA:
            </p>
            <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight mt-1">
              {formatRupiah(Math.max(0, jumlahDiterima))}
            </p>
            <p className="text-[11px] opacity-80 mt-1 font-sans">
              (Rumus: Saldo Saat Ini - Biaya Admin 10%)
            </p>
          </div>
        </div>

        {!canClose && (
          <div className="p-3 bg-red-100 text-red-800 rounded-xl text-xs mb-4 border border-red-300 font-semibold">
            Saldo saat ini ({formatRupiah(currentSaldo)}) tidak cukup untuk membayar biaya administrasi 10% ({formatRupiah(biayaAdmin)}). Transaksi tidak dapat diproses.
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirmClose}
            disabled={loading || !canClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {loading ? 'Memproses Penutupan...' : 'Ya, Tutup Tabungan & Cairkan'}
          </button>
        </div>
      </div>
    </div>
  );
}
