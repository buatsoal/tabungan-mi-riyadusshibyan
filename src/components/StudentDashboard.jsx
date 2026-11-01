import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { formatRupiah, formatTanggal } from '../utils/formatters';
import {
  Wallet,
  Calendar,
  LogOut,
  ChevronDown,
  Filter,
  PiggyBank,
  Sparkles,
  HeartHandshake
} from 'lucide-react';

export default function StudentDashboard({ student, onLogout }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');

  const studentId = student?.id || student?.NIS;

  // Fetch transactions with pagination limit
  const fetchTransactions = async (currentLimit) => {
    if (!studentId) return;
    try {
      setLoading(true);
      const transRef = collection(db, 'students', studentId, 'transactions');
      const q = query(transRef, orderBy('tanggal', 'desc'), limit(currentLimit + 1));
      const snap = await getDocs(q);

      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (docs.length > currentLimit) {
        setHasMore(true);
        setTransactions(docs.slice(0, currentLimit));
      } else {
        setHasMore(false);
        setTransactions(docs);
      }
    } catch (err) {
      console.error("Error loading student transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(displayLimit);
  }, [studentId, displayLimit]);

  const handleLoadMore = () => {
    setDisplayLimit(prev => prev + 20);
  };

  // Filtered transactions for display
  const filteredTransactions = transactions.filter(t => {
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
    { value: '11', label: 'Desember' }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Greeting & Logout (Strictly no transaction/print/excel buttons) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-lg">
            {student.nama?.charAt(0) || 'S'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">Assalamu'alaikum, {student.nama}</h2>
              <Sparkles className="w-4 h-4 text-amber-500 hidden sm:inline" />
            </div>
            <p className="text-xs text-gray-500">
              Buku Rekening Tabungan Siswa MI Riyadusshibyan
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-4 py-2 border border-gray-300 hover:bg-gray-100 rounded-xl text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 transition-colors w-fit"
        >
          <LogOut className="w-4 h-4 text-gray-500" />
          <span>Keluar Akun</span>
        </button>
      </div>

      {/* Kartu Profil & Saldo Utama */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Saldo Saat Ini (Format Rupiah Besar) */}
        <div className="md:col-span-2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -z-0"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
                <Wallet className="w-5 h-5 text-emerald-200" />
              </span>
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-100">
                Saldo Tabungan Kamu
              </span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-xs ${
              student.status === 'aktif' ? 'bg-emerald-400/20 text-white border border-emerald-300/30' : 'bg-red-400/20 text-white'
            }`}>
              {student.status === 'aktif' ? 'Status: Aktif' : student.status === 'ditutup' ? 'Ditutup' : 'Lulus'}
            </span>
          </div>

          <div className="relative z-10 my-6">
            <p className="text-xs text-emerald-100 font-medium mb-1">Total Saldo Simpanan Saat Ini</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-mono tracking-tight drop-shadow-xs">
              {formatRupiah(student.saldoSaatIni || 0)}
            </h1>
          </div>

          <div className="relative z-10 pt-4 border-t border-emerald-500/40 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-emerald-200 block text-[11px]">Total Setoran Awal:</span>
              <span className="font-mono font-bold text-white text-sm sm:text-base">
                {formatRupiah(student.totalSetoranAwal || 0)}
              </span>
            </div>
            <div>
              <span className="text-emerald-200 block text-[11px]">Tahun Ajaran:</span>
              <span className="font-semibold text-white text-sm sm:text-base">
                {student.tahunAjaran || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Info Identitas Siswa */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-gray-800 pb-3 border-b border-gray-100 flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-emerald-600" />
              Identitas Buku Rekening
            </h3>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <span className="text-gray-400 block text-[11px]">Nomor Induk Siswa (NIS)</span>
                <span className="font-mono font-bold text-gray-800 text-sm">{student.id || student.NIS}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">Nama Lengkap</span>
                <span className="font-bold text-gray-800 uppercase text-sm">{student.nama}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-gray-400 block text-[11px]">Kelas Saat Ini</span>
                  <span className="font-bold text-emerald-700 text-sm">Kelas {student.kelasSaatIni}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Tahun Masuk</span>
                  <span className="font-medium text-gray-800 text-sm">{student.tahunMasuk || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-[11px] text-emerald-800 leading-relaxed flex items-start gap-2">
            <HeartHandshake className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>Rajin menabung melatih disiplin dan hemat sejak dini untuk masa depan yang berkah.</p>
          </div>
        </div>
      </div>

      {/* Tabel Riwayat 20 Transaksi Terbaru dengan Pagination Load More dan Filter Bulan/Tahun */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Header & Filter */}
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/40">
          <div>
            <h3 className="font-bold text-base text-gray-900">Riwayat Mutasi Tabungan</h3>
            <p className="text-xs text-gray-500">Catatan transaksi setoran dan penarikan kamu</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Saring:</span>
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Bulan</option>
              {monthOptions.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Tahun</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>
        </div>

        {/* Tabel */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-center w-12">No</th>
                <th className="px-4 py-3 font-semibold">Tanggal</th>
                <th className="px-4 py-3 font-semibold">Jenis Transaksi</th>
                <th className="px-4 py-3 font-semibold">Keterangan</th>
                <th className="px-4 py-3 font-semibold text-right">Nominal</th>
                <th className="px-4 py-3 font-semibold text-center">Status Transaksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    Memuat riwayat transaksi...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    Belum ada riwayat transaksi yang tercatat.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t, idx) => (
                  <tr key={t.id || idx} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 text-center font-mono text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono text-gray-700 whitespace-nowrap">
                      {formatTanggal(t.tanggal, true)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 ${
                        t.type === 'masuk'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.type === 'tarik_sebagian'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {t.type === 'masuk' ? '+ Setoran Masuk' : t.type === 'tarik_sebagian' ? '- Tarik Sebagian' : 'x Tutup Rekening'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {t.keterangan || '-'}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono font-bold text-sm whitespace-nowrap ${
                      t.type === 'masuk' ? 'text-emerald-700' : 'text-red-600'
                    }`}>
                      {t.type === 'masuk' ? `+${formatRupiah(t.jumlah)}` : `-${formatRupiah(t.jumlah)}`}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-[10px] font-medium">
                        Tercatat di Buku
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Load More Pagination */}
        {hasMore && filteredTransactions.length >= displayLimit && (
          <div className="p-4 border-t border-gray-100 text-center bg-gray-50/30">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="px-5 py-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50"
            >
              <ChevronDown className="w-4 h-4 text-gray-500" />
              <span>{loading ? 'Memuat data...' : 'Muat Lebih Banyak (Load More)'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
