import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { UserCheck, Shield, KeyRound, AlertTriangle, Loader2, ArrowRight, Sparkles, Eye, EyeOff } from 'lucide-react';

export default function LoginModal({ onLoginSiswa, onLoginAdmin }) {
  const [activeTab, setActiveTab] = useState('siswa'); // 'siswa' | 'admin'

  // Siswa Form
  const [nisInput, setNisInput] = useState('');
  const [loadingSiswa, setLoadingSiswa] = useState(false);
  const [errorSiswa, setErrorSiswa] = useState('');

  // Admin Form (Kosong secara default demi keamanan data)
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [errorAdmin, setErrorAdmin] = useState('');

  // 1. LOGIN SISWA: Input NIS saja, cek doc students/NIS
  const handleSubmitSiswa = async (e) => {
    e.preventDefault();
    const cleanNis = nisInput.trim();
    if (!cleanNis) {
      setErrorSiswa('Silakan masukkan Nomor Induk Siswa (NIS).');
      return;
    }

    try {
      setLoadingSiswa(true);
      setErrorSiswa('');

      const docRef = doc(db, 'students', cleanNis);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setErrorSiswa(`Siswa dengan NIS "${cleanNis}" tidak ditemukan. Silakan periksa kembali atau hubungi tata usaha / bendahara.`);
        return;
      }

      const studentData = {
        id: docSnap.id,
        NIS: docSnap.id,
        ...docSnap.data()
      };

      onLoginSiswa(studentData);
    } catch (err) {
      console.error(err);
      setErrorSiswa('Gagal mengakses data: ' + (err.message || 'Periksa koneksi internet'));
    } finally {
      setLoadingSiswa(false);
    }
  };

  // 2. LOGIN ADMIN: Email & Password Firebase Auth
  const handleSubmitAdmin = async (e) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim();
    const cleanPass = passwordInput;

    if (!cleanEmail || !cleanPass) {
      setErrorAdmin('Email dan Password admin wajib diisi.');
      return;
    }

    try {
      setLoadingAdmin(true);
      setErrorAdmin('');

      let userCred;
      try {
        userCred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
      } catch (authErr) {
        // If user not created yet on clean Firebase project, initialize the default admin account
        if (
          authErr.code === 'auth/user-not-found' ||
          authErr.code === 'auth/invalid-credential' ||
          authErr.code === 'auth/wrong-password'
        ) {
          try {
            userCred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
          } catch (createErr) {
            throw authErr;
          }
        } else {
          throw authErr;
        }
      }

      onLoginAdmin(userCred.user);
    } catch (err) {
      console.error(err);
      setErrorAdmin('Gagal login admin: ' + (err.message || 'Kredensial tidak valid'));
    } finally {
      setLoadingAdmin(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-xl border border-emerald-100 overflow-hidden">
        {/* Banner Madrasah */}
        <div className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 text-white p-6 text-center relative">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center font-bold text-2xl shadow-inner">
            <span className="text-emerald-200 font-serif">MI</span>
          </div>
          <h1 className="text-xl font-extrabold tracking-wide uppercase font-sans">
            TABUNGAN MI RIYADUSSHIBYAN
          </h1>
          <p className="text-xs text-emerald-200 mt-1">
            Sistem Informasi Tabungan Siswa Modern & Amanah
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-2 bg-gray-100/80 m-4 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('siswa')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'siswa'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Login Siswa / Wali</span>
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'admin'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Petugas / Admin</span>
          </button>
        </div>

        <div className="p-6 pt-2">
          {activeTab === 'siswa' ? (
            /* TAB SISWA */
            <form onSubmit={handleSubmitSiswa} className="space-y-4">
              <div className="text-center pb-2">
                <h3 className="font-bold text-gray-800 text-sm">Masuk Sebagai Siswa / Wali</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Cukup masukkan Nomor Induk Siswa (NIS) untuk melihat saldo & mutasi buku tabungan.
                </p>
              </div>

              {errorSiswa && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorSiswa}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Nomor Induk Siswa (NIS) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={nisInput}
                    onChange={(e) => setNisInput(e.target.value)}
                    placeholder="Contoh: 2025001"
                    autoFocus
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingSiswa}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {loadingSiswa ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memeriksa NIS...
                  </>
                ) : (
                  <>
                    <span>Lihat Saldo Tabungan</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-[11px] text-gray-400">
                  Dashboard siswa bersifat aman & read-only tanpa tombol transaksi.
                </span>
              </div>
            </form>
          ) : (
            /* TAB ADMIN */
            <form onSubmit={handleSubmitAdmin} className="space-y-4">
              <div className="text-center pb-2">
                <h3 className="font-bold text-gray-800 text-sm">Login Bendahara / Admin Madrasah</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Akses penuh pencatatan transaksi, kelola kelas, dan cetak laporan.
                </p>
              </div>

              {errorAdmin && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorAdmin}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Petugas / Admin *
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="nama@madrasah.sch.id"
                  required
                  autoComplete="username"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Kata Sandi *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Masukkan kata sandi akun"
                    required
                    autoComplete="current-password"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
                <KeyRound className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <p>Akses terbatas hanya untuk panitia dan bendahara tabungan resmi madrasah.</p>
              </div>

              <button
                type="submit"
                disabled={loadingAdmin}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {loadingAdmin ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Masuk Dashboard Admin</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
