import { useState, useEffect } from "react";
import { db } from "./config/firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { Clock, ShieldAlert, LockKeyhole, ShieldCheck, AlertTriangle } from "lucide-react";
import Swal from "sweetalert2";

function App() {
  const [listPegawai, setListPegawai] = useState([]);
  const [selectedPegawai, setSelectedPegawai] = useState(null);
  const [status, setStatus] = useState("MASUK");
  const [laporan, setLaporan] = useState("");
  const [loading, setLoading] = useState(false);

  const [currentTime, setCurrentTime] = useState(null);
  const [currentDate, setCurrentDate] = useState("");
  const [isJumat, setIsJumat] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTimeSynced, setIsTimeSynced] = useState(false); // Flag sinkronisasi API

  // 1. FUNGSI SECURITY PASSWORD DENGAN SESSION 6 HARI
  const handleSecurityCheck = async () => {
    const SESSION_KEY = "kpu_session_auth";
    const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000;
    const now = new Date().getTime();

    const savedSession = localStorage.getItem(SESSION_KEY);

    if (savedSession) {
      const sessionData = JSON.parse(savedSession);
      if (now - sessionData.timestamp < SIX_DAYS_MS) {
        setIsAuthenticated(true);
        return;
      }
    }

    const { value: password } = await Swal.fire({
      title: "Verifikasi Akses",
      text: "Masukkan Password Akses KPU Sekadau",
      input: "password",
      inputPlaceholder: "••••••••",
      icon: "info",
      iconColor: "#8B0000",
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonText: "Verifikasi",
      confirmButtonColor: "#8B0000",
      background: "#fff",
      customClass: {
        popup: "rounded-[2rem] shadow-2xl border-2 border-slate-100",
        input: "rounded-xl font-bold text-center tracking-widest",
      },
      inputValidator: (value) => {
        if (!value) return "Password wajib diisi!";
        if (value !== "SEKADAU2026") return "Password Salah!";
      },
    });

    if (password === "SEKADAU2026") {
      const newSession = { authenticated: true, timestamp: now };
      localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
      setIsAuthenticated(true);
      Swal.fire({
        icon: "success",
        title: "Akses Diterima",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };

  // 2. FUNGSI AMBIL JAM (DENGAN ANTISIPASI GAGAL/CONNECTION RESET)
  const fetchTimeAndValidate = async () => {
    let apiDate = null;

    try {
      // Coba API Utama
      const response = await fetch(
        "https://www.timeapi.io/api/Time/current/zone?timeZone=Asia/Jakarta"
      );
      if (!response.ok) throw new Error("API Timeout");
      const data = await response.json();
      apiDate = new Date(data.dateTime);
      setIsTimeSynced(true);
    } catch (err) {
      console.warn("Gagal sinkronasi jam server, menggunakan waktu lokal perangkat.");
      apiDate = new Date(); // Fallback ke waktu lokal
      setIsTimeSynced(false);
      
      // Notifikasi bahwa waktu tidak sinkron server tapi tetap bisa jalan
      Swal.fire({
        icon: "warning",
        title: "Mode Offline Time",
        text: "Gagal terhubung ke server waktu. Pastikan jam HP Anda akurat.",
        toast: true,
        position: "top-right",
        showConfirmButton: false,
        timer: 5000
      });
    }

    if (apiDate) {
      setCurrentTime(apiDate);

      // VALIDASI JUMAT (Disesuaikan dengan apiDate)
      if (apiDate.getDay() !== 5) {
        setIsJumat(false);
      } else {
        handleSecurityCheck();
      }

      const opsiTanggal = { weekday: "long", day: "numeric", month: "numeric", year: "numeric" };
      const tanggalIndo = new Intl.DateTimeFormat("id-ID", opsiTanggal).format(apiDate);
      setCurrentDate(tanggalIndo.replace(/\//g, "-"));
    }
  };

  useEffect(() => {
    fetchTimeAndValidate();
    
    // Timer Realtime
    const timer = setInterval(() => {
      setCurrentTime((prevTime) => (prevTime ? new Date(prevTime.getTime() + 1000) : null));
    }, 1000);

    // Ambil Data Pegawai
    const fetchPegawai = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "pegawai"));
        const docs = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setListPegawai(docs.sort((a, b) => parseInt(a.id) - parseInt(b.id)));
      } catch (err) {
        console.error("Gagal ambil data pegawai:", err);
      }
    };

    fetchPegawai();
    return () => clearInterval(timer);
  }, []);

  // 3. LOGIKA PRESENSI
  const handleAbsensi = async () => {
    if (!selectedPegawai) return Swal.fire("Peringatan", "Pilih nama Anda!", "warning");
    if (status === "PULANG" && !laporan) return Swal.fire("Peringatan", "Laporan wajib diisi!", "warning");

    setLoading(true);
    const now = currentTime || new Date();
    const serverTimeFormat = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).replace(".", ":");
    const todayId = now.toLocaleDateString("id-ID").replace(/\//g, "-");
    const docId = `${todayId}_${selectedPegawai.id}`;
    const docRef = doc(db, "absensi", docId);

    try {
      const docSnap = await getDoc(docRef);
      if (status === "MASUK") {
        if (docSnap.exists()) {
          Swal.fire("Gagal", "Anda sudah absen MASUK!", "error");
        } else {
          await setDoc(docRef, {
            tanggal: todayId,
            tanggal_server: serverTimestamp(), // Tetap pakai jam server asli Firebase untuk database
            id_pegawai: selectedPegawai.id,
            nama: selectedPegawai.nama,
            jabatan: selectedPegawai.jabatan,
            jam_masuk: serverTimeFormat,
            jam_pulang: "",
            laporan: "-",
            status_final: "HADIR",
          });
          Swal.fire("Berhasil", `Absen MASUK tercatat jam ${serverTimeFormat}`, "success");
        }
      } else {
        if (docSnap.exists()) {
          if (docSnap.data().jam_pulang) {
            Swal.fire("Info", "Anda sudah absen PULANG.", "info");
          } else {
            await updateDoc(docRef, {
              jam_pulang: serverTimeFormat,
              laporan: laporan,
              status_final: "HADIR (Lengkap)",
              update_terakhir: serverTimestamp(),
            });
            Swal.fire("Berhasil", `Absen PULANG tercatat jam ${serverTimeFormat}`, "success");
          }
        } else {
          Swal.fire("Ditolak", "Anda belum absen MASUK pagi ini!", "error");
        }
      }
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // --- VIEW: BUKAN HARI JUMAT ---
  if (!isJumat) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-[#8B0000] p-6 rounded-full shadow-[0_0_50px_rgba(139,0,0,0.5)] mb-8 animate-pulse">
          <ShieldAlert className="w-16 h-16 text-white" />
        </div>
        <h1 className="text-white text-3xl font-black uppercase tracking-tighter mb-2">Sistem Terkunci</h1>
        <p className="text-slate-500 text-sm max-w-xs font-medium italic leading-relaxed">
          Presensi WFH hanya dibuka pada hari <span className="text-red-500 font-bold">Jumat</span>.<br/>Silakan kembali di waktu yang ditentukan.
        </p>
      </div>
    );
  }

  // --- VIEW: LOADING / SECURITY CHECK ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#8B0000] flex flex-col items-center justify-center text-white">
        <LockKeyhole className="w-12 h-12 mb-4 opacity-20 animate-bounce" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Harap tunggu sebentar...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 md:p-8 font-sans animate-in fade-in duration-1000">
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white">
        
        {/* KIRI: HEADER & CLOCK */}
        <div className="bg-[#8B0000] p-8 md:p-12 md:w-2/5 flex flex-col items-center justify-between text-white text-center relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
          
          <div className="relative z-10 w-full">
            <img src="https://www.kpu.go.id/images/1627539868logo-kpu.png" className="h-16 md:h-20 mb-6 drop-shadow-2xl mx-auto" alt="Logo KPU" />
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter leading-none">Presensi WFH</h1>
            <p className="text-white/60 text-[9px] font-bold tracking-[0.3em] uppercase mt-2 italic">KPU Kabupaten Sekadau</p>
          </div>

          <div className="bg-black/30 p-6 md:p-8 rounded-[2rem] backdrop-blur-xl border border-white/10 w-full my-8 relative z-10 shadow-2xl">
             <div className="flex items-center justify-center gap-2 mb-3">
                <Clock className={`w-4 h-4 animate-pulse ${isTimeSynced ? 'text-orange-400' : 'text-red-400'}`} />
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isTimeSynced ? 'text-orange-400' : 'text-red-400'}`}>
                    {isTimeSynced ? "Waktu Indonesia Barat" : "Waktu Lokal (Offline)"}
                </span>
             </div>
             <h2 className="text-4xl md:text-5xl font-black tracking-tighter tabular-nums drop-shadow-lg">
               {currentTime ? currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).replace(/\./g, ":") : "--:--:--"}
             </h2>
             <div className="mt-4 pt-4 border-t border-white/10 flex flex-col items-center gap-1">
                <p className="text-[11px] font-black uppercase tracking-widest text-white">{currentDate || "SINKRONISASI..."}</p>
                <div className={`flex items-center gap-1 text-[8px] font-bold uppercase ${isTimeSynced ? 'text-green-400' : 'text-yellow-400'}`}>
                    {isTimeSynced ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    {isTimeSynced ? "Server Terverifikasi" : "Sinkronasi API Gagal"}
                </div>
             </div>
          </div>

          <div className="w-full opacity-40 relative z-10 hidden md:block">
            <p className="text-[9px] italic tracking-[0.2em] uppercase">#TemanPemilih</p>
          </div>
        </div>

        {/* KANAN: FORM */}
        <div className="p-8 md:p-14 md:w-3/5 space-y-8 bg-white flex flex-col justify-center">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase text-left">Formulir Presensi</h2>
            <p className="text-slate-400 text-xs font-medium italic text-left">Silakan lengkapi data kehadiran Anda hari ini.</p>
          </div>

          <div className="space-y-6 text-left">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Pilih Identitas</label>
              <div className="relative">
                <select
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 md:p-5 rounded-2xl font-bold text-sm focus:border-[#8B0000] focus:bg-white outline-none transition-all appearance-none cursor-pointer text-slate-700"
                  onChange={(e) => setSelectedPegawai(listPegawai.find((p) => p.id === e.target.value))}
                >
                  <option value="">-- PILIH NAMA ANDA --</option>
                  {listPegawai.map((p) => (
                    <option key={p.id} value={p.id}>{p.nama}</option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8B0000] font-bold">▼</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Sesi Presensi</label>
                <select
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-black text-xs outline-none cursor-pointer focus:border-[#8B0000] text-slate-700"
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="MASUK">ABSEN MASUK (Pagi)</option>
                  <option value="PULANG">ABSEN PULANG (Sore)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Jabatan Sistem</label>
                <input
                  readOnly
                  value={selectedPegawai?.jabatan || "Menunggu Pilihan..."}
                  className="w-full bg-slate-100 p-4 rounded-2xl text-[10px] font-bold text-red-900 italic border-none outline-none overflow-hidden text-ellipsis whitespace-nowrap"
                />
              </div>
            </div>

            {status === "PULANG" && (
              <div className="animate-in slide-in-from-top-4 duration-500 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Laporan Pekerjaan (Harian)</label>
                <textarea
                  className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-[2rem] text-sm font-medium outline-none focus:border-[#8B0000] focus:bg-white transition-all shadow-inner min-h-[120px]"
                  placeholder="Deskripsikan secara detail pekerjaan Anda hari ini..."
                  onChange={(e) => setLaporan(e.target.value)}
                ></textarea>
              </div>
            )}
          </div>

          <div className="pt-4 text-center">
            <button
              disabled={loading || listPegawai.length === 0 || !currentTime}
              onClick={handleAbsensi}
              className="w-full bg-[#8B0000] hover:bg-black text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 uppercase text-[11px] tracking-[0.2em] disabled:bg-slate-300 disabled:scale-100 flex items-center justify-center gap-3"
            >
              {loading ? (
                <> <span className="animate-spin text-lg">↻</span> Menyimpan ke Cloud...</>
              ) : (
                "Kirim Presensi Sekarang"
              )}
            </button>
            <div className="mt-4 flex items-center justify-center gap-2 text-slate-300">
               <div className="h-[1px] w-8 bg-slate-100"></div>
               <p className="text-[8px] font-black uppercase tracking-widest">
                {isTimeSynced ? "Waktu Server Terverifikasi" : "Waktu Lokal Perangkat"}
               </p>
               <div className="h-[1px] w-8 bg-slate-100"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;