// ══════════════════════════════════════════════
//  CONFIG SETTING BACK-END (VERCEL SERVERLESS)
// ══════════════════════════════════════════════
// Menggunakan origin Vercel karena Front-End dan Back-End (api/dramas.js) sudah menyatu
const BACKEND_URL = window.location.origin; 

// ══════════════════════════════════════════════
//  GLOBAL APPLICATION STATE
// ══════════════════════════════════════════════
let allDramas    = [];
let browseDramas = [];
let browseOffset = 0;
let activeGenre  = 'All';
let currentDrama = null;
let heroSlides   = [];
let heroIndex    = 0;
let heroTimer    = null;
let currentEp    = 1;

const GENRES = ['All', 'Romance', 'Action', 'Thriller', 'Drama', 'Family'];

// ══════════════════════════════════════════════
//  APP INITIALIZATION (LOAD HOME)
// ══════════════════════════════════════════════
async function loadHome() {
  showSkeleton('trendingRow');
  showSkeleton('newRow');
  showSkeleton('topRow');

  try {
    // Menembak data dari API internal Vercel Serverless kita sendiri
    const response = await fetch(`${BACKEND_URL}/api/dramas?size=30`);
    const result = await response.json();
    
    // Unboxing data list dari format response Short Drama Pro
    const rawList = result.data || result.list || result || [];
    
    // Normalisasi & bersihkan data kotor
    allDramas = rawList.map(normalizeDrama).filter(Boolean);

    if (allDramas.length > 0) {
      // 1. Ambil 5 data teratas buat dipasang di Banner Hero Atas
      buildHero(allDramas.slice(0, 5));
      
      // 2. Bagi-bagi data secara berurutan ke baris row masing-masing sebagai variasi
      document.getElementById('trendingRow').innerHTML = allDramas.slice(0, 10).map(makeCard).join('');
      document.getElementById('newRow').innerHTML      = allDramas.slice(10, 20).map(d => makeCard({...d, isNew: true})).join('');
      document.getElementById('topRow').innerHTML      = allDramas.slice(20, 30).map(makeCard).join('');
    } else {
      showErrorPlaceholder('Data drama kosong atau tidak ditemukan dari API.');
    }
  } catch (error) {
    console.error("Gagal terhubung ke Vercel Serverless Back-End:", error);
    // Teks di bawah ini sudah diperbaiki agar tidak membawa-bawa nama Railway lagi
    showErrorPlaceholder('Gagal memuat data dari fungsi serverless Vercel.');
  }
}

// Helper jika loading gagal
function showErrorPlaceholder(msg) {
  const infoHTML = `<p style="grid-column:1/-1; padding:32px; color:var(--muted); text-align:center;">${msg}</p>`;
  document.getElementById('trendingRow').innerHTML = infoHTML;
  document.getElementById('newRow').innerHTML      = infoHTML;
  document.getElementById('topRow').innerHTML      = infoHTML;
}

// ══════════════════════════════════════════════
//  DATA STRUCTURE NORMALIZATION (JIKAN ANIME VERSION)
// ══════════════════════════════════════════════
function normalizeDrama(raw) {
  if (!raw) return null;
  
  // Mengambil genre pertama jika ada, kalau tidak ada default ke 'Anime'
  const primaryGenre = raw.genres && raw.genres.length > 0 ? raw.genres[0].name : 'Anime';
  
  return {
    id:       raw.mal_id || Math.random().toString(),
    title:    raw.title_english || raw.title || 'Anime Title',
    year:     raw.year || 2026,
    genre:    primaryGenre,
    episodes: raw.episodes || '?',
    rating:   parseFloat(raw.score || 8.5).toFixed(1),
    cover:    raw.images?.jpg?.large_image_url || raw.images?.jpg?.image_url || 'https://picsum.photos/320/440',
    hero:     raw.images?.jpg?.large_image_url || 'https://picsum.photos/1920/1080',
    desc:     raw.synopsis || 'Tidak ada sinopsis resmi untuk anime ini.'
  };
}

// ══════════════════════════════════════════════
//  UI RENDER CARDS & SKELETON
// ══════════════════════════════════════════════
function makeCard(d) {
  return `
    <div class="drama-card" onclick="openModal('${d.id}')">
      <div class="card-thumb">
        <img src="${d.cover}" alt="${d.title}" loading="lazy" onerror="this.src='https://picsum.photos/320/440'">
        <div class="card-overlay">
          <div class="play-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
          </div>
        </div>
        ${d.isNew ? '<span class="card-badge">NEW</span>' : ''}
        <span class="card-ep">Ep ${d.episodes}</span>
      </div>
      <div class="card-title">${d.title}</div>
      <div class="card-meta">
        <span class="card-rating">★ ${d.rating}</span>
        <span style="width:3px; height:3px; background:var(--muted); border-radius:50%; display:inline-block"></span>
        <span>${d.genre}</span>
      </div>
    </div>`;
}

function showSkeleton(containerId) {
  const el = document.getElementById(containerId);
  if (el) {
    el.innerHTML = Array(6).fill(`
      <div class="skel-card">
        <div class="skeleton skel-thumb"></div>
        <div class="skeleton skel-line"></div>
        <div class="skeleton skel-line short"></div>
      </div>`).join('');
  }
}

// ══════════════════════════════════════════════
//  HERO SLIDER ENGINE
// ══════════════════════════════════════════════
function buildHero(dramas) {
  heroSlides = dramas;
  const hero = document.getElementById('hero');
  const dots = document.getElementById('heroDots');
  if(!hero || !dots) return;

  dots.innerHTML = '';
  document.querySelectorAll('.hero-slide').forEach(el => el.remove());
  
  heroSlides.forEach((d, i) => {
    const slide = document.createElement('div');
    slide.className = 'hero-slide' + (i === 0 ? ' active' : '');
    slide.innerHTML = `
      <div class="hero-bg" style="background-image:url('${d.hero}')"></div>
      <div class="hero-gradient"></div>
      <div class="hero-content">
        <div class="hero-badge">⚡ Populer</div>
        <h1 class="hero-title">${d.title}</h1>
        <div class="hero-meta">
          <span class="rating">★ ${d.rating}</span>
          <span class="dot"></span><span>${d.year}</span>
          <span class="dot"></span><span>${d.genre}</span>
        </div>
        <p class="hero-desc">${d.desc}</p>
        <div class="hero-actions">
          <button class="btn-primary" onclick="openModal('${d.id}')">Tonton Sekarang</button>
        </div>
      </div>`;
    hero.insertBefore(slide, dots);
    
    const btn = document.createElement('button');
    if (i === 0) btn.classList.add('active');
    btn.onclick = () => goToSlide(i);
    dots.appendChild(btn);
  });

  startHeroTimer();
}

function goToSlide(i) {
  const slides = document.querySelectorAll('.hero-slide');
  const dotBtns = document.querySelectorAll('.hero-dots button');
  slides[heroIndex]?.classList.remove('active');
  dotBtns[heroIndex]?.classList.remove('active');
  heroIndex = i;
  slides[heroIndex]?.classList.add('active');
  dotBtns[heroIndex]?.classList.add('active');
}

function startHeroTimer() {
  clearInterval(heroTimer);
  heroTimer = setInterval(() => {
    goToSlide((heroIndex + 1) % heroSlides.length);
  }, 6000);
}

// ══════════════════════════════════════════════
//  PAGE CONTROLLER (BERANDA vs ALL DRAMA)
// ══════════════════════════════════════════════
function showPage(page) {
  document.getElementById('hero').style.display        = page === 'home' ? 'block' : 'none';
  document.getElementById('mainContent').style.display = page === 'home' ? 'block' : 'none';
  document.getElementById('browsePage').style.display  = page === 'browse' ? 'block' : 'none';

  document.querySelectorAll('.nav-links a').forEach((a) => {
    a.classList.toggle('active', a.getAttribute('onclick').includes(`'${page}'`));
  });

  if (page === 'browse') initBrowse();
}

function initBrowse() {
  browseDramas = [...allDramas];
  browseOffset = 0;
  activeGenre  = 'All';

  const pills = document.getElementById('genrePills');
  if(pills) {
    pills.innerHTML = GENRES.map(g => `
      <button class="genre-pill ${g === 'All' ? 'active' : ''}" onclick="filterByGenre('${g}')">${g}</button>
    `).join('');
  }
  renderBrowseGrid();
}

function filterByGenre(genre) {
  showPage('browse');
  activeGenre  = genre;
  browseOffset = 0;
  document.querySelectorAll('.genre-pill').forEach(p => {
    p.classList.toggle('active', p.textContent === genre);
  });
  renderBrowseGrid();
}

function renderBrowseGrid() {
  const filtered = activeGenre === 'All' ? browseDramas : browseDramas.filter(d => d.genre.toLowerCase().includes(activeGenre.toLowerCase()));
  const pageData = filtered.slice(0, browseOffset + 24);
  
  document.getElementById('browseGrid').innerHTML = pageData.map(makeCard).join('');
  document.getElementById('loadMoreBtn').style.display = (browseOffset + 24 >= filtered.length) ? 'none' : 'inline-block';
}

function loadMore() {
  browseOffset += 24;
  renderBrowseGrid();
}

// ══════════════════════════════════════════════
//  LIVE SEARCH SYSTEM
// ══════════════════════════════════════════════
function handleSearch(query) {
  if (!query.trim()) { showPage('home'); return; }
  showPage('browse');
  
  const searchResults = allDramas.filter(d => 
    d.title.toLowerCase().includes(query.toLowerCase()) || d.desc.toLowerCase().includes(query.toLowerCase())
  );

  const grid = document.getElementById('browseGrid');
  document.getElementById('loadMoreBtn').style.display = 'none';

  if (searchResults.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:48px; color:var(--muted)">Drama "${query}" tidak ditemukan.</div>`;
  } else {
    grid.innerHTML = searchResults.map(makeCard).join('');
  }
}

// ══════════════════════════════════════════════
//  DYNAMIC MODAL & STREAMS PLAYER
// ══════════════════════════════════════════════
async function openModal(id) {
  currentDrama = allDramas.find(d => d.id === id);
  if (!currentDrama) return;

  currentEp = 1;
  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';

  resetPlayerInterface();

  let totalEp = parseInt(currentDrama.episodes) || 12;

  document.getElementById('modalBody').innerHTML = `
    <h2 class="modal-title">${currentDrama.title}</h2>
    <div class="modal-meta">
      <span class="rating">★ ${currentDrama.rating}</span>
      <span class="tag">${currentDrama.year}</span>
      <span class="tag">${currentDrama.genre}</span>
    </div>
    <p class="modal-desc">${currentDrama.desc}</p>
    <h3 style="font-family:'Bebas Neue',sans-serif; font-size:18px; margin-bottom:12px;">Pilih Episode</h3>
    <div class="ep-list">
      ${Array.from({ length: totalEp }, (_, i) => `
        <button class="ep-btn ${i === 0 ? 'current' : ''}" onclick="changeEpisode(${i + 1}, this)">${i + 1}</button>
      `).join('')}
    </div>`;
}

function resetPlayerInterface() {
  document.getElementById('playerWrapper').innerHTML = `
    <div class="player-placeholder">
      <div class="play-big" onclick="startPlay()">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
      </div>
      <p style="font-size:16px; font-weight:600; margin-bottom:4px;">${currentDrama.title}</p>
      <p style="font-size:12px; color:var(--muted);">Episode ${currentEp} · Klik tombol play untuk mulai memutar</p>
    </div>`;
}

function startPlay() {
  showToast(`Memutar Episode ${currentEp}`);
  document.getElementById('playerWrapper').innerHTML = `
    <video controls autoplay style="width:100%; height:100%; object-fit:contain; background:#000;">
      <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4">
      Browser kamu tidak mendukung pemutaran video html5.
    </video>
  `;
}

function changeEpisode(epNum, btn) {
  currentEp = epNum;
  document.querySelectorAll('.ep-btn').forEach(b => b.classList.remove('current'));
  btn.classList.add('current');

  if (document.getElementById('playerWrapper').querySelector('video')) {
    startPlay();
  } else {
    resetPlayerInterface();
  }
}

function closeModalDirect() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('playerWrapper').innerHTML = '';
}

function closeModal(e) {
  if (e.target.id === 'modal-overlay') closeModalDirect();
}

// ══════════════════════════════════════════════
//  TOAST SYSTEM SYSTEM
// ══════════════════════════════════════════════
function showToast(msg) {
  const t = document.getElementById('toast');
  if(t) {
    t.textContent = msg; 
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }
}

// Trigger inisialisasi aplikasi saat dokumen HTML siap
window.addEventListener('DOMContentLoaded', loadHome);
