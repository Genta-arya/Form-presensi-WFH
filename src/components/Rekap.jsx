import { useState, useEffect, useMemo } from "react";
import { auth, db } from "../config/firebase";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { Mail, Lock, Loader2, Calendar, FilterX, Clock } from "lucide-react";
import Swal from "sweetalert2";
import { exportToExcel } from "../utils/exportExcel";
import RekapTable from "./RekapTable";
import HeaderDashboard from "./HeaderDashboard";
import Authentikasi from "./Authentikasi";

function Rekap() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [dataAbsensi, setDataAbsensi] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInitialCheck, setIsInitialCheck] = useState(true);

  // State untuk filter tanggal
  const [filterDate, setFilterDate] = useState("");
  const [serverStatus, setServerStatus] = useState("Sinkronisasi...");

  // --- 1. FUNGSI AMBIL TANGGAL HARI INI (API WITH DEVICE FALLBACK) ---
  const initTodayFilter = async () => {
    try {
      setServerStatus("Sinkronisasi...");
      const response = await fetch('https://www.timeapi.io/api/Time/current/zone?timeZone=Asia/Jakarta');
      
      if (!response.ok) throw new Error("API Down");

      const data = await response.json();
      
      // Format YYYY-MM-DD dari API
      const formattedToday = `${data.year}-${String(data.month).padStart(2, '0')}-${String(data.day).padStart(2, '0')}`;
      
      setFilterDate(formattedToday);
      setServerStatus("Server Terhubung");
    } catch (err) {
      console.warn("Gagal fetch API, menggunakan jam device:", err);
      
      // FALLBACK: Gunakan Tanggal Device
      const d = new Date();
      const formattedDeviceToday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      setFilterDate(formattedDeviceToday);
      setServerStatus("Offline (Jam Lokal)");

      // Toast kecil untuk info bahwa jam lokal digunakan
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      Toast.fire({
        icon: 'info',
        title: 'Menggunakan waktu perangkat'
      });
    }
  };

  const getHariTanggal = (item) => {
    try {
      let dateObj;
      if (item.tanggal_server && typeof item.tanggal_server.toDate === "function") {
        dateObj = item.tanggal_server.toDate();
      } else {
        const parts = item.tanggal.split("-");
        dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
      }
      const hari = new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(dateObj);
      const tanggal = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" }).format(dateObj);
      return { hari, tanggal, rawDate: dateObj };
    } catch (e) {
      return { hari: "Data", tanggal: item.tanggal, rawDate: new Date() };
    }
  };

  // --- 2. LOGIKA FILTER: DEFAULT TODAY ---
  const filteredData = useMemo(() => {
    if (!user || dataAbsensi.length === 0) return [];

    return dataAbsensi.filter((item) => {
      const info = getHariTanggal(item);
      
      if (filterDate) {
        const d = info.rawDate;
        const formattedItemDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return formattedItemDate === filterDate;
      }

      // Jika filter di-reset (kosong), tampilkan data hari jumat saja
      return info.hari.toLowerCase() === "jumat";
    });
  }, [dataAbsensi, filterDate, user]);

  useEffect(() => {
    const savedEmail = localStorage.getItem("savedAdminEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        initTodayFilter(); 
        fetchData();
      } else {
        setUser(null);
        setDataAbsensi([]);
      }
      setTimeout(() => setIsInitialCheck(false), 800);
    });

    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "absensi"));
      const data = querySnapshot.docs.map((doc) => doc.data());
      setDataAbsensi(
        data.sort((a, b) => (parseInt(a.id_pegawai) || 0) - (parseInt(b.id_pegawai) || 0))
      );
    } catch (err) {
      console.error("Gagal ambil data:", err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (rememberMe) localStorage.setItem("savedAdminEmail", email);
      else localStorage.removeItem("savedAdminEmail");
    } catch (err) {
      Swal.fire("Gagal", "Email atau Password Salah!", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setDataAbsensi([]);
  };

  const handleDownloadExcel = () => {
    if (filteredData.length === 0) {
      return Swal.fire("Peringatan", "Tidak ada data untuk diekspor", "warning");
    }
    exportToExcel(filteredData);
  };

  if (isInitialCheck) {
    return (
      <div className="min-h-screen bg-[#8B0000] flex flex-col items-center justify-center p-6 text-center text-white">
        <Loader2 className="animate-spin h-10 w-10 opacity-40" />
      </div>
    );
  }

  if (!user) {
    return (
      <Authentikasi
        email={email} setEmail={setEmail}
        password={password} setPassword={setPassword}
        rememberMe={rememberMe} setRememberMe={setRememberMe}
        handleLogin={handleLogin} loading={loading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-4 font-sans animate-in fade-in duration-700 text-left">
      <div className="max-w-7xl mx-auto">
        <HeaderDashboard
          user={user}
          handleDownloadExcel={handleDownloadExcel}
          handleLogout={handleLogout}
        />

        {/* --- FILTER SECTION --- */}
        <div className="mb-6 flex flex-col md:flex-row items-center gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="bg-orange-50 p-3 rounded-2xl">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                Monitoring WFH
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className="w-3 h-3 text-green-500" />
                <p className={`text-[9px] font-bold uppercase ${serverStatus.includes("Offline") ? "text-orange-500" : "text-green-600"}`}>
                  {serverStatus}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="date"
              value={filterDate}
              className="bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl font-bold text-sm outline-none focus:border-[#8B0000] transition-all text-slate-600 w-full md:w-[200px]"
              onChange={(e) => setFilterDate(e.target.value)}
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate("")}
                className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all shadow-sm"
                title="Tampilkan Semua Jumat"
              >
                <FilterX className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="md:ml-auto flex items-center gap-4">
            <div className="bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-xl flex flex-col items-center min-w-[120px]">
              <span className="text-[18px] font-black leading-none">
                {filteredData.length}
              </span>
              <span className="text-[8px] font-bold uppercase tracking-widest mt-1 opacity-60">
                Pegawai Hadir
              </span>
            </div>
          </div>
        </div>

        <RekapTable
          dataAbsensi={filteredData}
          getHariTanggal={getHariTanggal}
        />
      </div>
    </div>
  );
}

export default Rekap;