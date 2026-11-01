/**
 * Utility functions for currency and date formatting
 */

export const formatRupiah = (amount) => {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatNumber = (amount) => {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID').format(value);
};

export const formatTanggal = (timestampOrDate, withTime = false) => {
  if (!timestampOrDate) return '-';

  let date;
  if (timestampOrDate.toDate && typeof timestampOrDate.toDate === 'function') {
    date = timestampOrDate.toDate();
  } else if (timestampOrDate.seconds) {
    date = new Date(timestampOrDate.seconds * 1000);
  } else if (timestampOrDate instanceof Date) {
    date = timestampOrDate;
  } else {
    date = new Date(timestampOrDate);
  }

  if (isNaN(date.getTime())) return '-';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  if (!withTime) {
    return `${day}/${month}/${year}`;
  }

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes} WIB`;
};

export const formatTanggalIndonesia = (timestampOrDate) => {
  if (!timestampOrDate) return '-';

  let date;
  if (timestampOrDate.toDate && typeof timestampOrDate.toDate === 'function') {
    date = timestampOrDate.toDate();
  } else if (timestampOrDate.seconds) {
    date = new Date(timestampOrDate.seconds * 1000);
  } else if (timestampOrDate instanceof Date) {
    date = timestampOrDate;
  } else {
    date = new Date(timestampOrDate);
  }

  if (isNaN(date.getTime())) return '-';

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const day = date.getDate();
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${monthName} ${year}`;
};

export const LIST_KELAS = [
  '1A', '1B', '1C',
  '2A', '2B', '2C',
  '3A', '3B', '3C',
  '4A', '4B', '4C',
  '5A', '5B', '5C',
  '6A', '6B', '6C',
];

export const TAHUN_AJARAN_LIST = [
  '2023/2024',
  '2024/2025',
  '2025/2026',
  '2026/2027',
  '2027/2028',
];
