import React, { useState, useMemo } from 'react';
import { formatRupiah, LIST_KELAS, TAHUN_AJARAN_LIST } from '../utils/formatters';
import {
  Users,
  Wallet,
  PiggyBank,
  Archive,
  Search,
  Filter,
  UserPlus,
  GraduationCap,
  FileSpreadsheet,
  Download,
  Settings,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2
} from 'lucide-react';
import { generateTemplateExcel } from '../utils/excelHelper';
import { SetoranModal, TarikSebagianModal, TutupTabunganModal } from './TransactionModals';
import BulkPromoteModal from './BulkPromoteModal';
import ExcelModal from './ExcelModal';
import AddStudentModal from './AddStudentModal';
import EditStudentModal from './EditStudentModal';
import DeleteStudentModal from './DeleteStudentModal';
import SettingsModal from './SettingsModal';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminDashboard({
  students = [],
  loading = false,
  adminUser,
  schoolConfig,
  onUpdateSchoolConfig,
  onSelectStudent,
  onRefreshData
}) {
  // Tabs: 'active' (Siswa Aktif) | 'archive' (Ditutup / Lulus)
  const [activeTab, setActiveTab] = useState('active');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('all');
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Pagination (50 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Modals state
  const [isBulkPromoteOpen, setIsBulkPromoteOpen] = useState(false);
  const [isExcelOpen, setIsExcelOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);

  // Quick Action modal state
  const [selectedActionStudent, setSelectedActionStudent] = useState(null);
  const [actionType, setActionType] = useState(null); // 'setor' | 'tarik' | 'tutup'

  // Statistics calculation
  const stats = useMemo(() => {
    let aktifCount = 0;
    let ditutupCount = 0;
    let lulusCount = 0;
    let totalSaldoAktif = 0;
    let totalSetoranAwal = 0;

    students.forEach(s => {
      const saldo = Number(s.saldoSaatIni) || 0;
      const setoran = Number(s.totalSetoranAwal) || 0;

      if (s.status === 'aktif') {
        aktifCount++;
        totalSaldoAktif += saldo;
        totalSetoranAwal += setoran;
      } else if (s.status === 'ditutup') {
        ditutupCount++;
      } else if (s.status === 'lulus') {
        lulusCount++;
      }
    });

    return {
      aktifCount,
      ditutupCount,
      lulusCount,
      totalSaldoAktif,
      totalSetoranAwal
    };
  }, [students]);

  // Tab & Search Filtering
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // 1. Tab check
      if (activeTab === 'active') {
        if (student.status !== 'aktif') return false;
      } else {
        // Tab Arsip: status ditutup atau lulus
        if (student.status !== 'ditutup' && student.status !== 'lulus') return false;
      }

      // 2. Search query (Nama or NIS)
      if (searchQuery.trim() !== '') {
        const queryLower = searchQuery.toLowerCase().trim();
        const namaLower = (student.nama || '').toLowerCase();
        const nis = String(student.id || student.NIS || '');
        if (!namaLower.includes(queryLower) && !nis.includes(queryLower)) {
          return false;
        }
      }

      // 3. Kelas filter
      if (selectedKelas !== 'all' && student.kelasSaatIni !== selectedKelas) {
        return false;
      }

      // 4. Tahun Ajaran filter
      if (selectedTahunAjaran !== 'all' && student.tahunAjaran !== selectedTahunAjaran) {
        return false;
      }

      // 5. Status filter inside tab
      if (selectedStatusFilter !== 'all' && student.status !== selectedStatusFilter) {
        return false;
      }

      return true;
    });
  }, [students, activeTab, searchQuery, selectedKelas, selectedTahunAjaran, selectedStatusFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStudents, currentPage]);

  // Quick Action Handlers
  const handleOpenAction = (student, type) => {
    setSelectedActionStudent(student);
    setActionType(type);
  };

  const handleCloseAction = () => {
    setSelectedActionStudent(null);
    setActionType(null);
  };

  const handleLuluskanQuick = async (student) => {
    if (!confirm(`Konfirmasi meluluskan siswa ${student.nama} (${student.id || student.NIS})?`)) return;
    try {
      const sRef = doc(db, 'students', student.id || student.NIS);
      await updateDoc(sRef, { status: 'lulus' });
      onRefreshData();
    } catch (err) {
      alert('Gagal mengupdate status: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* A. STATISTIK ATAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Siswa Aktif */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
              Siswa Aktif
            </span>
            <span className="text-xl sm:text-2xl font-black text-gray-900 font-mono">
              {stats.aktifCount} <span className="text-xs font-normal text-gray-500 font-sans">Santri</span>
            </span>
          </div>
        </div>

        {/* Total Saldo Aktif */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
              Total Saldo Aktif
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-700 font-mono">
              {formatRupiah(stats.totalSaldoAktif)}
            </span>
          </div>
        </div>

        {/* Total Setoran Awal */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <PiggyBank className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
              Total Setoran Awal
            </span>
            <span className="text-lg sm:text-xl font-black text-blue-800 font-mono">
              {formatRupiah(stats.totalSetoranAwal)}
            </span>
          </div>
        </div>

        {/* Siswa Ditutup / Arsip */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
              Siswa Ditutup / Arsip
            </span>
            <span className="text-xl sm:text-2xl font-black text-gray-900 font-mono">
              {stats.ditutupCount} <span className="text-xs font-normal text-gray-500 font-sans">({stats.lulusCount} Lulus)</span>
            </span>
          </div>
        </div>
      </div>

      {/* ACTION BAR: Tombol-tombol Fitur Utama Admin */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Naik Kelas Massal */}
          <button
            onClick={() => setIsBulkPromoteOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Naik Kelas Massal</span>
          </button>

          {/* Tombol Tambah Siswa */}
          <button
            onClick={() => setIsAddStudentOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <UserPlus className="w-4 h-4 text-emerald-600" />
            <span>+ Tambah Siswa</span>
          </button>

          {/* Fitur Excel: Upload Excel */}
          <button
            onClick={() => setIsExcelOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Import Excel</span>
          </button>

          {/* Fitur Excel: Download Template */}
          <button
            onClick={generateTemplateExcel}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            title="Download Template Excel Resmi"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>Download Template</span>
          </button>
        </div>

        {/* Pengaturan Kop Surat */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Settings className="w-4 h-4 text-gray-600" />
          <span>Pengaturan Kop Surat</span>
        </button>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Realtime Search Nama / NIS */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari realtime Nama atau NIS siswa..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Kelas */}
            <select
              value={selectedKelas}
              onChange={(e) => { setSelectedKelas(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Kelas (1A - 6C)</option>
              {LIST_KELAS.map(k => (
                <option key={k} value={k}>Kelas {k}</option>
              ))}
            </select>

            {/* Filter Tahun Ajaran */}
            <select
              value={selectedTahunAjaran}
              onChange={(e) => { setSelectedTahunAjaran(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Tahun Ajaran</option>
              {TAHUN_AJARAN_LIST.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {/* Filter Status if on Arsip Tab */}
            {activeTab === 'archive' && (
              <select
                value={selectedStatusFilter}
                onChange={(e) => { setSelectedStatusFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Semua Status Arsip</option>
                <option value="ditutup">Ditutup Saja</option>
                <option value="lulus">Lulus Saja</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* TABEL SISWA DENGAN 2 TAB (Siswa Aktif vs Arsip) */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-gray-200 px-5 pt-3 bg-gray-50/50">
          <button
            onClick={() => { setActiveTab('active'); setCurrentPage(1); setSelectedStatusFilter('all'); }}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'active'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Tab Siswa Aktif</span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px]">
              {stats.aktifCount}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('archive'); setCurrentPage(1); setSelectedStatusFilter('all'); }}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'archive'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>Tab Arsip (Ditutup / Lulus)</span>
            <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-[10px]">
              {stats.ditutupCount + stats.lulusCount}
            </span>
          </button>
        </div>

        {/* Tabel Data Siswa */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-semibold w-10 text-center">No</th>
                <th className="px-4 py-3 font-semibold">NIS</th>
                <th className="px-4 py-3 font-semibold">Nama Siswa</th>
                <th className="px-4 py-3 font-semibold text-center">Kelas</th>
                <th className="px-4 py-3 font-semibold">Tahun Ajaran</th>
                <th className="px-4 py-3 font-semibold text-right">Saldo Saat Ini</th>
                <th className="px-4 py-3 font-semibold text-right">Total Setoran</th>
                <th className="px-4 py-3 font-semibold text-center">Status</th>
                <th className="px-4 py-3 font-semibold text-center">Aksi Transaksi & Riwayat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && students.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-500">
                    Memuat data siswa madrasah...
                  </td>
                </tr>
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-500">
                    Tidak ditemukan data siswa yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student, idx) => {
                  const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <tr key={student.id || student.NIS} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="px-4 py-3 text-center font-mono text-gray-400">{rowNumber}</td>
                      <td className="px-4 py-3 font-mono font-bold text-gray-800 whitespace-nowrap">
                        {student.id || student.NIS}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 uppercase">
                        {student.nama}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-bold font-mono">
                          {student.kelasSaatIni}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {student.tahunAjaran}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-800 whitespace-nowrap">
                        {formatRupiah(student.saldoSaatIni || 0)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-700 whitespace-nowrap">
                        {formatRupiah(student.totalSetoranAwal || 0)}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          student.status === 'aktif'
                            ? 'bg-green-100 text-green-800'
                            : student.status === 'ditutup'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {/* Detail / Riwayat */}
                          <button
                            onClick={() => onSelectStudent(student)}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                            title="Buka Detail & Riwayat Transaksi Siswa"
                          >
                            <Eye className="w-3.5 h-3.5 text-gray-500" />
                            <span>Detail</span>
                          </button>

                          {/* Action Buttons only for active students */}
                          {student.status === 'aktif' && (
                            <>
                              {/* + Setoran */}
                              <button
                                onClick={() => handleOpenAction(student, 'setor')}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                                title="Tambah Setoran Masuk"
                              >
                                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-700" />
                                <span>+Setor</span>
                              </button>

                              {/* Tarik Sebagian */}
                              <button
                                onClick={() => handleOpenAction(student, 'tarik')}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                                title="Tarik Sebagian Tabungan"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5 text-blue-700" />
                                <span>Tarik</span>
                              </button>

                              {/* Tutup Tabungan */}
                              <button
                                onClick={() => handleOpenAction(student, 'tutup')}
                                className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                                title="Tutup Tabungan Siswa (Tarik Semuanya)"
                              >
                                <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                                <span>Tutup</span>
                              </button>

                              {/* Luluskan */}
                              <button
                                onClick={() => handleLuluskanQuick(student)}
                                className="p-1 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors cursor-pointer"
                                title="Luluskan Siswa"
                              >
                                <GraduationCap className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Edit Data Siswa (Role Admin) */}
                          <button
                            type="button"
                            onClick={() => setStudentToEdit(student)}
                            className="p-1 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors cursor-pointer"
                            title="Edit / Koreksi Data Siswa"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Hapus Data Siswa (Role Admin) */}
                          <button
                            type="button"
                            onClick={() => setStudentToDelete(student)}
                            className="p-1 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Data Siswa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination 50 per halaman */}
        <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-gray-50/40">
          <span className="text-gray-500 font-medium">
            Menampilkan <span className="font-bold text-gray-800">{paginatedStudents.length}</span> dari <span className="font-bold text-gray-800">{filteredStudents.length}</span> siswa terfilter
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-semibold text-gray-700">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <BulkPromoteModal
        isOpen={isBulkPromoteOpen}
        onClose={() => setIsBulkPromoteOpen(false)}
        onFinish={() => {
          setIsBulkPromoteOpen(false);
          onRefreshData();
        }}
      />

      <ExcelModal
        isOpen={isExcelOpen}
        onClose={() => setIsExcelOpen(false)}
        onFinish={() => {
          onRefreshData();
        }}
      />

      <AddStudentModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        onSuccess={() => {
          onRefreshData();
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentConfig={schoolConfig}
        onSave={(cfg) => {
          onUpdateSchoolConfig(cfg);
        }}
      />

      {/* Quick Action Modals */}
      {selectedActionStudent && actionType === 'setor' && (
        <SetoranModal
          isOpen={true}
          onClose={handleCloseAction}
          student={selectedActionStudent}
          adminName={adminUser?.displayName || adminUser?.email || 'Admin MI'}
          onSuccess={() => {
            handleCloseAction();
            onRefreshData();
          }}
        />
      )}

      {selectedActionStudent && actionType === 'tarik' && (
        <TarikSebagianModal
          isOpen={true}
          onClose={handleCloseAction}
          student={selectedActionStudent}
          adminName={adminUser?.displayName || adminUser?.email || 'Admin MI'}
          onSuccess={() => {
            handleCloseAction();
            onRefreshData();
          }}
        />
      )}

      {selectedActionStudent && actionType === 'tutup' && (
        <TutupTabunganModal
          isOpen={true}
          onClose={handleCloseAction}
          student={selectedActionStudent}
          adminName={adminUser?.displayName || adminUser?.email || 'Admin MI'}
          onSuccess={() => {
            handleCloseAction();
            onRefreshData();
          }}
        />
      )}

      {/* Edit Student Modal */}
      {studentToEdit && (
        <EditStudentModal
          isOpen={true}
          student={studentToEdit}
          onClose={() => setStudentToEdit(null)}
          onSuccess={() => {
            setStudentToEdit(null);
            onRefreshData();
          }}
        />
      )}

      {/* Delete Student Modal */}
      {studentToDelete && (
        <DeleteStudentModal
          isOpen={true}
          student={studentToDelete}
          onClose={() => setStudentToDelete(null)}
          onSuccess={() => {
            setStudentToDelete(null);
            onRefreshData();
          }}
        />
      )}
    </div>
  );
}
