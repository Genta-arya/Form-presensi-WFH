import React, { useState } from 'react';
import { Clock, User, FileText, Calendar, X, Eye } from 'lucide-react';

const RekapTable = ({ dataAbsensi, getHariTanggal }) => {
  const [selectedLaporan, setSelectedLaporan] = useState(null);

  const truncateText = (text, limit = 60) => {
    if (text.length <= limit) return text;
    return text.substring(0, limit) + "...";
  };

  return (
    <div className="space-y-4">
      {/* --- MODAL DETAIL LAPORAN --- */}
      {selectedLaporan && (
        <div className="fixed inset-0 z-[99] flex items-center justify-center h-screen p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          {/* Container Modal Utama: Kita batasi max-height di sini */}
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Header Modal (Statis/Tetap di atas) */}
            <div className="bg-[#8B0000] p-6 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 opacity-70" />
                <h3 className="font-black uppercase tracking-widest text-sm">Detail Laporan Kerja</h3>
              </div>
              <button 
                onClick={() => setSelectedLaporan(null)}
                className="bg-white/20 hover:bg-white/40 p-2 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Modal (Bisa Di-scroll) */}
            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="bg-red-50 p-3 rounded-xl text-[#8B0000] font-bold text-xs">
                  {getHariTanggal(selectedLaporan).hari}
                </div>
                <div>
                  <p className="font-black text-slate-800 uppercase text-xs">{selectedLaporan.nama}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{selectedLaporan.tanggal}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <p className="text-slate-600 leading-relaxed italic text-sm whitespace-pre-wrap">
                  "{selectedLaporan.laporan}"
                </p>
              </div>
            </div>

            {/* Footer Modal (Statis/Tetap di bawah) */}
            <div className="p-6 border-t border-slate-100 bg-white shrink-0">
              <button 
                onClick={() => setSelectedLaporan(null)}
                className="w-full bg-slate-800 text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest shadow-lg hover:bg-black transition-all"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- VERSI DESKTOP --- */}
      <div className="hidden md:block bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#8B0000] text-white text-[10px] uppercase tracking-[0.3em]">
                <th className="p-8 text-center">Hari & Tanggal</th>
                <th className="p-8">Nama</th>
                <th className="p-8 text-center">Masuk - Pulang</th>
                <th className="p-8">Laporan Kegiatan</th>
                <th className="p-8 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="text-[12px] font-medium text-slate-600">
              {dataAbsensi.map((item, index) => {
                const info = getHariTanggal(item);
                return (
                  <tr key={index} className="border-b border-slate-50 hover:bg-slate-50/80 transition-all group">
                    <td className="p-8 font-black text-slate-500 tracking-tighter whitespace-nowrap text-center">
                      <span className="text-[#8B0000] font-black uppercase">{info.hari},</span>
                      <br />
                      <span className="text-slate-400 italic text-[10px]">{info.tanggal}</span>
                    </td>
                    <td className="p-8">
                      <p className="font-black text-slate-800 uppercase leading-none mb-1">{item.nama}</p>
                      <p className="text-[9px] text-red-700 font-bold italic tracking-tight uppercase">{item.jabatan}</p>
                    </td>
                    <td className="p-8 text-center">
                      <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full font-black text-[10px]">
                        <span className="text-green-600">{item.jam_masuk}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-orange-600">{item.jam_pulang || "---"}</span>
                      </div>
                    </td>
                    <td className="p-8 max-w-[250px]">
                      <div className="flex flex-col gap-2">
                        <p className="text-slate-500 italic line-clamp-2 leading-relaxed">
                          "{truncateText(item.laporan, 60)}"
                        </p>
                        {item.laporan.length > 60 && (
                          <button 
                            onClick={() => setSelectedLaporan(item)}
                            className="flex items-center gap-1.5 text-[#8B0000] font-black text-[9px] uppercase tracking-widest hover:underline"
                          >
                            <Eye className="w-3 h-3" /> Lihat Detail
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <span className={`px-5 py-2.5 rounded-2xl text-[7px] w-full font-black uppercase tracking-widest shadow-md ${
                        item.jam_pulang ? "bg-green-600 text-white" : "bg-red-500 text-white"
                      }`}>
                        {item.status_final}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- VERSI MOBILE --- */}
      <div className="md:hidden space-y-4">
        {dataAbsensi.map((item, index) => {
          const info = getHariTanggal(item);
          return (
            <div key={index} className="bg-white rounded-[2.5rem] shadow-lg border border-slate-100 overflow-hidden">
              <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-[#8B0000] p-2 rounded-xl text-white">
                    <User className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-slate-800 uppercase text-xs">{item.nama}</h3>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase ${
                  item.jam_pulang ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
                  {item.status_final}
                </span>
              </div>
              <div className="p-6 space-y-4 text-[10px]">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 font-bold uppercase text-[8px] block mb-1">Tanggal</span>
                    <span className="font-black text-slate-700 uppercase">{info.hari}, {info.tanggal}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 font-bold uppercase text-[8px] block mb-1">Waktu</span>
                    <span className="font-black text-slate-700">{item.jam_masuk} - {item.jam_pulang || "..." }</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2">
                  <span className="text-slate-400 font-bold uppercase text-[8px]">Laporan Kegiatan</span>
                  <p className="text-slate-600 italic leading-relaxed">
                    "{truncateText(item.laporan, 80)}"
                  </p>
                  {item.laporan.length > 80 && (
                    <button 
                      onClick={() => setSelectedLaporan(item)}
                      className="text-[#8B0000] font-black uppercase text-[9px] tracking-widest self-start mt-2"
                    >
                      Buka Detail
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RekapTable;