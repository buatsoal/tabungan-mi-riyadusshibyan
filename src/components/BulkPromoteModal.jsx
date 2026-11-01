import React, { useState } from 'react';
import { LIST_KELAS, TAHUN_AJARAN_LIST } from '../utils/formatters';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ArrowRight, GraduationCap, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';

export default function BulkPromoteModal({ isOpen, onClose, onFinish }) {
  const [oldTahun, setOldTahun] = useState('2024/2025');
  const [oldKelas, setOldKelas] = useState('5A');
  const [newTahun, setNewTahun] = useState('2025/2026');
  const [newKelas, setNewKelas] = useState('6A');

  const [previewStudents, setPreviewStudents] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSearchStudents = async () => {
    try {
      setSearching(true);
      setError('');
      setStatusMessage('');

      const studentsRef = collection(db, 'students');
      const q = query(
        studentsRef,
        where('kelasSaatIni', '==', oldKelas),
        where('tahunAjaran', '==', oldTahun),
        where('status', '==', 'aktif')
      );

      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPreviewStudents(list);
      setHasSearched(true);
      if (list.length === 0) {
        setStatusMessage(`Tidak ditemukan siswa aktif di kelas ${oldKelas} tahun ajaran ${oldTahun}.`);
      }
    } catch (err) {
      console.error(err);
      setError('Gagal mencari data siswa: ' + err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleExecutePromotion = async () => {
    if (previewStudents.length === 0) return;

    try {
      setUpdating(true);
      setError('');
      let updatedCount = 0;

      for (let i = 0; i < previewStudents.length; i++) {
        const s = previewStudents[i];
        const studentRef = doc(db, 'students', s.id);

        await updateDoc(studentRef, {
          kelasSaatIni: newKelas,
          tahunAjaran: newTahun,
          riwayatKelas: arrayUnion(newKelas)
        });

        updatedCount++;
        setProgress(Math.round((updatedCount / previewStudents.length) * 100));
      }

      setStatusMessage(`Alhamdulillah! Berhasil menaikkan ${updatedCount} siswa dari kelas ${oldKelas} ke ${newKelas}.`);
      setPreviewStudents([]);
      setHasSearched(false);
      onFinish();
    } catch (err) {
      console.error(err);
      setError('Terjadi kendala saat update massal: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-emerald-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5 text-emerald-900">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <GraduationCap className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-bold text-base">Kenaikan Kelas Massal</h3>
              <p className="text-xs text-gray-500">Pindahkan rombongan belajar ke tingkat kelas baru</p>
            </div>
          </div>
          <button onClick={onClose} disabled={updating} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {statusMessage && (
          <div className="mt-3 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Form Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
            {/* Asal Kelas */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Kelas & Tahun Asal</span>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tahun Ajaran Lama</label>
                <select
                  value={oldTahun}
                  onChange={(e) => { setOldTahun(e.target.value); setHasSearched(false); }}
                  className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  {TAHUN_AJARAN_LIST.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Kelas Lama</label>
                <select
                  value={oldKelas}
                  onChange={(e) => { setOldKelas(e.target.value); setHasSearched(false); }}
                  className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  {LIST_KELAS.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target Kelas */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Kelas & Tahun Tujuan</span>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tahun Ajaran Baru</label>
                <select
                  value={newTahun}
                  onChange={(e) => setNewTahun(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  {TAHUN_AJARAN_LIST.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Kelas Baru</label>
                <select
                  value={newKelas}
                  onChange={(e) => setNewKelas(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  {LIST_KELAS.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Button Search / Preview */}
          <div className="flex justify-between items-center pt-1">
            <button
              type="button"
              onClick={handleSearchStudents}
              disabled={searching || updating}
              className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {searching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Mencari Data...
                </>
              ) : (
                '1. Cek Siswa Rombel Ini'
              )}
            </button>

            {hasSearched && (
              <span className="text-xs font-medium text-gray-600">
                Ditemukan: <span className="font-bold text-emerald-700">{previewStudents.length}</span> siswa aktif
              </span>
            )}
          </div>

          {/* Preview Table */}
          {hasSearched && previewStudents.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 flex justify-between">
                <span>Daftar Siswa Yang Akan Dinaikkan:</span>
                <span className="text-emerald-800">{oldKelas} ({oldTahun}) <ArrowRight className="w-3 h-3 inline" /> {newKelas} ({newTahun})</span>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 text-xs">
                {previewStudents.map((s, idx) => (
                  <div key={s.id} className="p-2.5 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 font-mono w-5">{idx + 1}.</span>
                      <div>
                        <p className="font-semibold text-gray-800">{s.nama}</p>
                        <p className="text-[11px] text-gray-500 font-mono">NIS: {s.id || s.NIS}</p>
                      </div>
                    </div>
                    <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium">
                      Siap Naik
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress bar when updating */}
          {updating && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-600 font-medium">
                <span>Memproses pembaruan massal...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2.5 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-gray-100 flex justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={updating}
            className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleExecutePromotion}
            disabled={updating || previewStudents.length === 0}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 disabled:opacity-40 transition-colors"
          >
            {updating ? 'Menyimpan Pembaruan...' : `2. Konfirmasi Naikkan ${previewStudents.length} Siswa`}
          </button>
        </div>
      </div>
    </div>
  );
}
