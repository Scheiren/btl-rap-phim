import { apiFetch } from './api.js';
import { fmtMoney } from './utils.js';

// =====================================================
// DASHBOARD
// =====================================================
export async function loadDashboard() {
  const [stats, rapChart, phimChart] = await Promise.all([
    apiFetch('/api/thongke/tongquan'),
    apiFetch('/api/thongke/doanhthu-theo-rap'),
    apiFetch('/api/thongke/phim-hot'),
  ]);
  if (stats) {
    document.getElementById('s-phim').textContent = stats.tongPhim;
    document.getElementById('s-rap').textContent = stats.tongRap;
    document.getElementById('s-khach').textContent = stats.tongKhach;
    document.getElementById('s-ve').textContent = stats.tongVe;
    const dt = (stats.doanhThu / 1e6).toFixed(1);
    document.getElementById('s-dt').textContent = dt + 'M';
  }
  if (rapChart && rapChart.length) {
    const max = Math.max(...rapChart.map(r => r.DoanhThu)) || 1;
    document.getElementById('chart-rap').innerHTML = rapChart.map(r => `
      <div class="bar-item">
        <div class="bar-label">
          <span>${r.TenRap}</span>
          <span>${fmtMoney(r.DoanhThu)}</span>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${(r.DoanhThu/max*100).toFixed(1)}%"></div></div>
      </div>`).join('');
  }
  if (phimChart && phimChart.length) {
    const max = Math.max(...phimChart.map(r => r.SoVe)) || 1;
    document.getElementById('chart-phim').innerHTML = phimChart.map(r => `
      <div class="bar-item">
        <div class="bar-label">
          <span>${r.TenPhim}</span>
          <span>${r.SoVe} vé</span>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${(r.SoVe/max*100).toFixed(1)}%"></div></div>
      </div>`).join('');
  }
}