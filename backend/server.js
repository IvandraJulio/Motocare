const express = require('express');
const cors = require('cors');
const path = require('path');
try {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
  require('dotenv').config();
} catch (_) {}

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Koneksi Neon Serverless PostgreSQL (otomatis aktif jika DATABASE_URL tersedia)
let sql = null;
let dbInitialized = false;
if (process.env.DATABASE_URL) {
  try {
    const { neon } = require('@neondatabase/serverless');
    sql = neon(process.env.DATABASE_URL);
    console.log('Neon PostgreSQL terdeteksi via DATABASE_URL');
  } catch (err) {
    console.warn('Driver @neondatabase/serverless belum terpasang, memakai memori lokal:', err.message);
  }
}

// Melayani file statis Frontend PWA
app.use(express.static(path.join(__dirname, '../frontend')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

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

// ==========================================
// PENGINGAT SERVIS BERIKUTNYA
// ==========================================
const BULAN = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
const BULAN_LABEL = BULAN.map(b => b[0].toUpperCase() + b.slice(1));

const parseKm = (str) => parseInt(String(str || '').replace(/[^0-9]/g, '')) || 0;
const formatKm = (n) => `${Math.round(n).toLocaleString('id-ID')} KM`;
const parseTanggal = (str) => {
  const m = String(str || '').trim().toLowerCase().match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
  if (!m || BULAN.indexOf(m[2]) === -1) return null;
  return new Date(parseInt(m[3]), BULAN.indexOf(m[2]), parseInt(m[1]));
};
const formatTanggal = (d) => `${d.getDate()} ${BULAN_LABEL[d.getMonth()]} ${d.getFullYear()}`;

// Interval perawatan default (KM & bulan) berdasarkan jenis servis
function defaultInterval(jenis) {
  const j = String(jenis || '').toLowerCase();
  if (j.includes('oli')) return { interval_km: 2000, interval_bulan: 2 };
  if (j.includes('cvt')) return { interval_km: 8000, interval_bulan: 6 };
  if (j.includes('ban')) return { interval_km: 15000, interval_bulan: 24 };
  if (j.includes('rem')) return { interval_km: 10000, interval_bulan: 12 };
  if (j.includes('busi')) return { interval_km: 8000, interval_bulan: 12 };
  if (j.includes('aki')) return { interval_km: 20000, interval_bulan: 24 };
  return { interval_km: 5000, interval_bulan: 6 };
}
riwayat.forEach(r => Object.assign(r, { ...defaultInterval(r.jenis_servis), ...r }));

// Hitung estimasi servis berikutnya berdasarkan KM terakhir + interval (tanpa live odometer)
function enrichRiwayat(item) {
  const kmTerakhir = parseKm(item.jarak_tempuh_km);
  const kmBerikutnya = kmTerakhir + item.interval_km;

  let tanggalBerikutnya = null, sisaHari = null, pctWaktu = 0;
  const tglServis = parseTanggal(item.tanggal_servis);
  if (tglServis) {
    const next = new Date(tglServis);
    next.setMonth(next.getMonth() + item.interval_bulan);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    sisaHari = Math.round((next - today) / 86400000);
    tanggalBerikutnya = formatTanggal(next);
    const total = (next - tglServis) / 86400000;
    pctWaktu = Math.min(100, Math.max(0, ((today - tglServis) / 86400000 / total) * 100));
  }

  const progress = Math.round(pctWaktu);
  let status = 'aman', status_label = 'Terjadwal';
  if (sisaHari !== null && sisaHari < 0) { status = 'terlambat'; status_label = 'Lewat jadwal tanggal'; }
  else if (sisaHari !== null && sisaHari <= 14) { status = 'segera'; status_label = 'Mendekati jadwal'; }

  return {
    ...item,
    pengingat: {
      km_terakhir: formatKm(kmTerakhir),
      km_berikutnya: formatKm(kmBerikutnya),
      selisih_km_label: `+${formatKm(item.interval_km)} dari servis terakhir`,
      tanggal_berikutnya: tanggalBerikutnya,
      sisa_hari: sisaHari,
      sisa_hari_label: sisaHari === null ? '-' : sisaHari >= 0 ? `${sisaHari} hari lagi` : `Lewat ${-sisaHari} hari`,
      interval_label: `Setiap ${formatKm(item.interval_km)} / ${item.interval_bulan} bulan`,
      progress,
      status,
      status_label
    }
  };
}

// Auto-create table & seed di Neon PostgreSQL bila DATABASE_URL aktif
async function ensureDbReady() {
  if (!sql || dbInitialized) return;
  await sql`
    CREATE TABLE IF NOT EXISTS riwayat_servis (
      id SERIAL PRIMARY KEY,
      jenis_servis TEXT NOT NULL,
      tanggal_servis TEXT NOT NULL,
      nama_bengkel TEXT NOT NULL,
      total_biaya TEXT NOT NULL,
      total_biaya_angka INTEGER DEFAULT 0,
      jarak_tempuh_km TEXT NOT NULL,
      catatan_mekanik TEXT NOT NULL,
      interval_km INTEGER DEFAULT 2000,
      interval_bulan INTEGER DEFAULT 2
    )
  `;
  const countRes = await sql`SELECT COUNT(*)::int AS cnt FROM riwayat_servis`;
  if ((countRes[0]?.cnt || 0) === 0) {
    for (const r of riwayat) {
      await sql`
        INSERT INTO riwayat_servis (
          id, jenis_servis, tanggal_servis, nama_bengkel,
          total_biaya, total_biaya_angka, jarak_tempuh_km,
          catatan_mekanik, interval_km, interval_bulan
        ) VALUES (
          ${r.id}, ${r.jenis_servis}, ${r.tanggal_servis}, ${r.nama_bengkel},
          ${r.total_biaya}, ${r.total_biaya_angka}, ${r.jarak_tempuh_km},
          ${r.catatan_mekanik}, ${r.interval_km}, ${r.interval_bulan}
        )
      `;
    }
  }
  dbInitialized = true;
}

// Endpoint Riwayat Servis (List)
app.get('/api/riwayat-servis', async (req, res) => {
  try {
    if (sql) {
      await ensureDbReady();
      const rows = await sql`SELECT * FROM riwayat_servis ORDER BY id ASC`;
      return res.json(rows.map(enrichRiwayat));
    }
  } catch (err) {
    console.warn('Neon DB read error, fallback ke memori:', err.message);
  }
  res.json(riwayat.map(enrichRiwayat));
});

// Endpoint Riwayat Servis (Detail)
app.get('/api/riwayat-servis/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    if (sql) {
      await ensureDbReady();
      const rows = await sql`SELECT * FROM riwayat_servis WHERE id = ${id}`;
      if (rows.length > 0) return res.json(enrichRiwayat(rows[0]));
      return res.status(404).json({ message: "Riwayat servis tidak ditemukan" });
    }
  } catch (err) {
    console.warn('Neon DB detail error, fallback ke memori:', err.message);
  }
  const item = riwayat.find(r => r.id === id);
  if (item) {
    res.json(enrichRiwayat(item));
  } else {
    res.status(404).json({ message: "Riwayat servis tidak ditemukan" });
  }
});

// Endpoint Update Riwayat Servis (PUT & POST)
const handleUpdateRiwayat = async (req, res) => {
  const id = parseInt(req.params.id);
  const body = req.body || {};

  // Update di memori lokal juga
  const index = riwayat.findIndex(r => r.id === id);
  if (index !== -1) {
    ['jenis_servis', 'tanggal_servis', 'nama_bengkel', 'jarak_tempuh_km', 'catatan_mekanik'].forEach(k => {
      if (typeof body[k] === 'string' && body[k].trim() !== '') riwayat[index][k] = body[k].trim();
    });
    if (typeof body.total_biaya === 'string' && body.total_biaya.trim() !== '') {
      riwayat[index].total_biaya = body.total_biaya.trim();
      riwayat[index].total_biaya_angka = parseInt(body.total_biaya.replace(/[^0-9]/g, '')) || 0;
    }
    ['interval_km', 'interval_bulan'].forEach(k => {
      const n = parseInt(String(body[k] ?? '').replace(/[^0-9]/g, ''));
      if (n > 0) riwayat[index][k] = n;
    });
  }

  try {
    if (sql) {
      await ensureDbReady();
      const existing = await sql`SELECT * FROM riwayat_servis WHERE id = ${id}`;
      if (existing.length === 0) {
        return res.status(404).json({ message: "Riwayat servis tidak ditemukan" });
      }
      const cur = existing[0];
      const jenis_servis = (typeof body.jenis_servis === 'string' && body.jenis_servis.trim()) || cur.jenis_servis;
      const tanggal_servis = (typeof body.tanggal_servis === 'string' && body.tanggal_servis.trim()) || cur.tanggal_servis;
      const nama_bengkel = (typeof body.nama_bengkel === 'string' && body.nama_bengkel.trim()) || cur.nama_bengkel;
      const total_biaya = (typeof body.total_biaya === 'string' && body.total_biaya.trim()) || cur.total_biaya;
      const total_biaya_angka = parseInt(String(total_biaya).replace(/[^0-9]/g, '')) || 0;
      const jarak_tempuh_km = (typeof body.jarak_tempuh_km === 'string' && body.jarak_tempuh_km.trim()) || cur.jarak_tempuh_km;
      const catatan_mekanik = (typeof body.catatan_mekanik === 'string' && body.catatan_mekanik.trim()) || cur.catatan_mekanik;
      const interval_km = parseInt(String(body.interval_km ?? '').replace(/[^0-9]/g, '')) || cur.interval_km;
      const interval_bulan = parseInt(String(body.interval_bulan ?? '').replace(/[^0-9]/g, '')) || cur.interval_bulan;

      const updated = await sql`
        UPDATE riwayat_servis
        SET jenis_servis = ${jenis_servis},
            tanggal_servis = ${tanggal_servis},
            nama_bengkel = ${nama_bengkel},
            total_biaya = ${total_biaya},
            total_biaya_angka = ${total_biaya_angka},
            jarak_tempuh_km = ${jarak_tempuh_km},
            catatan_mekanik = ${catatan_mekanik},
            interval_km = ${interval_km},
            interval_bulan = ${interval_bulan}
        WHERE id = ${id}
        RETURNING *
      `;
      return res.json({ message: "Riwayat servis berhasil diperbarui", data: enrichRiwayat(updated[0]) });
    }
  } catch (err) {
    console.warn('Neon DB update error, fallback ke memori:', err.message);
  }

  if (index === -1) {
    return res.status(404).json({ message: "Riwayat servis tidak ditemukan" });
  }
  res.json({ message: "Riwayat servis berhasil diperbarui", data: enrichRiwayat(riwayat[index]) });
};
app.put('/api/riwayat-servis/:id', handleUpdateRiwayat);
app.post('/api/riwayat-servis/:id', handleUpdateRiwayat);

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

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Backend MotoCare berjalan di http://localhost:${port}`);
  });
}

module.exports = app;
