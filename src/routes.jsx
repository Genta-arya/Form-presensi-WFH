import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Rekap from "./components/Rekap";
import App from "./App";

function Routers() {
  return (
    <Router>
      <Routes>
        {/* Halaman Utama: Form Absensi */}
        <Route path="/" element={<App />} />

        {/* Halaman Rekap: Tabel Laporan */}
        <Route path="/rekap" element={<Rekap />} />
      </Routes>
    </Router>
  );
}

export default Routers;
