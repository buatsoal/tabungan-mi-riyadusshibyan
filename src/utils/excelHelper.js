import * as XLSX from 'xlsx';

export const generateTemplateExcel = () => {
  const sampleData = [
    {
      NIS: '2025001',
      Nama: 'Ahmad Fauzan Pratama',
      Kelas: '1A',
      TahunAjaran: '2025/2026',
      TahunMasuk: '2025'
    },
    {
      NIS: '2025002',
      Nama: 'Siti Aisyah Humaira',
      Kelas: '1A',
      TahunAjaran: '2025/2026',
      TahunMasuk: '2025'
    },
    {
      NIS: '2025003',
      Nama: 'Muhammad Rizky Ramadhan',
      Kelas: '1B',
      TahunAjaran: '2025/2026',
      TahunMasuk: '2025'
    },
    {
      NIS: '2025004',
      Nama: 'Fatimah Az-Zahra',
      Kelas: '2A',
      TahunAjaran: '2025/2026',
      TahunMasuk: '2024'
    },
    {
      NIS: '2025005',
      Nama: 'Bilal Habibi Al-Farisi',
      Kelas: '3B',
      TahunAjaran: '2025/2026',
      TahunMasuk: '2023'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData, {
    header: ['NIS', 'Nama', 'Kelas', 'TahunAjaran', 'TahunMasuk']
  });

  // Set column widths for clean readability
  worksheet['!cols'] = [
    { wch: 15 }, // NIS
    { wch: 30 }, // Nama
    { wch: 10 }, // Kelas
    { wch: 16 }, // TahunAjaran
    { wch: 14 }, // TahunMasuk
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DataSiswa');

  XLSX.writeFile(workbook, 'template_siswa_mi.xlsx');
};

export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          reject(new Error('File Excel tidak memiliki lembar kerja (sheet).'));
          return;
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        // Normalize headers
        const normalized = rawJson.map((row) => {
          const cleanRow = {};
          for (const key of Object.keys(row)) {
            const trimmedKey = key.trim();
            const lowerKey = trimmedKey.toLowerCase();

            if (lowerKey === 'nis' || lowerKey.includes('induk')) {
              cleanRow.NIS = String(row[key]).trim();
            } else if (lowerKey === 'nama' || lowerKey.includes('nama siswa')) {
              cleanRow.Nama = String(row[key]).trim();
            } else if (lowerKey === 'kelas' || lowerKey.includes('tingkat')) {
              cleanRow.Kelas = String(row[key]).trim().toUpperCase();
            } else if (lowerKey === 'tahunajaran' || lowerKey.includes('ajaran')) {
              cleanRow.TahunAjaran = String(row[key]).trim();
            } else if (lowerKey === 'tahunmasuk' || lowerKey.includes('masuk')) {
              cleanRow.TahunMasuk = String(row[key]).trim();
            } else {
              cleanRow[trimmedKey] = row[key];
            }
          }
          return cleanRow;
        });

        resolve(normalized);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
