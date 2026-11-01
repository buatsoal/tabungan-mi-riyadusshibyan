import React from 'react';
import { LogOut, ShieldCheck, User, Sparkles } from 'lucide-react';

export default function Navbar({
  currentUser, // { role: 'siswa' | 'admin', data: student | userObj }
  onLogout,
  onSeedDemoData,
  isSeeding = false,
  studentCount = 0
}) {
  return (
    <header className="no-print bg-white border-b border-emerald-100 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & School Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-lg shadow-sm font-serif">
              MI
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg text-emerald-950 tracking-tight">
                  Tabungan MI Riyadusshibyan
                </span>
                <span className="hidden md:inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md uppercase">
                  Bekasi
                </span>
              </div>
              <p className="text-[11px] text-gray-500 hidden sm:block">
                Amanah, Transparan, dan Barokah
              </p>
            </div>
          </div>

          {/* User Status / Actions */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                {currentUser.role === 'admin' ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <div className="text-left text-xs hidden sm:block">
                      <p className="font-bold text-emerald-900 leading-tight">Petugas Admin</p>
                      <p className="text-[10px] text-emerald-600">{currentUser.data?.email || 'admin@mi.sch.id'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl">
                    <User className="w-4 h-4 text-gray-600" />
                    <div className="text-left text-xs hidden sm:block">
                      <p className="font-bold text-gray-800 leading-tight">{currentUser.data?.nama}</p>
                      <p className="text-[10px] text-gray-500 font-mono">NIS: {currentUser.data?.id || currentUser.data?.NIS}</p>
                    </div>
                  </div>
                )}

                {/* Seed demo data helper if admin and student count is 0 */}
                {currentUser.role === 'admin' && studentCount === 0 && (
                  <button
                    onClick={onSeedDemoData}
                    disabled={isSeeding}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Buat data sampel siswa untuk uji coba langsung"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span className="hidden sm:inline">{isSeeding ? 'Membuat data...' : 'Isi Data Demo'}</span>
                  </button>
                )}

                <button
                  onClick={onLogout}
                  className="px-3 py-1.5 border border-gray-300 hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Keluar dari sesi ini"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
