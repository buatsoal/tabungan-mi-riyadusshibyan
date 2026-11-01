import React, { useState, useEffect } from 'react';
import { auth, db, serverTimestamp } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection,
  onSnapshot,
  query,
  doc,
  setDoc,
  addDoc
} from 'firebase/firestore';

import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import DetailSiswa from './components/DetailSiswa';
import PrintArea from './components/PrintArea';

export default function App() {
  // Auth state: 'guest' | 'siswa' | 'admin'
  const [authRole, setAuthRole] = useState('guest');
  const [currentStudent, setCurrentStudent] = useState(null);
  const [adminUser, setAdminUser] = useState(null);

  // Data state
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState(null);
  const [isSeeding, setIsSeeding] = useState(false);

  // Print state
  const [printData, setPrintData] = useState(null);

  // School config (persisted in localStorage)
  const [schoolConfig, setSchoolConfig] = useState(() => {
    const saved = localStorage.getItem('mi_school_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      nama: 'MI RIYADUSSHIBYAN',
      nsm: '111232750089',
      npsn: '69752311',
      alamat: 'Jl. KH. Noer Alie No. 45, Teluk Pucung, Kec. Bekasi Utara, Kota Bekasi, Jawa Barat 17121',
      telepon: '(021) 88991234',
      email: 'info@mi-riyadusshibyan.sch.id',
      bendahara: 'Ustadzah Nurul Hidayah, S.Pd.I',
      kota: 'Bekasi',
      logoUrl: 'https://images.unsplash.com/photo-1590076215667-873d328d49a7?auto=format&fit=crop&w=150&q=80'
    };
  });

  const handleUpdateSchoolConfig = (cfg) => {
    setSchoolConfig(cfg);
    localStorage.setItem('mi_school_config', JSON.stringify(cfg));
  };

  // Listen to Firebase Auth state for Admin
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAdminUser(user);
        setAuthRole('admin');
      } else {
        setAdminUser(null);
        // Only reset to guest if current role was admin
        setAuthRole(prev => (prev === 'admin' ? 'guest' : prev));
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to Students collection in real-time
  useEffect(() => {
    setLoadingStudents(true);
    const studentsRef = collection(db, 'students');
    const q = query(studentsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        NIS: doc.id,
        ...doc.data()
      }));

      // Sort by nama ascending by default
      list.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));

      setStudents(list);
      setLoadingStudents(false);

      // Keep selected student updated in detail view
      if (selectedStudentForDetail) {
        const found = list.find(s => s.id === selectedStudentForDetail.id);
        if (found) {
          setSelectedStudentForDetail(found);
        }
      }

      // Keep student dashboard data updated
      if (currentStudent) {
        const found = list.find(s => s.id === currentStudent.id);
        if (found) {
          setCurrentStudent(found);
        }
      }
    }, (err) => {
      console.error("Firestore students snapshot error:", err);
      setLoadingStudents(false);
    });

    return () => unsubscribe();
  }, [selectedStudentForDetail?.id, currentStudent?.id]);

  // Handle Logout
  const handleLogout = async () => {
    if (authRole === 'admin') {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Sign out error:", err);
      }
    }
    setAuthRole('guest');
    setCurrentStudent(null);
    setAdminUser(null);
    setSelectedStudentForDetail(null);
  };

  // Login Handlers
  const handleLoginSiswa = (studentData) => {
    setCurrentStudent(studentData);
    setAuthRole('siswa');
  };

  const handleLoginAdmin = (user) => {
    setAdminUser(user);
    setAuthRole('admin');
  };

  // Seed Demo Data (Helper for instant testing if Firestore is empty)
  const handleSeedDemoData = async () => {
    try {
      setIsSeeding(true);
      const demoStudents = [
        {
          nis: '2024001',
          nama: 'Ahmad Fauzan Pratama',
          kelas: '5A',
          tahunAjaran: '2024/2025',
          tahunMasuk: '2020',
          saldo: 350000,
          totalSetoran: 400000,
          status: 'aktif',
          history: [
            { type: 'masuk', jumlah: 200000, keterangan: 'Setoran awal buka rekening', dateOffset: -40 },
            { type: 'masuk', jumlah: 200000, keterangan: 'Setoran tabungan bulanan', dateOffset: -20 },
            { type: 'tarik_sebagian', jumlah: 50000, keterangan: 'Beli buku LKS & seragam', dateOffset: -5 }
          ]
        },
        {
          nis: '2024002',
          nama: 'Siti Aisyah Humaira',
          kelas: '5A',
          tahunAjaran: '2024/2025',
          tahunMasuk: '2020',
          saldo: 600000,
          totalSetoran: 600000,
          status: 'aktif',
          history: [
            { type: 'masuk', jumlah: 300000, keterangan: 'Setoran tabungan awal', dateOffset: -60 },
            { type: 'masuk', jumlah: 300000, keterangan: 'Setoran tabungan semester genap', dateOffset: -15 }
          ]
        },
        {
          nis: '2024003',
          nama: 'Muhammad Rizky Ramadhan',
          kelas: '6A',
          tahunAjaran: '2025/2026',
          tahunMasuk: '2019',
          saldo: 750000,
          totalSetoran: 800000,
          status: 'aktif',
          history: [
            { type: 'masuk', jumlah: 500000, keterangan: 'Setoran awal tahun', dateOffset: -90 },
            { type: 'masuk', jumlah: 300000, keterangan: 'Setoran rutin pekanan', dateOffset: -30 },
            { type: 'tarik_sebagian', jumlah: 50000, keterangan: 'Iuran kegiatan field trip', dateOffset: -10 }
          ]
        },
        {
          nis: '2024004',
          nama: 'Fatimah Az-Zahra',
          kelas: '4B',
          tahunAjaran: '2025/2026',
          tahunMasuk: '2021',
          saldo: 250000,
          totalSetoran: 250000,
          status: 'aktif',
          history: [
            { type: 'masuk', jumlah: 150000, keterangan: 'Setoran tabungan pekanan', dateOffset: -25 },
            { type: 'masuk', jumlah: 100000, keterangan: 'Setoran tambahan tabungan', dateOffset: -2 }
          ]
        },
        {
          nis: '2024005',
          nama: 'Bilal Habibi Al-Farisi',
          kelas: '5A',
          tahunAjaran: '2024/2025',
          tahunMasuk: '2020',
          saldo: 180000,
          totalSetoran: 200000,
          status: 'aktif',
          history: [
            { type: 'masuk', jumlah: 200000, keterangan: 'Setoran awal', dateOffset: -45 },
            { type: 'tarik_sebagian', jumlah: 20000, keterangan: 'Beli pensil warna & buku tulis', dateOffset: -8 }
          ]
        }
      ];

      for (const item of demoStudents) {
        const studentRef = doc(db, 'students', item.nis);
        await setDoc(studentRef, {
          nama: item.nama,
          kelasSaatIni: item.kelas,
          tahunAjaran: item.tahunAjaran,
          tahunMasuk: item.tahunMasuk,
          saldoSaatIni: item.saldo,
          totalSetoranAwal: item.totalSetoran,
          status: item.status,
          riwayatKelas: [item.kelas],
          createdAt: serverTimestamp()
        });

        // Add history transactions
        const transRef = collection(db, 'students', item.nis, 'transactions');
        for (const h of item.history) {
          const tDate = new Date();
          tDate.setDate(tDate.getDate() + h.dateOffset);
          await addDoc(transRef, {
            type: h.type,
            jumlah: h.jumlah,
            biayaAdmin: 0,
            jumlahDiterima: h.jumlah,
            tanggal: tDate,
            keterangan: h.keterangan,
            tahunAjaran: item.tahunAjaran,
            petugasAdmin: 'Ustadzah Nurul'
          });
        }
      }

      alert('Berhasil membuat 5 data santri demo dengan riwayat transaksi!');
    } catch (err) {
      console.error(err);
      alert('Gagal inisialisasi demo data: ' + err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  // Handle Print Action (HANYA MUNCUL DI DETAIL SISWA ADMIN)
  const handleTriggerPrint = (printPayload) => {
    setPrintData(printPayload);

    // Give browser brief time to render PrintArea then invoke window.print()
    setTimeout(() => {
      window.print();
    }, 250);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Navbar Header */}
      <Navbar
        currentUser={
          authRole === 'admin'
            ? { role: 'admin', data: adminUser }
            : authRole === 'siswa'
            ? { role: 'siswa', data: currentStudent }
            : null
        }
        onLogout={handleLogout}
        onSeedDemoData={handleSeedDemoData}
        isSeeding={isSeeding}
        studentCount={students.length}
      />

      {/* Main Content */}
      <main className="no-print flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {authRole === 'guest' && (
          <LoginModal
            onLoginSiswa={handleLoginSiswa}
            onLoginAdmin={handleLoginAdmin}
          />
        )}

        {authRole === 'siswa' && currentStudent && (
          <StudentDashboard
            student={currentStudent}
            onLogout={handleLogout}
          />
        )}

        {authRole === 'admin' && (
          <>
            {selectedStudentForDetail ? (
              <DetailSiswa
                student={selectedStudentForDetail}
                adminUser={adminUser}
                schoolConfig={schoolConfig}
                onBack={() => setSelectedStudentForDetail(null)}
                onTriggerPrint={handleTriggerPrint}
                onStudentUpdated={(updated) => setSelectedStudentForDetail(updated)}
              />
            ) : (
              <AdminDashboard
                students={students}
                loading={loadingStudents}
                adminUser={adminUser}
                schoolConfig={schoolConfig}
                onUpdateSchoolConfig={handleUpdateSchoolConfig}
                onSelectStudent={(st) => setSelectedStudentForDetail(st)}
                onRefreshData={() => {}}
              />
            )}
          </>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="no-print border-t border-gray-200 py-4 text-center text-xs text-gray-500 bg-white">
        <p>
          &copy; {new Date().getFullYear()} Tabungan Madrasah Ibtidaiyah Riyadusshibyan &bull; Dikelola oleh Panitia Tabungan & Tata Usaha
        </p>
      </footer>

      {/* PRINT AREA (Hidden on screen via CSS @media print, visible when window.print() is called) */}
      {printData && (
        <div className="hidden print:block">
          <PrintArea
            student={printData.student}
            transactions={printData.transactions}
            printType={printData.printType}
            filterMonth={printData.filterMonth}
            filterYear={printData.filterYear}
            schoolConfig={printData.schoolConfig || schoolConfig}
          />
        </div>
      )}
    </div>
  );
}
