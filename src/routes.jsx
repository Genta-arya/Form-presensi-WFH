import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Rekap from "./components/Rekap";
import App from "./App";

function Routers() {
  return (
    <Router>
      <Routes>
        {/* Halaman Utama: Form Absensi */}
        <Route path="/" element={<App />} />

        {/* Jika akses ke /rekap, arahkan ke /dashboard */}
        <Route path="/rekap" element={<Navigate to="/dashboard" replace />} />

        {/* Halaman Dashboard (Isinya komponen Rekap) */}
        <Route path="/dashboard" element={<Rekap />} />

        {/* Jika route tidak ditemukan (404), arahkan kembali ke / */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default Routers;