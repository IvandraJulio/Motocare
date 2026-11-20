/**
 * MotoCare PWA - SPA Routing & Dynamic Integration
 * Target UI: 100% Match with Figma SVG Designs + Fully Working Filter System
 */

// Hapus status bar simulasi (9:41) jika browser masih memuat index.html dari cache lama SW
document.querySelectorAll('header').forEach(el => el.remove());

// Register Service Worker for PWA & bersihkan cache HTML lama
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
                keys.filter(k => k !== 'motocare-v11' && k !== 'motocare-data')
                    .forEach(k => caches.delete(k));
            });
        }
    });
}

// API Base URL config (Auto detects port 3000 or external dev server)
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? (window.location.port === '3000' ? '' : 'http://localhost:3000')
    : '';

const appContent = document.getElementById('app-content');
if (appContent) appContent.style.paddingTop = '44px';

// Helper: selalu dapatkan modal container yang valid (buat jika belum ada)
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

// In-memory cache & fallback mock data if backend is starting up
const fallbackData = {
    motor: {
        nama: "Honda ADV 160",
        plat: "B 4271 MTC",
        tahun: "2024",
        odometer: "18.500 KM",
        gambar_url: "images/motor-adv.png"
    },
    profil: {
        nama: "Ivandra Julio Chrishanto",
        nim: "21120124120034",
        prodi: "S1 Teknik Komputer",
        peran: "Pengembang aplikasi",
        avatar_url: "images/profile.jpg",
        tentang: "Teman perawatan motor Anda. Catat riwayat servis, pantau biaya perawatan, dan temukan informasi suku cadang dalam satu aplikasi PWA yang praktis.",
        versi: "Versi 1.0.0",
        kategori: "Progressive Web App"
    },
    riwayat: [
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
            spesifikasi_nilai_2: "Tubeless • belakang",
            harga_min: 250000,
            harga_max: 350000,
            kisaran_harga: "Rp 250.000–350.000",
            masa_pakai_optimal: "Usia maksimal ban yang disarankan: 4 tahun. Periksa kondisi tapak secara berkala."
        }
    ]
};

// Safe API Fetcher with Fallback
async function fetchData(endpoint, fallbackKey, id = null) {
    try {
        const url = id ? `${API_BASE}${endpoint}/${id}` : `${API_BASE}${endpoint}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.warn(`Gagal fetch dari ${endpoint}, menggunakan fallback:`, err.message);
        if (id) {
            return fallbackData[fallbackKey].find(item => item.id === parseInt(id)) || fallbackData[fallbackKey][0];
        }
        return fallbackData[fallbackKey];
    }
}

// Update Riwayat Servis via Backend API
async function updateRiwayatData(id, fields) {
    const res = await fetch(`${API_BASE}/api/riwayat-servis/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const result = await res.json();
    return result.data || result;
}

// Toast notification
function showToast(message, type = 'success') {
    const existing = document.getElementById('motocare-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'motocare-toast';
    toast.className = `fixed top-5 left-1/2 -translate-x-1/2 max-w-[350px] w-[90%] px-4 py-3 rounded-2xl z-[9999] shadow-2xl transition-all duration-300 -translate-y-6 opacity-0 text-xs font-semibold text-[#F5F3EE] ${type === 'success' ? 'bg-[#151D22] border border-[#DEC99F]/40' : 'bg-red-950/90 border border-red-500/40'
        }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.remove('-translate-y-6', 'opacity-0')));
    setTimeout(() => {
        toast.classList.add('-translate-y-6', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}

// Update Active Tab on Bottom Navigation Bar
function updateBottomNav(activeRoute) {
    const tabs = [
        { id: 'nav-riwayat', route: 'riwayat' },
        { id: 'nav-katalog', route: 'katalog' },
        { id: 'nav-profil', route: 'profil' }
    ];

    tabs.forEach(tab => {
        const el = document.getElementById(tab.id);
        if (!el) return;

        if (activeRoute.startsWith(tab.route)) {
            el.className = "nav-btn nav-pill-active px-5 py-2 rounded-2xl flex flex-col items-center justify-center text-xs h-[52px]";
        } else {
            el.className = "nav-btn text-[#ADB6B8] hover:text-[#F5F3EE] px-4 py-2 flex flex-col items-center justify-center text-xs h-[52px] transition-colors";
        }
    });
}

// ==========================================
// KATALOG FILTER & STATE MANAGEMENT
// ==========================================
let katalogListCache = [];
let filterState = {
    search: '',
    kategori: 'all',    // 'all' | 'Pelumas' | 'Pengapian' | 'Pengereman' | 'Roda & Ban'
    sort: 'default',    // 'default' | 'nama-asc' | 'harga-asc' | 'harga-desc'
    harga: 'all'        // 'all' | 'under100' | 'above100'
};

function hasActiveFilter() {
    return filterState.kategori !== 'all' ||
        filterState.sort !== 'default' ||
        filterState.harga !== 'all' ||
        Boolean(filterState.search);
}

function getFilteredKatalog() {
    let result = [...katalogListCache];

    // 1. Filter Pencarian Teks
    if (filterState.search) {
        const q = filterState.search.toLowerCase().trim();
        result = result.filter(item =>
            item.nama_part.toLowerCase().includes(q) ||
            item.subjudul.toLowerCase().includes(q) ||
            (item.kategori && item.kategori.toLowerCase().includes(q))
        );
    }

    // 2. Filter Kategori
    if (filterState.kategori !== 'all') {
        result = result.filter(item => item.kategori === filterState.kategori);
    }

    // 3. Filter Rentang Harga
    if (filterState.harga === 'under100') {
        result = result.filter(item => (item.harga_min || 0) < 100000);
    } else if (filterState.harga === 'above100') {
        result = result.filter(item => (item.harga_min || 0) >= 100000);
    }

    // 4. Pengurutan (Sort)
    if (filterState.sort === 'nama-asc') {
        result.sort((a, b) => a.nama_part.localeCompare(b.nama_part));
    } else if (filterState.sort === 'harga-asc') {
        result.sort((a, b) => (a.harga_min || 0) - (b.harga_min || 0));
    } else if (filterState.sort === 'harga-desc') {
        result.sort((a, b) => (b.harga_min || 0) - (a.harga_min || 0));
    }

    return result;
}

// Update tampilan grid katalog berdasarkan filter aktif
function updateKatalogView() {
    const grid = document.getElementById('katalog-grid');
    const countEl = document.getElementById('katalog-count');
    const activeFiltersContainer = document.getElementById('active-filters-bar');
    const filterBtn = document.getElementById('katalog-filter-btn');

    if (!grid) return;

    const filtered = getFilteredKatalog();

    // Update Counter
    if (countEl) {
        countEl.textContent = `${filtered.length} part`;
    }

    // Update Filter Button Highlight
    if (filterBtn) {
        const isFiltered = filterState.kategori !== 'all' || filterState.sort !== 'default' || filterState.harga !== 'all';
        if (isFiltered) {
            filterBtn.className = "w-12 h-12 rounded-2xl bg-[#DEC99F] text-[#0C1014] flex items-center justify-center shrink-0 shadow-lg shadow-[#DEC99F]/20 relative active:scale-95 transition-all";
            filterBtn.innerHTML = `
                <svg class="w-5 h-5 text-[#0C1014]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 8h4m4 0h8M8 6v4M4 16h12m4 0h0M16 14v4"/>
                </svg>
                <span class="absolute -top-1 -right-1 w-3 h-3 bg-[#E2C995] border-2 border-[#0C1014] rounded-full"></span>
            `;
        } else {
            filterBtn.className = "w-12 h-12 gold-card rounded-2xl flex items-center justify-center shrink-0 text-[#DEC99F] active:scale-95 transition-transform";
            filterBtn.innerHTML = `
                <svg class="w-5 h-5 text-[#DEC99F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 8h4m4 0h8M8 6v4M4 16h12m4 0h0M16 14v4"/>
                </svg>
            `;
        }
    }

    // Render Active Filter Chips/Pills
    if (activeFiltersContainer) {
        const activeChips = [];

        if (filterState.kategori !== 'all') {
            activeChips.push({
                label: `Kategori: ${filterState.kategori}`,
                clear: () => { filterState.kategori = 'all'; updateKatalogView(); }
            });
        }
        if (filterState.sort !== 'default') {
            const sortLabel = filterState.sort === 'nama-asc' ? 'A – Z' :
                filterState.sort === 'harga-asc' ? 'Harga Termurah' : 'Harga Termahal';
            activeChips.push({
                label: `Urut: ${sortLabel}`,
                clear: () => { filterState.sort = 'default'; updateKatalogView(); }
            });
        }
        if (filterState.harga !== 'all') {
            const hargaLabel = filterState.harga === 'under100' ? '< Rp 100rb' : '≥ Rp 100rb';
            activeChips.push({
                label: `Harga: ${hargaLabel}`,
                clear: () => { filterState.harga = 'all'; updateKatalogView(); }
            });
        }

        if (activeChips.length > 0) {
            activeFiltersContainer.className = "flex items-center space-x-2 overflow-x-auto pb-2 mb-3 -mt-2 text-xs";
            activeFiltersContainer.innerHTML = `
                ${activeChips.map((chip, idx) => `
                    <button data-chip-idx="${idx}" class="chip-remove flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#DEC99F]/15 border border-[#DEC99F]/30 text-[#DEC99F] shrink-0 text-[11px] font-medium active:scale-95 transition-all">
                        <span>${chip.label}</span>
                        <span class="text-sm leading-none ml-1 opacity-70 hover:opacity-100">&times;</span>
                    </button>
                `).join('')}
                <button id="chip-reset-all" class="text-[11px] text-[#ADB6B8] hover:text-[#DEC99F] underline shrink-0 px-2">Reset</button>
            `;

            // Bind clear buttons
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

    // Render Cards or Empty State
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-span-2 text-center py-10 glass-card rounded-2xl p-6">
                <div class="w-12 h-12 rounded-full bg-[#DEC99F]/10 text-[#DEC99F] flex items-center justify-center mx-auto mb-3">
                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="7"/>
                        <path d="M21 21l-4.35-4.35"/>
                    </svg>
                </div>
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

// Buka Filter Modal (Bottom Sheet)
function openFilterModal() {
    const modalContainer = getModalContainer();

    // Temporary copy of filter state for modal draft
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
                
                <!-- Draggable Handle Indicator -->
                <div class="w-12 h-1 bg-[#E4ECE7]/25 rounded-full mx-auto mb-4"></div>

                <!-- Header -->
                <div class="flex items-center justify-between mb-5 pb-3 border-b border-[#E4ECE7]/10">
                    <div>
                        <h3 class="text-base font-bold text-[#F5F3EE]">Filter Suku Cadang</h3>
                        <p class="text-[11px] text-[#ADB6B8]">Sesuaikan part sesuai kebutuhan motor Anda</p>
                    </div>
                    <button id="modal-close-btn" class="w-8 h-8 rounded-full bg-[#E4ECE7]/10 flex items-center justify-center text-[#ADB6B8] hover:text-[#F5F3EE]">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <!-- 1. Kategori Filter -->
                <div class="mb-5">
                    <label class="block text-xs font-semibold text-[#DEC99F] uppercase tracking-wider mb-2.5">Kategori Part</label>
                    <div class="flex flex-wrap gap-2" id="filter-categories-group">
                        ${categories.map(c => `
                            <button type="button" data-cat="${c.id}" class="cat-pill px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${draft.kategori === c.id ? 'bg-[#DEC99F] text-[#0C1014] font-semibold shadow-sm' : 'glass-card text-[#ADB6B8] hover:text-[#F5F3EE]'}">
                                ${c.label}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- 2. Rentang Harga -->
                <div class="mb-5">
                    <label class="block text-xs font-semibold text-[#DEC99F] uppercase tracking-wider mb-2.5">Rentang Harga</label>
                    <div class="flex flex-wrap gap-2" id="filter-price-group">
                        ${priceOptions.map(p => `
                            <button type="button" data-price="${p.id}" class="price-pill px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${draft.harga === p.id ? 'bg-[#DEC99F] text-[#0C1014] font-semibold shadow-sm' : 'glass-card text-[#ADB6B8] hover:text-[#F5F3EE]'}">
                                ${p.label}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- 3. Urutkan (Sort) -->
                <div class="mb-6">
                    <label class="block text-xs font-semibold text-[#DEC99F] uppercase tracking-wider mb-2.5">Urutkan Berdasarkan</label>
                    <div class="grid grid-cols-2 gap-2" id="filter-sort-group">
                        ${sortOptions.map(s => `
                            <button type="button" data-sort="${s.id}" class="sort-pill px-3 py-2 rounded-xl text-xs font-medium text-left transition-all ${draft.sort === s.id ? 'bg-[#DEC99F] text-[#0C1014] font-semibold shadow-sm' : 'glass-card text-[#ADB6B8] hover:text-[#F5F3EE]'}">
                                ${s.label}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Footer Action Buttons -->
                <div class="flex items-center space-x-3 pt-3 border-t border-[#E4ECE7]/10">
                    <button type="button" id="modal-reset-btn" class="w-1/3 py-3 rounded-xl border border-[#E4ECE7]/20 text-xs font-semibold text-[#ADB6B8] hover:text-[#F5F3EE] active:scale-95 transition-all text-center">
                        Reset
                    </button>
                    <button type="button" id="modal-apply-btn" class="w-2/3 py-3 rounded-xl bg-[#DEC99F] text-[#0C1014] text-xs font-bold shadow-lg shadow-[#DEC99F]/20 active:scale-95 transition-all text-center">
                        Terapkan Filter
                    </button>
                </div>

            </div>
        </div>
    `;

    // Modal Animation In (double rAF ensures initial state paints before transition)
    const backdrop = document.getElementById('filter-modal-backdrop');
    const sheet = document.getElementById('filter-modal-sheet');

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            backdrop.classList.remove('opacity-0');
            sheet.classList.remove('translate-y-full');
        });
    });

    // Handle Category pill clicks
    document.querySelectorAll('.cat-pill').forEach(btn => {
        btn.onclick = () => {
            draft.kategori = btn.getAttribute('data-cat');
            document.querySelectorAll('.cat-pill').forEach(b => {
                const isActive = b.getAttribute('data-cat') === draft.kategori;
                b.className = `cat-pill px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${isActive ? 'bg-[#DEC99F] text-[#0C1014] font-semibold shadow-sm' : 'glass-card text-[#ADB6B8] hover:text-[#F5F3EE]'}`;
            });
        };
    });

    // Handle Price pill clicks
    document.querySelectorAll('.price-pill').forEach(btn => {
        btn.onclick = () => {
            draft.harga = btn.getAttribute('data-price');
            document.querySelectorAll('.price-pill').forEach(b => {
                const isActive = b.getAttribute('data-price') === draft.harga;
                b.className = `price-pill px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${isActive ? 'bg-[#DEC99F] text-[#0C1014] font-semibold shadow-sm' : 'glass-card text-[#ADB6B8] hover:text-[#F5F3EE]'}`;
            });
        };
    });

    // Handle Sort pill clicks
    document.querySelectorAll('.sort-pill').forEach(btn => {
        btn.onclick = () => {
            draft.sort = btn.getAttribute('data-sort');
            document.querySelectorAll('.sort-pill').forEach(b => {
                const isActive = b.getAttribute('data-sort') === draft.sort;
                b.className = `sort-pill px-3 py-2 rounded-xl text-xs font-medium text-left transition-all ${isActive ? 'bg-[#DEC99F] text-[#0C1014] font-semibold shadow-sm' : 'glass-card text-[#ADB6B8] hover:text-[#F5F3EE]'}`;
            });
        };
    });

    // Close Modal Function
    function closeModal() {
        backdrop.classList.add('opacity-0');
        sheet.classList.add('translate-y-full');
        setTimeout(() => {
            modalContainer.innerHTML = '';
        }, 200);
    }

    // Modal Close Button
    document.getElementById('modal-close-btn').onclick = closeModal;

    // Backdrop Click outside closes modal
    backdrop.onclick = (e) => {
        if (e.target === backdrop) closeModal();
    };

    // Reset Button
    document.getElementById('modal-reset-btn').onclick = () => {
        draft.kategori = 'all';
        draft.sort = 'default';
        draft.harga = 'all';
        filterState.kategori = 'all';
        filterState.sort = 'default';
        filterState.harga = 'all';
        closeModal();
        updateKatalogView();
    };

    // Apply Button
    document.getElementById('modal-apply-btn').onclick = () => {
        filterState.kategori = draft.kategori;
        filterState.sort = draft.sort;
        filterState.harga = draft.harga;
        closeModal();
        updateKatalogView();
    };
}


// ==========================================
// RENDER VIEWS
// ==========================================

// 1. HALAMAN 1: List Riwayat Servis (#/riwayat)
async function renderRiwayatList() {
    updateBottomNav('riwayat');
    const [dataRiwayat, motor] = await Promise.all([
        fetchData('/api/riwayat-servis', 'riwayat'),
        fetchData('/api/motor', 'motor')
    ]);

    appContent.innerHTML = `
        <!-- Top App Bar -->
        <div class="flex items-start justify-between mt-2 mb-5">
            <div>
                <h1 class="text-2xl font-bold text-[#F5F3EE] tracking-tight">MotoCare</h1>
                <p class="text-xs text-[#ADB6B8] mt-0.5">Rawat motor. Nikmati perjalanan.</p>
            </div>
            <!-- Notification Bell Button -->
            <button class="w-[42px] h-[42px] rounded-2xl bg-[#E4ECE7]/[0.07] border border-[#E4ECE7]/[0.15] flex items-center justify-center text-[#F5F3EE] hover:bg-[#E4ECE7]/[0.12] active:scale-95 transition-all" aria-label="Notifikasi">
                <svg class="w-5 h-5 text-[#F5F3EE]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
            </button>
        </div>

        <!-- Motor Saya Card (Gold Glass Highlight) -->
        <div class="gold-card rounded-2xl p-4 mb-6 relative overflow-hidden flex items-center justify-between min-h-[134px]">
            <div class="z-10 max-w-[58%]">
                <p class="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#DEC99F]">MOTOR SAYA</p>
                <h2 class="text-lg font-bold text-[#F5F3EE] mt-0.5">${motor.nama || 'Honda ADV 160'}</h2>
                <p class="text-xs text-[#ADB6B8] mt-0.5">${motor.plat || 'B 4271 MTC'} • ${motor.tahun || '2024'}</p>
                <p class="text-xs font-semibold text-[#DEC99F] mt-3">${motor.odometer || '18.500 KM'}</p>
            </div>
            <!-- Motor Image -->
            <div class="w-36 h-28 absolute right-1 -bottom-0.5 flex items-end justify-center pointer-events-none">
                <img src="${motor.gambar_url || 'images/motor-adv.png'}" alt="Honda ADV 160" class="max-h-full max-w-full object-contain drop-shadow-md" onerror="this.src='images/motor-adv.png'">
            </div>
        </div>

        <!-- Section Header -->
        <div class="flex items-center justify-between mb-3 px-1">
            <h3 class="text-base font-bold text-[#F5F3EE]">Riwayat servis</h3>
            <span class="text-xs text-[#ADB6B8] font-normal">${dataRiwayat.length} catatan</span>
        </div>

        <!-- Service History List -->
        <div class="space-y-3">
            ${dataRiwayat.map(item => {
                const p = item.pengingat;
                const st = pengingatStyle(p && p.status);
                return `
                <a href="#/riwayat/${item.id}" class="glass-card hover:border-[#DEC99F]/40 transition-all active:scale-[0.99] rounded-2xl p-4 flex items-center justify-between group">
                    <div class="min-w-0 flex-1">
                        <h4 class="text-sm font-semibold text-[#F5F3EE] group-hover:text-[#DEC99F] transition-colors">${item.jenis_servis}</h4>
                        <p class="text-xs text-[#ADB6B8] mt-1">Terakhir: ${item.tanggal_servis} • ${item.jarak_tempuh_km}</p>
                        ${p ? `
                        <div class="flex items-center mt-2 text-[10.5px] font-medium ${st.text}">
                            <span class="w-1.5 h-1.5 rounded-full ${st.dot} mr-1.5 shrink-0"></span>
                            <span class="truncate">Servis lagi: ${p.km_berikutnya}${p.tanggal_berikutnya ? ` / ${p.tanggal_berikutnya}` : ''}</span>
                        </div>` : ''}
                    </div>
                    <!-- Right Chevron Icon -->
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-[#BDC6C5] group-hover:text-[#DEC99F] transition-colors">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 18l6-6-6-6"/>
                        </svg>
                    </div>
                </a>
            `;}).join('')}
        </div>
    `;
}

// Warna status pengingat servis
function pengingatStyle(status) {
    if (status === 'terlambat') return { text: 'text-[#F08A7E]', dot: 'bg-[#F08A7E]', bar: 'bg-[#F08A7E]', badge: 'bg-[#F08A7E]/15 border-[#F08A7E]/40 text-[#F08A7E]' };
    if (status === 'segera') return { text: 'text-[#E2C995]', dot: 'bg-[#E2C995]', bar: 'bg-[#E2C995]', badge: 'bg-[#E2C995]/15 border-[#E2C995]/40 text-[#E2C995]' };
    return { text: 'text-[#8FC9B5]', dot: 'bg-[#8FC9B5]', bar: 'bg-[#8FC9B5]', badge: 'bg-[#8FC9B5]/15 border-[#8FC9B5]/40 text-[#8FC9B5]' };
}

// 2. HALAMAN 2: Detail Riwayat Servis (#/riwayat/:id)
async function renderRiwayatDetail(id) {
    updateBottomNav('riwayat');
    const item = await fetchData('/api/riwayat-servis', 'riwayat', id);
    const p = item.pengingat;
    const st = pengingatStyle(p && p.status);

    appContent.innerHTML = `
        <!-- Top App Bar with Back Button -->
        <div class="flex items-center mt-2 mb-5">
            <a href="#/riwayat" class="w-[42px] h-[42px] rounded-2xl bg-[#E4ECE7]/[0.07] border border-[#E4ECE7]/[0.15] flex items-center justify-center text-[#F5F3EE] hover:bg-[#E4ECE7]/[0.12] active:scale-95 transition-all" aria-label="Kembali">
                <svg class="w-5 h-5 text-[#F5F3EE]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 19l-7-7 7-7"/>
                </svg>
            </a>
            <h1 class="text-base font-bold text-[#F5F3EE] ml-3.5 flex-1">Detail Riwayat Servis</h1>
            <button type="button" id="btn-edit-riwayat" class="h-[42px] px-4 rounded-2xl bg-[#DEC99F] text-[#0C1014] text-xs font-bold flex items-center space-x-1.5 active:scale-95 transition-all" aria-label="Edit riwayat">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                <span>Edit</span>
            </button>
        </div>

        <!-- Hero Card (Jenis Servis) -->
        <div class="gold-card rounded-2xl p-5 mb-5">
            <p class="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#DEC99F] mb-1">JENIS SERVIS</p>
            <h2 class="text-2xl font-bold text-[#F5F3EE] leading-snug">${item.jenis_servis}</h2>
            <div class="flex items-center text-xs text-[#ADB6B8] mt-2">
                <svg class="w-4 h-4 mr-1.5 text-[#ADB6B8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>${item.tanggal_servis}</span>
            </div>
        </div>

        <!-- Section Title: Informasi Servis -->
        <h3 class="text-sm font-bold text-[#F5F3EE] mb-2.5 px-1">Informasi servis</h3>

        <!-- Card Informasi Servis -->
        <div class="glass-card rounded-2xl p-4 mb-4">
            <!-- Row: Nama Bengkel -->
            <div class="pb-3 border-b border-[#E4ECE7]/10">
                <p class="text-[11px] text-[#ADB6B8]">Nama Bengkel</p>
                <p class="text-sm font-semibold text-[#F5F3EE] mt-0.5">${item.nama_bengkel}</p>
            </div>

            <!-- Row 2 Columns: Total Biaya & Jarak Tempuh -->
            <div class="grid grid-cols-2 gap-4 py-3 border-b border-[#E4ECE7]/10">
                <div>
                    <p class="text-[11px] text-[#ADB6B8]">Total Biaya</p>
                    <p class="text-base font-bold text-[#DEC99F] mt-0.5">${item.total_biaya}</p>
                </div>
                <div>
                    <p class="text-[11px] text-[#ADB6B8]">Jarak Tempuh</p>
                    <p class="text-base font-bold text-[#F5F3EE] mt-0.5">${item.jarak_tempuh_km}</p>
                </div>
            </div>

            <!-- Note Footer -->
            <div class="pt-2.5">
                <p class="text-[11px] text-[#ADB6B8]">Tercatat pada ${item.tanggal_servis}</p>
            </div>
        </div>

        ${p ? `
        <!-- Pengingat Servis Berikutnya (Tanpa Live Odometer) -->
        <div class="flex items-center justify-between mb-2.5 px-1">
            <h3 class="text-sm font-bold text-[#F5F3EE]">Estimasi servis berikutnya</h3>
            <span class="text-[10px] font-semibold px-2.5 py-1 rounded-full border ${st.badge}">${p.status_label}</span>
        </div>
        <div class="glass-card rounded-2xl p-4 mb-4">
            <div class="grid grid-cols-2 gap-4 pb-3 border-b border-[#E4ECE7]/10">
                <div>
                    <p class="text-[11px] text-[#ADB6B8]">Terakhir Servis</p>
                    <p class="text-sm font-bold text-[#F5F3EE] mt-0.5">${p.km_terakhir}</p>
                    <p class="text-[10.5px] text-[#ADB6B8] mt-0.5">${item.tanggal_servis}</p>
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
                    <p class="text-xl font-bold ${st.text} leading-tight mt-0.5">${p.km_berikutnya}</p>
                </div>
                <div>
                    <p class="text-[11px] text-[#ADB6B8]">Atau Tanggal</p>
                    <p class="text-sm font-bold text-[#F5F3EE] mt-0.5">${p.tanggal_berikutnya || '-'}</p>
                    <p class="text-[10.5px] ${st.text} mt-0.5">${p.sisa_hari_label}</p>
                </div>
            </div>
        </div>
        ` : ''}

        <!-- Catatan Mekanik Card (Gold Alert) -->
        <div class="gold-card rounded-2xl p-4">
            <div class="flex items-center space-x-2 text-[#DEC99F] mb-1.5">
                <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 9v4m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
                <h4 class="text-xs font-bold uppercase tracking-wider text-[#DEC99F]">Catatan Mekanik</h4>
            </div>
            <p class="text-xs leading-relaxed text-[#ADB6B8] mt-1">${item.catatan_mekanik}</p>
        </div>
    `;

    document.getElementById('btn-edit-riwayat').onclick = () => openEditRiwayatModal(item);
}

// Modal Form Edit Riwayat Servis
function openEditRiwayatModal(item) {
    const container = getModalContainer();
    const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
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
            renderRiwayatDetail(item.id);
        } catch (err) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Simpan Perubahan';
            showToast('Gagal memperbarui riwayat', 'error');
        }
    };
}

// 3. HALAMAN 3: List Katalog Suku Cadang (#/katalog)
async function renderKatalogList() {
    updateBottomNav('katalog');
    katalogListCache = await fetchData('/api/katalog-part', 'katalog');

    const isFiltered = hasActiveFilter();

    appContent.innerHTML = `
        <!-- Top App Bar -->
        <div class="mt-2 mb-4">
            <h1 class="text-2xl font-bold text-[#F5F3EE] tracking-tight">Katalog Suku Cadang</h1>
            <p class="text-xs text-[#ADB6B8] mt-0.5">Kenali part, jaga performa.</p>
        </div>

        <!-- Search Bar & Filter Button -->
        <div class="flex items-center space-x-2.5 mb-3">
            <div class="relative flex-1 glass-card rounded-2xl h-12 flex items-center px-4">
                <svg class="w-4 h-4 text-[#ADB6B8] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="7"/>
                    <path d="M21 21l-4.35-4.35"/>
                </svg>
                <input type="text" id="katalog-search-input" value="${filterState.search || ''}" placeholder="Cari suku cadang..." class="w-full bg-transparent text-xs text-[#F5F3EE] placeholder-[#ADB6B8] outline-none ml-2.5">
                ${filterState.search ? `
                    <button id="clear-search-btn" class="text-xs text-[#ADB6B8] hover:text-[#F5F3EE] ml-1 p-1">
                        &times;
                    </button>
                ` : ''}
            </div>

            <!-- Filter Button (Opens Bottom Sheet Modal) -->
            <button id="katalog-filter-btn" class="${isFiltered ? 'w-12 h-12 rounded-2xl bg-[#DEC99F] text-[#0C1014] flex items-center justify-center shrink-0 shadow-lg shadow-[#DEC99F]/20 relative active:scale-95 transition-all' : 'w-12 h-12 gold-card rounded-2xl flex items-center justify-center shrink-0 text-[#DEC99F] active:scale-95 transition-transform'}" aria-label="Filter">
                <svg class="w-5 h-5 ${isFiltered ? 'text-[#0C1014]' : 'text-[#DEC99F]'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 8h4m4 0h8M8 6v4M4 16h12m4 0h0M16 14v4"/>
                </svg>
                ${isFiltered ? '<span class="absolute -top-1 -right-1 w-3 h-3 bg-[#E2C995] border-2 border-[#0C1014] rounded-full"></span>' : ''}
            </button>
        </div>

        <!-- Active Filter Tags / Pills Container -->
        <div id="active-filters-bar" class="hidden"></div>

        <!-- Section Header -->
        <div class="flex items-center justify-between mb-3 px-1 mt-2">
            <h3 class="text-base font-bold text-[#F5F3EE]">Part esensial</h3>
            <span id="katalog-count" class="text-xs text-[#ADB6B8] font-normal">${katalogListCache.length} part</span>
        </div>

        <!-- Catalog Grid (2 Columns) -->
        <div id="katalog-grid" class="grid grid-cols-2 gap-3.5">
            ${renderKatalogGridCards(getFilteredKatalog())}
        </div>
    `;

    // Real-time Search Handler
    const searchInput = document.getElementById('katalog-search-input');
    searchInput?.addEventListener('input', (e) => {
        filterState.search = e.target.value;
        updateKatalogView();
    });

    const clearSearchBtn = document.getElementById('clear-search-btn');
    if (clearSearchBtn) {
        clearSearchBtn.onclick = () => {
            filterState.search = '';
            if (searchInput) searchInput.value = '';
            updateKatalogView();
        };
    }

    // Bind Filter Modal Button
    const filterBtn = document.getElementById('katalog-filter-btn');
    if (filterBtn) {
        filterBtn.onclick = () => {
            openFilterModal();
        };
    }

    // Initial sync of active filter chips
    updateKatalogView();
}

function renderKatalogGridCards(items) {
    return items.map(item => `
        <a href="#/katalog/${item.id}" class="glass-card hover:border-[#DEC99F]/40 transition-all active:scale-[0.98] rounded-2xl p-3 flex flex-col group">
            <!-- Product Image Frame -->
            <div class="w-full h-36 rounded-xl bg-[#0C1014]/40 overflow-hidden flex items-center justify-center p-2 mb-3 relative">
                <img src="${item.gambar_url}" alt="${item.nama_part}" class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-sm" onerror="this.src='images/ban.png'">
                ${item.kategori ? `
                    <span class="absolute top-2 left-2 text-[9px] font-medium px-2 py-0.5 rounded-md bg-[#0C1014]/70 border border-[#E4ECE7]/10 text-[#DEC99F]">
                        ${item.kategori}
                    </span>
                ` : ''}
            </div>
            <!-- Title -->
            <h4 class="text-xs font-semibold text-[#F5F3EE] group-hover:text-[#DEC99F] transition-colors leading-tight mb-1">${item.nama_part}</h4>
            <p class="text-[10px] text-[#DEC99F] font-medium">${item.kisaran_harga || ''}</p>
        </a>
    `).join('');
}

// 4. HALAMAN 4: Detail Suku Cadang (#/katalog/:id)
async function renderKatalogDetail(id) {
    updateBottomNav('katalog');
    const item = await fetchData('/api/katalog-part', 'katalog', id);

    appContent.innerHTML = `
        <!-- Top App Bar with Back Button -->
        <div class="flex items-center mt-2 mb-5">
            <a href="#/katalog" class="w-[42px] h-[42px] rounded-2xl bg-[#E4ECE7]/[0.07] border border-[#E4ECE7]/[0.15] flex items-center justify-center text-[#F5F3EE] hover:bg-[#E4ECE7]/[0.12] active:scale-95 transition-all" aria-label="Kembali">
                <svg class="w-5 h-5 text-[#F5F3EE]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 19l-7-7 7-7"/>
                </svg>
            </a>
            <h1 class="text-base font-bold text-[#F5F3EE] ml-3.5">Detail Suku Cadang</h1>
        </div>

        <!-- Large Part Preview Image Frame -->
        <div class="glass-card rounded-2xl h-52 p-4 mb-4 flex items-center justify-center overflow-hidden relative">
            <img src="${item.gambar_url}" alt="${item.nama_part}" class="max-h-full max-w-full object-contain drop-shadow-xl" onerror="this.src='images/ban.png'">
            ${item.kategori ? `
                <span class="absolute top-3 left-3 text-[10px] font-medium px-2.5 py-1 rounded-lg bg-[#0C1014]/80 border border-[#DEC99F]/30 text-[#DEC99F]">
                    ${item.kategori}
                </span>
            ` : ''}
        </div>

        <!-- Part Title & Subtitle -->
        <div class="mb-5 px-1">
            <h2 class="text-xl font-bold text-[#F5F3EE]">${item.nama_part}</h2>
            <p class="text-xs text-[#ADB6B8] mt-1 leading-relaxed">${item.subjudul}</p>
        </div>

        <!-- Spesifikasi Part Card -->
        <div class="glass-card rounded-2xl p-4 mb-4">
            <h3 class="text-xs font-bold text-[#F5F3EE] mb-3 uppercase tracking-wider">Spesifikasi Part</h3>
            
            <!-- Row 1: Spesifikasi Label 1 -->
            <div class="flex items-center justify-between py-2 border-b border-[#E4ECE7]/10">
                <span class="text-xs text-[#ADB6B8]">${item.spesifikasi_label_1 || 'Ukuran'}</span>
                <span class="text-xs font-semibold text-[#F5F3EE] text-right">${item.spesifikasi_nilai_1 || '-'}</span>
            </div>

            <!-- Row 2: Spesifikasi Label 2 -->
            <div class="flex items-center justify-between py-2 border-b border-[#E4ECE7]/10">
                <span class="text-xs text-[#ADB6B8]">${item.spesifikasi_label_2 || 'Tipe'}</span>
                <span class="text-xs font-semibold text-[#F5F3EE] text-right">${item.spesifikasi_nilai_2 || '-'}</span>
            </div>

            <!-- Row 3: Kisaran Harga -->
            <div class="flex items-center justify-between pt-2.5">
                <span class="text-xs text-[#ADB6B8]">Kisaran Harga</span>
                <span class="text-xs font-bold text-[#DEC99F] text-right">${item.kisaran_harga || '-'}</span>
            </div>
        </div>

        <!-- Masa Pakai Optimal Card -->
        <div class="gold-card rounded-2xl p-4">
            <div class="flex items-center space-x-2 text-[#DEC99F] mb-1.5">
                <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 9v4m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
                <h4 class="text-xs font-bold uppercase tracking-wider text-[#DEC99F]">Masa Pakai Optimal</h4>
            </div>
            <p class="text-xs leading-relaxed text-[#ADB6B8] mt-1">${item.masa_pakai_optimal}</p>
        </div>
    `;
}

// 5. HALAMAN 5: Profil Pengembang (#/profil)
async function renderProfil() {
    updateBottomNav('profil');
    const profil = await fetchData('/api/profil', 'profil');

    appContent.innerHTML = `
        <!-- Top App Bar -->
        <div class="mt-2 mb-4">
            <h1 class="text-2xl font-bold text-[#F5F3EE] tracking-tight">Profil</h1>
            <p class="text-xs text-[#ADB6B8] mt-0.5">Di balik MotoCare</p>
        </div>

        <!-- Avatar & Role Section -->
        <div class="flex flex-col items-center my-4">
            <div class="w-24 h-24 rounded-full p-[2px] bg-gradient-to-b from-[#DEC99F]/60 via-[#DEC99F]/20 to-transparent shadow-lg mb-2">
                <img src="${(profil.avatar_url || 'images/profile.jpg')}?v=8.0" alt="${profil.nama}" class="w-full h-full rounded-full object-cover" onerror="this.src='images/profile.jpg?v=8.0'">
            </div>
            <p class="text-xs font-medium text-[#DEC99F]">${profil.peran || 'Pengembang aplikasi'}</p>
        </div>

        <!-- Identitas Mahasiswa Card -->
        <div class="glass-card rounded-2xl p-4 mb-4">
            <p class="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#DEC99F] mb-3">IDENTITAS MAHASISWA</p>
            
            <!-- Nama -->
            <div class="mb-3">
                <p class="text-[11px] text-[#ADB6B8]">Nama</p>
                <p class="text-sm font-semibold text-[#F5F3EE] mt-0.5">${profil.nama || 'Ivandra Julio Chrishanto'}</p>
            </div>

            <!-- NIM -->
            <div class="mb-3">
                <p class="text-[11px] text-[#ADB6B8]">NIM</p>
                <p class="text-sm font-semibold text-[#F5F3EE] mt-0.5">${profil.nim || '21120124120034'}</p>
            </div>

            <!-- Kelas / Prodi -->
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-[11px] text-[#ADB6B8]">Kelas / Prodi</p>
                </div>
                <div>
                    <p class="text-sm font-semibold text-[#F5F3EE]">${profil.prodi || 'S1 Teknik Komputer'}</p>
                </div>
            </div>
        </div>

        <!-- Tentang MotoCare Card -->
        <div class="glass-card rounded-2xl p-4">
            <h3 class="text-sm font-bold text-[#F5F3EE] mb-1.5">Tentang MotoCare</h3>
            <p class="text-xs leading-relaxed text-[#ADB6B8]">${profil.tentang || 'Teman perawatan motor Anda. Catat riwayat servis, pantau biaya perawatan, dan temukan informasi suku cadang dalam satu aplikasi PWA yang praktis.'}</p>
            
            <!-- Badges Footer -->
            <div class="flex items-center justify-between mt-4 pt-3 border-t border-[#E4ECE7]/10">
                <span class="px-3 py-1 rounded-full border border-[#DEC99F]/30 bg-[#D8BF8D]/[0.10] text-[#DEC99F] text-[11px] font-medium">
                    ${profil.versi || 'Versi 1.0.0'}
                </span>
                <span class="text-[11px] text-[#ADB6B8]">${profil.kategori || 'Progressive Web App'}</span>
            </div>
        </div>
    `;
}

// ==========================================
// SPA ROUTER DISPATCHER
// ==========================================
async function router() {
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Smooth transition
    appContent.classList.add('page-fade-out');

    const rawHash = window.location.hash || '#/riwayat';
    const cleanHash = rawHash.split('?')[0];
    const parts = cleanHash.replace(/^#\/?/, '').split('/');
    const page = parts[0] || 'riwayat';
    const id = parts[1];

    try {
        if (page === 'riwayat') {
            if (id) {
                await renderRiwayatDetail(id);
            } else {
                await renderRiwayatList();
            }
        } else if (page === 'katalog') {
            if (id) {
                await renderKatalogDetail(id);
            } else {
                await renderKatalogList();
            }
        } else if (page === 'profil') {
            await renderProfil();
        } else {
            // Default fallback route
            window.location.hash = '#/riwayat';
        }
    } catch (err) {
        console.error('Error saat merender halaman:', err);
        appContent.innerHTML = `
            <div class="text-center py-12 glass-card rounded-2xl p-5 mt-10">
                <p class="text-sm font-semibold text-red-400 mb-2">Terjadi kendala saat memuat data</p>
                <p class="text-xs text-[#ADB6B8] mb-4">${err.message}</p>
                <a href="#/riwayat" class="inline-block px-4 py-2 bg-[#D8BF8D]/20 border border-[#DEC99F]/40 text-[#DEC99F] text-xs rounded-xl">Kembali ke Beranda</a>
            </div>
        `;
    } finally {
        setTimeout(() => {
            appContent.classList.remove('page-fade-out');
            appContent.classList.add('page-fade-in');
        }, 30);
    }
}

// Router Event Listeners
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
