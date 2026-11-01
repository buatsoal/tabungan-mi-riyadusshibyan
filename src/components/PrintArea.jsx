import React from 'react';
import { formatRupiah, formatTanggal, formatTanggalIndonesia } from '../utils/formatters';

export default function PrintArea({
  student,
  transactions = [],
  printType = 'all', // 'all' (Buku Tabungan) | 'monthly' (Laporan Bulanan)
  filterMonth = '',
  filterYear = '',
  schoolConfig = {}
}) {
  if (!student) return null;

  const defaultSchool = {
    nama: 'MI RIYADUSSHIBYAN',
    yayasan: 'YAYASAN PENDIDIKAN ISLAM RIYADUSSHIBYAN',
    nsm: '111232750089',
    npsn: '69752311',
    alamat: 'Jl. KH. Noer Alie No. 45, Teluk Pucung, Kec. Bekasi Utara, Kota Bekasi, Jawa Barat 17121',
    telepon: '(021) 88991234',
    email: 'info@mi-riyadusshibyan.sch.id',
    bendahara: 'Ustadzah Nurul Hidayah, S.Pd.I',
    kota: 'Bekasi',
    logoUrl: 'https://images.unsplash.com/photo-1590076215667-873d328d49a7?auto=format&fit=crop&w=150&q=80'
  };

  const config = { ...defaultSchool, ...schoolConfig };

  // Hitung saldo berjalan secara kronologis (ascending) dari transaksi tertua
  const sortedAsc = [...transactions].sort((a, b) => {
    const timeA = a.tanggal?.seconds || (a.tanggal instanceof Date ? a.tanggal.getTime() / 1000 : 0);
    const timeB = b.tanggal?.seconds || (b.tanggal instanceof Date ? b.tanggal.getTime() / 1000 : 0);
    return timeA - timeB;
  });

  let runningBalance = 0;
  let totalMasuk = 0;
  let totalKeluar = 0;

  const enrichedTransactions = sortedAsc.map((t, idx) => {
    const masuk = t.type === 'masuk' ? Number(t.jumlah) || 0 : 0;
    const keluar = t.type === 'tarik_sebagian' || t.type === 'tarik_semuanya' ? Number(t.jumlah) || 0 : 0;
    const adminFee = Number(t.biayaAdmin) || 0;

    runningBalance = runningBalance + masuk - keluar;
    totalMasuk += masuk;
    totalKeluar += keluar;

    return {
      ...t,
      no: idx + 1,
      masuk,
      keluar,
      adminFee,
      runningBalance
    };
  });

  // Jika cetak bulanan, saring baris transaksi berdasarkan bulan & tahun terpilih
  let displayRows = enrichedTransactions;
  if (printType === 'monthly' && filterMonth !== '' && filterYear !== '') {
    displayRows = enrichedTransactions.filter(t => {
      let d;
      if (t.tanggal?.seconds) d = new Date(t.tanggal.seconds * 1000);
      else if (t.tanggal instanceof Date) d = t.tanggal;
      else d = new Date(t.tanggal);

      return d.getMonth() === Number(filterMonth) && d.getFullYear() === Number(filterYear);
    });
  }

  const todayStr = formatTanggalIndonesia(new Date());

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const adminDeduction = (Number(student.totalSetoranAwal) || 0) * 0.10;
  const netReceived = (Number(student.saldoSaatIni) || 0) > 0 ? ((Number(student.saldoSaatIni) || 0) - adminDeduction) : 0;

  return (
    <>
      {/* CSS @media print terintegrasi menggunakan standar HEX (bebas dari oklch) */}
      <style>{`
        #print-area {
          background-color: #ffffff !important;
          color: #111827 !important;
        }
        @media print {
          html, body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }
          body * {
            visibility: hidden !important;
          }
          #print-area, #print-area * {
            visibility: visible !important;
          }
          #print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px 28px !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            display: block !important;
            z-index: 999999 !important;
          }
          .no-print {
            display: none !important;
          }
          tr {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div
        id="print-area"
        style={{ backgroundColor: '#ffffff', color: '#111827' }}
        className="p-6 sm:p-10 font-serif leading-relaxed text-sm max-w-4xl mx-auto shadow-sm print:shadow-none print:max-w-none print:p-0"
      >
        {/* KOP SURAT RESMI MI RIYADUSSHIBYAN BEKASI (TANPA KOTAK AKREDITASI) */}
        <div style={{ borderBottom: '4px double #065f46', paddingBottom: '16px', marginBottom: '24px' }}>
          <div className="flex items-center justify-between gap-4">
            <div
              style={{ borderColor: '#065f46', backgroundColor: '#ecfdf5', color: '#065f46' }}
              className="w-20 h-20 shrink-0 flex items-center justify-center border-2 rounded-full font-bold overflow-hidden"
            >
              {config.logoUrl ? (
                <img
                  src={config.logoUrl}
                  alt="Logo MI"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-xl font-sans">MI</span>
              )}
            </div>

            <div className="text-center flex-1 px-2">
              <h4 style={{ color: '#4b5563' }} className="text-[11px] sm:text-xs tracking-widest uppercase font-semibold">
                {config.yayasan || 'YAYASAN PENDIDIKAN ISLAM RIYADUSSHIBYAN'}
              </h4>
              <h1 style={{ color: '#065f46' }} className="text-xl sm:text-2xl font-black tracking-wide font-sans uppercase">
                {config.nama || 'MI RIYADUSSHIBYAN'}
              </h1>
              <p style={{ color: '#4b5563' }} className="text-xs font-sans font-medium mt-0.5">
                NSM: {config.nsm} | NPSN: {config.npsn}
              </p>
              <p style={{ color: '#374151' }} className="text-xs mt-0.5">
                {config.alamat}
              </p>
              <p style={{ color: '#6b7280' }} className="text-[11px] font-sans">
                Telp: {config.telepon} &bull; Email: {config.email}
              </p>
            </div>

            {/* Spacer penyeimbang kanan agar teks nama madrasah berada tepat di tengah */}
            <div className="w-20 hidden sm:block shrink-0" aria-hidden="true"></div>
          </div>
        </div>

        {/* JUDUL DOKUMEN CETAK */}
        <div className="text-center mb-6">
          <h2 style={{ color: '#111827' }} className="text-base sm:text-lg font-bold tracking-wider uppercase underline underline-offset-4 font-sans">
            {printType === 'monthly' ? 'LAPORAN REKAPITULASI TABUNGAN BULANAN' : 'BUKU REKENING TABUNGAN SISWA'}
          </h2>
          {printType === 'monthly' && filterMonth !== '' && (
            <p style={{ color: '#1f2937' }} className="text-xs font-semibold font-sans mt-1">
              Periode: {monthNames[Number(filterMonth)]} {filterYear}
            </p>
          )}
          <p style={{ color: '#6b7280' }} className="text-[11px] font-sans mt-0.5">
            Tahun Ajaran: {student.tahunAjaran || '-'} &bull; Dicetak: {todayStr}
          </p>
        </div>

        {/* BOX IDENTITAS SISWA */}
        <div style={{ borderColor: '#9ca3af', backgroundColor: '#f8fafc' }} className="border rounded-lg p-3.5 mb-6 text-xs font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
            <div className="flex">
              <span style={{ color: '#4b5563' }} className="w-36 font-semibold">Nomor Induk (NIS)</span>
              <span className="w-3">:</span>
              <span style={{ color: '#111827' }} className="font-bold font-mono">{student.id || student.NIS}</span>
            </div>
            <div className="flex">
              <span style={{ color: '#4b5563' }} className="w-36 font-semibold">Kelas Saat Ini</span>
              <span className="w-3">:</span>
              <span style={{ color: '#065f46' }} className="font-bold">Kelas {student.kelasSaatIni}</span>
            </div>
            <div className="flex">
              <span style={{ color: '#4b5563' }} className="w-36 font-semibold">Nama Lengkap Siswa</span>
              <span className="w-3">:</span>
              <span style={{ color: '#111827' }} className="font-bold uppercase">{student.nama}</span>
            </div>
            <div className="flex">
              <span style={{ color: '#4b5563' }} className="w-36 font-semibold">Tahun Masuk</span>
              <span className="w-3">:</span>
              <span style={{ color: '#111827' }}>{student.tahunMasuk || '-'}</span>
            </div>
            <div className="flex">
              <span style={{ color: '#4b5563' }} className="w-36 font-semibold">Status Tabungan</span>
              <span className="w-3">:</span>
              <span style={{ color: '#111827' }} className="font-semibold uppercase">
                {student.status === 'aktif' ? 'Aktif' : student.status === 'ditutup' ? 'Ditutup / Selesai' : 'Lulus'}
              </span>
            </div>
            <div className="flex">
              <span style={{ color: '#4b5563' }} className="w-36 font-semibold">Total Setoran Awal</span>
              <span className="w-3">:</span>
              <span style={{ color: '#111827' }} className="font-mono font-bold">{formatRupiah(student.totalSetoranAwal || 0)}</span>
            </div>
            <div style={{ borderColor: '#d1d5db' }} className="col-span-1 sm:col-span-2 pt-2 border-t mt-1 flex justify-between items-center">
              <span style={{ color: '#1f2937' }} className="font-bold">Saldo Rekening Saat Ini:</span>
              <span style={{ color: '#065f46' }} className="text-base font-extrabold font-mono">
                {formatRupiah(student.saldoSaatIni || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* TABEL MUTASI TRANSAKSI */}
        <div className="mb-6">
          <h3 style={{ color: '#1f2937' }} className="text-xs font-bold uppercase tracking-wide mb-2 font-sans">
            Rincian Riwayat Transaksi Tabungan
          </h3>
          <table style={{ borderColor: '#9ca3af' }} className="w-full border-collapse border text-[11px] font-sans">
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', color: '#1f2937' }} className="font-semibold">
                <th style={{ borderColor: '#9ca3af' }} className="border px-2 py-1.5 text-center w-8">No</th>
                <th style={{ borderColor: '#9ca3af' }} className="border px-2 py-1.5 text-center w-24">Tanggal</th>
                <th style={{ borderColor: '#9ca3af' }} className="border px-2 py-1.5 text-left w-24">Jenis</th>
                <th style={{ borderColor: '#9ca3af' }} className="border px-2 py-1.5 text-left">Keterangan</th>
                <th style={{ borderColor: '#9ca3af' }} className="border px-2 py-1.5 text-right w-24">Masuk (Rp)</th>
                <th style={{ borderColor: '#9ca3af' }} className="border px-2 py-1.5 text-right w-24">Keluar (Rp)</th>
                <th style={{ borderColor: '#9ca3af' }} className="border px-2 py-1.5 text-right w-20">Admin (Rp)</th>
                <th style={{ borderColor: '#9ca3af' }} className="border px-2 py-1.5 text-right w-28">Saldo (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ borderColor: '#9ca3af', color: '#6b7280' }} className="border text-center py-4 italic">
                    Belum ada catatan transaksi pada periode ini
                  </td>
                </tr>
              ) : (
                displayRows.map((t, i) => (
                  <tr key={t.id || i} style={{ backgroundColor: i % 2 === 1 ? '#f9fafb' : '#ffffff' }}>
                    <td style={{ borderColor: '#9ca3af' }} className="border px-2 py-1 text-center font-mono">{i + 1}</td>
                    <td style={{ borderColor: '#9ca3af' }} className="border px-2 py-1 text-center font-mono">{formatTanggal(t.tanggal)}</td>
                    <td style={{ borderColor: '#9ca3af' }} className="border px-2 py-1 capitalize font-medium">
                      {t.type === 'masuk' ? 'Setoran' : t.type === 'tarik_sebagian' ? 'Tarik Sebagian' : 'Tutup Tabungan'}
                    </td>
                    <td style={{ borderColor: '#9ca3af', color: '#374151' }} className="border px-2 py-1">
                      {t.keterangan || '-'}
                    </td>
                    <td style={{ borderColor: '#9ca3af', color: '#065f46' }} className="border px-2 py-1 text-right font-mono font-medium">
                      {t.masuk > 0 ? formatRupiah(t.masuk) : '-'}
                    </td>
                    <td style={{ borderColor: '#9ca3af', color: '#b91c1c' }} className="border px-2 py-1 text-right font-mono font-medium">
                      {t.keluar > 0 ? formatRupiah(t.keluar) : '-'}
                    </td>
                    <td style={{ borderColor: '#9ca3af', color: '#c2410c' }} className="border px-2 py-1 text-right font-mono font-medium">
                      {t.adminFee > 0 ? formatRupiah(t.adminFee) : '-'}
                    </td>
                    <td style={{ borderColor: '#9ca3af', color: '#111827' }} className="border px-2 py-1 text-right font-mono font-bold">
                      {formatRupiah(t.runningBalance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* RINGKASAN REKAPITULASI AKHIR */}
        <div style={{ borderColor: '#9ca3af', backgroundColor: '#f9fafb' }} className="border rounded-lg p-3.5 mb-8 font-sans text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between py-0.5">
                <span style={{ color: '#4b5563' }}>Total Akumulasi Setoran:</span>
                <span style={{ color: '#065f46' }} className="font-bold font-mono">{formatRupiah(totalMasuk)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span style={{ color: '#4b5563' }}>Total Penarikan Dana:</span>
                <span style={{ color: '#b91c1c' }} className="font-bold font-mono">{formatRupiah(totalKeluar)}</span>
              </div>
              <div style={{ borderColor: '#d1d5db' }} className="flex justify-between py-0.5 border-t mt-1 pt-1">
                <span style={{ color: '#1f2937' }} className="font-bold">Saldo Akhir Tercatat:</span>
                <span style={{ color: '#111827' }} className="font-black font-mono">{formatRupiah(student.saldoSaatIni || 0)}</span>
              </div>
            </div>

            <div style={{ borderColor: '#d1d5db' }} className="border-t sm:border-t-0 sm:border-l pt-2 sm:pt-0 sm:pl-4">
              {student.status === 'ditutup' ? (
                <div style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }} className="p-2.5 border rounded">
                  <p style={{ color: '#78350f' }} className="font-bold text-[11px] mb-1">Status: Rekening Telah Ditutup</p>
                  <div style={{ color: '#374151' }} className="flex justify-between text-[11px]">
                    <span>Biaya Admin (10% Total Setoran):</span>
                    <span style={{ color: '#b91c1c' }} className="font-mono font-semibold">
                      {formatRupiah((Number(student.totalSetoranAwal) || 0) * 0.10)}
                    </span>
                  </div>
                  <div style={{ borderColor: '#fde68a', color: '#065f46' }} className="flex justify-between text-[11px] font-bold border-t mt-1 pt-1">
                    <span>Jumlah Uang Diterima Bersih:</span>
                    <span className="font-mono">
                      {formatRupiah(
                        transactions.find(t => t.type === 'tarik_semuanya')?.jumlahDiterima ||
                        Math.max(0, (Number(student.saldoSaatIni) || 0) - (Number(student.totalSetoranAwal) || 0) * 0.10)
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#6b7280' }} className="text-[11px] italic flex items-center h-full">
                  * Rekening berstatus Aktif. Pemotongan biaya administrasi 10% dari akumulasi setoran awal hanya berlaku jika rekening tabungan ditutup secara definitif.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER & PENGESAHAN TANDA TANGAN */}
        <div className="mt-8 text-xs font-sans">
          <div className="flex justify-between items-start">
            <div className="text-center w-56 sm:w-64">
              <p style={{ color: '#374151' }} className="mb-1">Mengetahui,</p>
              <p style={{ color: '#1f2937' }} className="font-semibold">Orang Tua / Wali Siswa</p>
              <div className="h-16 sm:h-20"></div>
              <p style={{ color: '#111827', borderColor: '#374151' }} className="font-semibold border-b inline-block px-6 pb-0.5">
                ( .................................................. )
              </p>
            </div>

            <div className="text-center w-56 sm:w-64">
              <p style={{ color: '#374151' }} className="mb-1">
                {config.kota || 'Bekasi'}, {todayStr}
              </p>
              <p style={{ color: '#1f2937' }} className="font-semibold">Petugas / Bendahara Madrasah</p>
              <div className="h-16 sm:h-20 flex items-center justify-center">
                <span style={{ color: '#9ca3af' }} className="text-[10px] italic font-mono">[Cap Madrasah]</span>
              </div>
              <p style={{ color: '#111827', borderColor: '#374151' }} className="font-bold border-b inline-block px-4 pb-0.5">
                {config.bendahara || 'Ustadzah Nurul Hidayah, S.Pd.I'}
              </p>
              <p style={{ color: '#4b5563' }} className="text-[10px] mt-0.5">NIP / NUPTK: -</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
