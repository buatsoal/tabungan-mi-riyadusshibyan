import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { formatRupiah, formatTanggal } from '../utils/formatters';
import { generateStudentPdf } from '../utils/pdfHelper';
import {
  ArrowLeft,
  Download,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
  GraduationCap,
  Filter,
  CreditCard,
  History,
  CheckCircle,
  FileDown,
  Printer,
  X,
  Loader2,
  Edit3,
  Trash2
} from 'lucide-react';
import { SetoranModal, TarikSebagianModal, TutupTabunganModal } from './TransactionModals';
import EditStudentModal from './EditStudentModal';
import DeleteStudentModal from './DeleteStudentModal';
import PrintArea from './PrintArea';

export default function DetailSiswa({
  student,
  adminUser,
  onBack,
  schoolConfig,
  onStudentUpdated
}) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');

  // Modals state
  const [isSetoranOpen, setIsSetoranOpen] = useState(false);
  const [isTarikOpen, setIsTarikOpen] = useState(false);
  const [isTutupOpen, setIsTutupOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // PDF Preview & Download state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printType, setPrintType] = useState('all'); // 'all' (Buku Tabungan) | 'monthly' (Laporan Bulanan)
  const [isMonthlyFilterModalOpen, setIsMonthlyFilterModalOpen] = useState(false);
  const [printMonth, setPrintMonth] = useState(new Date().getMonth().toString());
  const [printYear, setPrintYear] = useState(new Date().getFullYear().toString());
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const studentId = student?.id || student?.NIS;

  // Cek apakah user adalah admin (Fitur download PDF HANYA muncul di role Admin)
  const isAdmin = Boolean(adminUser);

  // Real-time listener untuk data mutasi transaksi siswa
  useEffect(() => {
    if (!studentId) return;

    setLoading(true);
    const transRef = collection(db, 'students', studentId, 'transactions');
    const q = query(transRef, orderBy('tanggal', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setTransactions(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading transactions:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [studentId]);

  const monthOptions = [
    { value: '0', label: 'Januari' },
    { value: '1', label: 'Februari' },
    { value: '2', label: 'Maret' },
    { value: '3', label: 'April' },
    { value: '4', label: 'Mei' },
    { value: '5', label: 'Juni' },
    { value: '6', label: 'Juli' },
    { value: '7', label: 'Agustus' },
    { value: '8', label: 'September' },
    { value: '9', label: 'Oktober' },
    { value: '10', label: 'November' },
    { value: '11', label: 'Desember' },
  ];

  // Helper untuk generate & unduh PDF murni via jsPDF (NO html2canvas, NO oklch)
  const handleDownloadPdf = (type = printType, customMonth = printMonth, customYear = printYear) => {
    try {
      setIsDownloadingPdf(true);
      generateStudentPdf({
        student,
        transactions,
        printType: type,
        filterMonth: customMonth,
        filterYear: customYear,
        schoolConfig,
      });
    } catch (err) {
      console.error('Gagal membuat PDF:', err);
      alert('Gagal mengunduh file PDF: ' + err.message);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Tombol 1: Buka Modal & Download PDF Buku Tabungan Langsung
  const handleOpenBukuTabunganPdf = () => {
    setPrintType('all');
    setIsPrintModalOpen(true);
    handleDownloadPdf('all');
  };

  // Tombol 2: Buka Modal Pilih Periode Bulan
  const handleOpenMonthlyFilter = () => {
    setIsMonthlyFilterModalOpen(true);
  };

  // Konfirmasi filter bulan dan langsung download PDF
  const handleConfirmMonthlyPdf = () => {
    setIsMonthlyFilterModalOpen(false);
    setPrintType('monthly');
    setIsPrintModalOpen(true);
    handleDownloadPdf('monthly', printMonth, printYear);
  };

  // Handle Luluskan
  const handleLuluskan = async () => {
    if (!confirm(`Konfirmasi meluluskan siswa ${student.nama}? Status akan diubah menjadi 'lulus'.`)) return;
    try {
      const sRef = doc(db, 'students', studentId);
      await updateDoc(sRef, { status: 'lulus' });
      if (onStudentUpdated) {
        onStudentUpdated({ ...student, status: 'lulus' });
      }
    } catch (err) {
      alert('Gagal memperbarui status: ' + err.message);
    }
  };

  // Filtered transactions for display in table
  const filteredTransactions = transactions.filter((t) => {
    if (!t.tanggal) return true;
    let d;
    if (t.tanggal.seconds) d = new Date(t.tanggal.seconds * 1000);
    else if (t.tanggal instanceof Date) d = t.tanggal;
    else d = new Date(t.tanggal);

    if (isNaN(d.getTime())) return true;

    if (selectedMonth !== 'all' && d.getMonth() !== Number(selectedMonth)) return false;
    if (selectedYear !== 'all' && d.getFullYear() !== Number(selectedYear)) return false;
    return true;
  });

  if (!student) {
    return (
      <div className="p-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-200">
        Data siswa tidak ditemukan. Silakan kembali ke daftar siswa.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-emerald-700 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Siswa</span>
        </button>

        {/* FITUR DOWNLOAD PDF HANYA MUNCUL DI ROLE ADMIN */}
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Tombol Download PDF Buku Tabungan */}
            <button
              type="button"
              disabled={false}
              onClick={handleOpenBukuTabunganPdf}
              className="cursor-pointer px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
              title="Download Dokumen Buku Tabungan Siswa Format PDF"
            >
              <FileDown className="w-4 h-4" />
              <span>Download PDF Buku Tabungan</span>
            </button>

            {/* Tombol Download PDF Laporan Bulanan */}
            <button
              type="button"
              disabled={false}
              onClick={handleOpenMonthlyFilter}
              className="cursor-pointer px-4 py-2 bg-white hover:bg-emerald-50 active:bg-emerald-100 border border-emerald-600 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
              title="Download Rekapitulasi Tabungan Bulanan Format PDF"
            >
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Download PDF Laporan Bulanan</span>
            </button>

            {/* Tombol Edit Siswa */}
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="cursor-pointer px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
              title="Koreksi / Edit Data Siswa"
            >
              <Edit3 className="w-4 h-4 text-amber-700" />
              <span>Edit Siswa</span>
            </button>

            {/* Tombol Hapus Siswa */}
            <button
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              className="cursor-pointer px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
              title="Hapus Data Siswa Permanen"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
              <span>Hapus Siswa</span>
            </button>
          </div>
        )}
      </div>

      {/* Identitas Siswa Card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-0 opacity-70"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg uppercase tracking-wide">
                Kelas {student.kelasSaatIni}
              </span>
              <span
                className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase ${
                  student.status === 'aktif'
                    ? 'bg-green-100 text-green-800'
                    : student.status === 'ditutup'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-purple-100 text-purple-800'
                }`}
              >
                {student.status === 'aktif' ? 'Status: Aktif' : student.status === 'ditutup' ? 'Status: Ditutup' : 'Status: Lulus'}
              </span>
              <span className="text-xs text-gray-500 font-medium">T.A: {student.tahunAjaran}</span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 uppercase">{student.nama}</h2>
              <p className="text-sm text-gray-500 font-mono mt-0.5">
                NIS: {student.id || student.NIS} &bull; Masuk: {student.tahunMasuk || '-'}
              </p>
            </div>

            {/* Riwayat Rombel */}
            {student.riwayatKelas && student.riwayatKelas.length > 0 && (
              <div className="flex items-center gap-1.5 pt-1 text-xs text-gray-600">
                <span className="font-semibold text-gray-500">Riwayat Rombel:</span>
                <div className="flex flex-wrap gap-1">
                  {student.riwayatKelas.map((k, i) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-[11px] font-mono">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cards Saldo & Setoran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:w-96">
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white p-4 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-emerald-100 text-xs">
                <span>Saldo Rekening</span>
                <CreditCard className="w-4 h-4 opacity-80" />
              </div>
              <p className="text-xl sm:text-2xl font-black font-mono mt-1">
                {formatRupiah(student.saldoSaatIni || 0)}
              </p>
              <p className="text-[10px] text-emerald-200 mt-1">Saldo aktif tersimpan</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-800">
              <div className="flex items-center justify-between text-gray-500 text-xs">
                <span>Total Setoran Awal</span>
                <History className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-xl font-bold font-mono text-gray-900 mt-1">
                {formatRupiah(student.totalSetoranAwal || 0)}
              </p>
              <p className="text-[10px] text-gray-500 mt-1">Akumulasi seluruh setoran</p>
            </div>
          </div>
        </div>

        {/* Action Buttons for Active Students (Khusus Admin) */}
        {isAdmin && student.status === 'aktif' && (
          <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSetoranOpen(true)}
              className="cursor-pointer px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>+ Setoran Masuk</span>
            </button>
            <button
              type="button"
              onClick={() => setIsTarikOpen(true)}
              className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Tarik Sebagian</span>
            </button>
            <button
              type="button"
              onClick={() => setIsTutupOpen(true)}
              className="cursor-pointer px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Tutup Tabungan</span>
            </button>
            <button
              type="button"
              onClick={handleLuluskan}
              className="cursor-pointer px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ml-auto"
            >
              <GraduationCap className="w-4 h-4 text-purple-600" />
              <span>Luluskan Siswa</span>
            </button>
          </div>
        )}

        {student.status === 'ditutup' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2 font-medium">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <span>Tabungan siswa telah ditutup secara definitif. Rekening tidak dapat menerima transaksi baru.</span>
          </div>
        )}

        {student.status === 'lulus' && (
          <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-800 flex items-center gap-2 font-medium">
            <CheckCircle className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Siswa telah dinyatakan Lulus dari Madrasah Ibtidaiyah Riyadusshibyan.</span>
          </div>
        )}
      </div>

      {/* Tabel Mutasi Transaksi Siswa */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Table Filter Header */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-gray-800">Riwayat Mutasi Tabungan</h3>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
              {filteredTransactions.length} Transaksi
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Bulan</option>
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Tahun</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-semibold w-12 text-center">No</th>
                <th className="px-4 py-3 font-semibold">Tanggal & Waktu</th>
                <th className="px-4 py-3 font-semibold">Jenis</th>
                <th className="px-4 py-3 font-semibold">Keterangan</th>
                <th className="px-4 py-3 font-semibold text-right">Nominal Transaksi</th>
                <th className="px-4 py-3 font-semibold text-right">Potongan Admin</th>
                <th className="px-4 py-3 font-semibold text-right">Diterima / Masuk</th>
                <th className="px-4 py-3 font-semibold text-center">Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    Memuat riwayat transaksi siswa...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    Belum ada riwayat transaksi pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t, idx) => (
                  <tr key={t.id || idx} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 text-center font-mono text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono text-gray-700 whitespace-nowrap">
                      {formatTanggal(t.tanggal, true)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 ${
                          t.type === 'masuk'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.type === 'tarik_sebagian'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {t.type === 'masuk' ? '+ Setoran' : t.type === 'tarik_sebagian' ? '- Tarik Sebagian' : 'x Tutup Tabungan'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{t.keterangan || '-'}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                      {formatRupiah(t.jumlah)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-red-600 whitespace-nowrap">
                      {t.biayaAdmin > 0 ? `-${formatRupiah(t.biayaAdmin)}` : 'Rp 0'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                      {formatRupiah(t.jumlahDiterima || t.jumlah)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500 text-[11px] whitespace-nowrap">
                      {t.petugasAdmin || 'Admin'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Modals */}
      <SetoranModal
        isOpen={isSetoranOpen}
        onClose={() => setIsSetoranOpen(false)}
        student={student}
        adminName={adminUser?.displayName || adminUser?.email || 'Admin MI'}
        onSuccess={(updated) => onStudentUpdated && onStudentUpdated(updated)}
      />

      <TarikSebagianModal
        isOpen={isTarikOpen}
        onClose={() => setIsTarikOpen(false)}
        student={student}
        adminName={adminUser?.displayName || adminUser?.email || 'Admin MI'}
        onSuccess={(updated) => onStudentUpdated && onStudentUpdated(updated)}
      />

      <TutupTabunganModal
        isOpen={isTutupOpen}
        onClose={() => setIsTutupOpen(false)}
        student={student}
        adminName={adminUser?.displayName || adminUser?.email || 'Admin MI'}
        onSuccess={(updated) => onStudentUpdated && onStudentUpdated(updated)}
      />

      {/* Modal Filter Download PDF Bulanan */}
      {isMonthlyFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-emerald-100">
            <h3 className="font-bold text-base text-emerald-900 mb-1 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Periode Laporan Bulanan (PDF)
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Pilih bulan dan tahun rekapan transaksi untuk diunduh sebagai berkas PDF
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Bulan Transaksi</label>
                <select
                  value={printMonth}
                  onChange={(e) => setPrintMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  {monthOptions.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tahun Transaksi</label>
                <select
                  value={printYear}
                  onChange={(e) => setPrintYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsMonthlyFilterModalOpen(false)}
                className="cursor-pointer px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmMonthlyPdf}
                className="cursor-pointer px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <FileDown className="w-4 h-4" />
                <span>Buka Dokumen PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRATINJAU DOKUMEN & DOWNLOAD PDF (KHUSUS ADMIN) */}
      {isAdmin && isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
            {/* Modal Header */}
            <div className="no-print bg-emerald-800 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileDown className="w-5 h-5 text-emerald-200" />
                <div>
                  <h3 className="font-bold text-sm">
                    {printType === 'monthly' ? 'Download PDF: Laporan Tabungan Bulanan' : 'Download PDF: Buku Tabungan Siswa'}
                  </h3>
                  <p className="text-[11px] text-emerald-200">
                    {student.nama} (NIS: {student.id || student.NIS})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Tombol Utama: Download PDF */}
                <button
                  type="button"
                  disabled={isDownloadingPdf}
                  onClick={() => handleDownloadPdf()}
                  className="cursor-pointer px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                >
                  {isDownloadingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Membuat PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>

                {/* Tombol Cadangan: Cetak / Print */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="cursor-pointer px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                  title="Cetak via browser atau simpan printer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="cursor-pointer p-1.5 hover:bg-white/10 rounded-full text-white/80 hover:text-white"
                  title="Tutup Pratinjau"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Dokumen yang Akan Diconvert Jadi PDF */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <PrintArea
                  student={student}
                  transactions={transactions}
                  printType={printType}
                  filterMonth={printMonth}
                  filterYear={printYear}
                  schoolConfig={schoolConfig}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="no-print p-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
              <span>* Klik tombol hijau <strong>Download PDF</strong> untuk mengunduh dokumen secara langsung ke perangkat Anda.</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="cursor-pointer px-4 py-1.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 font-semibold"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  disabled={isDownloadingPdf}
                  onClick={() => handleDownloadPdf()}
                  className="cursor-pointer px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {isDownloadingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memproses PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {isEditOpen && (
        <EditStudentModal
          isOpen={true}
          student={student}
          onClose={() => setIsEditOpen(false)}
          onSuccess={(updated) => {
            setIsEditOpen(false);
            if (onStudentUpdated) {
              onStudentUpdated(updated);
            }
          }}
        />
      )}

      {/* Delete Student Modal */}
      {isDeleteOpen && (
        <DeleteStudentModal
          isOpen={true}
          student={student}
          onClose={() => setIsDeleteOpen(false)}
          onSuccess={() => {
            setIsDeleteOpen(false);
            onBack();
          }}
        />
      )}
    </div>
  );
}
