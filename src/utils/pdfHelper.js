import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatRupiah, formatTanggal, formatTanggalIndonesia } from './formatters';

/**
 * Generates and downloads student passbook or monthly report PDF
 * Uses 100% pure jsPDF vector & text operations (NO html2canvas, NO canvas, NO oklch).
 */
export function generateStudentPdf({
  student,
  transactions = [],
  printType = 'all', // 'all' (Buku Tabungan) | 'monthly' (Laporan Bulanan)
  filterMonth = '',
  filterYear = '',
  schoolConfig = {}
}) {
  if (!student) {
    throw new Error('Data siswa tidak ditemukan.');
  }

  const defaultSchool = {
    nama: 'MI RIYADUSSHIBYAN',
    yayasan: 'YAYASAN PENDIDIKAN ISLAM RIYADUSSHIBYAN',
    nsm: '111232750089',
    npsn: '69752311',
    alamat: 'Jl. KH. Noer Alie No. 45, Teluk Pucung, Kec. Bekasi Utara, Kota Bekasi, Jawa Barat 17121',
    telepon: '(021) 88991234',
    email: 'info@mi-riyadusshibyan.sch.id',
    bendahara: 'Ustadzah Nurul Hidayah, S.Pd.I',
    kota: 'Bekasi'
  };

  const config = { ...defaultSchool, ...schoolConfig };

  // 1. Inisialisasi dokumen jsPDF (Portrait, mm, A4: 210 x 297 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2); // 182 mm
  let currentY = 14;

  // 2. KOP SURAT RESMI MI RIYADUSSHIBYAN (TANPA AKREDITASI, PURE VECTOR TEXT)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text((config.yayasan || 'YAYASAN PENDIDIKAN ISLAM RIYADUSSHIBYAN').toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 5.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(16, 120, 68); // Dark Emerald #107844
  doc.text((config.nama || 'MI RIYADUSSHIBYAN').toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text(`NSM: ${config.nsm}   |   NPSN: ${config.npsn}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 4;

  doc.text(config.alamat, pageWidth / 2, currentY, { align: 'center' });
  currentY += 4;

  doc.text(`Telp: ${config.telepon}   |   Email: ${config.email}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  // Garis Ganda Pembatas Kop Surat
  doc.setDrawColor(16, 120, 68);
  doc.setLineWidth(0.8);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 1.2;

  doc.setDrawColor(16, 120, 68);
  doc.setLineWidth(0.2);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  // 3. JUDUL DOKUMEN
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const docTitle = printType === 'monthly'
    ? 'LAPORAN REKAPITULASI TABUNGAN BULANAN'
    : 'BUKU REKENING TABUNGAN SISWA';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text(docTitle, pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(90, 90, 90);

  if (printType === 'monthly' && filterMonth !== '' && filterYear !== '') {
    doc.text(`Periode: ${monthNames[Number(filterMonth)]} ${filterYear}   |   Tahun Ajaran: ${student.tahunAjaran || '-'}`, pageWidth / 2, currentY, { align: 'center' });
  } else {
    doc.text(`Tahun Ajaran: ${student.tahunAjaran || '-'}   |   Tanggal Cetak: ${formatTanggalIndonesia(new Date())}`, pageWidth / 2, currentY, { align: 'center' });
  }
  currentY += 6;

  // 4. KOTAK IDENTITAS SISWA
  const boxHeight = 28;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, boxHeight, 2, 2, 'FD');

  const col1X = margin + 4;
  const col1ValX = margin + 42;
  const col2X = margin + 96;
  const col2ValX = margin + 138;
  let textY = currentY + 5.5;

  // Baris 1: NIS & Kelas
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 90, 90);
  doc.text('Nomor Induk (NIS)', col1X, textY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(`:  ${student.id || student.NIS}`, col1ValX, textY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 90, 90);
  doc.text('Kelas Saat Ini', col2X, textY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 120, 68);
  doc.text(`:  Kelas ${student.kelasSaatIni}`, col2ValX, textY);

  // Baris 2: Nama Siswa & Tahun Masuk
  textY += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 90, 90);
  doc.text('Nama Siswa', col1X, textY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(`:  ${(student.nama || '').toUpperCase()}`, col1ValX, textY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 90, 90);
  doc.text('Tahun Masuk', col2X, textY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(`:  ${student.tahunMasuk || '-'}`, col2ValX, textY);

  // Baris 3: Status & Total Setoran
  textY += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 90, 90);
  doc.text('Status Tabungan', col1X, textY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(student.status === 'aktif' ? 16 : 180, student.status === 'aktif' ? 120 : 30, student.status === 'aktif' ? 68 : 30);
  doc.text(`:  ${student.status === 'aktif' ? 'Aktif' : student.status === 'ditutup' ? 'Ditutup' : 'Lulus'}`, col1ValX, textY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 90, 90);
  doc.text('Total Setoran Awal', col2X, textY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(`:  ${formatRupiah(student.totalSetoranAwal || 0)}`, col2ValX, textY);

  // Baris 4: Saldo Rekening Saat Ini
  textY += 6;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(col1X, textY - 1.5, margin + contentWidth - 4, textY - 1.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text('Saldo Tabungan Tercatat', col1X, textY + 2);
  doc.setFontSize(10);
  doc.setTextColor(16, 120, 68);
  doc.text(formatRupiah(student.saldoSaatIni || 0), margin + contentWidth - 4, textY + 2, { align: 'right' });

  currentY += boxHeight + 6;

  // 5. KALKULASI MUTASI & SALDO BERJALAN SECARA KRONOLOGIS (ASCENDING)
  const sortedAsc = [...transactions].sort((a, b) => {
    const timeA = a.tanggal?.seconds || (a.tanggal instanceof Date ? a.tanggal.getTime() / 1000 : 0);
    const timeB = b.tanggal?.seconds || (b.tanggal instanceof Date ? b.tanggal.getTime() / 1000 : 0);
    return timeA - timeB;
  });

  let runningBalance = 0;
  let totalMasuk = 0;
  let totalKeluar = 0;

  const enrichedRows = sortedAsc.map((t, idx) => {
    const masuk = t.type === 'masuk' ? Number(t.jumlah) || 0 : 0;
    const keluar = t.type === 'tarik_sebagian' || t.type === 'tarik_semuanya' ? Number(t.jumlah) || 0 : 0;
    const adminFee = Number(t.biayaAdmin) || 0;

    runningBalance = runningBalance + masuk - keluar;
    totalMasuk += masuk;
    totalKeluar += keluar;

    return {
      no: idx + 1,
      tanggal: formatTanggal(t.tanggal),
      jenis: t.type === 'masuk' ? 'Setoran' : t.type === 'tarik_sebagian' ? 'Tarik Sebagian' : 'Tutup Tabungan',
      keterangan: t.keterangan || '-',
      masuk,
      keluar,
      adminFee,
      runningBalance,
      rawDate: t.tanggal
    };
  });

  // Filter bulanan jika diminta
  let displayRows = enrichedRows;
  if (printType === 'monthly' && filterMonth !== '' && filterYear !== '') {
    displayRows = enrichedRows.filter(t => {
      let d;
      if (t.rawDate?.seconds) d = new Date(t.rawDate.seconds * 1000);
      else if (t.rawDate instanceof Date) d = t.rawDate;
      else d = new Date(t.rawDate);

      return d.getMonth() === Number(filterMonth) && d.getFullYear() === Number(filterYear);
    });
  }

  // Format baris tabel untuk autoTable
  const tableBody = displayRows.map((r, i) => [
    String(i + 1),
    r.tanggal,
    r.jenis,
    r.keterangan,
    r.masuk > 0 ? formatRupiah(r.masuk) : '-',
    r.keluar > 0 ? formatRupiah(r.keluar) : '-',
    r.adminFee > 0 ? formatRupiah(r.adminFee) : '-',
    formatRupiah(r.runningBalance)
  ]);

  if (tableBody.length === 0) {
    tableBody.push(['-', '-', 'Belum ada transaksi pada periode ini', '-', '-', '-', '-', '-']);
  }

  // 6. RENDER TABEL TRANSAKSI MENGGUNAKAN JSPDF-AUTOTABLE
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['No', 'Tanggal', 'Jenis', 'Keterangan Transaksi', 'Masuk (Rp)', 'Keluar (Rp)', 'Admin (Rp)', 'Saldo (Rp)']],
    body: tableBody,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      textColor: [30, 30, 30],
      cellPadding: 2,
      lineColor: [203, 213, 225],
      lineWidth: 0.15
    },
    headStyles: {
      fillColor: [16, 120, 68], // Emerald Header
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'left', cellWidth: 24, fontStyle: 'bold' },
      3: { halign: 'left' },
      4: { halign: 'right', cellWidth: 23, textColor: [16, 120, 68] },
      5: { halign: 'right', cellWidth: 23, textColor: [185, 28, 28] },
      6: { halign: 'right', cellWidth: 18, textColor: [194, 65, 12] },
      7: { halign: 'right', cellWidth: 25, fontStyle: 'bold' }
    },
    didDrawPage: (data) => {
      // Header / page number if multi-page
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(`Halaman ${data.pageNumber} dari ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 7, { align: 'right' });
      doc.text(`MI Riyadusshibyan - Dokumen Resmi Tabungan`, margin, doc.internal.pageSize.getHeight() - 7);
    }
  });

  let finalY = doc.lastAutoTable.finalY + 6;

  // Cek apakah sisa halaman cukup untuk ringkasan dan tanda tangan (butuh minimal 60mm)
  if (finalY + 65 > doc.internal.pageSize.getHeight()) {
    doc.addPage();
    finalY = margin + 5;
  }

  // 7. KOTAK RINGKASAN AKHIR
  const summaryHeight = 22;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, finalY, contentWidth, summaryHeight, 1.5, 1.5, 'FD');

  const sumLeftX = margin + 4;
  const sumValX = margin + 85;
  let sumY = finalY + 4.5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Total Akumulasi Setoran Masuk', sumLeftX, sumY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 120, 68);
  doc.text(`:  ${formatRupiah(totalMasuk)}`, sumValX, sumY);

  sumY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Total Penarikan Dana', sumLeftX, sumY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text(`:  ${formatRupiah(totalKeluar)}`, sumValX, sumY);

  sumY += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('Saldo Akhir Tercatat', sumLeftX, sumY);
  doc.setTextColor(16, 120, 68);
  doc.text(`:  ${formatRupiah(student.saldoSaatIni || 0)}`, sumValX, sumY);

  // Bagian kanan kotak ringkasan: Status rekening
  const rightBoxX = margin + 98;
  doc.setDrawColor(226, 232, 240);
  doc.line(rightBoxX - 4, finalY + 2, rightBoxX - 4, finalY + summaryHeight - 2);

  if (student.status === 'ditutup') {
    const adminCut = Math.round((Number(student.totalSetoranAwal) || 0) * 0.10);
    const netMoney = Math.max(0, (Number(student.saldoSaatIni) || 0) - adminCut);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text('STATUS: Rekening Telah Ditutup', rightBoxX, finalY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(70, 70, 70);
    doc.text(`Potongan Admin 10%: ${formatRupiah(adminCut)}`, rightBoxX, finalY + 9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 120, 68);
    doc.text(`Uang Diterima Bersih: ${formatRupiah(netMoney)}`, rightBoxX, finalY + 14);
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text('* Rekening berstatus Aktif.', rightBoxX, finalY + 6);
    doc.text('Biaya admin 10% dari akumulasi setoran awal hanya', rightBoxX, finalY + 10.5);
    doc.text('dipotong jika rekening ditutup secara definitif.', rightBoxX, finalY + 15);
  }

  finalY += summaryHeight + 8;

  // 8. TANDA TANGAN RESMI
  const sigCol1X = margin + 25;
  const sigCol2X = pageWidth - margin - 25;
  const todayStr = formatTanggalIndonesia(new Date());

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);

  // Kolom Kiri: Orang Tua
  doc.text('Mengetahui,', sigCol1X, finalY, { align: 'center' });
  doc.text('Orang Tua / Wali Siswa', sigCol1X, finalY + 4.5, { align: 'center' });

  // Kolom Kanan: Bendahara
  doc.text(`${config.kota || 'Bekasi'}, ${todayStr}`, sigCol2X, finalY, { align: 'center' });
  doc.text('Petugas / Bendahara Madrasah', sigCol2X, finalY + 4.5, { align: 'center' });

  // Ruang Tanda Tangan
  const sigLineY = finalY + 23;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);

  doc.text('( .................................................. )', sigCol1X, sigLineY, { align: 'center' });
  doc.text(`( ${config.bendahara || 'Ustadzah Nurul Hidayah, S.Pd.I'} )`, sigCol2X, sigLineY, { align: 'center' });

  // 9. SIMPAN BERKAS PDF LANGSUNG KE PERANGKAT
  const studentNameClean = (student.nama || 'Siswa').replace(/[^a-zA-Z0-9]/g, '_');
  const studentNis = student.id || student.NIS || 'NIS';

  let filename = `Buku_Tabungan_${studentNis}_${studentNameClean}.pdf`;
  if (printType === 'monthly') {
    const mLabel = monthNames[Number(filterMonth)] || 'Bulan';
    filename = `Laporan_Tabungan_${studentNis}_${mLabel}_${filterYear}.pdf`;
  }

  doc.save(filename);
}
