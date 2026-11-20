const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Melayani file statis Frontend PWA
app.use(express.static(path.join(__dirname, '../frontend')));

const motorSaya = {
  nama: "Honda ADV 160",
  plat: "B 4271 MTC",
  tahun: "2024",
  odometer: "18.500 KM",
  gambar_url: "images/motor-adv.png"
};

const profilPengembang = {
  nama: "Ivandra Julio Chrishanto",
  nim: "21120124120034",
  prodi: "S1 Teknik Komputer",
  peran: "Pengembang aplikasi",
  avatar_url: "images/profile.jpg",
  tentang: "Teman perawatan motor Anda. Catat riwayat servis, pantau biaya perawatan, dan temukan informasi suku cadang dalam satu aplikasi PWA yang praktis.",
  versi: "Versi 1.0.0",
  kategori: "Progressive Web App"
};

const riwayat = [
  {
    id: 1,
    jenis_servis: "Ganti Oli Mesin",
    tanggal_servis: "12 Oktober 2026",
    nama_bengkel: "AHASS Bintang Motor",
    total_biaya: "Rp 150.000",
    total_biaya_angka: 150000,
    jarak_tempuh_km: "18.500 KM",
    catatan_mekanik: "Oli mesin diganti dengan SAE 10W-30. Kondisi mesin baik. Lakukan penggantian berikutnya pada 20.500 KM."
  },
  {
    id: 2,
    jenis_servis: "Ganti Ban",
    tanggal_servis: "24 Agustus 2026",
    nama_bengkel: "Planet Ban Semarang",
    total_biaya: "Rp 320.000",
    total_biaya_angka: 320000,
    jarak_tempuh_km: "16.800 KM",
    catatan_mekanik: "Ban belakang diganti baru ukuran 100/80-14 Tubeless. Tekanan angin disetel pada 33 PSI."
  },
  {
    id: 3,
    jenis_servis: "Servis CVT",
    tanggal_servis: "10 Juni 2026",
    nama_bengkel: "AHASS Bintang Motor",
    total_biaya: "Rp 95.000",
    total_biaya_angka: 95000,
    jarak_tempuh_km: "14.200 KM",
    catatan_mekanik: "Pembersihan ruang CVT, pemberian grease ulang pada pulley, roller dan v-belt masih optimal."
  },
  {
    id: 4,
    jenis_servis: "Ganti Kampas Rem",
    tanggal_servis: "18 April 2026",
    nama_bengkel: "Bengkel Motor Sejahtera",
    total_biaya: "Rp 65.000",
    total_biaya_angka: 65000,
    jarak_tempuh_km: "12.000 KM",
    catatan_mekanik: "Kampas rem cakram depan sudah tipis dan diganti baru. Pengereman normal dan pakem."
  }
];

const katalog = [
  {
    id: 1,
    nama_part: "Oli Mesin",
    kategori: "Pelumas",
    subjudul: "Pelumas mesin full synthetic untuk performa optimal.",
    gambar_url: "images/oli-mesin.png",
    spesifikasi_label_1: "Viskositas",
    spesifikasi_nilai_1: "SAE 10W-30",
    spesifikasi_label_2: "Kapasitas",
    spesifikasi_nilai_2: "800 ml • JASO MB",
    harga_min: 55000,
    harga_max: 85000,
    kisaran_harga: "Rp 55.000 – Rp 85.000",
    masa_pakai_optimal: "Ganti rutin setiap 2.000 – 2.500 KM untuk menjaga sirkulasi dan performa mesin."
  },
  {
    id: 2,
    nama_part: "Busi",
    kategori: "Pengapian",
    subjudul: "Pengapian fokus dan stabil untuk efisiensi bahan bakar.",
    gambar_url: "images/busi.png",
    spesifikasi_label_1: "Tipe Elektroda",
    spesifikasi_nilai_1: "Iridium 0.6mm",
    spesifikasi_label_2: "Kode Part",
    spesifikasi_nilai_2: "CPR9EA-9",
    harga_min: 35000,
    harga_max: 95000,
    kisaran_harga: "Rp 35.000 – Rp 95.000",
    masa_pakai_optimal: "Ganti busi setiap 8.000 KM (Standar) atau 15.000 KM (Iridium)."
  },
  {
    id: 3,
    nama_part: "Kampas Rem",
    kategori: "Pengereman",
    subjudul: "Pengereman pakem dan responsif.",
    gambar_url: "images/kampas-rem.png",
    spesifikasi_label_1: "Material",
    spesifikasi_nilai_1: "Non-Asbestos Ceramic",
    spesifikasi_label_2: "Posisi",
    spesifikasi_nilai_2: "Cakram Depan",
    harga_min: 45000,
    harga_max: 75000,
    kisaran_harga: "Rp 45.000 – Rp 75.000",
    masa_pakai_optimal: "Ganti setiap 10.000 – 12.000 KM atau saat ketebalan kampas di bawah 2 mm."
  },
  {
    id: 4,
    nama_part: "Ban Tubeless",
    kategori: "Roda & Ban",
    subjudul: "Grip stabil untuk perjalanan harian.",
    gambar_url: "images/ban.png",
    spesifikasi_label_1: "Ukuran",
    spesifikasi_nilai_1: "100/80-14",
    spesifikasi_label_2: "Tipe",
    spesifikasi_nilai_2: "Tubeless • Belakang",
    harga_min: 250000,
    harga_max: 350000,
    kisaran_harga: "Rp 250.000 – Rp 350.000",
    masa_pakai_optimal: "Usia maksimal ban yang disarankan: 4 tahun. Periksa kondisi tapak secara berkala."
  }
];

// Endpoint Riwayat Servis (List)
app.get('/api/riwayat-servis', (req, res) => {
  res.json(riwayat);
});

// Endpoint Riwayat Servis (Detail)
app.get('/api/riwayat-servis/:id', (req, res) => {
  const item = riwayat.find(r => r.id === parseInt(req.params.id));
  if (item) {
    res.json(item);
  } else {
    res.status(404).json({ message: "Riwayat servis tidak ditemukan" });
  }
});

// Endpoint Katalog Suku Cadang (List dengan dukungan Filter & Sort)
app.get('/api/katalog-part', (req, res) => {
  let hasil = [...katalog];
  const { q, kategori, harga, sort } = req.query;

  // 1. Filter Pencarian Teks
  if (q) {
    const query = q.toLowerCase();
    hasil = hasil.filter(item => 
      item.nama_part.toLowerCase().includes(query) || 
      item.subjudul.toLowerCase().includes(query) ||
      item.kategori.toLowerCase().includes(query)
    );
  }

  // 2. Filter Kategori
  if (kategori && kategori !== 'all' && kategori !== 'semua') {
    hasil = hasil.filter(item => item.kategori.toLowerCase() === kategori.toLowerCase());
  }

  // 3. Filter Rentang Harga
  if (harga === 'under100') {
    hasil = hasil.filter(item => item.harga_min < 100000);
  } else if (harga === 'above100') {
    hasil = hasil.filter(item => item.harga_min >= 100000);
  }

  // 4. Pengurutan (Sort)
  if (sort === 'nama-asc') {
    hasil.sort((a, b) => a.nama_part.localeCompare(b.nama_part));
  } else if (sort === 'nama-desc') {
    hasil.sort((a, b) => b.nama_part.localeCompare(a.nama_part));
  } else if (sort === 'harga-asc') {
    hasil.sort((a, b) => a.harga_min - b.harga_min);
  } else if (sort === 'harga-desc') {
    hasil.sort((a, b) => b.harga_min - a.harga_min);
  }

  res.json(hasil);
});

// Endpoint Katalog Suku Cadang (Detail)
app.get('/api/katalog-part/:id', (req, res) => {
  const item = katalog.find(r => r.id === parseInt(req.params.id));
  if (item) {
    res.json(item);
  } else {
    res.status(404).json({ message: "Suku cadang tidak ditemukan" });
  }
});

// Endpoint Motor Saya
app.get('/api/motor', (req, res) => {
  res.json(motorSaya);
});

// Endpoint Profil Pengembang
app.get('/api/profil', (req, res) => {
  res.json(profilPengembang);
});

app.listen(port, () => {
  console.log(`Backend MotoCare berjalan di http://localhost:${port}`);
});
