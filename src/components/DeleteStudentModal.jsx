import React, { useState } from 'react';
import { formatRupiah } from '../utils/formatters';
import { db } from '../firebase';
import { doc, deleteDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { Trash2, AlertTriangle, Loader2, X } from 'lucide-react';

export default function DeleteStudentModal({ isOpen, onClose, student, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmedCheck, setConfirmedCheck] = useState(false);

  if (!isOpen || !student) return null;

  const studentId = student.id || student.NIS;
  const saldo = Number(student.saldoSaatIni) || 0;

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Delete all transactions in subcollection 'students/{NIS}/transactions'
      const transRef = collection(db, 'students', studentId, 'transactions');
      const transSnap = await getDocs(transRef);

      if (!transSnap.empty) {
        // Delete batch
        const batch = writeBatch(db);
        transSnap.docs.forEach((d) => {
          batch.delete(d.ref);
        });
        await batch.commit();
      }

      // 2. Delete the student document
      const studentRef = doc(db, 'students', studentId);
      await deleteDoc(studentRef);

      if (onSuccess) {
        onSuccess(studentId);
      }
      onClose();
    } catch (err) {
      console.error('Gagal menghapus siswa:', err);
      setError('Gagal menghapus siswa: ' + (err.message || 'Terjadi kesalahan sistem'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-red-500 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-red-100">
          <div className="flex items-center gap-2.5 text-red-700">
            <div className="p-2 bg-red-100 rounded-xl">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Hapus Data Siswa</h3>
              <p className="text-xs text-red-500 font-medium">Tindakan ini tidak dapat dibatalkan</p>
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
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 space-y-3 text-xs">
          {/* Ringkasan Data Siswa */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-500">Nama Siswa:</span>
              <span className="font-bold text-gray-900 uppercase">{student.nama}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Nomor Induk (NIS):</span>
              <span className="font-mono font-bold text-gray-800">{studentId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Kelas Saat Ini:</span>
              <span className="font-bold text-emerald-800">Kelas {student.kelasSaatIni}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-gray-200">
              <span className="text-gray-500">Saldo Tersimpan:</span>
              <span className="font-mono font-black text-emerald-800">{formatRupiah(saldo)}</span>
            </div>
          </div>

          {/* Alert Peringatan bila ada saldo tersisa */}
          {saldo > 0 ? (
            <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-red-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-xs text-red-800">
                <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
                PERINGATAN: Siswa Masih Memiliki Saldo!
              </p>
              <p className="text-[11px] leading-relaxed">
                Siswa ini tercatat memiliki saldo aktif sebesar <strong className="font-mono">{formatRupiah(saldo)}</strong>. Menghapus data ini akan menghapus rekening dan seluruh mutasi transaksi secara permanen.
              </p>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
              Seluruh data identitas siswa serta mutasi tabungan di nomor induk <strong>{studentId}</strong> akan dihapus permanen dari database madrasah.
            </div>
          )}

          {/* Konfirmasi Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmedCheck}
                onChange={(e) => setConfirmedCheck(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-[11px] text-gray-700 font-medium">
                Saya mengonfirmasi untuk menghapus data siswa ini secara permanen guna memperbaiki kesalahan input.
              </span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-3 border-t border-gray-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="cursor-pointer px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading || !confirmedCheck}
            className="cursor-pointer px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Ya, Hapus Siswa
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
