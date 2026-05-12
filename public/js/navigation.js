import { sharedData } from './config.js';
import { loadDashboard, loadThanhPho, loadRap, loadPhong, loadGhe, loadPhim, loadSuatChieu, loadVe, loadKhachHang, openAddForm } from './pages.js';

// =====================================================
// NAVIGATION
// =====================================================
export function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    if (n.textContent.includes(getPageLabel(page))) n.classList.add('active');
  });

  sharedData.currentPage = page;
  document.getElementById('page-title').textContent = getPageLabel(page).toUpperCase();
  
  const addBtn = document.getElementById('add-btn');
  const noAdd = ['dashboard', 'ghe'];
  addBtn.style.display = noAdd.includes(page) ? 'none' : 'flex';
  document.getElementById('add-label').textContent = getAddLabel(page);

  // Hide search for some pages
  const searchInput = document.getElementById('global-search');
  searchInput.style.display = ['phim','khachhang'].includes(page) ? 'none' : 'flex';

  loadPageData(page);
}

export function getPageLabel(p) {
  const m = { dashboard:'Dashboard', thanhpho:'Thành phố', rap:'Rạp chiếu phim',
    phong:'Phòng chiếu', ghe:'Quản lý ghế', phim:'Phim', suatchieu:'Suất chiếu',
    ve:'Vé & Đặt chỗ', khachhang:'Khách hàng' };
  return m[p] || p;
}

export function getAddLabel(p) {
  const m = { thanhpho:'Thêm thành phố', rap:'Thêm rạp', phong:'Thêm phòng',
    phim:'Thêm phim', suatchieu:'Thêm suất chiếu', ve:'Đặt vé', khachhang:'Thêm khách hàng' };
  return m[p] || 'Thêm mới';
}

export function loadPageData(page) {
  const loaders = {
    dashboard: loadDashboard,
    thanhpho: loadThanhPho,
    rap: loadRap,
    phong: loadPhong,
    ghe: loadGhe,
    phim: loadPhim,
    suatchieu: loadSuatChieu,
    ve: loadVe,
    khachhang: loadKhachHang,
  };
  if (loaders[page]) loaders[page]();
}

export function handleSearch(v) {}
export function handleAdd() {
  openAddForm(sharedData.currentPage);
}