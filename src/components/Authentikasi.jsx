import { Loader2, Lock, Mail } from 'lucide-react'
import React from 'react'

const Authentikasi = ({ handleLogin, email, setEmail, password, setPassword, rememberMe, setRememberMe, loading, }) => {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-white">
          <div className="md:w-1/2 bg-[#8B0000] p-12 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <img
                src="https://www.kpu.go.id/images/1627539868logo-kpu.png"
                className="h-16 mb-8 mx-auto md:mx-0"
                alt="Logo KPU"
              />
              <h1 className="text-4xl font-black leading-tight mb-4 uppercase tracking-tighter italic text-center md:text-left">
                Sistem
                <br />
                Rekapitulasi
              </h1>
              <p className="text-red-100 text-xs font-bold tracking-widest uppercase opacity-60 text-center md:text-left">
                KPU Kabupaten Sekadau
              </p>
            </div>
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-red-600 rounded-full blur-[100px] opacity-40"></div>
          </div>

          <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white">
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter mb-1">
              Panel Admin
            </h2>
            <p className="text-slate-400 text-sm mb-10 italic">
              Masuk untuk mengelola data presensi
            </p>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  Email KPU
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 pl-12 rounded-2xl font-bold outline-none focus:border-[#8B0000] transition-all text-slate-700"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 pl-12 rounded-2xl font-bold outline-none focus:border-[#8B0000] transition-all text-slate-700"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center ml-1">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  className="w-4 h-4 text-[#8B0000] rounded cursor-pointer"
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label
                  htmlFor="remember"
                  className="ml-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer select-none"
                >
                  Ingat Saya
                </label>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#8B0000] text-white font-black py-5 rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 uppercase text-[11px] tracking-widest active:scale-95"
              >
                {loading ? (
                  <Loader2 className="animate-spin text-white w-5 h-5" />
                ) : (
                  "Masuk Ke Dashboard"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
  )
}

export default Authentikasi