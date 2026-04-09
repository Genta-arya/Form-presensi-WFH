import { Download, LogOut, Printer, ShieldCheck } from 'lucide-react'
import React from 'react'

const HeaderDashboard = ({user, handleDownloadExcel, handleLogout }) => {
  return (
  <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-6">
            <div className="bg-red-50 p-4 rounded-3xl">
              <ShieldCheck className="w-10 h-10 text-[#8B0000]" />
            </div>
            <div className="text-left">
              <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter italic leading-none">
                Rekapitulasi WFH
              </h2>
              <p className="text-[#8B0000] text-[10px] font-black uppercase mt-2 italic tracking-[0.2em]">
                {user.email}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={handleDownloadExcel}
              className="bg-green-700 hover:bg-green-800 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center gap-2 shadow-xl active:scale-95"
            >
              <Download className="w-4 h-4" /> Export Excel
            </button>
           
            <button
              onClick={handleLogout}
              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-6 py-4 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center gap-2 active:scale-95"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
  )
}

export default HeaderDashboard