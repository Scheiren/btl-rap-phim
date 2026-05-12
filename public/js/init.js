import { apiFetch } from './api.js';
import { populateSelect } from './utils.js';
import { sharedData } from './config.js';
import { loadDashboard } from './dashboard.js';

// =====================================================
// INIT
// =====================================================
export async function init() {
  // Preload shared data
  [sharedData.allTP, sharedData.allRap, sharedData.allPhong, sharedData.allPhim, window.allTheLoai] = await Promise.all([
    apiFetch('/api/thanhpho'),
    apiFetch('/api/rap'),
    apiFetch('/api/phong'),
    apiFetch('/api/phim'),
    apiFetch('/api/theloai'),
  ]);
  sharedData.allTP = sharedData.allTP || []; sharedData.allRap = sharedData.allRap || [];
  sharedData.allPhong = sharedData.allPhong || []; sharedData.allPhim = sharedData.allPhim || [];
  window.allTheLoai = window.allTheLoai || [];

  // Init filter dropdowns
  populateSelect('filter-rap-tp', sharedData.allTP, 'MaTP', 'TenTP', 'Tất cả thành phố');
  populateSelect('filter-phong-rap', sharedData.allRap, 'MaRap', 'TenRap', 'Tất cả rạp');
  populateSelect('filter-ghe-phong', sharedData.allPhong, 'MaPhong', r=>`${r.TenPhong} — ${r.TenRap||''}`, 'Chọn phòng để xem ghế');
  populateSelect('filter-sc-rap', sharedData.allRap, 'MaRap', 'TenRap', 'Tất cả rạp');

  // Load dashboard
  loadDashboard();

  // Close modal on overlay click
  document.querySelectorAll('.modal-overlay').forEach(el => {
    el.addEventListener('click', e => { if (e.target === el) el.classList.remove('open'); });
  });
}