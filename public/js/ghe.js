import { apiFetch } from './api.js';
import { toast, confirmDeleteFn, emptyRow, populateSelect, fmtDate, fmtTime, openModal, esc } from './utils.js';
import { sharedData } from './config.js';

// =====================================================
// GHẾ
// =====================================================
export async function loadGhe() {
  const tb = document.getElementById('tb-ghe');
  const thead = tb.closest('table')?.querySelector('thead');
  if (thead) thead.style.display = 'none'; // Ẩn tiêu đề cột vì sẽ dùng giao diện dạng sơ đồ

  // Tạo thanh công cụ lọc 4 cấp độ (Thành phố -> Rạp -> Phòng -> Suất chiếu)
  let filterBar = document.getElementById('custom-ghe-filters');
  if (!filterBar) {
    const origFilter = document.getElementById('filter-ghe-phong');
    if (origFilter) origFilter.style.display = 'none'; // Ẩn bộ lọc cũ

    filterBar = document.createElement('div');
    filterBar.id = 'custom-ghe-filters';
    filterBar.style.display = 'flex';
    filterBar.style.gap = '12px';
    filterBar.style.marginBottom = '20px';
    filterBar.innerHTML = `
      <select id="cg-tp" class="form-select" style="flex:1"><option value="">Chọn Thành phố</option></select>
      <select id="cg-rap" class="form-select" style="flex:1"><option value="">Chọn Rạp</option></select>
      <select id="cg-phong" class="form-select" style="flex:1"><option value="">Chọn Phòng</option></select>
      <select id="cg-sc" class="form-select" style="flex:2"><option value="">Chọn Suất chiếu</option></select>
    `;
    
    const tableWrap = tb.closest('.table-wrap');
    if (tableWrap) {
      tableWrap.parentNode.insertBefore(filterBar, tableWrap);
    }

    // Đổ dữ liệu Thành phố
    populateSelect('cg-tp', sharedData.allTP, 'MaTP', 'TenTP', 'Chọn Thành phố');
    
    // Xử lý sự kiện khi thay đổi các lựa chọn
    document.getElementById('cg-tp').addEventListener('change', () => {
      const tp = document.getElementById('cg-tp').value;
      const raps = sharedData.allRap.filter(r => r.MaTP === tp);
      populateSelect('cg-rap', raps, 'MaRap', 'TenRap', 'Chọn Rạp');
      document.getElementById('cg-phong').innerHTML = '<option value="">Chọn Phòng</option>';
      document.getElementById('cg-sc').innerHTML = '<option value="">Chọn Suất chiếu</option>';
      loadGhe();
    });
    
    document.getElementById('cg-rap').addEventListener('change', () => {
      const rap = document.getElementById('cg-rap').value;
      const phongs = sharedData.allPhong.filter(p => p.MaRap === rap);
      populateSelect('cg-phong', phongs, 'MaPhong', 'TenPhong', 'Chọn Phòng');
      document.getElementById('cg-sc').innerHTML = '<option value="">Chọn Suất chiếu</option>';
      loadGhe();
    });
    
    document.getElementById('cg-phong').addEventListener('change', async () => {
      const phong = document.getElementById('cg-phong').value;
      if (!phong) {
        document.getElementById('cg-sc').innerHTML = '<option value="">Chọn Suất chiếu</option>';
        loadGhe();
        return;
      }
      const scData = await apiFetch(`/api/suatchieu?maPhong=${phong}`);
      const scSel = document.getElementById('cg-sc');
      scSel.innerHTML = '<option value="">Chọn Suất chiếu</option>';
      (scData || []).forEach(sc => {
        const lbl = `${sc.TenPhim} (${fmtDate(sc.NgayChieu)} ${fmtTime(sc.ThoiGianBd)})`;
        scSel.add(new Option(lbl, sc.MaSchieu));
      });
      loadGhe();
    });

    document.getElementById('cg-sc').addEventListener('change', () => loadGhe());
  }

  const maSC = document.getElementById('cg-sc')?.value;
  if (!maSC) { 
    tb.innerHTML = emptyRow(6, 'Vui lòng chọn đầy đủ Thành phố, Rạp, Phòng và Suất chiếu để xem sơ đồ'); 
    return; 
  }

  const data = await apiFetch(`/api/suatchieu/${maSC}/soghe`);
  if (!data?.length) { tb.innerHTML = emptyRow(6, 'Suất chiếu này chưa có ghế nào'); return; }

  // Phân loại ghế theo Hàng (chữ cái đầu của Vị trí, ví dụ: "A")
  const rows = {};
  data.forEach(g => {
    const row = g.ViTri[0];
    if (!rows[row]) rows[row] = [];
    rows[row].push(g);
  });

  let html = `
    <div class="seat-legend" style="justify-content:center; margin-bottom:24px; display:flex; flex-wrap:wrap; gap:16px;">
      <span><span class="legend-dot" style="background:rgba(122,128,153,0.15); border:1px solid var(--muted)"></span> Thường</span>
      <span><span class="legend-dot" style="background:rgba(201,168,76,0.2); border:1px solid var(--gold)"></span> VIP</span>
      <span style="color:var(--muted)">|</span>
      <span><span class="legend-dot" style="background:transparent; border:2px solid var(--green)"></span> Còn trống</span>
      <span><span class="legend-dot" style="background:transparent; border:2px solid var(--red)"></span> Đã đặt</span>
    </div>
    <div class="seat-screen" style="width:60%; margin:0 auto 20px;"></div>
    <div class="seat-screen-label">— Màn hình —</div>
    <div class="seat-grid">`;

  Object.entries(rows).sort().forEach(([row, seats]) => {
    html += `<div class="seat-row"><div class="seat-row-label" style="font-size:14px; width:24px;">${row}</div>`;
    seats.sort((a,b) => a.ViTri.localeCompare(b.ViTri)).forEach(s => {
      const isBooked = s.TrangThai === 'Đã đặt';
      const borderCol = isBooked ? 'var(--red)' : 'var(--green)';
      const bgCol = s.LoaiGhe === 'VIP' ? 'rgba(201,168,76,0.2)' : 'rgba(122,128,153,0.15)';
      const style = `background:${bgCol}; border: 2px solid ${borderCol}; color: var(--text);`;
      const safeData = esc(JSON.stringify(s));
      html += `<button class="seat seat-lg" style="${style}" title="${s.ViTri} — ${s.LoaiGhe} — ${s.TrangThai}" onclick='showSeatInfo(${safeData})'>${s.ViTri.slice(1)}</button>`;
    });
    html += `</div>`;
  });

  html += `</div>
    <div style="text-align:center;margin-top:24px;font-size:13px;color:var(--muted)">
      Tổng số: <strong>${data.length}</strong> ghế | Đã đặt: ${data.filter(g=>g.TrangThai==='Đã đặt').length} | Còn trống: ${data.filter(g=>g.TrangThai!=='Đã đặt').length}
    </div>`;

  tb.innerHTML = `<tr><td colspan="6" style="padding: 40px; background: var(--surface); border-bottom: none;">${html}</td></tr>`;
}

export function showSeatInfo(s) {
  document.getElementById('modal-form-title').textContent = `Thông tin ghế ${s.ViTri}`;
  let html = `
    <div style="font-size:14px; line-height:1.6; padding: 10px 0;">
      <p style="margin-bottom:8px"><strong>Loại ghế:</strong> ${s.LoaiGhe}</p>
      <p style="margin-bottom:8px"><strong>Trạng thái:</strong> <span class="badge ${s.TrangThai==='Đã đặt'?'badge-red':'badge-green'}">${s.TrangThai}</span></p>`;
      
  if (s.TrangThai === 'Đã đặt' && s.HoTen) {
    html += `
      <hr style="margin:16px 0; border:0; border-top:1px solid var(--border);">
      <p style="margin-bottom:8px; color:var(--gold);"><strong>Thông tin người đặt:</strong></p>
      <p style="margin-bottom:8px"><strong>Khách hàng:</strong> ${s.HoTen}</p>
      <p style="margin-bottom:8px"><strong>SĐT:</strong> ${s.Sdt || '—'}</p>`;
  }
  
  html += `</div>`;
  document.getElementById('modal-form-body').innerHTML = html;
  openModal('modal-form');
}

export function deleteGhe(id) {
  confirmDeleteFn(`Xóa ghế mã "${id}"?`, async () => {
    const r = await apiFetch(`/api/ghe/${id}`, { method: 'DELETE' });
    if (r?.success) { toast('Đã xóa!', 'success'); loadGhe(); }
    else toast(r?.error || 'Lỗi', 'error');
  });
}