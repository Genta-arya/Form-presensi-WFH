import { useState, useEffect, useMemo } from "react";
import { auth, db } from "../config/firebase";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { Mail, Lock, Loader2, Calendar, FilterX } from "lucide-react";
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

  // State untuk filter tanggal dari input type="date"
  const [filterDate, setFilterDate] = useState("");

  const getHariTanggal = (item) => {
    try {
      let dateObj;
      if (
        item.tanggal_server &&
        typeof item.tanggal_server.toDate === "function"
      ) {
        dateObj = item.tanggal_server.toDate();
      } else {
        const parts = item.tanggal.split("-");
        dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
      }

      const hari = new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(
        dateObj,
      );
      const tanggal = new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(dateObj);

      return { hari, tanggal, rawDate: dateObj };
    } catch (e) {
      return { hari: "Data", tanggal: item.tanggal, rawDate: new Date() };
    }
  };

  // --- LOGIKA FILTER: KHUSUS JUMAT & BY DATE ---
  const filteredData = useMemo(() => {
    return dataAbsensi.filter((item) => {
      const info = getHariTanggal(item);

      // 1. Filter Wajib: Hanya hari Jumat
      const isJumat = info.hari.toLowerCase() === "jumat";

      // 2. Filter Opsional: Berdasarkan Date Picker
      let matchesDate = true;
      if (filterDate) {
        const d = info.rawDate;
        // Format YYYY-MM-DD untuk dicocokkan dengan nilai input date
        const formattedItemDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        matchesDate = formattedItemDate === filterDate;
      }

      return isJumat && matchesDate;
    });
  }, [dataAbsensi, filterDate]);

  useEffect(() => {
    const savedEmail = localStorage.getItem("savedAdminEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchData();
      } else {
        setUser(null);
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
        data.sort((a, b) => {
          // 1. Ambil ID Pegawai dan ubah ke angka
          const idA = parseInt(a.id_pegawai) || 0;
          const idB = parseInt(b.id_pegawai) || 0;

          // 2. Sort Ascending (1 - 20)
          // Jika ingin sebaliknya (20 - 1), ganti jadi: return idB - idA;
          return idA - idB;
        }),
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
      if (rememberMe) {
        localStorage.setItem("savedAdminEmail", email);
      } else {
        localStorage.removeItem("savedAdminEmail");
      }
      Swal.fire({
        icon: "success",
        title: "Login Berhasil",
        timer: 1500,
        showConfirmButton: false,
      });
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

  // Export Excel hanya data yang sudah difilter
  const handleDownloadExcel = () => {
    if (filteredData.length === 0) {
      return Swal.fire(
        "Peringatan",
        "Tidak ada data untuk diekspor",
        "warning",
      );
    }
    exportToExcel(filteredData);
  };

  if (isInitialCheck) {
    return (
      <div className="min-h-screen bg-[#8B0000] flex flex-col items-center justify-center p-6 text-center text-white">
        <img
          src="https://www.kpu.go.id/images/1627539868logo-kpu.png"
          className="h-24 w-auto animate-pulse mb-10"
          alt="Logo KPU"
        />
        <Loader2 className="animate-spin h-10 w-10 opacity-40" />
      </div>
    );
  }

  if (!user) {
    return (
      <Authentikasi
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        rememberMe={rememberMe}
        setRememberMe={setRememberMe}
        handleLogin={handleLogin}
        loading={loading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-4 font-sans animate-in fade-in duration-700">
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
                Filter Tanggal WFH
              </p>
              <p className="text-[9px] text-orange-600 font-bold italic mt-1 uppercase">
                Sistem Otomatis: Hanya Hari Jumat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="date"
              value={filterDate}
              className="bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl font-bold text-sm outline-none focus:border-[#8B0000] transition-all text-slate-600 w-full md:w-[200px]"
              onChange={(e) => {
                const selected = e.target.value;
                if (!selected) {
                  setFilterDate("");
                  return;
                }

                // Validasi apakah tanggal yang dipilih adalah hari Jumat
                const dateCheck = new Date(selected);
                if (dateCheck.getDay() !== 5) {
                  // 5 adalah hari Jumat
                  Swal.fire({
                    icon: "warning",
                    title: "Alert",
                    text: "Presensi WFH hanya tersedia untuk hari Jumat. Silakan pilih tanggal yang sesuai.",
                    confirmButtonColor: "#8B0000",
                  });
                  setFilterDate(""); // Reset jika bukan jumat
                } else {
                  setFilterDate(selected); // Set jika benar jumat
                }
              }}
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate("")}
                className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all shadow-sm"
                title="Reset Filter"
              >
                <FilterX className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="md:ml-auto flex items-center gap-4">
            <div className="bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-xl shadow-slate-900/20 flex flex-col items-center">
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
