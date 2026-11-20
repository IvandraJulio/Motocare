# MotoCare - PWA Perawatan Motor Honda ADV 160

MotoCare adalah aplikasi **Progressive Web App (PWA)** untuk mencatat riwayat servis motor, memantau estimasi biaya perawatan, serta melihat katalog suku cadang esensial.

Aplikasi ini dikembangkan untuk memenuhi **Tugas Akhir Praktikum**.

---

## 👤 Identitas Praktikan
- **Nama**: Ivandra Julio Chrishanto
- **NIM**: 21120124120034
- **Program Studi**: S1 Teknik Komputer
- **Platform**: Progressive Web Apps (PWA) + REST API Mandiri

---

## 🌟 Fitur Utama
1. **PWA Standalone & Offline Support**: Menggunakan Web App Manifest (`manifest.json`) dan Service Worker (`sw.js`).
2. **5 Halaman Single Page Application (SPA)**:
   - **Halaman 1 - List Riwayat Servis (`#/riwayat`)**: Menampilkan identitas motor dan daftar riwayat servis.
   - **Halaman 2 - Detail Riwayat Servis (`#/riwayat/:id`)**: Rincian servis, tanggal, bengkel, total biaya, jarak tempuh, dan catatan mekanik.
   - **Halaman 3 - List Katalog Suku Cadang (`#/katalog`)**: Katalog part esensial dalam grid 2 kolom dengan fitur **Pencarian Real-Time** dan **Bottom Sheet Modal Filter** (kategori, harga, sorting).
   - **Halaman 4 - Detail Suku Cadang (`#/katalog/:id`)**: Spesifikasi teknis, estimasi harga, dan rekomendasi interval penggantian.
   - **Halaman 5 - Profil & About (`#/profil`)**: Identitas mahasiswa pembuat dan rincian aplikasi.
3. **Floating Bottom Navigation Bar**: Navigasi cepat antar halaman tanpa reload.
4. **Backend REST API Mandiri**: Dibangun dengan Node.js dan Express.js.

---

## 🛠️ Tech Stack
- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript (Hash-based SPA Router), Web App Manifest, Service Worker
- **Backend**: Node.js, Express.js, CORS
- **Desain UI**: Figma Glassmorphism & Gold Accent (100% Mobile Responsive)

---

## 🚀 Cara Menjalankan Secara Lokal

### 1. Clone Repository
```bash
git clone https://github.com/IvandraJulio/Motocare.git
cd Motocare
```

### 2. Install Dependencies Backend
```bash
cd backend
npm install
```

### 3. Jalankan Server
```bash
node server.js
```

### 4. Buka Aplikasi di Browser
Buka browser dan akses:
```
http://localhost:3000
```
Gunakan fitur **Inspect Device Toolbar (`Ctrl + Shift + M`)** di browser dan pilih ukuran smartphone (misal: iPhone 12/14 Pro atau lebar 390px) untuk pengalaman terbaik.
