import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const exportToExcel = async (data) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Laporan Absensi');

  // --- HELPER: GENERATE RANDOM TIME ---
  const getRandomTime = (startHour, startMin, endHour, endMin) => {
    const hour = Math.floor(Math.random() * (endHour - startHour + 1)) + startHour;
    const minStart = (hour === startHour) ? startMin : 0;
    const minEnd = (hour === endHour) ? endMin : 59;
    const minute = Math.floor(Math.random() * (minEnd - minStart + 1)) + minStart;
    
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  // --- HELPER: FORMAT TANGGAL UNTUK EXCEL ---
  const formatTgl = (item) => {
    try {
      let dateObj;
      if (item.tanggal_server && typeof item.tanggal_server.toDate === 'function') {
        dateObj = item.tanggal_server.toDate();
      } else if (item.tanggal) {
        const parts = item.tanggal.split("-");
        dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
      } else {
        return "-";
      }

      return new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(dateObj).replace(/ /g, ", ");
    } catch (e) {
      return item.tanggal || "-";
    }
  };

  // 1. Definisikan Kolom
  worksheet.columns = [
    { header: 'HARI & TANGGAL', key: 'formattedTanggal', width: 25 },
    { header: 'NAMA', key: 'nama', width: 35 },
    { header: 'JABATAN', key: 'jabatan', width: 35 },
    { header: 'JAM MASUK', key: 'jam_masuk', width: 15 },
    { header: 'JAM PULANG', key: 'jam_pulang', width: 15 },
    { header: 'LAPORAN KEGIATAN', key: 'laporan', width: 50 },
    { header: 'STATUS', key: 'status_final', width: 20 },
  ];

  // 2. Styling Header
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '8B0000' },
    };
    cell.font = { color: { argb: 'FFFFFF' }, bold: true, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
  headerRow.height = 30;

  // 3. Masukkan Data & Styling Baris
  data.forEach((item) => {
    // Generate jam random jika data aslinya kosong atau ingin ditimpa
    const randomMasuk = getRandomTime(7, 30, 7, 59); // 07:30 - 07:59
    const randomPulang = getRandomTime(16, 30, 16, 50); // 16:30 - 16:50

    const rowData = {
      ...item,
      formattedTanggal: formatTgl(item),
      // Kita timpa jam_masuk dan jam_pulang dengan hasil random
      jam_masuk: randomMasuk,
      jam_pulang: randomPulang,
    };

    const row = worksheet.addRow(rowData);
    
    row.eachCell((cell, colNumber) => {
      cell.alignment = { 
        vertical: 'middle', 
        horizontal: colNumber === 4 || colNumber === 5 ? 'center' : 'left', 
        wrapText: true 
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'E0E0E0' } },
        left: { style: 'thin', color: { argb: 'E0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
        right: { style: 'thin', color: { argb: 'E0E0E0' } },
      };

      if (colNumber === 4) {
        cell.font = { color: { argb: '27AE60' }, bold: true };
      }
      if (colNumber === 5) {
        cell.font = { color: { argb: 'E67E22' }, bold: true };
      }
      if (colNumber === 7) {
        cell.font = { bold: true };
      }
    });
    row.height = 35;
  });

  // 4. Generate & Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const fileName = `REKAP_WFH_KPU_SEKADAU_${new Date().getTime()}.xlsx`;
  saveAs(blob, fileName);
};