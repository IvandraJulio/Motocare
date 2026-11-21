/**
 * MotoCare PWA v2.1 - 5 Halaman Utama + 4 Detail + CRUD History di Dalam Detail Riwayat + Upload Foto Motor + Drag/Wheel Horizontal Scroll
 */

// Hapus status bar simulasi (9:41) jika browser masih memuat index.html dari cache lama SW
document.querySelectorAll('header').forEach(el => el.remove());

// Register Service Worker for PWA & bersihkan cache versi lama
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => {
                reg.update();
                console.log('MotoCare PWA SW terdaftar:', reg.scope);
            })
            .catch(err => console.warn('PWA SW gagal:', err));
        if ('caches' in window) {
            caches.keys().then(keys => {
                keys.filter(k => k !== 'motocare-v15' && k !== 'motocare-data')
                    .forEach(k => caches.delete(k));
            });
        }
    });
}

// API Base URL config
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? (window.location.port === '3000' ? '' : 'http://localhost:3000')
    : '';

const appContent = document.getElementById('app-content');
if (appContent) appContent.style.paddingTop = '44px';

function getModalContainer() {
    let el = document.getElementById('modal-container');
    if (!el) {
        el = document.createElement('div');
        el.id = 'modal-container';
        el.className = 'relative z-50';
        document.body.appendChild(el);
    }
    return el;
}

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// ==========================================
// HELPER: HORIZONTAL SCROLL DENGAN MOUSE WHEEL & DRAG (MENYIMPAN POSISI SCROLL)
// ==========================================
const savedHorizontalScroll = {};

function bindHorizontalScrollContainers() {
    document.querySelectorAll('.h-scroll').forEach((slider, idx) => {
        const key = slider.id || `hscroll-${window.location.hash}-${idx}`;
        if (savedHorizontalScroll[key] !== undefined) {
            slider.scrollLeft = savedHorizontalScroll[key];
        }

        if (slider.dataset.boundScroll === '1') return;
        slider.dataset.boundScroll = '1';

        slider.addEventListener('scroll', () => {
            savedHorizontalScroll[key] = slider.scrollLeft;
        }, { passive: true });

        // Scroll horizontal menggunakan roda mouse (mouse wheel)
        slider.addEventListener('wheel', (e) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                slider.scrollLeft += e.deltaY;
                savedHorizontalScroll[key] = slider.scrollLeft;
            }
        }, { passive: false });

        // Drag to scroll dengan mouse di Desktop
        let isDown = false;
        let startX = 0;
        let scrollLeft = 0;
        let moved = false;

        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            moved = false;
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });
        slider.addEventListener('mouseleave', () => { isDown = false; });
        slider.addEventListener('mouseup', () => { isDown = false; });
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 1.4;
            if (Math.abs(walk) > 5) {
                moved = true;
                e.preventDefault();
                slider.scrollLeft = scrollLeft - walk;
                savedHorizontalScroll[key] = slider.scrollLeft;
            }
        });
        slider.addEventListener('click', (e) => {
            if (moved) {
                e.preventDefault();
                e.stopPropagation();
                moved = false;
            }
        }, true);
    });
}

// ==========================================
// HELPER: KOMPRESI GAMBAR UPLOAD KE DATA URL BASE64
// ==========================================
function compressImageFileToDataUrl(file, maxWidth = 520) {
    return new Promise((resolve, reject) => {
        if (!file) return reject(new Error('File tidak ditemukan'));
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const scale = img.width > maxWidth ? maxWidth / img.width : 1;
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                // Gunakan PNG bila file asli PNG (agar background transparan tetap terjaga), selain itu WebP/JPEG
                const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                const dataUrl = canvas.toDataURL(mime, 0.85);
                resolve(dataUrl);
            };
            img.onerror = () => reject(new Error('Gagal membaca gambar'));
            img.src = ev.target.result;
        };
        reader.onerror = () => reject(new Error('Gagal membaca file'));
        reader.readAsDataURL(file);
    });
}

// ==========================================
// DATA FALLBACK & CLIENT-SIDE INSTANT CACHE
// ==========================================
const fallbackData = {
    motor: [
        {
            id: 1,
            nama: "Honda ADV 160",
            plat: "B 4271 MTC",
            tahun: "2024",
            odometer: "18.500 KM",
            tipe_mesin: "160cc eSP+ ABS",
            pajak_stnk: "12 Oktober 2027",
            gambar_url: "images/motor-adv.png",
            jumlah_servis: 4,
            total_biaya_servis: "Rp 630.000"
        },
        {
            id: 2,
            nama: "Honda Vario 160",
            plat: "H 5819 VRO",
            tahun: "2023",
            odometer: "11.200 KM",
            tipe_mesin: "160cc eSP+ CBS",
            pajak_stnk: "20 Mei 2027",
            gambar_url: "images/motor-adv.png",
            jumlah_servis: 2,
            total_biaya_servis: "Rp 250.000"
        }
    ],
    profil: {
        nama: "Ivandra Julio Chrishanto",
        nim: "21120124120034",
        prodi: "S1 Teknik Komputer",
        peran: "Pengembang aplikasi",
        avatar_url: "images/profile.jpg",
        tentang: "Teman perawatan motor Anda. Kelola banyak motor di garasi, catat riwayat servis (CRUD), pantau estimasi servis berikutnya, temukan bengkel rekanan, dan lihat katalog suku cadang dalam satu aplikasi PWA.",
        versi: "Versi 2.0.0",
        kategori: "Progressive Web App"
    },
    riwayat: [
        {
            id: 1,
            motor_id: 1,
            jenis_servis: "Ganti Oli Mesin",
            tanggal_servis: "12 Oktober 2026",
            nama_bengkel: "AHASS Bintang Motor",
            total_biaya: "Rp 150.000",
            total_biaya_angka: 150000,
            jarak_tempuh_km: "18.500 KM",
            interval_km: 2000,
            interval_bulan: 2,
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
            interval_km: 15000,
            interval_bulan: 24,
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
            interval_km: 8000,
            interval_bulan: 6,
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
            interval_km: 10000,
            interval_bulan: 12,
            catatan_mekanik: "Kampas rem cakram depan sudah tipis dan diganti baru. Pengereman normal dan pakem."
        }
    ],
    katalog: [
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
    ],
    bengkel: [
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
    ]
};

// State Motor Aktif
let activeMotorId = parseInt(localStorage.getItem('motocare_active_motor_id')) || 1;
function setActiveMotorId(id) {
    activeMotorId = parseInt(id) || 1;
    localStorage.setItem('motocare_active_motor_id', String(activeMotorId));
}

// Client-Side Memory Cache
const clientCache = new Map();

function invalidateClientCache() {
    clientCache.clear();
}

async function fetchData(endpoint, fallbackKey, id = null, forceRefresh = false) {
    const url = id ? `${API_BASE}${endpoint}/${id}` : `${API_BASE}${endpoint}`;
    const cached = clientCache.get(url);
    const now = Date.now();

    if (cached && !forceRefresh) {
        if (now - cached.time > 15000) {
            fetch(url, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(d => {
                if (d) clientCache.set(url, { data: d, time: Date.now() });
            }).catch(() => {});
        }
        return cached.data;
    }

    try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        clientCache.set(url, { data, time: now });
        return data;
    } catch (err) {
        console.warn(`Gagal fetch dari ${endpoint}, menggunakan fallback:`, err.message);
        if (cached) return cached.data;
        if (id && Array.isArray(fallbackData[fallbackKey])) {
            return fallbackData[fallbackKey].find(item => item.id === parseInt(id)) || fallbackData[fallbackKey][0];
        }
        return fallbackData[fallbackKey];
    }
}

// CRUD API Helpers
async function createRiwayatData(fields) {
    const res = await fetch(`${API_BASE}/api/riwayat-servis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
    });
    if (!res.ok) throw new Error(`Gagal menambah riwayat (${res.status})`);
    const result = await res.json();
    invalidateClientCache();
    return result.data || result;
}

async function updateRiwayatData(id, fields) {
    const res = await fetch(`${API_BASE}/api/riwayat-servis/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
    });
    if (!res.ok) throw new Error(`Gagal memperbarui riwayat (${res.status})`);
    const result = await res.json();
    invalidateClientCache();
    return result.data || result;
}

async function deleteRiwayatData(id) {
    const res = await fetch(`${API_BASE}/api/riwayat-servis/${id}`, {
        method: 'DELETE'
    });
    if (!res.ok) throw new Error(`Gagal menghapus riwayat (${res.status})`);
    const result = await res.json();
    invalidateClientCache();
    return result;
}

async function createMotorData(fields) {
    const res = await fetch(`${API_BASE}/api/motor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
    });
    if (!res.ok) {
        const errObj = await res.json().catch(() => ({}));
        throw new Error(errObj.message || `Gagal menambah motor (${res.status})`);
    }
    const result = await res.json();
    invalidateClientCache();
    return result.data || result;
}

async function updateMotorData(id, fields) {
    const res = await fetch(`${API_BASE}/api/motor/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
    });
    if (!res.ok) {
        const errObj = await res.json().catch(() => ({}));
        throw new Error(errObj.message || `Gagal memperbarui motor (${res.status})`);
    }
    const result = await res.json();
    invalidateClientCache();
    return result.data || result;
}

async function deleteMotorData(id) {
    const res = await fetch(`${API_BASE}/api/motor/${id}`, {
        method: 'DELETE'
    });
    if (!res.ok) {
        const errObj = await res.json().catch(() => ({}));
        throw new Error(errObj.message || `Gagal menghapus motor (${res.status})`);
    }
    const result = await res.json();
    invalidateClientCache();
    return result;
}

// Toast notification
function showToast(message, type = 'success') {
    const existing = document.getElementById('motocare-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'motocare-toast';
    toast.className = `fixed top-5 left-1/2 -translate-x-1/2 max-w-[350px] w-[90%] px-4 py-3 rounded-2xl z-[9999] shadow-2xl transition-all duration-300 -translate-y-6 opacity-0 text-xs font-semibold text-[#F5F3EE] ${
        type === 'success' ? 'bg-[#151D22] border border-[#DEC99F]/40' : 'bg-red-950/90 border border-red-500/40'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.remove('-translate-y-6', 'opacity-0')));
    setTimeout(() => {
        toast.classList.add('-translate-y-6', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}

// Update Active Tab on Bottom Navigation Bar (5 Tabs)
function updateBottomNav(activeRoute) {
    const tabs = [
        { id: 'nav-riwayat', route: 'riwayat' },
        { id: 'nav-garasi', route: 'garasi' },
        { id: 'nav-katalog', route: 'katalog' },
        { id: 'nav-bengkel', route: 'bengkel' },
        { id: 'nav-profil', route: 'profil' }
    ];

    tabs.forEach(tab => {
        const el = document.getElementById(tab.id);
        if (!el) return;

        if (activeRoute.startsWith(tab.route)) {
            el.className = "nav-btn nav-pill-active px-3 py-1.5 rounded-2xl flex flex-col items-center justify-center text-xs h-[52px] min-w-[62px]";
        } else {
            el.className = "nav-btn text-[#ADB6B8] hover:text-[#F5F3EE] px-2.5 py-1.5 flex flex-col items-center justify-center text-xs h-[52px] min-w-[58px] transition-colors";
        }
    });
}

// Warna status pengingat servis
function pengingatStyle(status) {
    if (status === 'terlambat') return { text: 'text-[#F08A7E]', dot: 'bg-[#F08A7E]', bar: 'bg-[#F08A7E]', badge: 'bg-[#F08A7E]/15 border-[#F08A7E]/40 text-[#F08A7E]' };
    if (status === 'segera') return { text: 'text-[#E2C995]', dot: 'bg-[#E2C995]', bar: 'bg-[#E2C995]', badge: 'bg-[#E2C995]/15 border-[#E2C995]/40 text-[#E2C995]' };
    return { text: 'text-[#8FC9B5]', dot: 'bg-[#8FC9B5]', bar: 'bg-[#8FC9B5]', badge: 'bg-[#8FC9B5]/15 border-[#8FC9B5]/40 text-[#8FC9B5]' };
}

// ==========================================
// 1. HALAMAN UTAMA 1: RIWAYAT SERVIS (#/riwayat)
// ==========================================
async function renderRiwayatList() {
    updateBottomNav('riwayat');
    const [allRiwayat, motorsData] = await Promise.all([
        fetchData('/api/riwayat-servis', 'riwayat'),
        fetchData('/api/motor', 'motor')
    ]);

    const motors = Array.isArray(motorsData) ? motorsData : [motorsData];
    let activeMotor = motors.find(m => m.id === activeMotorId) || motors[0];
    if (activeMotor && activeMotor.id !== activeMotorId) {
        setActiveMotorId(activeMotor.id);
    }

    const dataRiwayat = (Array.isArray(allRiwayat) ? allRiwayat : []).filter(
        item => parseInt(item.motor_id || 1) === parseInt(activeMotor?.id || 1)
    );

    appContent.innerHTML = `
        <!-- Top App Bar -->
        <div class="flex items-start justify-between mt-2 mb-4">
            <div>
                <h1 class="text-2xl font-bold text-[#F5F3EE] tracking-tight">MotoCare</h1>
                <p class="text-xs text-[#ADB6B8] mt-0.5">Rawat motor. Nikmati perjalanan.</p>
            </div>
            <a href="#/garasi" class="h-[42px] px-3.5 rounded-2xl bg-[#E4ECE7]/[0.07] border border-[#E4ECE7]/[0.15] flex items-center space-x-1.5 text-xs font-semibold text-[#DEC99F] hover:bg-[#E4ECE7]/[0.12] active:scale-95 transition-all" aria-label="Garasi">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h3l2 5h-5l-3-5H8l-2.5 6.5"/><path d="M9 17.5h6"/>
                </svg>
                <span>${motors.length} Motor</span>
            </a>
        </div>

        <!-- Switcher Multi-Motor (Scrollable dengan mouse wheel / drag) -->
        ${motors.length > 1 ? `
        <div class="h-scroll flex items-center space-x-2 pb-2 mb-3">
            ${motors.map(m => {
                const isAct = m.id === activeMotor.id;
                return `
                <button type="button" data-switch-motor="${m.id}" class="motor-switch-pill shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                    isAct ? 'bg-[#DEC99F] text-[#0C1014] shadow-md' : 'glass-card text-[#ADB6B8] hover:text-[#F5F3EE]'
                }">
                    <span>${esc(m.nama)}</span>
                    <span class="text-[10px] ${isAct ? 'text-[#0C1014]/70' : 'text-[#ADB6B8]/70'}">(${esc(m.plat)})</span>
                </button>`;
            }).join('')}
        </div>
        ` : ''}

        <!-- Motor Saya Card (Gold Glass Highlight) -->
        <div class="gold-card rounded-2xl p-4 mb-6 relative overflow-hidden flex items-center justify-between min-h-[134px]">
            <div class="z-10 max-w-[58%]">
                <p class="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#DEC99F]">MOTOR SAYA</p>
                <h2 class="text-lg font-bold text-[#F5F3EE] mt-0.5">${esc(activeMotor?.nama || 'Honda ADV 160')}</h2>
                <p class="text-xs text-[#ADB6B8] mt-0.5">${esc(activeMotor?.plat || 'B 4271 MTC')} • ${esc(activeMotor?.tahun || '2024')}</p>
                <p class="text-xs font-semibold text-[#DEC99F] mt-3">${esc(activeMotor?.odometer || '18.500 KM')}</p>
            </div>
            <!-- Motor Image -->
            <div class="w-36 h-28 absolute right-1 -bottom-0.5 flex items-end justify-center pointer-events-none">
                <img src="${activeMotor?.gambar_url || 'images/motor-adv.png'}" alt="${esc(activeMotor?.nama)}" class="max-h-full max-w-full object-contain drop-shadow-md rounded-lg" onerror="this.src='images/motor-adv.png'">
            </div>
        </div>

        <!-- Section Header (Sesuai Desain Asli) -->
        <div class="flex items-center justify-between mb-3 px-1">
            <h3 class="text-base font-bold text-[#F5F3EE]">Riwayat servis</h3>
            <span class="text-xs text-[#ADB6B8] font-normal">${dataRiwayat.length} jenis servis</span>
        </div>

        <!-- Service History List (Klik item untuk masuk ke Detail & Tambah History Servis di dalamnya) -->
        <div class="space-y-3">
            ${dataRiwayat.map(item => {
                const p = item.pengingat;
                const st = pengingatStyle(p && p.status);
                return `
                <a href="#/riwayat/${item.id}" class="glass-card hover:border-[#DEC99F]/40 transition-all active:scale-[0.99] rounded-2xl p-4 flex items-center justify-between group">
                    <div class="min-w-0 flex-1 pr-2">
                        <h4 class="text-sm font-semibold text-[#F5F3EE] group-hover:text-[#DEC99F] transition-colors truncate">${esc(item.jenis_servis)}</h4>
                        <p class="text-xs text-[#ADB6B8] mt-1">Terakhir: ${esc(item.tanggal_servis)} • ${esc(item.jarak_tempuh_km)}</p>
                        ${p ? `
                        <div class="flex items-center mt-2 text-[10.5px] font-medium ${st.text}">
                            <span class="w-1.5 h-1.5 rounded-full ${st.dot} mr-1.5 shrink-0"></span>
                            <span class="truncate">Servis lagi: ${esc(p.km_berikutnya)}${p.tanggal_berikutnya ? ` / ${esc(p.tanggal_berikutnya)}` : ''}</span>
                        </div>` : ''}
                    </div>
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-[#BDC6C5] group-hover:text-[#DEC99F] transition-colors shrink-0">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 18l6-6-6-6"/>
                        </svg>
                    </div>
                </a>
            `;}).join('')}
        </div>
    `;

    bindHorizontalScrollContainers();

    document.querySelectorAll('.motor-switch-pill').forEach(btn => {
        btn.onclick = () => {
            setActiveMotorId(btn.getAttribute('data-switch-motor'));
            renderRiwayatList();
        };
    });
}

// ==========================================
// 2. HALAMAN DETAIL 1: DETAIL RIWAYAT SERVIS (#/riwayat/:id)
//    -> Di dalam halaman ini ada tombol "+ Catat Servis Baru" (Create), Edit (Update), Hapus (Delete), & Timeline History!
// ==========================================
async function renderRiwayatDetail(id) {
    updateBottomNav('riwayat');
    const item = await fetchData('/api/riwayat-servis', 'riwayat', id, true);
    const p = item.pengingat;
    const st = pengingatStyle(p && p.status);
    const historyList = Array.isArray(item.history_list) && item.history_list.length > 0 ? item.history_list : [item];

    appContent.innerHTML = `
        <!-- Top App Bar with Back, Delete & Edit Buttons -->
        <div class="flex items-center mt-2 mb-5">
            <a href="#/riwayat" class="w-[42px] h-[42px] rounded-2xl bg-[#E4ECE7]/[0.07] border border-[#E4ECE7]/[0.15] flex items-center justify-center text-[#F5F3EE] hover:bg-[#E4ECE7]/[0.12] active:scale-95 transition-all" aria-label="Kembali">
                <svg class="w-5 h-5 text-[#F5F3EE]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 19l-7-7 7-7"/>
                </svg>
            </a>
            <h1 class="text-base font-bold text-[#F5F3EE] ml-3 flex-1 truncate">Detail Riwayat</h1>
            <div class="flex items-center space-x-2">
                <button type="button" id="btn-delete-riwayat" class="w-[42px] h-[42px] rounded-2xl bg-red-500/15 border border-red-500/30 text-[#F08A7E] flex items-center justify-center active:scale-95 transition-all" aria-label="Hapus riwayat">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                </button>
                <button type="button" id="btn-edit-riwayat" class="h-[42px] px-3.5 rounded-2xl glass-card border border-[#DEC99F]/40 text-[#DEC99F] text-xs font-bold flex items-center space-x-1.5 active:scale-95 transition-all" aria-label="Edit riwayat">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    <span>Edit</span>
                </button>
            </div>
        </div>

        <!-- Hero Card (Jenis Servis + Tombol Tambah Servis Baru di Dalam Detail) -->
        <div class="gold-card rounded-2xl p-5 mb-5">
            <div class="flex items-center justify-between mb-1">
                <p class="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#DEC99F]">JENIS SERVIS</p>
                ${item.motor_nama ? `<span class="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-[#0C1014]/60 text-[#DEC99F] border border-[#DEC99F]/30">${esc(item.motor_nama)}</span>` : ''}
            </div>
            <h2 class="text-2xl font-bold text-[#F5F3EE] leading-snug">${esc(item.jenis_servis)}</h2>
            <div class="flex items-center text-xs text-[#ADB6B8] mt-2">
                <svg class="w-4 h-4 mr-1.5 text-[#ADB6B8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>Servis terakhir: ${esc(item.tanggal_servis)}</span>
            </div>

            <!-- Tombol CREATE (+ Tambah Riwayat Servis Baru) langsung di dalam halaman Detail Riwayat -->
            <button type="button" id="btn-create-in-detail" class="mt-4 w-full py-2.5 px-4 rounded-xl bg-[#DEC99F] text-[#0C1014] text-xs font-bold flex items-center justify-center space-x-1.5 shadow-lg shadow-[#DEC99F]/20 active:scale-95 transition-all">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span>Tambah Riwayat ${esc(item.jenis_servis)} Baru</span>
            </button>
        </div>

        <!-- Section Title: Informasi Servis Terakhir -->
        <h3 class="text-sm font-bold text-[#F5F3EE] mb-2.5 px-1">Informasi servis terbaru</h3>

        <!-- Card Informasi Servis -->
        <div class="glass-card rounded-2xl p-4 mb-4">
            <div class="pb-3 border-b border-[#E4ECE7]/10">
                <p class="text-[11px] text-[#ADB6B8]">Nama Bengkel</p>
                <p class="text-sm font-semibold text-[#F5F3EE] mt-0.5">${esc(item.nama_bengkel)}</p>
            </div>

            <div class="grid grid-cols-2 gap-4 py-3 border-b border-[#E4ECE7]/10">
                <div>
                    <p class="text-[11px] text-[#ADB6B8]">Total Biaya</p>
                    <p class="text-base font-bold text-[#DEC99F] mt-0.5">${esc(item.total_biaya)}</p>
                </div>
                <div>
                    <p class="text-[11px] text-[#ADB6B8]">KM Saat Servis</p>
                    <p class="text-base font-bold text-[#F5F3EE] mt-0.5">${esc(item.jarak_tempuh_km)}</p>
                </div>
            </div>

            <div class="pt-2.5">
                <p class="text-[11px] text-[#ADB6B8]">Tercatat pada ${esc(item.tanggal_servis)}</p>
            </div>
        </div>

        ${p ? `
        <!-- Pengingat Servis Berikutnya -->
        <div class="flex items-center justify-between mb-2.5 px-1">
            <h3 class="text-sm font-bold text-[#F5F3EE]">Estimasi servis berikutnya</h3>
            <span class="text-[10px] font-semibold px-2.5 py-1 rounded-full border ${st.badge}">${esc(p.status_label)}</span>
        </div>
        <div class="glass-card rounded-2xl p-4 mb-4">
            <div class="grid grid-cols-2 gap-4 pb-3 border-b border-[#E4ECE7]/10">
                <div>
                    <p class="text-[11px] text-[#ADB6B8]">Terakhir Servis</p>
                    <p class="text-sm font-bold text-[#F5F3EE] mt-0.5">${esc(p.km_terakhir)}</p>
                    <p class="text-[10.5px] text-[#ADB6B8] mt-0.5">${esc(item.tanggal_servis)}</p>
                </div>
                <div>
                    <p class="text-[11px] text-[#ADB6B8]">Interval Anjuran</p>
                    <p class="text-sm font-bold text-[#DEC99F] mt-0.5">+${(item.interval_km || 0).toLocaleString('id-ID')} KM</p>
                    <p class="text-[10.5px] text-[#ADB6B8] mt-0.5">atau ${item.interval_bulan} bulan</p>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 pt-3">
                <div>
                    <p class="text-[11px] text-[#ADB6B8]">Servis Lagi di KM</p>
                    <p class="text-xl font-bold ${st.text} leading-tight mt-0.5">${esc(p.km_berikutnya)}</p>
                </div>
                <div>
                    <p class="text-[11px] text-[#ADB6B8]">Atau Tanggal</p>
                    <p class="text-sm font-bold text-[#F5F3EE] mt-0.5">${esc(p.tanggal_berikutnya || '-')}</p>
                    <p class="text-[10.5px] ${st.text} mt-0.5">${esc(p.sisa_hari_label)}</p>
                </div>
            </div>
        </div>
        ` : ''}

        <!-- Catatan Mekanik Card -->
        <div class="gold-card rounded-2xl p-4 mb-5">
            <div class="flex items-center space-x-2 text-[#DEC99F] mb-1.5">
                <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 9v4m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
                <h4 class="text-xs font-bold uppercase tracking-wider text-[#DEC99F]">Catatan Mekanik</h4>
            </div>
            <p class="text-xs leading-relaxed text-[#ADB6B8] mt-1">${esc(item.catatan_mekanik)}</p>
        </div>

        <!-- Timeline / History Pergantian Servis Ini -->
        <div class="flex items-center justify-between mb-2.5 px-1">
            <h3 class="text-sm font-bold text-[#F5F3EE]">Riwayat pergantian (${historyList.length} catatan)</h3>
            <button type="button" id="btn-create-in-history" class="text-xs font-semibold text-[#DEC99F] hover:underline">+ Tambah Baru</button>
        </div>
        <div class="space-y-2.5">
            ${historyList.map((h, idx) => {
                const isCurrent = h.id === item.id;
                return `
                <div class="${isCurrent ? 'gold-card' : 'glass-card'} rounded-2xl p-3.5 transition-all">
                    <div class="flex items-start justify-between">
                        <div>
                            <div class="flex items-center space-x-2">
                                <span class="text-xs font-bold text-[#F5F3EE]">${esc(h.tanggal_servis)}</span>
                                ${idx === 0 ? `<span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#DEC99F] text-[#0C1014]">Terbaru</span>` : `<span class="text-[9px] px-2 py-0.5 rounded-full bg-[#E4ECE7]/10 text-[#ADB6B8]">Ke-${historyList.length - idx}</span>`}
                            </div>
                            <p class="text-[11px] text-[#ADB6B8] mt-0.5">${esc(h.nama_bengkel)} • <span class="text-[#F5F3EE] font-semibold">${esc(h.jarak_tempuh_km)}</span></p>
                        </div>
                        <span class="text-xs font-bold text-[#DEC99F]">${esc(h.total_biaya)}</span>
                    </div>
                    <p class="text-[11px] text-[#ADB6B8] mt-2 leading-relaxed">${esc(h.catatan_mekanik)}</p>
                    <div class="flex items-center justify-end space-x-2 mt-2.5 pt-2 border-t border-[#E4ECE7]/10">
                        <button type="button" data-hist-edit="${h.id}" class="btn-hist-edit text-[11px] font-semibold text-[#DEC99F] px-2.5 py-1 rounded-lg bg-[#DEC99F]/15 hover:bg-[#DEC99F]/25 transition-all">Edit</button>
                        <button type="button" data-hist-del="${h.id}" data-hist-tgl="${esc(h.tanggal_servis)}" class="btn-hist-del text-[11px] font-semibold text-[#F08A7E] px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 transition-all">Hapus</button>
                    </div>
                </div>
                `;
            }).join('')}
        </div>
    `;

    // Tombol Create di dalam Detail Riwayat (otomatis mengunci jenis_servis & motor_id saat ini)
    const openCreateForThisService = () => openCreateRiwayatModal({
        id: item.motor_id,
        nama: item.motor_nama,
        odometer: item.jarak_tempuh_km
    }, item.nama_bengkel, item);

    document.getElementById('btn-create-in-detail').onclick = openCreateForThisService;
    document.getElementById('btn-create-in-history').onclick = openCreateForThisService;

    document.getElementById('btn-edit-riwayat').onclick = () => openEditRiwayatModal(item);
    document.getElementById('btn-delete-riwayat').onclick = () => openDeleteConfirmModal({
        title: 'Hapus Catatan Servis?',
        subtitle: `Catatan "${item.jenis_servis}" (${item.tanggal_servis}) akan dihapus.`,
        onConfirm: async () => {
            const res = await deleteRiwayatData(item.id);
            showToast('Catatan servis berhasil dihapus');
            if (res && res.next_id) {
                window.location.hash = `#/riwayat/${res.next_id}`;
                renderRiwayatDetail(res.next_id);
            } else {
                window.location.hash = '#/riwayat';
            }
        }
    });

    // Bind Edit & Delete pada masing-masing item history di bawah
    document.querySelectorAll('.btn-hist-edit').forEach(btn => {
        btn.onclick = () => {
            const hId = parseInt(btn.getAttribute('data-hist-edit'));
            const targetObj = historyList.find(x => x.id === hId) || item;
            openEditRiwayatModal(targetObj, item.id);
        };
    });
    document.querySelectorAll('.btn-hist-del').forEach(btn => {
        btn.onclick = () => {
            const hId = parseInt(btn.getAttribute('data-hist-del'));
            const hTgl = btn.getAttribute('data-hist-tgl');
            openDeleteConfirmModal({
                title: 'Hapus Riwayat Ini?',
                subtitle: `Catatan "${item.jenis_servis}" tanggal ${hTgl} akan dihapus.`,
                onConfirm: async () => {
                    const res = await deleteRiwayatData(hId);
                    showToast('Riwayat berhasil dihapus');
                    if (res && res.next_id) {
                        window.location.hash = `#/riwayat/${res.next_id}`;
                        renderRiwayatDetail(res.next_id);
                    } else {
                        window.location.hash = '#/riwayat';
                    }
                }
            });
        };
    });
}

// ==========================================
// MODAL CRUD RIWAYAT SERVIS (CREATE, UPDATE, DELETE)
// ==========================================
function openCreateRiwayatModal(activeMotor, prefillBengkel = '', lockedServiceItem = null) {
    const container = getModalContainer();
    const inputCls = 'w-full bg-[#0C1014]/60 border border-[#E4ECE7]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#F5F3EE] placeholder-[#ADB6B8] outline-none focus:border-[#DEC99F]/60 select-text';
    const labelCls = 'block text-[11px] font-semibold text-[#DEC99F] mb-1.5';

    const todayStr = '21 November 2026';
    const defaultJenis = lockedServiceItem ? lockedServiceItem.jenis_servis : '';
    const defaultIntKm = lockedServiceItem ? (lockedServiceItem.interval_km || 2000) : 2000;
    const defaultIntBln = lockedServiceItem ? (lockedServiceItem.interval_bulan || 2) : 2;
    const defaultBiaya = lockedServiceItem ? (lockedServiceItem.total_biaya || 'Rp 150.000') : 'Rp 150.000';

    container.innerHTML = `
        <div id="create-modal-backdrop" class="fixed inset-0 bg-black/75 backdrop-blur-sm z-[999] flex items-end justify-center transition-opacity duration-200 opacity-0">
            <form id="create-riwayat-form" class="w-full max-w-[390px] bg-[#151D22] border-t border-[#E4ECE7]/20 rounded-t-[28px] p-5 shadow-2xl transform transition-transform duration-200 translate-y-full max-h-[90vh] overflow-y-auto">
                <div class="w-12 h-1 bg-[#E4ECE7]/25 rounded-full mx-auto mb-3"></div>
                <div class="flex items-center justify-between mb-3">
                    <div>
                        <h3 class="text-base font-bold text-[#F5F3EE]">Tambah Riwayat ${esc(defaultJenis || 'Servis')}</h3>
                        <p class="text-[11px] text-[#ADB6B8]">Motor: <span class="text-[#DEC99F] font-semibold">${esc(activeMotor?.nama || 'Motor Aktif')}</span></p>
                    </div>
                    <button type="button" id="create-close-btn" class="w-8 h-8 rounded-full bg-[#E4ECE7]/10 text-[#ADB6B8] text-lg leading-none">&times;</button>
                </div>

                <div class="space-y-3 mb-5">
                    <input type="hidden" name="motor_id" value="${esc(activeMotor?.id || 1)}">
                    <div>
                        <label class="${labelCls}">Jenis Servis</label>
                        <input name="jenis_servis" required value="${esc(defaultJenis)}" placeholder="Contoh: Ganti Oli Mesin" class="${inputCls}">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div><label class="${labelCls}">Tanggal Servis Baru</label><input name="tanggal_servis" required value="${todayStr}" placeholder="21 November 2026" class="${inputCls}"></div>
                        <div><label class="${labelCls}">KM Saat Servis</label><input name="jarak_tempuh_km" required placeholder="Contoh: 20.500 KM" class="${inputCls}"></div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div><label class="${labelCls}">Nama Bengkel</label><input name="nama_bengkel" required value="${esc(prefillBengkel || 'AHASS Bintang Motor')}" placeholder="Nama bengkel" class="${inputCls}"></div>
                        <div><label class="${labelCls}">Total Biaya</label><input name="total_biaya" required value="${esc(defaultBiaya)}" placeholder="Rp 150.000" class="${inputCls}"></div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div><label class="${labelCls}">Interval Servis (KM)</label><input name="interval_km" type="number" min="100" step="100" required value="${esc(defaultIntKm)}" class="${inputCls}"></div>
                        <div><label class="${labelCls}">Interval (Bulan)</label><input name="interval_bulan" type="number" min="1" required value="${esc(defaultIntBln)}" class="${inputCls}"></div>
                    </div>
                    <div><label class="${labelCls}">Catatan Mekanik</label><textarea name="catatan_mekanik" rows="2" placeholder="Kondisi komponen & saran perawatan berikutnya..." class="${inputCls} resize-none"></textarea></div>
                </div>

                <div class="flex items-center space-x-3">
                    <button type="button" id="create-cancel-btn" class="w-1/3 py-3 rounded-xl border border-[#E4ECE7]/20 text-xs font-semibold text-[#ADB6B8] active:scale-95 transition-all">Batal</button>
                    <button type="submit" id="create-save-btn" class="w-2/3 py-3 rounded-xl bg-[#DEC99F] text-[#0C1014] text-xs font-bold shadow-lg shadow-[#DEC99F]/20 active:scale-95 transition-all">Simpan Riwayat Baru</button>
                </div>
            </form>
        </div>
    `;

    const backdrop = document.getElementById('create-modal-backdrop');
    const form = document.getElementById('create-riwayat-form');
    requestAnimationFrame(() => requestAnimationFrame(() => {
        backdrop.classList.remove('opacity-0');
        form.classList.remove('translate-y-full');
    }));

    const closeModal = () => {
        backdrop.classList.add('opacity-0');
        form.classList.add('translate-y-full');
        setTimeout(() => { container.innerHTML = ''; }, 200);
    };
    document.getElementById('create-close-btn').onclick = closeModal;
    document.getElementById('create-cancel-btn').onclick = closeModal;
    backdrop.onclick = (e) => { if (e.target === backdrop) closeModal(); };

    form.onsubmit = async (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('create-save-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Menyimpan...';
        const fd = new FormData(form);
        const payload = {};
        ['motor_id', 'jenis_servis', 'tanggal_servis', 'nama_bengkel', 'total_biaya', 'jarak_tempuh_km', 'interval_km', 'interval_bulan', 'catatan_mekanik']
            .forEach(k => { payload[k] = String(fd.get(k) || '').trim(); });
        try {
            const created = await createRiwayatData(payload);
            closeModal();
            showToast('Riwayat servis baru berhasil ditambahkan!');
            if (created && created.id) {
                window.location.hash = `#/riwayat/${created.id}`;
                renderRiwayatDetail(created.id);
            } else {
                renderRiwayatList();
            }
        } catch (err) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Simpan Riwayat Baru';
            showToast(err.message || 'Gagal menambah riwayat', 'error');
        }
    };
}

function openEditRiwayatModal(item, returnDetailId = null) {
    const container = getModalContainer();
    const inputCls = 'w-full bg-[#0C1014]/60 border border-[#E4ECE7]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#F5F3EE] placeholder-[#ADB6B8] outline-none focus:border-[#DEC99F]/60 select-text';
    const labelCls = 'block text-[11px] font-semibold text-[#DEC99F] mb-1.5';

    container.innerHTML = `
        <div id="edit-modal-backdrop" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999] flex items-end justify-center transition-opacity duration-200 opacity-0">
            <form id="edit-riwayat-form" class="w-full max-w-[390px] bg-[#151D22] border-t border-[#E4ECE7]/20 rounded-t-[28px] p-5 shadow-2xl transform transition-transform duration-200 translate-y-full max-h-[90vh] overflow-y-auto">
                <div class="w-12 h-1 bg-[#E4ECE7]/25 rounded-full mx-auto mb-4"></div>
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-base font-bold text-[#F5F3EE]">Update Riwayat Servis</h3>
                    <button type="button" id="edit-close-btn" class="w-8 h-8 rounded-full bg-[#E4ECE7]/10 text-[#ADB6B8] text-lg leading-none">&times;</button>
                </div>
                <div class="space-y-3.5 mb-5">
                    <div><label class="${labelCls}">Jenis Servis</label><input name="jenis_servis" required value="${esc(item.jenis_servis)}" class="${inputCls}"></div>
                    <div><label class="${labelCls}">Tanggal Servis</label><input name="tanggal_servis" required value="${esc(item.tanggal_servis)}" placeholder="12 Oktober 2026" class="${inputCls}"></div>
                    <div><label class="${labelCls}">Nama Bengkel</label><input name="nama_bengkel" required value="${esc(item.nama_bengkel)}" class="${inputCls}"></div>
                    <div class="grid grid-cols-2 gap-3">
                        <div><label class="${labelCls}">Total Biaya</label><input name="total_biaya" required value="${esc(item.total_biaya)}" placeholder="Rp 150.000" class="${inputCls}"></div>
                        <div><label class="${labelCls}">Jarak Tempuh</label><input name="jarak_tempuh_km" required value="${esc(item.jarak_tempuh_km)}" placeholder="18.500 KM" class="${inputCls}"></div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div><label class="${labelCls}">Interval (KM)</label><input name="interval_km" type="number" min="100" step="100" required value="${esc(item.interval_km)}" placeholder="2000" class="${inputCls}"></div>
                        <div><label class="${labelCls}">Interval (Bulan)</label><input name="interval_bulan" type="number" min="1" required value="${esc(item.interval_bulan)}" placeholder="2" class="${inputCls}"></div>
                    </div>
                    <div><label class="${labelCls}">Catatan Mekanik</label><textarea name="catatan_mekanik" rows="3" class="${inputCls} resize-none">${esc(item.catatan_mekanik)}</textarea></div>
                </div>
                <div class="flex items-center space-x-3">
                    <button type="button" id="edit-cancel-btn" class="w-1/3 py-3 rounded-xl border border-[#E4ECE7]/20 text-xs font-semibold text-[#ADB6B8] active:scale-95 transition-all">Batal</button>
                    <button type="submit" id="edit-save-btn" class="w-2/3 py-3 rounded-xl bg-[#DEC99F] text-[#0C1014] text-xs font-bold shadow-lg shadow-[#DEC99F]/20 active:scale-95 transition-all">Simpan Perubahan</button>
                </div>
            </form>
        </div>
    `;

    const backdrop = document.getElementById('edit-modal-backdrop');
    const form = document.getElementById('edit-riwayat-form');
    requestAnimationFrame(() => requestAnimationFrame(() => {
        backdrop.classList.remove('opacity-0');
        form.classList.remove('translate-y-full');
    }));

    const closeModal = () => {
        backdrop.classList.add('opacity-0');
        form.classList.add('translate-y-full');
        setTimeout(() => { container.innerHTML = ''; }, 200);
    };
    document.getElementById('edit-close-btn').onclick = closeModal;
    document.getElementById('edit-cancel-btn').onclick = closeModal;
    backdrop.onclick = (e) => { if (e.target === backdrop) closeModal(); };

    form.onsubmit = async (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('edit-save-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Menyimpan...';
        const fd = new FormData(form);
        const payload = {};
        ['jenis_servis', 'tanggal_servis', 'nama_bengkel', 'total_biaya', 'jarak_tempuh_km', 'interval_km', 'interval_bulan', 'catatan_mekanik']
            .forEach(k => { payload[k] = String(fd.get(k) || '').trim(); });
        try {
            await updateRiwayatData(item.id, payload);
            closeModal();
            showToast('Riwayat servis berhasil diperbarui');
            renderRiwayatDetail(returnDetailId || item.id);
        } catch (err) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Simpan Perubahan';
            showToast('Gagal memperbarui riwayat', 'error');
        }
    };
}

function openDeleteConfirmModal({ title, subtitle, onConfirm }) {
    const container = getModalContainer();
    container.innerHTML = `
        <div id="del-modal-backdrop" class="fixed inset-0 bg-black/75 backdrop-blur-sm z-[999] flex items-center justify-center px-5 transition-opacity duration-200 opacity-0">
            <div id="del-modal-box" class="w-full max-w-[340px] bg-[#151D22] border border-[#E4ECE7]/20 rounded-3xl p-5 shadow-2xl transform transition-transform duration-200 scale-95">
                <div class="w-11 h-11 rounded-2xl bg-red-500/15 border border-red-500/30 text-[#F08A7E] flex items-center justify-center mb-3.5">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    </svg>
                </div>
                <h3 class="text-base font-bold text-[#F5F3EE]">${esc(title)}</h3>
                <p class="text-xs text-[#ADB6B8] mt-1.5 leading-relaxed">${esc(subtitle)}</p>
                <div class="flex items-center space-x-2.5 mt-5">
                    <button type="button" id="del-cancel-btn" class="w-1/2 py-2.5 rounded-xl border border-[#E4ECE7]/20 text-xs font-semibold text-[#ADB6B8] active:scale-95 transition-all">Batal</button>
                    <button type="button" id="del-confirm-btn" class="w-1/2 py-2.5 rounded-xl bg-[#F08A7E] text-[#0C1014] text-xs font-bold active:scale-95 transition-all">Ya, Hapus</button>
                </div>
            </div>
        </div>
    `;
    const backdrop = document.getElementById('del-modal-backdrop');
    const box = document.getElementById('del-modal-box');
    requestAnimationFrame(() => requestAnimationFrame(() => {
        backdrop.classList.remove('opacity-0');
        box.classList.remove('scale-95');
    }));
    const close = () => {
        backdrop.classList.add('opacity-0');
        setTimeout(() => { container.innerHTML = ''; }, 180);
    };
    document.getElementById('del-cancel-btn').onclick = close;
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
    document.getElementById('del-confirm-btn').onclick = async () => {
        const btn = document.getElementById('del-confirm-btn');
        btn.disabled = true;
        btn.textContent = 'Menghapus...';
        try {
            await onConfirm();
            close();
        } catch (err) {
            close();
            showToast(err.message || 'Gagal menghapus data', 'error');
        }
    };
}

// ==========================================
// 3. HALAMAN UTAMA 2: GARASI MOTOR (#/garasi & #/garasi/:id)
// ==========================================
async function renderGarasiList() {
    updateBottomNav('garasi');
    const motorsData = await fetchData('/api/motor', 'motor', null, true);
    const motors = Array.isArray(motorsData) ? motorsData : [motorsData];

    if (!motors.some(m => m.id === activeMotorId) && motors[0]) {
        setActiveMotorId(motors[0].id);
    }

    appContent.innerHTML = `
        <!-- Top App Bar -->
        <div class="flex items-start justify-between mt-2 mb-5">
            <div>
                <h1 class="text-2xl font-bold text-[#F5F3EE] tracking-tight">Garasi Motor</h1>
                <p class="text-xs text-[#ADB6B8] mt-0.5">Kelola motor & histori perawatan terpisah.</p>
            </div>
            <button type="button" id="btn-add-motor" class="h-[42px] px-3.5 rounded-2xl bg-[#DEC99F] text-[#0C1014] text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-[#DEC99F]/20 active:scale-95 transition-all">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span>Tambah Motor</span>
            </button>
        </div>

        <!-- Daftar Motor di Garasi -->
        <div class="space-y-4">
            ${motors.map(motor => {
                const isActive = motor.id === activeMotorId;
                return `
                <div class="${isActive ? 'gold-card' : 'glass-card'} rounded-2xl p-4 relative overflow-hidden transition-all">
                    <div class="flex items-start justify-between">
                        <a href="#/garasi/${motor.id}" class="flex-1 pr-2 group">
                            <div class="flex items-center space-x-2 mb-1">
                                <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                    isActive ? 'bg-[#DEC99F] text-[#0C1014]' : 'bg-[#E4ECE7]/10 text-[#ADB6B8]'
                                }">
                                    ${isActive ? '✓ Motor Aktif' : 'Cadangan'}
                                </span>
                                <span class="text-[11px] text-[#ADB6B8]">${esc(motor.tahun)}</span>
                            </div>
                            <h3 class="text-lg font-bold text-[#F5F3EE] group-hover:text-[#DEC99F] transition-colors">${esc(motor.nama)}</h3>
                            <p class="text-xs text-[#ADB6B8] mt-0.5">${esc(motor.plat)} • ${esc(motor.tipe_mesin || '160cc eSP+')}</p>
                        </a>
                        <a href="#/garasi/${motor.id}" class="w-24 h-16 flex items-center justify-center shrink-0 rounded-xl bg-[#0C1014]/30 overflow-hidden p-1">
                            <img src="${motor.gambar_url || 'images/motor-adv.png'}" alt="${esc(motor.nama)}" class="max-h-full max-w-full object-contain drop-shadow-md rounded-lg" onerror="this.src='images/motor-adv.png'">
                        </a>
                    </div>

                    <!-- Statistik Ringkas per Motor -->
                    <div class="grid grid-cols-3 gap-2 pt-3 mt-3 border-t border-[#E4ECE7]/10 text-left">
                        <div>
                            <p class="text-[10px] text-[#ADB6B8]">KM Terakhir</p>
                            <p class="text-xs font-bold text-[#F5F3EE] mt-0.5">${esc(motor.odometer || '0 KM')}</p>
                        </div>
                        <div>
                            <p class="text-[10px] text-[#ADB6B8]">Riwayat Servis</p>
                            <p class="text-xs font-bold text-[#DEC99F] mt-0.5">${motor.jumlah_servis ?? 0} catatan</p>
                        </div>
                        <div>
                            <p class="text-[10px] text-[#ADB6B8]">Total Biaya</p>
                            <p class="text-xs font-bold text-[#F5F3EE] mt-0.5">${esc(motor.total_biaya_servis || 'Rp 0')}</p>
                        </div>
                    </div>

                    <!-- Action Buttons per Motor -->
                    <div class="flex items-center justify-between pt-3 mt-3 border-t border-[#E4ECE7]/10 space-x-2">
                        ${!isActive ? `
                            <button type="button" data-activate-motor="${motor.id}" class="btn-activate-motor flex-1 py-2 rounded-xl bg-[#DEC99F] text-[#0C1014] text-xs font-bold active:scale-95 transition-all">
                                Jadikan Motor Aktif
                            </button>
                        ` : `
                            <a href="#/riwayat" class="flex-1 py-2 rounded-xl bg-[#DEC99F]/20 border border-[#DEC99F]/40 text-[#DEC99F] text-xs font-semibold text-center active:scale-95 transition-all">
                                Lihat Riwayat Servis
                            </a>
                        `}
                        <button type="button" data-edit-motor="${motor.id}" class="btn-edit-motor px-3 py-2 rounded-xl glass-card text-xs font-medium text-[#DEC99F] hover:border-[#DEC99F]/40 active:scale-95 transition-all">
                            Edit / Foto
                        </button>
                        ${motors.length > 1 ? `
                        <button type="button" data-delete-motor="${motor.id}" data-delete-nama="${esc(motor.nama)}" class="btn-delete-motor w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 text-[#F08A7E] flex items-center justify-center active:scale-95 transition-all" aria-label="Hapus motor">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            </svg>
                        </button>
                        ` : ''}
                    </div>
                </div>
                `;
            }).join('')}
        </div>
    `;

    document.getElementById('btn-add-motor').onclick = () => openMotorFormModal(null);

    document.querySelectorAll('.btn-edit-motor').forEach(btn => {
        btn.onclick = () => {
            const id = parseInt(btn.getAttribute('data-edit-motor'));
            const m = motors.find(x => x.id === id);
            if (m) openMotorFormModal(m);
        };
    });

    document.querySelectorAll('.btn-activate-motor').forEach(btn => {
        btn.onclick = () => {
            const id = parseInt(btn.getAttribute('data-activate-motor'));
            setActiveMotorId(id);
            showToast('Motor aktif berhasil diganti');
            renderGarasiList();
        };
    });

    document.querySelectorAll('.btn-delete-motor').forEach(btn => {
        btn.onclick = () => {
            const id = parseInt(btn.getAttribute('data-delete-motor'));
            const nama = btn.getAttribute('data-delete-nama');
            openDeleteConfirmModal({
                title: `Hapus ${nama}?`,
                subtitle: `Motor "${nama}" beserta seluruh catatan riwayat servisnya akan dihapus dari garasi.`,
                onConfirm: async () => {
                    await deleteMotorData(id);
                    if (activeMotorId === id) {
                        const remaining = motors.find(m => m.id !== id);
                        if (remaining) setActiveMotorId(remaining.id);
                    }
                    showToast(`${nama} dihapus dari garasi`);
                    renderGarasiList();
                }
            });
        };
    });
}

// Halaman Detail Motor (#/garasi/:id)
async function renderGarasiDetail(id) {
    updateBottomNav('garasi');
    const motor = await fetchData('/api/motor', 'motor', id, true);
    const isActive = parseInt(motor.id) === activeMotorId;
    const riwayatMotor = Array.isArray(motor.riwayat) ? motor.riwayat : [];

    appContent.innerHTML = `
        <!-- Top App Bar -->
        <div class="flex items-center mt-2 mb-5">
            <a href="#/garasi" class="w-[42px] h-[42px] rounded-2xl bg-[#E4ECE7]/[0.07] border border-[#E4ECE7]/[0.15] flex items-center justify-center text-[#F5F3EE] hover:bg-[#E4ECE7]/[0.12] active:scale-95 transition-all" aria-label="Kembali">
                <svg class="w-5 h-5 text-[#F5F3EE]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 19l-7-7 7-7"/>
                </svg>
            </a>
            <h1 class="text-base font-bold text-[#F5F3EE] ml-3.5 flex-1 truncate">Detail Motor</h1>
            <button type="button" id="btn-edit-motor-detail" class="h-[42px] px-3.5 rounded-2xl glass-card border border-[#DEC99F]/40 text-[#DEC99F] text-xs font-bold mr-2 active:scale-95 transition-all">
                Edit / Foto
            </button>
            ${!isActive ? `
                <button type="button" id="btn-set-active-detail" class="h-[42px] px-3.5 rounded-2xl bg-[#DEC99F] text-[#0C1014] text-xs font-bold active:scale-95 transition-all">
                    Pilih Aktif
                </button>
            ` : ''}
        </div>

        <!-- Hero Motor Card -->
        <div class="gold-card rounded-2xl p-5 mb-4 relative overflow-hidden">
            <p class="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#DEC99F]">SPESIFIKASI KENDARAAN</p>
            <h2 class="text-2xl font-bold text-[#F5F3EE] mt-0.5">${esc(motor.nama)}</h2>
            <p class="text-xs text-[#ADB6B8] mt-1">${esc(motor.plat)} • Tahun ${esc(motor.tahun)}</p>
            <div class="w-full h-40 flex items-center justify-center my-3 rounded-xl bg-[#0C1014]/30 overflow-hidden p-2">
                <img src="${motor.gambar_url || 'images/motor-adv.png'}" alt="${esc(motor.nama)}" class="max-h-full max-w-full object-contain drop-shadow-lg rounded-lg" onerror="this.src='images/motor-adv.png'">
            </div>
            <div class="grid grid-cols-2 gap-3 pt-3 border-t border-[#E4ECE7]/15">
                <div>
                    <p class="text-[11px] text-[#ADB6B8]">Tipe Mesin</p>
                    <p class="text-xs font-semibold text-[#F5F3EE] mt-0.5">${esc(motor.tipe_mesin || '160cc eSP+ Matic')}</p>
                </div>
                <div>
                    <p class="text-[11px] text-[#ADB6B8]">Masa Berlaku STNK</p>
                    <p class="text-xs font-semibold text-[#DEC99F] mt-0.5">${esc(motor.pajak_stnk || '12 Oktober 2027')}</p>
                </div>
            </div>
        </div>

        <!-- Ringkasan Perawatan Motor Ini -->
        <div class="glass-card rounded-2xl p-4 mb-5 grid grid-cols-3 gap-2 text-center">
            <div>
                <p class="text-[10px] text-[#ADB6B8]">KM Terakhir</p>
                <p class="text-xs font-bold text-[#F5F3EE] mt-1">${esc(motor.odometer)}</p>
            </div>
            <div class="border-x border-[#E4ECE7]/10">
                <p class="text-[10px] text-[#ADB6B8]">Total Servis</p>
                <p class="text-xs font-bold text-[#DEC99F] mt-1">${motor.jumlah_servis ?? riwayatMotor.length} kali</p>
            </div>
            <div>
                <p class="text-[10px] text-[#ADB6B8]">Akumulasi Biaya</p>
                <p class="text-xs font-bold text-[#F5F3EE] mt-1">${esc(motor.total_biaya_servis || 'Rp 0')}</p>
            </div>
        </div>

        <!-- Daftar Riwayat Khusus Motor Ini -->
        <div class="flex items-center justify-between mb-3 px-1">
            <h3 class="text-sm font-bold text-[#F5F3EE]">Riwayat servis ${esc(motor.nama)}</h3>
        </div>
        <div class="space-y-2.5">
            ${riwayatMotor.map(r => `
                <a href="#/riwayat/${r.id}" class="glass-card rounded-2xl p-3.5 flex items-center justify-between hover:border-[#DEC99F]/40 transition-all">
                    <div>
                        <h4 class="text-xs font-semibold text-[#F5F3EE]">${esc(r.jenis_servis)}</h4>
                        <p class="text-[11px] text-[#ADB6B8] mt-0.5">${esc(r.tanggal_servis)} • ${esc(r.jarak_tempuh_km)}</p>
                    </div>
                    <span class="text-xs font-bold text-[#DEC99F]">${esc(r.total_biaya)}</span>
                </a>
            `).join('')}
        </div>
    `;

    document.getElementById('btn-edit-motor-detail').onclick = () => openMotorFormModal(motor, true);

    const setActBtn = document.getElementById('btn-set-active-detail');
    if (setActBtn) {
        setActBtn.onclick = () => {
            setActiveMotorId(motor.id);
            showToast(`${motor.nama} dijadikan motor aktif`);
            renderGarasiDetail(motor.id);
        };
    }
}

// Modal Tambah / Edit Motor + Upload Foto Motor Sendiri dari Galeri/Laptop
function openMotorFormModal(existingMotor = null, fromDetail = false) {
    const container = getModalContainer();
    const isEdit = Boolean(existingMotor);
    const inputCls = 'w-full bg-[#0C1014]/60 border border-[#E4ECE7]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#F5F3EE] placeholder-[#ADB6B8] outline-none focus:border-[#DEC99F]/60 select-text';
    const labelCls = 'block text-[11px] font-semibold text-[#DEC99F] mb-1.5';

    let selectedImageDataUrl = existingMotor?.gambar_url || 'images/motor-adv.png';

    container.innerHTML = `
        <div id="motor-modal-backdrop" class="fixed inset-0 bg-black/75 backdrop-blur-sm z-[999] flex items-end justify-center transition-opacity duration-200 opacity-0">
            <form id="motor-form" class="w-full max-w-[390px] bg-[#151D22] border-t border-[#E4ECE7]/20 rounded-t-[28px] p-5 shadow-2xl transform transition-transform duration-200 translate-y-full max-h-[90vh] overflow-y-auto">
                <div class="w-12 h-1 bg-[#E4ECE7]/25 rounded-full mx-auto mb-3"></div>
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h3 class="text-base font-bold text-[#F5F3EE]">${isEdit ? 'Edit Data & Foto Motor' : 'Tambah Motor Baru'}</h3>
                        <p class="text-[11px] text-[#ADB6B8]">Unggah foto motor kamu sendiri dari perangkat</p>
                    </div>
                    <button type="button" id="motor-close-btn" class="w-8 h-8 rounded-full bg-[#E4ECE7]/10 text-[#ADB6B8] text-lg leading-none">&times;</button>
                </div>

                <!-- Upload Foto Motor Sendiri -->
                <div class="mb-4">
                    <label class="${labelCls}">Foto Motor</label>
                    <div class="glass-card rounded-2xl p-3 flex items-center space-x-3.5">
                        <div class="w-24 h-16 rounded-xl bg-[#0C1014]/60 border border-[#E4ECE7]/10 flex items-center justify-center overflow-hidden shrink-0 p-1">
                            <img id="motor-img-preview" src="${esc(selectedImageDataUrl)}" alt="Preview Motor" class="max-h-full max-w-full object-contain rounded-lg" onerror="this.src='images/motor-adv.png'">
                        </div>
                        <div class="flex-1 min-w-0">
                            <label for="motor-file-input" class="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#DEC99F] text-[#0C1014] text-xs font-bold cursor-pointer active:scale-95 transition-all">
                                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                                </svg>
                                <span>Pilih Foto dari Perangkat</span>
                            </label>
                            <input id="motor-file-input" type="file" accept="image/*" class="hidden">
                            <p id="motor-file-status" class="text-[10px] text-[#ADB6B8] mt-1.5 truncate">Mendukung JPG, PNG, WebP</p>
                        </div>
                    </div>
                </div>

                <div class="space-y-3 mb-5">
                    <div><label class="${labelCls}">Nama / Tipe Motor</label><input name="nama" required value="${esc(existingMotor?.nama || '')}" placeholder="Contoh: Honda CBR 250RR / Yamaha NMAX" class="${inputCls}"></div>
                    <div class="grid grid-cols-2 gap-3">
                        <div><label class="${labelCls}">Plat Nomor</label><input name="plat" required value="${esc(existingMotor?.plat || '')}" placeholder="H 1234 XYZ" class="${inputCls}"></div>
                        <div><label class="${labelCls}">Tahun Kendaraan</label><input name="tahun" type="number" required value="${esc(existingMotor?.tahun || '2025')}" class="${inputCls}"></div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div><label class="${labelCls}">Kilometer Saat Ini</label><input name="odometer" required value="${esc(existingMotor?.odometer || '')}" placeholder="15.000 KM" class="${inputCls}"></div>
                        <div><label class="${labelCls}">Spesifikasi Mesin</label><input name="tipe_mesin" value="${esc(existingMotor?.tipe_mesin || '155cc – 250cc')}" class="${inputCls}"></div>
                    </div>
                    <div><label class="${labelCls}">Masa Berlaku Pajak / STNK</label><input name="pajak_stnk" value="${esc(existingMotor?.pajak_stnk || '15 Agustus 2028')}" placeholder="15 Agustus 2028" class="${inputCls}"></div>
                </div>

                <div class="flex items-center space-x-3">
                    <button type="button" id="motor-cancel-btn" class="w-1/3 py-3 rounded-xl border border-[#E4ECE7]/20 text-xs font-semibold text-[#ADB6B8] active:scale-95 transition-all">Batal</button>
                    <button type="submit" id="motor-save-btn" class="w-2/3 py-3 rounded-xl bg-[#DEC99F] text-[#0C1014] text-xs font-bold shadow-lg shadow-[#DEC99F]/20 active:scale-95 transition-all">${isEdit ? 'Simpan Perubahan' : 'Simpan ke Garasi'}</button>
                </div>
            </form>
        </div>
    `;

    const backdrop = document.getElementById('motor-modal-backdrop');
    const form = document.getElementById('motor-form');
    requestAnimationFrame(() => requestAnimationFrame(() => {
        backdrop.classList.remove('opacity-0');
        form.classList.remove('translate-y-full');
    }));

    // Handle file input change -> compress & live preview
    const fileInput = document.getElementById('motor-file-input');
    const previewImg = document.getElementById('motor-img-preview');
    const statusText = document.getElementById('motor-file-status');

    fileInput.onchange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        statusText.textContent = 'Memproses gambar...';
        try {
            selectedImageDataUrl = await compressImageFileToDataUrl(file, 520);
            previewImg.src = selectedImageDataUrl;
            statusText.textContent = `✓ ${file.name}`;
            statusText.className = 'text-[10px] text-[#8FC9B5] font-semibold mt-1.5 truncate';
        } catch (err) {
            statusText.textContent = 'Gagal memuat gambar';
            showToast(err.message, 'error');
        }
    };

    const closeModal = () => {
        backdrop.classList.add('opacity-0');
        form.classList.add('translate-y-full');
        setTimeout(() => { container.innerHTML = ''; }, 200);
    };
    document.getElementById('motor-close-btn').onclick = closeModal;
    document.getElementById('motor-cancel-btn').onclick = closeModal;
    backdrop.onclick = (e) => { if (e.target === backdrop) closeModal(); };

    form.onsubmit = async (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('motor-save-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Menyimpan...';
        const fd = new FormData(form);
        const payload = {
            gambar_url: selectedImageDataUrl
        };
        ['nama', 'plat', 'tahun', 'odometer', 'tipe_mesin', 'pajak_stnk'].forEach(k => {
            payload[k] = String(fd.get(k) || '').trim();
        });
        try {
            if (isEdit) {
                await updateMotorData(existingMotor.id, payload);
                closeModal();
                showToast(`Data & foto ${payload.nama} diperbarui!`);
                if (fromDetail) renderGarasiDetail(existingMotor.id);
                else renderGarasiList();
            } else {
                const created = await createMotorData(payload);
                if (created && created.id) setActiveMotorId(created.id);
                closeModal();
                showToast(`${payload.nama} berhasil ditambahkan ke garasi!`);
                renderGarasiList();
            }
        } catch (err) {
            saveBtn.disabled = false;
            saveBtn.textContent = isEdit ? 'Simpan Perubahan' : 'Simpan ke Garasi';
            showToast(err.message || 'Gagal menyimpan motor', 'error');
        }
    };
}

// ==========================================
// 4. HALAMAN UTAMA 3: KATALOG SUKU CADANG (#/katalog & #/katalog/:id)
// ==========================================
let katalogListCache = [];
let filterState = {
    search: '',
    kategori: 'all',
    sort: 'default',
    harga: 'all'
};

function hasActiveFilter() {
    return filterState.kategori !== 'all' ||
           filterState.sort !== 'default' ||
           filterState.harga !== 'all' ||
           Boolean(filterState.search);
}

function getFilteredKatalog() {
    let result = [...katalogListCache];
    if (filterState.search) {
        const q = filterState.search.toLowerCase().trim();
        result = result.filter(item =>
            item.nama_part.toLowerCase().includes(q) ||
            item.subjudul.toLowerCase().includes(q) ||
            (item.kategori && item.kategori.toLowerCase().includes(q))
        );
    }
    if (filterState.kategori !== 'all') {
        result = result.filter(item => item.kategori === filterState.kategori);
    }
    if (filterState.harga === 'under100') {
        result = result.filter(item => (item.harga_min || 0) < 100000);
    } else if (filterState.harga === 'above100') {
        result = result.filter(item => (item.harga_min || 0) >= 100000);
    }
    if (filterState.sort === 'nama-asc') {
        result.sort((a, b) => a.nama_part.localeCompare(b.nama_part));
    } else if (filterState.sort === 'harga-asc') {
        result.sort((a, b) => (a.harga_min || 0) - (b.harga_min || 0));
    } else if (filterState.sort === 'harga-desc') {
        result.sort((a, b) => (b.harga_min || 0) - (a.harga_min || 0));
    }
    return result;
}

function updateKatalogView() {
    const grid = document.getElementById('katalog-grid');
    const countEl = document.getElementById('katalog-count');
    const activeFiltersContainer = document.getElementById('active-filters-bar');
    const filterBtn = document.getElementById('katalog-filter-btn');
    if (!grid) return;

    const filtered = getFilteredKatalog();
    if (countEl) countEl.textContent = `${filtered.length} part`;

    if (filterBtn) {
        const isFiltered = filterState.kategori !== 'all' || filterState.sort !== 'default' || filterState.harga !== 'all';
        if (isFiltered) {
            filterBtn.className = "w-12 h-12 rounded-2xl bg-[#DEC99F] text-[#0C1014] flex items-center justify-center shrink-0 shadow-lg shadow-[#DEC99F]/20 relative active:scale-95 transition-all";
            filterBtn.innerHTML = `
                <svg class="w-5 h-5 text-[#0C1014]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h4m4 0h8M8 6v4M4 16h12m4 0h0M16 14v4"/></svg>
                <span class="absolute -top-1 -right-1 w-3 h-3 bg-[#E2C995] border-2 border-[#0C1014] rounded-full"></span>
            `;
        } else {
            filterBtn.className = "w-12 h-12 gold-card rounded-2xl flex items-center justify-center shrink-0 text-[#DEC99F] active:scale-95 transition-transform";
            filterBtn.innerHTML = `
                <svg class="w-5 h-5 text-[#DEC99F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h4m4 0h8M8 6v4M4 16h12m4 0h0M16 14v4"/></svg>
            `;
        }
    }

    if (activeFiltersContainer) {
        const activeChips = [];
        if (filterState.kategori !== 'all') {
            activeChips.push({ label: `Kategori: ${filterState.kategori}`, clear: () => { filterState.kategori = 'all'; updateKatalogView(); } });
        }
        if (filterState.sort !== 'default') {
            const sortLabel = filterState.sort === 'nama-asc' ? 'A – Z' : filterState.sort === 'harga-asc' ? 'Harga Termurah' : 'Harga Termahal';
            activeChips.push({ label: `Urut: ${sortLabel}`, clear: () => { filterState.sort = 'default'; updateKatalogView(); } });
        }
        if (filterState.harga !== 'all') {
            const hargaLabel = filterState.harga === 'under100' ? '< Rp 100rb' : '≥ Rp 100rb';
            activeChips.push({ label: `Harga: ${hargaLabel}`, clear: () => { filterState.harga = 'all'; updateKatalogView(); } });
        }

        if (activeChips.length > 0) {
            activeFiltersContainer.className = "h-scroll flex items-center space-x-2 pb-2 mb-3 -mt-2 text-xs";
            activeFiltersContainer.innerHTML = `
                ${activeChips.map((chip, idx) => `
                    <button data-chip-idx="${idx}" class="chip-remove flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#DEC99F]/15 border border-[#DEC99F]/30 text-[#DEC99F] shrink-0 text-[11px] font-medium active:scale-95 transition-all">
                        <span>${chip.label}</span>
                        <span class="text-sm leading-none ml-1 opacity-70 hover:opacity-100">&times;</span>
                    </button>
                `).join('')}
                <button id="chip-reset-all" class="text-[11px] text-[#ADB6B8] hover:text-[#DEC99F] underline shrink-0 px-2">Reset</button>
            `;
            bindHorizontalScrollContainers();
            activeFiltersContainer.querySelectorAll('.chip-remove').forEach(btn => {
                const idx = parseInt(btn.getAttribute('data-chip-idx'));
                btn.onclick = () => activeChips[idx].clear();
            });
            const resetBtn = document.getElementById('chip-reset-all');
            if (resetBtn) {
                resetBtn.onclick = () => {
                    filterState.kategori = 'all';
                    filterState.sort = 'default';
                    filterState.harga = 'all';
                    updateKatalogView();
                };
            }
        } else {
            activeFiltersContainer.className = "hidden";
            activeFiltersContainer.innerHTML = '';
        }
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-span-2 text-center py-10 glass-card rounded-2xl p-6">
                <p class="text-sm font-semibold text-[#F5F3EE] mb-1">Suku cadang tidak ditemukan</p>
                <p class="text-xs text-[#ADB6B8] mb-4">Coba sesuaikan kata kunci atau filter pencarian.</p>
                <button id="btn-reset-filter-empty" class="px-4 py-2 rounded-xl bg-[#DEC99F] text-[#0C1014] text-xs font-semibold active:scale-95 transition-all">
                    Reset Semua Filter
                </button>
            </div>
        `;
        const resetEmpty = document.getElementById('btn-reset-filter-empty');
        if (resetEmpty) {
            resetEmpty.onclick = () => {
                filterState.search = '';
                filterState.kategori = 'all';
                filterState.sort = 'default';
                filterState.harga = 'all';
                const searchInput = document.getElementById('katalog-search-input');
                if (searchInput) searchInput.value = '';
                updateKatalogView();
            };
        }
    } else {
        grid.innerHTML = renderKatalogGridCards(filtered);
    }
}

function openFilterModal() {
    const modalContainer = getModalContainer();
    let draft = { ...filterState };

    const categories = [
        { id: 'all', label: 'Semua' },
        { id: 'Pelumas', label: 'Pelumas' },
        { id: 'Pengapian', label: 'Pengapian' },
        { id: 'Pengereman', label: 'Pengereman' },
        { id: 'Roda & Ban', label: 'Roda & Ban' }
    ];
    const sortOptions = [
        { id: 'default', label: 'Rekomendasi (Default)' },
        { id: 'nama-asc', label: 'Nama (A – Z)' },
        { id: 'harga-asc', label: 'Harga: Termurah' },
        { id: 'harga-desc', label: 'Harga: Termahal' }
    ];
    const priceOptions = [
        { id: 'all', label: 'Semua Harga' },
        { id: 'under100', label: '< Rp 100.000' },
        { id: 'above100', label: '≥ Rp 100.000' }
    ];

    modalContainer.innerHTML = `
        <div id="filter-modal-backdrop" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999] flex items-end justify-center transition-opacity duration-200 opacity-0">
            <div id="filter-modal-sheet" class="w-full max-w-[390px] bg-[#151D22] border-t border-[#E4ECE7]/20 rounded-t-[28px] p-5 shadow-2xl transform transition-transform duration-200 translate-y-full max-h-[85vh] overflow-y-auto">
                <div class="w-12 h-1 bg-[#E4ECE7]/25 rounded-full mx-auto mb-4"></div>
                <div class="flex items-center justify-between mb-5 pb-3 border-b border-[#E4ECE7]/10">
                    <div>
                        <h3 class="text-base font-bold text-[#F5F3EE]">Filter Suku Cadang</h3>
                        <p class="text-[11px] text-[#ADB6B8]">Sesuaikan part sesuai kebutuhan motor Anda</p>
                    </div>
                    <button id="modal-close-btn" class="w-8 h-8 rounded-full bg-[#E4ECE7]/10 flex items-center justify-center text-[#ADB6B8] hover:text-[#F5F3EE]">&times;</button>
                </div>

                <div class="mb-5">
                    <label class="block text-xs font-semibold text-[#DEC99F] uppercase tracking-wider mb-2.5">Kategori Part</label>
                    <div class="flex flex-wrap gap-2">
                        ${categories.map(c => `
                            <button type="button" data-cat="${c.id}" class="cat-pill px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${draft.kategori === c.id ? 'bg-[#DEC99F] text-[#0C1014] font-semibold shadow-sm' : 'glass-card text-[#ADB6B8] hover:text-[#F5F3EE]'}">${c.label}</button>
                        `).join('')}
                    </div>
                </div>

                <div class="mb-5">
                    <label class="block text-xs font-semibold text-[#DEC99F] uppercase tracking-wider mb-2.5">Rentang Harga</label>
                    <div class="flex flex-wrap gap-2">
                        ${priceOptions.map(p => `
                            <button type="button" data-price="${p.id}" class="price-pill px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${draft.harga === p.id ? 'bg-[#DEC99F] text-[#0C1014] font-semibold shadow-sm' : 'glass-card text-[#ADB6B8] hover:text-[#F5F3EE]'}">${p.label}</button>
                        `).join('')}
                    </div>
                </div>

                <div class="mb-6">
                    <label class="block text-xs font-semibold text-[#DEC99F] uppercase tracking-wider mb-2.5">Urutkan Berdasarkan</label>
                    <div class="grid grid-cols-2 gap-2">
                        ${sortOptions.map(s => `
                            <button type="button" data-sort="${s.id}" class="sort-pill px-3 py-2 rounded-xl text-xs font-medium text-left transition-all ${draft.sort === s.id ? 'bg-[#DEC99F] text-[#0C1014] font-semibold shadow-sm' : 'glass-card text-[#ADB6B8] hover:text-[#F5F3EE]'}">${s.label}</button>
                        `).join('')}
                    </div>
                </div>

                <div class="flex items-center space-x-3 pt-3 border-t border-[#E4ECE7]/10">
                    <button type="button" id="modal-reset-btn" class="w-1/3 py-3 rounded-xl border border-[#E4ECE7]/20 text-xs font-semibold text-[#ADB6B8] active:scale-95 transition-all">Reset</button>
                    <button type="button" id="modal-apply-btn" class="w-2/3 py-3 rounded-xl bg-[#DEC99F] text-[#0C1014] text-xs font-bold shadow-lg shadow-[#DEC99F]/20 active:scale-95 transition-all">Terapkan Filter</button>
                </div>
            </div>
        </div>
    `;

    const backdrop = document.getElementById('filter-modal-backdrop');
    const sheet = document.getElementById('filter-modal-sheet');
    requestAnimationFrame(() => requestAnimationFrame(() => {
        backdrop.classList.remove('opacity-0');
        sheet.classList.remove('translate-y-full');
    }));

    document.querySelectorAll('.cat-pill').forEach(btn => {
        btn.onclick = () => {
            draft.kategori = btn.getAttribute('data-cat');
            document.querySelectorAll('.cat-pill').forEach(b => {
                const isActive = b.getAttribute('data-cat') === draft.kategori;
                b.className = `cat-pill px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${isActive ? 'bg-[#DEC99F] text-[#0C1014] font-semibold shadow-sm' : 'glass-card text-[#ADB6B8] hover:text-[#F5F3EE]'}`;
            });
        };
    });
    document.querySelectorAll('.price-pill').forEach(btn => {
        btn.onclick = () => {
            draft.harga = btn.getAttribute('data-price');
            document.querySelectorAll('.price-pill').forEach(b => {
                const isActive = b.getAttribute('data-price') === draft.harga;
                b.className = `price-pill px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${isActive ? 'bg-[#DEC99F] text-[#0C1014] font-semibold shadow-sm' : 'glass-card text-[#ADB6B8] hover:text-[#F5F3EE]'}`;
            });
        };
    });
    document.querySelectorAll('.sort-pill').forEach(btn => {
        btn.onclick = () => {
            draft.sort = btn.getAttribute('data-sort');
            document.querySelectorAll('.sort-pill').forEach(b => {
                const isActive = b.getAttribute('data-sort') === draft.sort;
                b.className = `sort-pill px-3 py-2 rounded-xl text-xs font-medium text-left transition-all ${isActive ? 'bg-[#DEC99F] text-[#0C1014] font-semibold shadow-sm' : 'glass-card text-[#ADB6B8] hover:text-[#F5F3EE]'}`;
            });
        };
    });

    const closeModal = () => {
        backdrop.classList.add('opacity-0');
        sheet.classList.add('translate-y-full');
        setTimeout(() => { modalContainer.innerHTML = ''; }, 200);
    };
    document.getElementById('modal-close-btn').onclick = closeModal;
    backdrop.onclick = (e) => { if (e.target === backdrop) closeModal(); };
    document.getElementById('modal-reset-btn').onclick = () => {
        filterState.kategori = 'all';
        filterState.sort = 'default';
        filterState.harga = 'all';
        closeModal();
        updateKatalogView();
    };
    document.getElementById('modal-apply-btn').onclick = () => {
        filterState.kategori = draft.kategori;
        filterState.sort = draft.sort;
        filterState.harga = draft.harga;
        closeModal();
        updateKatalogView();
    };
}

async function renderKatalogList() {
    updateBottomNav('katalog');
    katalogListCache = await fetchData('/api/katalog-part', 'katalog');
    const isFiltered = hasActiveFilter();

    appContent.innerHTML = `
        <div class="mt-2 mb-4">
            <h1 class="text-2xl font-bold text-[#F5F3EE] tracking-tight">Katalog Suku Cadang</h1>
            <p class="text-xs text-[#ADB6B8] mt-0.5">Kenali part, jaga performa.</p>
        </div>

        <div class="flex items-center space-x-2.5 mb-3">
            <div class="relative flex-1 glass-card rounded-2xl h-12 flex items-center px-4">
                <svg class="w-4 h-4 text-[#ADB6B8] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input type="text" id="katalog-search-input" value="${esc(filterState.search || '')}" placeholder="Cari suku cadang..." class="w-full bg-transparent text-xs text-[#F5F3EE] placeholder-[#ADB6B8] outline-none ml-2.5">
            </div>

            <button id="katalog-filter-btn" class="${isFiltered ? 'w-12 h-12 rounded-2xl bg-[#DEC99F] text-[#0C1014] flex items-center justify-center shrink-0 shadow-lg shadow-[#DEC99F]/20 relative active:scale-95 transition-all' : 'w-12 h-12 gold-card rounded-2xl flex items-center justify-center shrink-0 text-[#DEC99F] active:scale-95 transition-transform'}" aria-label="Filter">
                <svg class="w-5 h-5 ${isFiltered ? 'text-[#0C1014]' : 'text-[#DEC99F]'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 8h4m4 0h8M8 6v4M4 16h12m4 0h0M16 14v4"/>
                </svg>
            </button>
        </div>

        <div id="active-filters-bar" class="hidden"></div>

        <div class="flex items-center justify-between mb-3 px-1 mt-2">
            <h3 class="text-base font-bold text-[#F5F3EE]">Part esensial</h3>
            <span id="katalog-count" class="text-xs text-[#ADB6B8] font-normal">${katalogListCache.length} part</span>
        </div>

        <div id="katalog-grid" class="grid grid-cols-2 gap-3.5">
            ${renderKatalogGridCards(getFilteredKatalog())}
        </div>
    `;

    const searchInput = document.getElementById('katalog-search-input');
    searchInput?.addEventListener('input', (e) => {
        filterState.search = e.target.value;
        updateKatalogView();
    });
    const filterBtn = document.getElementById('katalog-filter-btn');
    if (filterBtn) filterBtn.onclick = () => openFilterModal();
    updateKatalogView();
}

function renderKatalogGridCards(items) {
    return items.map(item => `
        <a href="#/katalog/${item.id}" class="glass-card hover:border-[#DEC99F]/40 transition-all active:scale-[0.98] rounded-2xl p-3 flex flex-col group">
            <div class="w-full h-36 rounded-xl bg-[#0C1014]/40 overflow-hidden flex items-center justify-center p-2 mb-3 relative">
                <img src="${item.gambar_url}" alt="${esc(item.nama_part)}" class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-sm" onerror="this.src='images/ban.png'">
                ${item.kategori ? `<span class="absolute top-2 left-2 text-[9px] font-medium px-2 py-0.5 rounded-md bg-[#0C1014]/70 border border-[#E4ECE7]/10 text-[#DEC99F]">${esc(item.kategori)}</span>` : ''}
            </div>
            <h4 class="text-sm font-semibold text-[#F5F3EE] group-hover:text-[#DEC99F] transition-colors">${esc(item.nama_part)}</h4>
            <p class="text-[11px] text-[#ADB6B8] mt-1 line-clamp-2 leading-snug">${esc(item.subjudul)}</p>
            ${item.kisaran_harga ? `<p class="text-[11px] font-semibold text-[#DEC99F] mt-2 pt-2 border-t border-[#E4ECE7]/10">${esc(item.kisaran_harga.split('–')[0].trim())}+</p>` : ''}
        </a>
    `).join('');
}

async function renderKatalogDetail(id) {
    updateBottomNav('katalog');
    const item = await fetchData('/api/katalog-part', 'katalog', id);

    appContent.innerHTML = `
        <div class="flex items-center mt-2 mb-5">
            <a href="#/katalog" class="w-[42px] h-[42px] rounded-2xl bg-[#E4ECE7]/[0.07] border border-[#E4ECE7]/[0.15] flex items-center justify-center text-[#F5F3EE] hover:bg-[#E4ECE7]/[0.12] active:scale-95 transition-all" aria-label="Kembali">
                <svg class="w-5 h-5 text-[#F5F3EE]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 19l-7-7 7-7"/></svg>
            </a>
            <h1 class="text-base font-bold text-[#F5F3EE] ml-3.5">Detail Suku Cadang</h1>
        </div>

        <div class="glass-card rounded-2xl p-4 mb-5">
            <div class="w-full h-56 rounded-xl bg-[#0C1014]/50 overflow-hidden flex items-center justify-center p-4 mb-4">
                <img src="${item.gambar_url}" alt="${esc(item.nama_part)}" class="max-h-full max-w-full object-contain drop-shadow-lg" onerror="this.src='images/ban.png'">
            </div>
            <p class="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#DEC99F]">INFORMASI PART</p>
            <h2 class="text-2xl font-bold text-[#F5F3EE] mt-0.5">${esc(item.nama_part)}</h2>
            <p class="text-xs text-[#ADB6B8] mt-1">${esc(item.subjudul)}</p>
        </div>

        <h3 class="text-sm font-bold text-[#F5F3EE] mb-2.5 px-1">Spesifikasi</h3>
        <div class="glass-card rounded-2xl p-4 mb-4">
            <div class="grid grid-cols-2 gap-4 pb-3 border-b border-[#E4ECE7]/10">
                <div>
                    <p class="text-[11px] text-[#ADB6B8]">${esc(item.spesifikasi_label_1)}</p>
                    <p class="text-sm font-bold text-[#F5F3EE] mt-0.5">${esc(item.spesifikasi_nilai_1)}</p>
                </div>
                <div>
                    <p class="text-[11px] text-[#ADB6B8]">${esc(item.spesifikasi_label_2)}</p>
                    <p class="text-sm font-bold text-[#F5F3EE] mt-0.5">${esc(item.spesifikasi_nilai_2)}</p>
                </div>
            </div>
            <div class="pt-3">
                <p class="text-[11px] text-[#ADB6B8]">Kisaran Harga</p>
                <p class="text-lg font-bold text-[#DEC99F] mt-0.5">${esc(item.kisaran_harga)}</p>
            </div>
        </div>

        <div class="gold-card rounded-2xl p-4">
            <div class="flex items-center space-x-2 text-[#DEC99F] mb-1.5">
                <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 9v4m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
                <h4 class="text-xs font-bold uppercase tracking-wider text-[#DEC99F]">Masa Pakai Optimal</h4>
            </div>
            <p class="text-xs leading-relaxed text-[#ADB6B8] mt-1">${esc(item.masa_pakai_optimal)}</p>
        </div>
    `;
}

// ==========================================
// 5. HALAMAN UTAMA 4: DIREKTORI BENGKEL (#/bengkel & #/bengkel/:id)
// ==========================================
let bengkelSearchQuery = '';
let bengkelKategoriFilter = 'all';

async function renderBengkelList() {
    updateBottomNav('bengkel');
    const bengkelData = await fetchData('/api/bengkel', 'bengkel');
    const list = Array.isArray(bengkelData) ? bengkelData : [];

    const categories = ['all', 'Bengkel Resmi', 'Spesialis Ban & Oli', 'Spesialis CVT', 'Bengkel Umum'];

    const filtered = list.filter(b => {
        const matchCat = bengkelKategoriFilter === 'all' || b.kategori === bengkelKategoriFilter;
        const q = bengkelSearchQuery.toLowerCase().trim();
        const matchQ = !q ||
            b.nama_bengkel.toLowerCase().includes(q) ||
            b.alamat.toLowerCase().includes(q) ||
            b.layanan_utama.toLowerCase().includes(q);
        return matchCat && matchQ;
    });

    appContent.innerHTML = `
        <div class="mt-2 mb-4">
            <h1 class="text-2xl font-bold text-[#F5F3EE] tracking-tight">Bengkel Rekanan</h1>
            <p class="text-xs text-[#ADB6B8] mt-0.5">Rekomendasi bengkel resmi & spesialis terpercaya.</p>
        </div>

        <!-- Search Bengkel -->
        <div class="relative glass-card rounded-2xl h-12 flex items-center px-4 mb-3">
            <svg class="w-4 h-4 text-[#ADB6B8] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input type="text" id="bengkel-search-input" value="${esc(bengkelSearchQuery)}" placeholder="Cari nama bengkel, alamat, layanan..." class="w-full bg-transparent text-xs text-[#F5F3EE] placeholder-[#ADB6B8] outline-none ml-2.5">
        </div>

        <!-- Filter Kategori Bengkel (Scrollable dengan mouse wheel & drag) -->
        <div class="h-scroll flex items-center space-x-2 pb-2 mb-3">
            ${categories.map(cat => {
                const isAct = bengkelKategoriFilter === cat;
                return `
                <button type="button" data-bengkel-cat="${esc(cat)}" class="bengkel-cat-pill shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isAct ? 'bg-[#DEC99F] text-[#0C1014] font-semibold' : 'glass-card text-[#ADB6B8] hover:text-[#F5F3EE]'
                }">
                    ${cat === 'all' ? 'Semua' : esc(cat)}
                </button>`;
            }).join('')}
        </div>

        <!-- List Bengkel -->
        <div class="space-y-3">
            ${filtered.map(b => `
                <a href="#/bengkel/${b.id}" class="glass-card hover:border-[#DEC99F]/40 transition-all active:scale-[0.99] rounded-2xl p-4 block group">
                    <div class="flex items-start justify-between">
                        <div>
                            <span class="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#DEC99F]/15 border border-[#DEC99F]/30 text-[#DEC99F]">${esc(b.kategori)}</span>
                            <h3 class="text-sm font-bold text-[#F5F3EE] group-hover:text-[#DEC99F] transition-colors mt-2">${esc(b.nama_bengkel)}</h3>
                        </div>
                        <div class="flex items-center space-x-1 bg-[#0C1014]/60 px-2.5 py-1 rounded-xl border border-[#E4ECE7]/10">
                            <span class="text-xs text-[#DEC99F]">★</span>
                            <span class="text-xs font-bold text-[#F5F3EE]">${esc(b.rating)}</span>
                        </div>
                    </div>
                    <p class="text-xs text-[#ADB6B8] mt-1.5">${esc(b.alamat)}</p>
                    <div class="flex items-center justify-between pt-2.5 mt-2.5 border-t border-[#E4ECE7]/10 text-[11px]">
                        <span class="text-[#8FC9B5] font-medium">Buka: ${esc(b.jam_buka)}</span>
                        <span class="text-[#DEC99F] font-semibold">Lihat Detail →</span>
                    </div>
                </a>
            `).join('')}
        </div>
    `;

    bindHorizontalScrollContainers();

    const searchEl = document.getElementById('bengkel-search-input');
    searchEl?.addEventListener('input', (e) => {
        bengkelSearchQuery = e.target.value;
        renderBengkelList();
        const inputAfter = document.getElementById('bengkel-search-input');
        if (inputAfter) {
            inputAfter.focus();
            inputAfter.setSelectionRange(inputAfter.value.length, inputAfter.value.length);
        }
    });

    document.querySelectorAll('.bengkel-cat-pill').forEach(btn => {
        btn.onclick = () => {
            bengkelKategoriFilter = btn.getAttribute('data-bengkel-cat');
            renderBengkelList();
        };
    });
}

// Halaman Detail Bengkel (#/bengkel/:id)
async function renderBengkelDetail(id) {
    updateBottomNav('bengkel');
    const [b, motorsData] = await Promise.all([
        fetchData('/api/bengkel', 'bengkel', id),
        fetchData('/api/motor', 'motor')
    ]);
    const motors = Array.isArray(motorsData) ? motorsData : [motorsData];
    const activeMotor = motors.find(m => m.id === activeMotorId) || motors[0];

    appContent.innerHTML = `
        <div class="flex items-center mt-2 mb-5">
            <a href="#/bengkel" class="w-[42px] h-[42px] rounded-2xl bg-[#E4ECE7]/[0.07] border border-[#E4ECE7]/[0.15] flex items-center justify-center text-[#F5F3EE] hover:bg-[#E4ECE7]/[0.12] active:scale-95 transition-all" aria-label="Kembali">
                <svg class="w-5 h-5 text-[#F5F3EE]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 19l-7-7 7-7"/></svg>
            </a>
            <h1 class="text-base font-bold text-[#F5F3EE] ml-3.5">Detail Bengkel</h1>
        </div>

        <div class="gold-card rounded-2xl p-5 mb-4">
            <div class="flex items-center justify-between mb-1.5">
                <span class="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#DEC99F]">${esc(b.kategori)}</span>
                <span class="text-xs font-bold text-[#DEC99F]">★ ${esc(b.rating)} (${b.ulasan || 80} ulasan)</span>
            </div>
            <h2 class="text-xl font-bold text-[#F5F3EE] leading-snug">${esc(b.nama_bengkel)}</h2>
            <p class="text-xs text-[#ADB6B8] mt-1.5">${esc(b.alamat)}</p>
        </div>

        <div class="glass-card rounded-2xl p-4 mb-4 space-y-3">
            <div class="pb-3 border-b border-[#E4ECE7]/10">
                <p class="text-[11px] text-[#ADB6B8]">Layanan Unggulan</p>
                <p class="text-xs font-semibold text-[#F5F3EE] mt-0.5">${esc(b.layanan_utama)}</p>
            </div>
            <div class="grid grid-cols-2 gap-3 pb-3 border-b border-[#E4ECE7]/10">
                <div>
                    <p class="text-[11px] text-[#ADB6B8]">Jam Operasional</p>
                    <p class="text-xs font-bold text-[#8FC9B5] mt-0.5">${esc(b.jam_buka)}</p>
                </div>
                <div>
                    <p class="text-[11px] text-[#ADB6B8]">Kontak / Telepon</p>
                    <p class="text-xs font-bold text-[#F5F3EE] mt-0.5">${esc(b.telepon)}</p>
                </div>
            </div>
            <div>
                <p class="text-[11px] text-[#ADB6B8]">Estimasi Biaya Jasa</p>
                <p class="text-base font-bold text-[#DEC99F] mt-0.5">${esc(b.kisaran_jasa)}</p>
            </div>
        </div>

        <div class="glass-card rounded-2xl p-4 mb-5">
            <h4 class="text-xs font-bold uppercase tracking-wider text-[#DEC99F] mb-1">Keunggulan Bengkel</h4>
            <p class="text-xs leading-relaxed text-[#ADB6B8]">${esc(b.keunggulan)}</p>
        </div>
    `;
}

// ==========================================
// 6. HALAMAN UTAMA 5: PROFIL PENGEMBANG (#/profil)
// ==========================================
async function renderProfil() {
    updateBottomNav('profil');
    const profil = await fetchData('/api/profil', 'profil');

    appContent.innerHTML = `
        <div class="mt-2 mb-4">
            <h1 class="text-2xl font-bold text-[#F5F3EE] tracking-tight">Profil</h1>
            <p class="text-xs text-[#ADB6B8] mt-0.5">Di balik MotoCare</p>
        </div>

        <div class="flex flex-col items-center my-4">
            <div class="w-24 h-24 rounded-full p-[2px] bg-gradient-to-b from-[#DEC99F]/60 via-[#DEC99F]/20 to-transparent shadow-lg mb-2">
                <img src="${(profil.avatar_url || 'images/profile.jpg')}?v=13.0" alt="${esc(profil.nama)}" class="w-full h-full rounded-full object-cover" onerror="this.src='images/profile.jpg?v=13.0'">
            </div>
            <p class="text-xs font-medium text-[#DEC99F]">${esc(profil.peran || 'Pengembang aplikasi')}</p>
        </div>

        <div class="glass-card rounded-2xl p-4 mb-4">
            <p class="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#DEC99F] mb-3">IDENTITAS MAHASISWA</p>
            <div class="mb-3">
                <p class="text-[11px] text-[#ADB6B8]">Nama</p>
                <p class="text-sm font-semibold text-[#F5F3EE] mt-0.5">${esc(profil.nama || 'Ivandra Julio Chrishanto')}</p>
            </div>
            <div class="mb-3">
                <p class="text-[11px] text-[#ADB6B8]">NIM</p>
                <p class="text-sm font-semibold text-[#F5F3EE] mt-0.5">${esc(profil.nim || '21120124120034')}</p>
            </div>
            <div class="flex items-center justify-between">
                <p class="text-[11px] text-[#ADB6B8]">Kelas / Prodi</p>
                <p class="text-sm font-semibold text-[#F5F3EE]">${esc(profil.prodi || 'S1 Teknik Komputer')}</p>
            </div>
        </div>

        <div class="glass-card rounded-2xl p-4">
            <h3 class="text-sm font-bold text-[#F5F3EE] mb-1.5">Tentang MotoCare</h3>
            <p class="text-xs leading-relaxed text-[#ADB6B8]">${esc(profil.tentang)}</p>
            <div class="flex items-center justify-between mt-4 pt-3 border-t border-[#E4ECE7]/10">
                <span class="px-3 py-1 rounded-full border border-[#DEC99F]/30 bg-[#D8BF8D]/[0.10] text-[#DEC99F] text-[11px] font-medium">
                    ${esc(profil.versi || 'Versi 2.0.0')}
                </span>
                <span class="text-[11px] text-[#ADB6B8]">${esc(profil.kategori || 'Progressive Web App')}</span>
            </div>
        </div>
    `;
}

// ==========================================
// SPA ROUTER DISPATCHER
// ==========================================
async function router() {
    window.scrollTo({ top: 0, behavior: 'instant' });
    appContent.classList.add('page-fade-out');

    const rawHash = window.location.hash || '#/riwayat';
    const cleanHash = rawHash.split('?')[0];
    const parts = cleanHash.replace(/^#\/?/, '').split('/');
    const page = parts[0] || 'riwayat';
    const id = parts[1];

    try {
        if (page === 'riwayat') {
            if (id) await renderRiwayatDetail(id);
            else await renderRiwayatList();
        } else if (page === 'garasi') {
            if (id) await renderGarasiDetail(id);
            else await renderGarasiList();
        } else if (page === 'katalog') {
            if (id) await renderKatalogDetail(id);
            else await renderKatalogList();
        } else if (page === 'bengkel') {
            if (id) await renderBengkelDetail(id);
            else await renderBengkelList();
        } else if (page === 'profil') {
            await renderProfil();
        } else {
            window.location.hash = '#/riwayat';
        }
    } catch (err) {
        console.error('Error saat merender halaman:', err);
        appContent.innerHTML = `
            <div class="text-center py-12 glass-card rounded-2xl p-5 mt-10">
                <p class="text-sm font-semibold text-red-400 mb-2">Terjadi kendala saat memuat data</p>
                <p class="text-xs text-[#ADB6B8] mb-4">${esc(err.message)}</p>
                <a href="#/riwayat" class="inline-block px-4 py-2 bg-[#D8BF8D]/20 border border-[#DEC99F]/40 text-[#DEC99F] text-xs rounded-xl">Kembali ke Beranda</a>
            </div>
        `;
    } finally {
        setTimeout(() => {
            appContent.classList.remove('page-fade-out');
            appContent.classList.add('page-fade-in');
        }, 20);
    }
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
