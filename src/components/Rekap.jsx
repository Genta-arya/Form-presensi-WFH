import { useState, useEffect, useMemo } from "react";
import { auth, db } from "../config/firebase";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { 
  collection, 
  getDocs, 
  setDoc, // Menggunakan setDoc agar ID dokumen bisa ditentukan manual
  updateDoc, 
  deleteDoc, 
  doc, 
} from "firebase/firestore";
import { 
  Loader2, Calendar, FilterX, Clock, 
  Users, ClipboardList, UserPlus, Pencil, Trash2 
} from "lucide-react";
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

  const [activeTab, setActiveTab] = useState("rekap"); 
  const [dataPegawai, setDataPegawai] = useState([]);

  const [filterDate, setFilterDate] = useState("");
  const [serverStatus, setServerStatus] = useState("Sinkronisasi...");

  // --- 1. FUNGSI AMBIL TANGGAL HARI INI ---
  const initTodayFilter = async () => {
    try {
      setServerStatus("Sinkronisasi...");
      const response = await fetch('https://www.timeapi.io/api/Time/current/zone?timeZone=Asia/Jakarta');
      if (!response.ok) throw new Error("API Down");
      const data = await response.json();
      const formattedToday = `${data.year}-${String(data.month).padStart(2, '0')}-${String(data.day).padStart(2, '0')}`;
      setFilterDate(formattedToday);
      setServerStatus("Server Terhubung");
    } catch (err) {
      const d = new Date();
      const formattedDeviceToday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      setFilterDate(formattedDeviceToday);
      setServerStatus("Offline (Jam Lokal)");
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

  const filteredData = useMemo(() => {
    if (!user || dataAbsensi.length === 0) return [];
    return dataAbsensi.filter((item) => {
      const info = getHariTanggal(item);
      if (filterDate) {
        const d = info.rawDate;
        const formattedItemDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return formattedItemDate === filterDate;
      }
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
        fetchPegawai();
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

  // --- LOGIKA CRUD PEGAWAI (FIXED UNDEFINED) ---
  const fetchPegawai = async () => {
    try {
      const snapshot = await getDocs(collection(db, "pegawai"));
      const docs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      // Sort berdasarkan ID (karena ID kamu adalah angka 1, 10, 11 dst)
      const sortedDocs = docs.sort((a, b) => parseInt(a.id) - parseInt(b.id));
      setDataPegawai(sortedDocs);
    } catch (err) {
      console.error("Gagal load pegawai:", err);
    }
  };

  const handleAddPegawai = async () => {
    // Cari angka ID terakhir dari dokumen
    const lastId = dataPegawai.length > 0 
      ? Math.max(...dataPegawai.map(p => parseInt(p.id) || 0)) 
      : 0;
    const nextId = String(lastId + 1);

    const { value: formValues } = await Swal.fire({
      title: 'Tambah Pegawai',
      html:
        `<input id="swal-id" class="swal2-input" placeholder="ID Pegawai" readonly value="${nextId}">` +
        '<input id="swal-nama" class="swal2-input" placeholder="Nama Lengkap">' +
        '<input id="swal-jabatan" class="swal2-input" placeholder="Jabatan">',
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      confirmButtonColor: '#8B0000',
      preConfirm: () => ({
        id: document.getElementById('swal-id').value,
        nama: document.getElementById('swal-nama').value,
        jabatan: document.getElementById('swal-jabatan').value,
      })
    });

    if (formValues?.nama) {
      try {
        // Simpan dengan ID dokumen custom sesuai input (agar lanjut 17, 18, dst)
        await setDoc(doc(db, "pegawai", formValues.id), {
          id_pegawai: formValues.id, // simpan juga di dalam field agar tidak undefined lagi
          nama: formValues.nama,
          jabatan: formValues.jabatan
        });
        fetchPegawai();
        Swal.fire("Berhasil", "Pegawai ditambahkan", "success");
      } catch (err) {
        Swal.fire("Error", "Gagal menyimpan ke Firebase", "error");
      }
    }
  };

  const handleEditPegawai = async (p) => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit Pegawai',
      html:
        `<input id="swal-nama" class="swal2-input" placeholder="Nama" value="${p.nama}">` +
        `<input id="swal-jabatan" class="swal2-input" placeholder="Jabatan" value="${p.jabatan || ''}">`,
      showCancelButton: true,
      preConfirm: () => ({
        nama: document.getElementById('swal-nama').value,
        jabatan: document.getElementById('swal-jabatan').value,
      })
    });
    if (formValues) {
      await updateDoc(doc(db, "pegawai", p.id), formValues);
      fetchPegawai();
      Swal.fire("Berhasil", "Data diperbarui", "success");
    }
  };

  const handleDeletePegawai = async (id) => {
    const res = await Swal.fire({
      title: 'Hapus Pegawai?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Hapus'
    });
    if (res.isConfirmed) {
      await deleteDoc(doc(db, "pegawai", id));
      fetchPegawai();
      Swal.fire("Dihapus", "Data telah dihapus", "success");
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

        {/* --- TAB NAVIGATION --- */}
        <div className="flex gap-2 mb-6 justify-center items-center w-full p-2">
          <button 
            onClick={() => setActiveTab("rekap")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-sm transition-all ${activeTab === 'rekap' ? 'bg-[#8B0000] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <ClipboardList className="w-4 h-4" /> Data Absensi
          </button>
          <button 
            onClick={() => setActiveTab("pegawai")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-sm transition-all ${activeTab === 'pegawai' ? 'bg-[#8B0000] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Users className="w-4 h-4" /> Data Pegawai
          </button>
        </div>

        {activeTab === "rekap" ? (
          <>
            <div className="mb-6 flex flex-col md:flex-row items-center gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
               {/* Logika filter absensi tetap sama */}
               <div className="flex items-center gap-4">
                <div className="bg-orange-50 p-3 rounded-2xl">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Monitoring WFH</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="w-3 h-3 text-green-500" />
                    <p className={`text-[9px] font-bold uppercase ${serverStatus.includes("Offline") ? "text-orange-500" : "text-green-600"}`}>
                      {serverStatus}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <input type="date" value={filterDate} className="bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl font-bold text-sm outline-none focus:border-[#8B0000] transition-all text-slate-600 w-full md:w-[200px]" onChange={(e) => setFilterDate(e.target.value)} />
                {filterDate && ( <button onClick={() => setFilterDate("")} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all shadow-sm"><FilterX className="w-5 h-5" /></button> )}
              </div>
              <div className="md:ml-auto">
                <div className="bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-xl flex flex-col items-center min-w-[120px]">
                  <span className="text-[18px] font-black leading-none">{filteredData.length}</span>
                  <span className="text-[8px] font-bold uppercase tracking-widest mt-1 opacity-60">Pegawai Hadir</span>
                </div>
              </div>
            </div>
            <RekapTable dataAbsensi={filteredData} getHariTanggal={getHariTanggal} />
          </>
        ) : (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-4 px-2">
              <h2 className="font-black text-slate-800 uppercase tracking-tight">Daftar Pegawai</h2>
              <button 
                onClick={handleAddPegawai}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-green-700 transition-all shadow-sm"
              >
                <UserPlus className="w-4 h-4" /> Tambah
              </button>
            </div>
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase">ID</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase">Nama</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase">Jabatan</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {dataPegawai.length > 0 ? (
                    dataPegawai.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Jika id_pegawai tidak ada, tampilkan ID dokumen (p.id) */}
                        <td className="p-5 font-bold text-slate-600">{p.id_pegawai || p.id}</td>
                        <td className="p-5 font-black text-slate-800">{p.nama}</td>
                        <td className="p-5 text-slate-500 text-sm font-medium">{p.jabatan || "-"}</td>
                        <td className="p-5">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => handleEditPegawai(p)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => handleDeletePegawai(p.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="p-10 text-center text-slate-400 font-bold italic">Loading data pegawai...</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Rekap;