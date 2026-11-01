import React, { useState } from 'react';
import { generateTemplateExcel, parseExcelFile } from '../utils/excelHelper';
import { db, serverTimestamp } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Download, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, X, Loader2 } from 'lucide-react';

export default function ExcelModal({ isOpen, onClose, onFinish }) {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [allParsedData, setAllParsedData] = useState([]);
  const [readingFile, setReadingFile] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState(null); // { success: 0, duplicate: 0, failed: 0 }
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    try {
      setReadingFile(true);
      setError('');
      setReport(null);
      setFile(selected);

      const parsed = await parseExcelFile(selected);

      if (!parsed || parsed.length === 0) {
        setError('File Excel kosong atau format tidak sesuai.');
        setPreviewData([]);
        setAllParsedData([]);
        return;
      }

      setAllParsedData(parsed);
      setPreviewData(parsed.slice(0, 5));
    } catch (err) {
      console.error(err);
      setError('Gagal membaca file Excel: ' + (err.message || 'Format tidak didukung'));
    } finally {
      setReadingFile(false);
    }
  };

  const handleConfirmImport = async () => {
    if (allParsedData.length === 0) return;

    try {
      setImporting(true);
      setError('');
      setProgress(0);

      let successCount = 0;
      let duplicateCount = 0;
      let failedCount = 0;

      for (let i = 0; i < allParsedData.length; i++) {
        const row = allParsedData[i];
        const nis = String(row.NIS || '').trim();

        if (!nis) {
          failedCount++;
          continue;
        }

        try {
          // Check duplicate in Firestore
          const docRef = doc(db, 'students', nis);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            duplicateCount++;
          } else {
            // New student
            await setDoc(docRef, {
              nama: row.Nama || 'Tanpa Nama',
              kelasSaatIni: row.Kelas || '1A',
              tahunAjaran: row.TahunAjaran || '2025/2026',
              tahunMasuk: row.TahunMasuk || new Date().getFullYear().toString(),
              saldoSaatIni: 0,
              totalSetoranAwal: 0,
              status: 'aktif',
              riwayatKelas: [row.Kelas || '1A'],
              createdAt: serverTimestamp()
            });
            successCount++;
          }
        } catch (itemErr) {
          console.error(itemErr);
          failedCount++;
        }

        setProgress(Math.round(((i + 1) / allParsedData.length) * 100));
      }

      setReport({
        success: successCount,
        duplicate: duplicateCount,
        failed: failedCount,
        total: allParsedData.length
      });

      onFinish();
    } catch (err) {
      console.error(err);
      setError('Terjadi kendala dalam import data: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setPreviewData([]);
    setAllParsedData([]);
    setReport(null);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-emerald-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5 text-emerald-900">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-bold text-base">Kelola Data Siswa via Excel</h3>
              <p className="text-xs text-gray-500">Download format template atau unggah data rombel</p>
            </div>
          </div>
          <button
            onClick={() => { resetState(); onClose(); }}
            disabled={importing}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 space-y-5 overflow-y-auto flex-1 pr-1">
          {/* Section 1: Template Download */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-emerald-900">Unduh Format Template Excel</h4>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Gunakan template resmi dengan kolom: NIS, Nama, Kelas, TahunAjaran, TahunMasuk.
              </p>
            </div>
            <button
              type="button"
              onClick={generateTemplateExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
            >
              <Download className="w-4 h-4" />
              Download Template (.xlsx)
            </button>
          </div>

          {/* Section 2: Upload File */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Pilih Berkas Excel Siswa (.xlsx)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center hover:border-emerald-500 transition-colors bg-gray-50/50">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <input
                type="file"
                id="excel-file-input"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                disabled={importing}
                className="hidden"
              />
              <label
                htmlFor="excel-file-input"
                className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 shadow-xs"
              >
                Pilih File Excel
              </label>
              <p className="text-[11px] text-gray-500 mt-2">
                {file ? file.name : 'Format .xlsx atau .xls didukung'}
              </p>
            </div>
          </div>

          {/* Reading loader */}
          {readingFile && (
            <div className="flex items-center justify-center gap-2 text-xs text-gray-600 py-4">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Membaca sheet pertama Excel...</span>
            </div>
          )}

          {/* Preview Section */}
          {previewData.length > 0 && !report && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 flex justify-between items-center">
                <span>Pratinjau Data (5 Baris Pertama):</span>
                <span className="text-gray-500 font-normal">Total {allParsedData.length} baris terdeteksi</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 font-semibold">NIS</th>
                      <th className="px-3 py-2 font-semibold">Nama Siswa</th>
                      <th className="px-3 py-2 font-semibold">Kelas</th>
                      <th className="px-3 py-2 font-semibold">Tahun Ajaran</th>
                      <th className="px-3 py-2 font-semibold">Tahun Masuk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {previewData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-1.5 font-mono font-medium text-emerald-800">{row.NIS || '-'}</td>
                        <td className="px-3 py-1.5 font-medium">{row.Nama || '-'}</td>
                        <td className="px-3 py-1.5">{row.Kelas || '-'}</td>
                        <td className="px-3 py-1.5">{row.TahunAjaran || '-'}</td>
                        <td className="px-3 py-1.5">{row.TahunMasuk || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Progress bar during import */}
          {importing && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-600 font-medium">
                <span>Mengimpor data siswa ke database...</span>
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

          {/* Import Result Report */}
          {report && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Laporan Hasil Import Excel Selesai</span>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-gray-500 block">Berhasil Diimport</span>
                  <span className="text-lg font-bold text-emerald-700">{report.success}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-amber-100">
                  <span className="text-gray-500 block">Duplikat (Dilewati)</span>
                  <span className="text-lg font-bold text-amber-600">{report.duplicate}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-red-100">
                  <span className="text-gray-500 block">Gagal (NIS Kosong)</span>
                  <span className="text-lg font-bold text-red-600">{report.failed}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-gray-100 flex justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={() => { resetState(); onClose(); }}
            disabled={importing}
            className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            {report ? 'Selesai' : 'Batal'}
          </button>
          {!report && allParsedData.length > 0 && (
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={importing}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors"
            >
              {importing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Mengimpor Data...
                </>
              ) : (
                `Konfirmasi Import (${allParsedData.length} Baris)`
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
