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
// Limit 10MB agar upload foto motor (base64 data URL) berjalan lancar
app.use(express.json({ limit: '10mb' }));

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

// ==========================================
// DATA AWAL (DEFAULT SEED & FALLBACK)
// ==========================================
const defaultMotors = [
  {
    id: 1,
    nama: "Honda ADV 160",
    plat: "B 4271 MTC",
    tahun: "2024",
    odometer: "18.500 KM",
    tipe_mesin: "160cc eSP+ ABS",
    pajak_stnk: "12 Oktober 2027",
    gambar_url: "images/motor-adv.png"
  },
  {
    id: 2,
    nama: "Honda Vario 160",
    plat: "H 5819 VRO",
    tahun: "2023",
    odometer: "11.200 KM",
    tipe_mesin: "160cc eSP+ CBS",
    pajak_stnk: "20 Mei 2027",
    gambar_url: "images/motor-adv.png"
  }
];

const profilPengembang = {
  nama: "Ivandra Julio Chrishanto",
  nim: "21120124120034",
  prodi: "S1 Teknik Komputer",
  peran: "Pengembang aplikasi",
  avatar_url: "images/profile.jpg",
  tentang: "Teman perawatan motor Anda. Kelola banyak motor di garasi, catat riwayat servis (CRUD), pantau estimasi servis berikutnya, temukan bengkel rekanan, dan lihat katalog suku cadang dalam satu aplikasi PWA.",
  versi: "Versi 2.0.0",
  kategori: "Progressive Web App"
};

const defaultRiwayat = [
  {
    id: 1,
    motor_id: 1,
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
    motor_id: 1,
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
    motor_id: 1,
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
    motor_id: 1,
    jenis_servis: "Ganti Kampas Rem",
    tanggal_servis: "18 April 2026",
    nama_bengkel: "Bengkel Motor Sejahtera",
    total_biaya: "Rp 65.000",
    total_biaya_angka: 65000,
    jarak_tempuh_km: "12.000 KM",
    catatan_mekanik: "Kampas rem cakram depan sudah tipis dan diganti baru. Pengereman normal dan pakem."
  },
  {
    id: 5,
    motor_id: 2,
    jenis_servis: "Ganti Oli Mesin",
    tanggal_servis: "05 November 2026",
    nama_bengkel: "AHASS Bintang Motor",
    total_biaya: "Rp 115.000",
    total_biaya_angka: 115000,
    jarak_tempuh_km: "11.200 KM",
    catatan_mekanik: "Penggantian oli mesin SPX2 dan oli gardan Vario 160. Tarikan halus dan suara transmisi senyap."
  },
  {
    id: 6,
    motor_id: 2,
    jenis_servis: "Servis CVT",
    tanggal_servis: "14 Juli 2026",
    nama_bengkel: "Garage Matic & CVT Specialist",
    total_biaya: "Rp 135.000",
    total_biaya_angka: 135000,
    jarak_tempuh_km: "8.500 KM",
    catatan_mekanik: "Pembersihan ruang CVT dari debu dan penggantian filter udara baru. Roller masih layak pakai."
  }
];

// Template 4 jenis servis dasar ketika motor baru dibuat
function buildInitialServisForMotor(motorId, odometerStr, tahunStr) {
  const baseKm = parseKm(odometerStr) || 2000;
  const tgl = `10 Oktober ${tahunStr || '2026'}`;
  return [
    {
      motor_id: motorId,
      jenis_servis: "Ganti Oli Mesin",
      tanggal_servis: tgl,
      nama_bengkel: "AHASS Bintang Motor",
      total_biaya: "Rp 120.000",
      total_biaya_angka: 120000,
      jarak_tempuh_km: formatKm(baseKm),
      interval_km: 2000,
      interval_bulan: 2,
      catatan_mekanik: "Penggantian oli mesin rutin. Mesin halus dan suhu kerja stabil."
    },
    {
      motor_id: motorId,
      jenis_servis: "Servis CVT",
      tanggal_servis: tgl,
      nama_bengkel: "Garage Matic & CVT Specialist",
      total_biaya: "Rp 90.000",
      total_biaya_angka: 90000,
      jarak_tempuh_km: formatKm(Math.max(0, baseKm - 1000)),
      interval_km: 8000,
      interval_bulan: 6,
      catatan_mekanik: "Pengecekan dan pembersihan komponen penggerak/transmisi."
    },
    {
      motor_id: motorId,
      jenis_servis: "Ganti Kampas Rem",
      tanggal_servis: tgl,
      nama_bengkel: "Bengkel Motor Sejahtera",
      total_biaya: "Rp 65.000",
      total_biaya_angka: 65000,
      jarak_tempuh_km: formatKm(Math.max(0, baseKm - 2000)),
      interval_km: 10000,
      interval_bulan: 12,
      catatan_mekanik: "Kampas rem depan & belakang dicek, daya pengereman pakem."
    },
    {
      motor_id: motorId,
      jenis_servis: "Ganti Ban",
      tanggal_servis: tgl,
      nama_bengkel: "Planet Ban Semarang",
      total_biaya: "Rp 310.000",
      total_biaya_angka: 310000,
      jarak_tempuh_km: formatKm(Math.max(0, baseKm - 3000)),
      interval_km: 15000,
      interval_bulan: 24,
      catatan_mekanik: "Kondisi alur ban tebal dan tekanan udara nitrogen sesuai standar."
    }
  ];
}

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

const bengkelList = [
  {
    id: 1,
    nama_bengkel: "AHASS Bintang Motor",
    kategori: "Bengkel Resmi",
    rating: "4.9",
    ulasan: 128,
    jam_buka: "08.00 – 17.00 WIB",
    alamat: "Jl. Setiabudi No. 114, Banyumanik, Semarang",
    telepon: "0812-3456-7890",
    layanan_utama: "Servis Berkala, Oli HGP, Injeksi & Klaim Garansi",
    kisaran_jasa: "Rp 45.000 – Rp 120.000",
    keunggulan: "Bengkel resmi Honda AHASS dengan mekanik tersertifikasi, ruang tunggu ber-AC, dan jaminan suku cadang asli Honda Genuine Parts (HGP)."
  },
  {
    id: 2,
    nama_bengkel: "Planet Ban Semarang",
    kategori: "Spesialis Ban & Oli",
    rating: "4.8",
    ulasan: 96,
    jam_buka: "09.00 – 20.00 WIB",
    alamat: "Jl. Sirojudin No. 28, Tembalang, Semarang",
    telepon: "0813-9876-5432",
    layanan_utama: "Ban Tubeless, Nitrogen, Oli X-Ten, Kampas Rem",
    kisaran_jasa: "Gratis Pasang Ban – Rp 35.000",
    keunggulan: "Spesialis ban motor tubeless lengkap (Michelin, Pirelli, Maxxis, FDR) dengan alat tire changer otomatis tanpa membuat lecet velg."
  },
  {
    id: 3,
    nama_bengkel: "Garage Matic & CVT Specialist",
    kategori: "Spesialis CVT",
    rating: "4.8",
    ulasan: 84,
    jam_buka: "09.30 – 18.00 WIB",
    alamat: "Jl. Ngesrep Timur V No. 42, Banyumanik, Semarang",
    telepon: "0857-1122-3344",
    layanan_utama: "Servis CVT Anti Gredek, Upgrade Pulley, V-Belt & Roller",
    kisaran_jasa: "Rp 50.000 – Rp 150.000",
    keunggulan: "Spesialis perawatan transmisi CVT motor matic 150cc–160cc untuk mengatasi tarikan awal gredek dan menjaga performa akselerasi."
  },
  {
    id: 4,
    nama_bengkel: "Bengkel Motor Sejahtera",
    kategori: "Bengkel Umum",
    rating: "4.7",
    ulasan: 65,
    jam_buka: "08.00 – 21.00 WIB",
    alamat: "Jl. Banjarsari Selatan No. 19, Tembalang, Semarang",
    telepon: "0821-4455-6677",
    layanan_utama: "Servis Rem Cakram, Kelistrikan, Aki & Tune Up Harian",
    kisaran_jasa: "Rp 25.000 – Rp 85.000",
    keunggulan: "Bengkel umum terpercaya yang buka hingga malam hari. Cocok untuk ganti kampas rem mendadak, kuras minyak rem, maupun cek aki."
  }
];

// ==========================================
// PENGINGAT SERVIS BERIKUTNYA
// ==========================================
const BULAN = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
const BULAN_LABEL = BULAN.map(b => b[0].toUpperCase() + b.slice(1));

const parseKm = (str) => parseInt(String(str || '').replace(/[^0-9]/g, '')) || 0;
const formatKm = (n) => `${Math.round(n).toLocaleString('id-ID')} KM`;
const formatRupiah = (n) => `Rp ${(parseInt(n) || 0).toLocaleString('id-ID')}`;
const parseTanggal = (str) => {
  const m = String(str || '').trim().toLowerCase().match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
  if (!m || BULAN.indexOf(m[2]) === -1) return null;
  return new Date(parseInt(m[3]), BULAN.indexOf(m[2]), parseInt(m[1]));
};
const formatTanggal = (d) => `${d.getDate()} ${BULAN_LABEL[d.getMonth()]} ${d.getFullYear()}`;

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

defaultRiwayat.forEach(r => Object.assign(r, { ...defaultInterval(r.jenis_servis), ...r }));

// ==========================================
// BACKEND IN-MEMORY CACHE LAYER (ANTI-DELAY)
// ==========================================
const backendCache = {
  motors: [...defaultMotors],
  riwayat: [...defaultRiwayat],
  hydratedFromDb: false,
  lastSyncedAt: 0,
  ttlMs: 60 * 1000,
  syncPromise: null
};

// X-Cache: HIT menunjukkan data disajikan instan dari RAM cache backend,
// sedangkan Cache-Control: no-store memastikan browser selalu mendapat state terbaru setelah POST/PUT/DELETE
function sendWithCacheHeader(res, payload, hit = true) {
  res.setHeader('X-Cache', hit ? 'HIT' : 'MISS');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  return res.json(payload);
}

function enrichRiwayat(item) {
  const def = defaultInterval(item.jenis_servis);
  const intervalKm = parseInt(item.interval_km) || def.interval_km;
  const intervalBulan = parseInt(item.interval_bulan) || def.interval_bulan;
  const kmTerakhir = parseKm(item.jarak_tempuh_km);
  const kmBerikutnya = kmTerakhir + intervalKm;

  let tanggalBerikutnya = null, sisaHari = null, pctWaktu = 0;
  const tglServis = parseTanggal(item.tanggal_servis);
  if (tglServis) {
    const next = new Date(tglServis);
    next.setMonth(next.getMonth() + intervalBulan);
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

  const motor = backendCache.motors.find(m => m.id === parseInt(item.motor_id)) || backendCache.motors[0];

  return {
    ...item,
    motor_id: parseInt(item.motor_id) || 1,
    motor_nama: motor ? motor.nama : 'Honda ADV 160',
    motor_plat: motor ? motor.plat : 'B 4271 MTC',
    interval_km: intervalKm,
    interval_bulan: intervalBulan,
    pengingat: {
      km_terakhir: formatKm(kmTerakhir),
      km_berikutnya: formatKm(kmBerikutnya),
      selisih_km_label: `+${formatKm(intervalKm)} dari servis terakhir`,
      tanggal_berikutnya: tanggalBerikutnya,
      sisa_hari: sisaHari,
      sisa_hari_label: sisaHari === null ? '-' : sisaHari >= 0 ? `${sisaHari} hari lagi` : `Lewat ${-sisaHari} hari`,
      interval_label: `Setiap ${formatKm(intervalKm)} / ${intervalBulan} bulan`,
      progress,
      status,
      status_label
    }
  };
}

function enrichMotor(motor) {
  const listServis = backendCache.riwayat
    .filter(r => parseInt(r.motor_id || 1) === parseInt(motor.id))
    .map(enrichRiwayat);
  const totalBiayaAngka = listServis.reduce((acc, r) => acc + (parseInt(r.total_biaya_angka) || parseKm(r.total_biaya)), 0);
  const maxKm = listServis.reduce((max, r) => Math.max(max, parseKm(r.jarak_tempuh_km)), parseKm(motor.odometer));
  const servisTerakhir = listServis[0] || null;

  return {
    ...motor,
    odometer: maxKm > 0 ? formatKm(maxKm) : (motor.odometer || '0 KM'),
    jumlah_servis: listServis.length,
    total_biaya_servis: formatRupiah(totalBiayaAngka),
    total_biaya_angka: totalBiayaAngka,
    servis_terakhir: servisTerakhir ? `${servisTerakhir.jenis_servis} (${servisTerakhir.tanggal_servis})` : 'Belum ada catatan servis'
  };
}

async function ensureMotorHasInitialServis(motor) {
  // Normalisasi nama jenis servis lama pada motor_id=2 bila ada
  for (const r of backendCache.riwayat) {
    if (parseInt(r.motor_id || 1) === parseInt(motor.id)) {
      if (r.jenis_servis === 'Ganti Oli & Gear Oil') {
        r.jenis_servis = 'Ganti Oli Mesin';
        if (sql) await sql`UPDATE riwayat_servis SET jenis_servis = 'Ganti Oli Mesin' WHERE id = ${r.id}`.catch(() => {});
      } else if (r.jenis_servis === 'Servis CVT & Filter Udara') {
        r.jenis_servis = 'Servis CVT';
        if (sql) await sql`UPDATE riwayat_servis SET jenis_servis = 'Servis CVT' WHERE id = ${r.id}`.catch(() => {});
      }
    }
  }

  const existing = backendCache.riwayat.filter(r => parseInt(r.motor_id || 1) === parseInt(motor.id));
  const existingTypes = new Set(existing.map(r => String(r.jenis_servis || '').toLowerCase().trim()));
  const templates = buildInitialServisForMotor(motor.id, motor.odometer, motor.tahun);

  for (const t of templates) {
    if (existingTypes.has(t.jenis_servis.toLowerCase())) continue;
    let created = {
      id: backendCache.riwayat.reduce((max, r) => Math.max(max, r.id), 0) + 1,
      ...t
    };
    try {
      if (sql) {
        const ins = await sql`
          INSERT INTO riwayat_servis (
            motor_id, jenis_servis, tanggal_servis, nama_bengkel,
            total_biaya, total_biaya_angka, jarak_tempuh_km,
            catatan_mekanik, interval_km, interval_bulan
          ) VALUES (
            ${t.motor_id}, ${t.jenis_servis}, ${t.tanggal_servis}, ${t.nama_bengkel},
            ${t.total_biaya}, ${t.total_biaya_angka}, ${t.jarak_tempuh_km},
            ${t.catatan_mekanik}, ${t.interval_km}, ${t.interval_bulan}
          )
          RETURNING *
        `;
        if (ins[0]) created = ins[0];
      }
    } catch (err) {
      console.warn('Seed initial servis motor warning:', err.message);
    }
    backendCache.riwayat.push(created);
  }
}

// Inisialisasi & Sinkronisasi Database Neon PostgreSQL ke In-Memory Cache
async function syncFromNeonDb(force = false) {
  if (!sql) return false;
  const now = Date.now();
  if (backendCache.hydratedFromDb && !force && (now - backendCache.lastSyncedAt < backendCache.ttlMs)) {
    return true;
  }
  if (backendCache.syncPromise) return backendCache.syncPromise;

  backendCache.syncPromise = (async () => {
    try {
      if (!dbInitialized) {
        await sql`
          CREATE TABLE IF NOT EXISTS motors (
            id SERIAL PRIMARY KEY,
            nama TEXT NOT NULL,
            plat TEXT NOT NULL,
            tahun TEXT NOT NULL,
            odometer TEXT NOT NULL,
            tipe_mesin TEXT DEFAULT '160cc eSP+ Matic',
            pajak_stnk TEXT DEFAULT '12 Oktober 2027',
            gambar_url TEXT DEFAULT 'images/motor-adv.png'
          )
        `;
        await sql`
          CREATE TABLE IF NOT EXISTS riwayat_servis (
            id SERIAL PRIMARY KEY,
            motor_id INTEGER DEFAULT 1,
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
        await sql`ALTER TABLE riwayat_servis ADD COLUMN IF NOT EXISTS motor_id INTEGER DEFAULT 1`;
        await sql`SELECT setval('motors_id_seq', (SELECT COALESCE(MAX(id), 1) FROM motors))`;
        await sql`SELECT setval('riwayat_servis_id_seq', (SELECT COALESCE(MAX(id), 1) FROM riwayat_servis))`;

        const mCount = await sql`SELECT COUNT(*)::int AS cnt FROM motors`;
        if ((mCount[0]?.cnt || 0) === 0) {
          for (const m of defaultMotors) {
            await sql`
              INSERT INTO motors (id, nama, plat, tahun, odometer, tipe_mesin, pajak_stnk, gambar_url)
              VALUES (${m.id}, ${m.nama}, ${m.plat}, ${m.tahun}, ${m.odometer}, ${m.tipe_mesin}, ${m.pajak_stnk}, ${m.gambar_url})
            `;
          }
          await sql`SELECT setval('motors_id_seq', (SELECT COALESCE(MAX(id), 1) FROM motors))`;
        }

        const rCount = await sql`SELECT COUNT(*)::int AS cnt FROM riwayat_servis`;
        if ((rCount[0]?.cnt || 0) === 0) {
          for (const r of defaultRiwayat) {
            await sql`
              INSERT INTO riwayat_servis (
                id, motor_id, jenis_servis, tanggal_servis, nama_bengkel,
                total_biaya, total_biaya_angka, jarak_tempuh_km,
                catatan_mekanik, interval_km, interval_bulan
              ) VALUES (
                ${r.id}, ${r.motor_id}, ${r.jenis_servis}, ${r.tanggal_servis}, ${r.nama_bengkel},
                ${r.total_biaya}, ${r.total_biaya_angka}, ${r.jarak_tempuh_km},
                ${r.catatan_mekanik}, ${r.interval_km}, ${r.interval_bulan}
              )
            `;
          }
          await sql`SELECT setval('riwayat_servis_id_seq', (SELECT COALESCE(MAX(id), 1) FROM riwayat_servis))`;
        }
        dbInitialized = true;
      }

      const [dbMotors, dbRiwayat] = await Promise.all([
        sql`SELECT * FROM motors ORDER BY id ASC`,
        sql`SELECT * FROM riwayat_servis ORDER BY id DESC`
      ]);

      if (dbMotors.length > 0) backendCache.motors = dbMotors;
      backendCache.riwayat = dbRiwayat;

      // Pastikan setiap motor yang ada di garasi punya minimal data jenis servis awal
      for (const m of backendCache.motors) {
        await ensureMotorHasInitialServis(m);
      }

      backendCache.hydratedFromDb = true;
      backendCache.lastSyncedAt = Date.now();
      return true;
    } catch (err) {
      console.warn('Neon DB sync warning (memakai cache memori):', err.message);
      return false;
    } finally {
      backendCache.syncPromise = null;
    }
  })();

  return backendCache.syncPromise;
}

syncFromNeonDb(true);

async function ensureCachePopulated() {
  if (backendCache.hydratedFromDb) {
    if (Date.now() - backendCache.lastSyncedAt > backendCache.ttlMs) {
      syncFromNeonDb(true);
    }
    return true;
  }
  await syncFromNeonDb(true);
  return false;
}

// ==========================================
// ENDPOINT 1: GARASI & MULTI-MOTOR (/api/motor)
// ==========================================
app.get('/api/motor', async (req, res) => {
  const wasHit = await ensureCachePopulated();
  const list = backendCache.motors.map(enrichMotor);
  return sendWithCacheHeader(res, list, wasHit);
});

app.get('/api/motor/:id', async (req, res) => {
  const wasHit = await ensureCachePopulated();
  const id = parseInt(req.params.id);
  const motor = backendCache.motors.find(m => m.id === id);
  if (!motor) return res.status(404).json({ message: "Motor tidak ditemukan" });
  const enriched = enrichMotor(motor);
  const riwayatMotor = backendCache.riwayat
    .filter(r => parseInt(r.motor_id || 1) === id)
    .sort((a, b) => b.id - a.id)
    .map(enrichRiwayat);
  return sendWithCacheHeader(res, { ...enriched, riwayat: riwayatMotor }, wasHit);
});

// Tambah Motor Baru (CREATE) + dukung foto custom (base64 / URL) & auto-seed 4 jenis servis dasar
app.post('/api/motor', async (req, res) => {
  await ensureCachePopulated();
  const body = req.body || {};
  const nama = String(body.nama || '').trim();
  const plat = String(body.plat || '').trim().toUpperCase();
  const tahun = String(body.tahun || '2024').trim();
  const odometerRaw = parseKm(body.odometer || '0');
  const odometer = formatKm(odometerRaw);
  const tipe_mesin = String(body.tipe_mesin || '160cc eSP+ Matic').trim();
  const pajak_stnk = String(body.pajak_stnk || '12 Oktober 2027').trim();
  const gambar_url = String(body.gambar_url || '').trim() || 'images/motor-adv.png';

  if (!nama || !plat) {
    return res.status(400).json({ message: "Nama motor dan plat nomor wajib diisi" });
  }

  let newMotor = {
    id: backendCache.motors.reduce((max, m) => Math.max(max, m.id), 0) + 1,
    nama,
    plat,
    tahun,
    odometer,
    tipe_mesin,
    pajak_stnk,
    gambar_url
  };

  try {
    if (sql) {
      await sql`SELECT setval('motors_id_seq', (SELECT COALESCE(MAX(id), 1) FROM motors))`;
      const inserted = await sql`
        INSERT INTO motors (nama, plat, tahun, odometer, tipe_mesin, pajak_stnk, gambar_url)
        VALUES (${nama}, ${plat}, ${tahun}, ${odometer}, ${tipe_mesin}, ${pajak_stnk}, ${gambar_url})
        RETURNING *
      `;
      if (inserted[0]) newMotor = inserted[0];
    }
  } catch (err) {
    console.warn('Neon DB insert motor fallback ke cache:', err.message);
  }

  backendCache.motors.push(newMotor);
  await ensureMotorHasInitialServis(newMotor);
  backendCache.lastSyncedAt = Date.now();
  res.status(201).json({ message: "Motor baru berhasil ditambahkan ke garasi", data: enrichMotor(newMotor) });
});

// Update Data / Foto Motor (PUT /api/motor/:id)
app.put('/api/motor/:id', async (req, res) => {
  await ensureCachePopulated();
  const id = parseInt(req.params.id);
  const idx = backendCache.motors.findIndex(m => m.id === id);
  if (idx === -1) return res.status(404).json({ message: "Motor tidak ditemukan" });

  const body = req.body || {};
  const cur = backendCache.motors[idx];
  const updated = {
    ...cur,
    nama: (typeof body.nama === 'string' && body.nama.trim()) || cur.nama,
    plat: (typeof body.plat === 'string' && body.plat.trim().toUpperCase()) || cur.plat,
    tahun: (typeof body.tahun === 'string' && body.tahun.trim()) || cur.tahun,
    odometer: (typeof body.odometer === 'string' && body.odometer.trim()) ? formatKm(parseKm(body.odometer)) : cur.odometer,
    tipe_mesin: (typeof body.tipe_mesin === 'string' && body.tipe_mesin.trim()) || cur.tipe_mesin,
    pajak_stnk: (typeof body.pajak_stnk === 'string' && body.pajak_stnk.trim()) || cur.pajak_stnk,
    gambar_url: (typeof body.gambar_url === 'string' && body.gambar_url.trim()) || cur.gambar_url
  };

  backendCache.motors[idx] = updated;
  backendCache.lastSyncedAt = Date.now();

  try {
    if (sql) {
      await sql`
        UPDATE motors
        SET nama = ${updated.nama},
            plat = ${updated.plat},
            tahun = ${updated.tahun},
            odometer = ${updated.odometer},
            tipe_mesin = ${updated.tipe_mesin},
            pajak_stnk = ${updated.pajak_stnk},
            gambar_url = ${updated.gambar_url}
        WHERE id = ${id}
      `;
    }
  } catch (err) {
    console.warn('Neon DB update motor warning:', err.message);
  }

  res.json({ message: "Data motor berhasil diperbarui", data: enrichMotor(updated) });
});

// Hapus Motor (DELETE)
app.delete('/api/motor/:id', async (req, res) => {
  await ensureCachePopulated();
  const id = parseInt(req.params.id);
  if (backendCache.motors.length <= 1) {
    return res.status(400).json({ message: "Minimal harus ada 1 motor aktif di dalam garasi" });
  }
  const index = backendCache.motors.findIndex(m => m.id === id);
  if (index === -1) {
    return res.status(404).json({ message: "Motor tidak ditemukan" });
  }

  const deletedMotor = backendCache.motors[index];
  backendCache.motors.splice(index, 1);
  backendCache.riwayat = backendCache.riwayat.filter(r => parseInt(r.motor_id || 1) !== id);
  backendCache.lastSyncedAt = Date.now();

  try {
    if (sql) {
      await sql`DELETE FROM riwayat_servis WHERE motor_id = ${id}`;
      await sql`DELETE FROM motors WHERE id = ${id}`;
    }
  } catch (err) {
    console.warn('Neon DB delete motor warning:', err.message);
  }

  res.json({ message: `${deletedMotor.nama} berhasil dihapus dari garasi`, data: deletedMotor });
});

// ==========================================
// ENDPOINT 2: RIWAYAT SERVIS CRUD (/api/riwayat-servis)
// ==========================================
app.get('/api/riwayat-servis', async (req, res) => {
  const wasHit = await ensureCachePopulated();
  const { motor_id } = req.query;
  let rows = [...backendCache.riwayat];
  if (motor_id) {
    rows = rows.filter(r => parseInt(r.motor_id || 1) === parseInt(motor_id));
  }
  rows.sort((a, b) => parseKm(b.jarak_tempuh_km) - parseKm(a.jarak_tempuh_km) || b.id - a.id);

  // Kelompokkan per (motor_id + jenis_servis) supaya halaman utama menampilkan item terbaru per kategori
  // dan di dalamnya menyimpan total_history
  const groupedMap = new Map();
  for (const r of rows) {
    const key = `${r.motor_id || 1}::${String(r.jenis_servis || '').toLowerCase().trim()}`;
    if (!groupedMap.has(key)) {
      groupedMap.set(key, { latest: r, count: 1 });
    } else {
      groupedMap.get(key).count += 1;
    }
  }

  const result = Array.from(groupedMap.values()).map(({ latest, count }) => ({
    ...enrichRiwayat(latest),
    jumlah_history: count
  }));

  return sendWithCacheHeader(res, result, wasHit);
});

app.get('/api/riwayat-servis/:id', async (req, res) => {
  const wasHit = await ensureCachePopulated();
  const id = parseInt(req.params.id);
  const item = backendCache.riwayat.find(r => r.id === id);
  if (!item) return res.status(404).json({ message: "Riwayat servis tidak ditemukan" });

  // Ambil seluruh history untuk jenis_servis & motor_id yang sama (diurutkan dari KM/ID terbaru)
  const sameCategoryRows = backendCache.riwayat
    .filter(r =>
      parseInt(r.motor_id || 1) === parseInt(item.motor_id || 1) &&
      String(r.jenis_servis || '').toLowerCase().trim() === String(item.jenis_servis || '').toLowerCase().trim()
    )
    .sort((a, b) => parseKm(b.jarak_tempuh_km) - parseKm(a.jarak_tempuh_km) || b.id - a.id)
    .map(enrichRiwayat);

  const primary = sameCategoryRows.find(r => r.id === id) || enrichRiwayat(item);
  return sendWithCacheHeader(res, {
    ...primary,
    jumlah_history: sameCategoryRows.length,
    history_list: sameCategoryRows
  }, wasHit);
});

// CREATE Riwayat Servis Baru di dalam halaman Detail Riwayat (POST /api/riwayat-servis)
app.post('/api/riwayat-servis', async (req, res) => {
  await ensureCachePopulated();
  const body = req.body || {};
  const motor_id = parseInt(body.motor_id) || (backendCache.motors[0]?.id || 1);
  const jenis_servis = String(body.jenis_servis || '').trim();
  const tanggal_servis = String(body.tanggal_servis || '').trim();
  const nama_bengkel = String(body.nama_bengkel || '').trim();
  const total_biaya_angka = parseInt(String(body.total_biaya || '0').replace(/[^0-9]/g, '')) || 0;
  const total_biaya = String(body.total_biaya || '').trim().startsWith('Rp')
    ? String(body.total_biaya).trim()
    : formatRupiah(total_biaya_angka);
  const kmNum = parseKm(body.jarak_tempuh_km || '0');
  const jarak_tempuh_km = formatKm(kmNum);
  const catatan_mekanik = String(body.catatan_mekanik || 'Servis rutin selesai dilakukan, kondisi komponen berfungsi normal.').trim();
  const defInt = defaultInterval(jenis_servis);
  const interval_km = parseInt(String(body.interval_km ?? '').replace(/[^0-9]/g, '')) || defInt.interval_km;
  const interval_bulan = parseInt(String(body.interval_bulan ?? '').replace(/[^0-9]/g, '')) || defInt.interval_bulan;

  if (!jenis_servis || !tanggal_servis || !nama_bengkel) {
    return res.status(400).json({ message: "Jenis servis, tanggal, dan nama bengkel wajib diisi" });
  }

  let newItem = {
    id: backendCache.riwayat.reduce((max, r) => Math.max(max, r.id), 0) + 1,
    motor_id,
    jenis_servis,
    tanggal_servis,
    nama_bengkel,
    total_biaya,
    total_biaya_angka,
    jarak_tempuh_km,
    catatan_mekanik,
    interval_km,
    interval_bulan
  };

  try {
    if (sql) {
      await sql`SELECT setval('riwayat_servis_id_seq', (SELECT COALESCE(MAX(id), 1) FROM riwayat_servis))`;
      const inserted = await sql`
        INSERT INTO riwayat_servis (
          motor_id, jenis_servis, tanggal_servis, nama_bengkel,
          total_biaya, total_biaya_angka, jarak_tempuh_km,
          catatan_mekanik, interval_km, interval_bulan
        ) VALUES (
          ${motor_id}, ${jenis_servis}, ${tanggal_servis}, ${nama_bengkel},
          ${total_biaya}, ${total_biaya_angka}, ${jarak_tempuh_km},
          ${catatan_mekanik}, ${interval_km}, ${interval_bulan}
        )
        RETURNING *
      `;
      if (inserted[0]) newItem = inserted[0];
    }
  } catch (err) {
    console.warn('Neon DB insert riwayat fallback ke cache:', err.message);
  }

  backendCache.riwayat.unshift(newItem);

  const motorIdx = backendCache.motors.findIndex(m => m.id === motor_id);
  if (motorIdx !== -1 && kmNum > parseKm(backendCache.motors[motorIdx].odometer)) {
    backendCache.motors[motorIdx].odometer = jarak_tempuh_km;
    if (sql) {
      sql`UPDATE motors SET odometer = ${jarak_tempuh_km} WHERE id = ${motor_id}`.catch(() => {});
    }
  }

  backendCache.lastSyncedAt = Date.now();
  res.status(201).json({ message: "Catatan riwayat servis berhasil ditambahkan", data: enrichRiwayat(newItem) });
});

// UPDATE Riwayat Servis (PUT & POST /api/riwayat-servis/:id)
const handleUpdateRiwayat = async (req, res) => {
  await ensureCachePopulated();
  const id = parseInt(req.params.id);
  const body = req.body || {};

  const index = backendCache.riwayat.findIndex(r => r.id === id);
  if (index === -1) {
    return res.status(404).json({ message: "Riwayat servis tidak ditemukan" });
  }

  const cur = backendCache.riwayat[index];
  const motor_id = parseInt(body.motor_id) || parseInt(cur.motor_id) || 1;
  const jenis_servis = (typeof body.jenis_servis === 'string' && body.jenis_servis.trim()) || cur.jenis_servis;
  const tanggal_servis = (typeof body.tanggal_servis === 'string' && body.tanggal_servis.trim()) || cur.tanggal_servis;
  const nama_bengkel = (typeof body.nama_bengkel === 'string' && body.nama_bengkel.trim()) || cur.nama_bengkel;
  const total_biaya_raw = (typeof body.total_biaya === 'string' && body.total_biaya.trim()) || cur.total_biaya;
  const total_biaya_angka = parseInt(String(total_biaya_raw).replace(/[^0-9]/g, '')) || 0;
  const total_biaya = total_biaya_raw.startsWith('Rp') ? total_biaya_raw : formatRupiah(total_biaya_angka);
  const jarak_tempuh_km = (typeof body.jarak_tempuh_km === 'string' && body.jarak_tempuh_km.trim())
    ? formatKm(parseKm(body.jarak_tempuh_km))
    : cur.jarak_tempuh_km;
  const catatan_mekanik = (typeof body.catatan_mekanik === 'string' && body.catatan_mekanik.trim()) || cur.catatan_mekanik;
  const interval_km = parseInt(String(body.interval_km ?? '').replace(/[^0-9]/g, '')) || cur.interval_km || 2000;
  const interval_bulan = parseInt(String(body.interval_bulan ?? '').replace(/[^0-9]/g, '')) || cur.interval_bulan || 2;

  const updatedObj = {
    ...cur,
    id,
    motor_id,
    jenis_servis,
    tanggal_servis,
    nama_bengkel,
    total_biaya,
    total_biaya_angka,
    jarak_tempuh_km,
    catatan_mekanik,
    interval_km,
    interval_bulan
  };

  backendCache.riwayat[index] = updatedObj;
  backendCache.lastSyncedAt = Date.now();

  try {
    if (sql) {
      await sql`
        UPDATE riwayat_servis
        SET motor_id = ${motor_id},
            jenis_servis = ${jenis_servis},
            tanggal_servis = ${tanggal_servis},
            nama_bengkel = ${nama_bengkel},
            total_biaya = ${total_biaya},
            total_biaya_angka = ${total_biaya_angka},
            jarak_tempuh_km = ${jarak_tempuh_km},
            catatan_mekanik = ${catatan_mekanik},
            interval_km = ${interval_km},
            interval_bulan = ${interval_bulan}
        WHERE id = ${id}
      `;
    }
  } catch (err) {
    console.warn('Neon DB update warning:', err.message);
  }

  res.json({ message: "Riwayat servis berhasil diperbarui", data: enrichRiwayat(updatedObj) });
};
app.put('/api/riwayat-servis/:id', handleUpdateRiwayat);
app.post('/api/riwayat-servis/:id', handleUpdateRiwayat);

// DELETE Riwayat Servis (DELETE /api/riwayat-servis/:id)
app.delete('/api/riwayat-servis/:id', async (req, res) => {
  await ensureCachePopulated();
  const id = parseInt(req.params.id);
  const index = backendCache.riwayat.findIndex(r => r.id === id);
  if (index === -1) {
    return res.status(404).json({ message: "Riwayat servis tidak ditemukan" });
  }

  const removed = backendCache.riwayat.splice(index, 1)[0];
  backendCache.lastSyncedAt = Date.now();

  try {
    if (sql) {
      await sql`DELETE FROM riwayat_servis WHERE id = ${id}`;
    }
  } catch (err) {
    console.warn('Neon DB delete riwayat warning:', err.message);
  }

  // Cari record tersisa pada jenis servis & motor yang sama (jika masih ada)
  const remainingSameType = backendCache.riwayat
    .filter(r =>
      parseInt(r.motor_id || 1) === parseInt(removed.motor_id || 1) &&
      String(r.jenis_servis || '').toLowerCase().trim() === String(removed.jenis_servis || '').toLowerCase().trim()
    )
    .sort((a, b) => parseKm(b.jarak_tempuh_km) - parseKm(a.jarak_tempuh_km) || b.id - a.id);

  res.json({
    message: "Catatan riwayat servis berhasil dihapus",
    data: removed,
    next_id: remainingSameType[0]?.id || null
  });
});

// ==========================================
// ENDPOINT 3: KATALOG SUKU CADANG (/api/katalog-part)
// ==========================================
app.get('/api/katalog-part', (req, res) => {
  let hasil = [...katalog];
  const { q, kategori, harga, sort } = req.query;

  if (q) {
    const query = q.toLowerCase();
    hasil = hasil.filter(item =>
      item.nama_part.toLowerCase().includes(query) ||
      item.subjudul.toLowerCase().includes(query) ||
      item.kategori.toLowerCase().includes(query)
    );
  }
  if (kategori && kategori !== 'all' && kategori !== 'semua') {
    hasil = hasil.filter(item => item.kategori.toLowerCase() === kategori.toLowerCase());
  }
  if (harga === 'under100') {
    hasil = hasil.filter(item => item.harga_min < 100000);
  } else if (harga === 'above100') {
    hasil = hasil.filter(item => item.harga_min >= 100000);
  }
  if (sort === 'nama-asc') {
    hasil.sort((a, b) => a.nama_part.localeCompare(b.nama_part));
  } else if (sort === 'nama-desc') {
    hasil.sort((a, b) => b.nama_part.localeCompare(a.nama_part));
  } else if (sort === 'harga-asc') {
    hasil.sort((a, b) => a.harga_min - b.harga_min);
  } else if (sort === 'harga-desc') {
    hasil.sort((a, b) => b.harga_min - a.harga_min);
  }

  return sendWithCacheHeader(res, hasil, true);
});

app.get('/api/katalog-part/:id', (req, res) => {
  const item = katalog.find(r => r.id === parseInt(req.params.id));
  if (item) {
    return sendWithCacheHeader(res, item, true);
  }
  res.status(404).json({ message: "Suku cadang tidak ditemukan" });
});

// ==========================================
// ENDPOINT 4: DIREKTORI BENGKEL (/api/bengkel)
// ==========================================
app.get('/api/bengkel', (req, res) => {
  let hasil = [...bengkelList];
  const { q, kategori } = req.query;
  if (q) {
    const query = q.toLowerCase();
    hasil = hasil.filter(b =>
      b.nama_bengkel.toLowerCase().includes(query) ||
      b.alamat.toLowerCase().includes(query) ||
      b.layanan_utama.toLowerCase().includes(query) ||
      b.kategori.toLowerCase().includes(query)
    );
  }
  if (kategori && kategori !== 'all') {
    hasil = hasil.filter(b => b.kategori.toLowerCase() === kategori.toLowerCase());
  }
  return sendWithCacheHeader(res, hasil, true);
});

app.get('/api/bengkel/:id', (req, res) => {
  const item = bengkelList.find(b => b.id === parseInt(req.params.id));
  if (item) {
    return sendWithCacheHeader(res, item, true);
  }
  res.status(404).json({ message: "Bengkel tidak ditemukan" });
});

// ==========================================
// ENDPOINT 5: PROFIL PENGEMBANG (/api/profil)
// ==========================================
app.get('/api/profil', (req, res) => {
  return sendWithCacheHeader(res, profilPengembang, true);
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Backend MotoCare berjalan di http://localhost:${port}`);
  });
}

module.exports = app;
