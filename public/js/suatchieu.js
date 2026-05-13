import { apiFetch } from './api.js';
import { toast, openModal, closeModal, confirmDeleteFn, v, esc, emptyRow, populateSelect, fmtDate, fmtTime, fmtDateInput } from './utils.js';
import { sharedData } from './config.js';

// =====================================================
// SUẤT CHIẾU
// =====================================================
export async function loadSuatChieu() {
  const ngay = document.getElementById('filter-ngay')?.value || '';
  const data = await apiFetch('/api/suatchieu' + (ngay ? `?ngay=${ngay}` : ''));
  
  // populate rap filter
  const rapSet = {}; (data||[]).forEach(r => rapSet[r.TenRap] = true);
  const rapSel = document.getElementById('filter-sc-rap');
  if (rapSel.options.length <= 1) {
    Object.keys(rapSet).forEach(tn => { const o = new Option(tn, tn); rapSel.add(o); });
  }

  // Tạo dropdown lọc theo phim nếu chưa có
  let phimSel = document.getElementById('filter-sc-phim');
  if (!phimSel && rapSel) {
    phimSel = document.createElement('select');
    phimSel.id = 'filter-sc-phim';
    phimSel.className = 'form-select';
    phimSel.style.width = 'auto';
    phimSel.style.flex = '1';
    phimSel.onchange = loadSuatChieu;
    
    // Biến vùng chứa thành dạng nằm ngang ngang và thu gọn thanh rạp
    rapSel.style.width = 'auto';
    rapSel.style.flex = '1';
    rapSel.parentNode.style.display = 'flex';
    rapSel.parentNode.style.gap = '12px';
    
    rapSel.parentNode.insertBefore(phimSel, rapSel.nextSibling);
  }

  if (phimSel) {
    const currentPhim = phimSel.value;
    const phimSet = {}; 
    (data||[]).forEach(r => phimSet[r.TenPhim] = true);
    phimSel.innerHTML = '<option value="">Tất cả phim</option>';
    Object.keys(phimSet).sort().forEach(tn => { 
      const o = new Option(tn, tn); 
      if (tn === currentPhim) o.selected = true;
      phimSel.add(o); 
    });
  }

  const tb = document.getElementById('tb-suatchieu');
  if (!data?.length) { tb.innerHTML = emptyRow(9); return; }
  
  const rapFilter = rapSel?.value || '';
  const phimFilter = phimSel?.value || '';
  const filtered = data.filter(r => 
    (!rapFilter || r.TenRap === rapFilter) &&
    (!phimFilter || r.TenPhim === phimFilter)
  );
  
  if (!filtered.length) { tb.innerHTML = emptyRow(9, 'Không có suất chiếu nào phù hợp với bộ lọc'); return; }
  
  tb.innerHTML = filtered.map(r => `
    <tr>
      <td class="td-id">${r.MaSchieu}</td>
      <td><div class="td-name">${r.TenPhim}</div><div class="td-sub">⏱ ${r.ThoiLuong} phút</div></td>
      <td><div class="td-name">${r.TenPhong}</div><div class="td-sub">${r.TenRap}</div></td>
      <td>${fmtDate(r.NgayChieu)}</td>
      <td><strong>${fmtTime(r.ThoiGianBd)}</strong></td>
      <td>${fmtTime(r.ThoiGianKt)}</td>
      <td><span class="badge ${r.HeSoGia>1?'badge-gold':'badge-gray'}">x${r.HeSoGia}</span></td>
      <td>
        <div style="font-size:12px;color:var(--muted)">${r.SoVeDaBan}/${r.TongGhe}</div>
        <div style="height:4px;background:var(--border);border-radius:2px;margin-top:4px;width:60px">
          <div style="height:100%;background:var(--gold);border-radius:2px;width:${(r.SoVeDaBan/Math.max(r.TongGhe,1)*100).toFixed(0)}%"></div>
        </div>
      </td>
      <td><div class="actions">
        <button class="btn-action btn-view" onclick="viewSeatMap('${r.MaSchieu}','${esc(r.TenPhim)}')">🗺️ Sơ đồ</button>
        <button class="btn-action btn-edit" onclick='editSuatChieu(${JSON.stringify(r)})'>✏️</button>
        <button class="btn-action btn-delete" onclick="deleteSuatChieu('${r.MaSchieu}')">🗑️</button>
      </div></td>
    </tr>`).join('');
}

export function filterSuatChieuByRap() { loadSuatChieu(); }

export async function viewSeatMap(maSchieu, tenPhim) {
  document.getElementById('modal-seat-title').textContent = `Sơ đồ ghế — ${tenPhim}`;
  document.getElementById('modal-seat-body').innerHTML = `<div class="loading"><div class="spinner"></div>Đang tải sơ đồ...</div>`;
  openModal('modal-seat');
  
  const data = await apiFetch(`/api/suatchieu/${maSchieu}/soghe`);
  if (!data) { document.getElementById('modal-seat-body').innerHTML = '<p>Lỗi tải dữ liệu</p>'; return; }
  
  const rows = {};
  data.forEach(g => {
    const row = g.ViTri[0];
    if (!rows[row]) rows[row] = [];
    rows[row].push(g);
  });
  
  let html = `
    <div class="seat-legend" style="justify-content:center; margin-bottom:24px; display:flex; flex-wrap:wrap; gap:16px;">
      <span><span class="legend-dot" style="background:rgba(122,128,153,0.15); border:2px solid var(--muted)"></span> Thường</span>
      <span><span class="legend-dot" style="background:rgba(201,168,76,0.2); border:2px solid var(--gold)"></span> VIP</span>
      <span style="color:var(--muted)">|</span>
      <span><span class="legend-dot" style="background:rgba(229,76,76,0.15); border:2px solid var(--red)"></span> Đã đặt</span>
    </div>
    <div class="seat-screen" style="width:60%; margin:0 auto 20px;"></div>
    <div class="seat-screen-label">— Màn hình —</div>
    <div class="seat-grid">`;
  
  Object.entries(rows).sort().forEach(([row, seats]) => {
    html += `<div class="seat-row"><div class="seat-row-label" style="font-size:14px; width:24px;">${row}</div>`;
    seats.sort((a,b) => a.ViTri.localeCompare(b.ViTri)).forEach(s => {
      const isBooked = s.TrangThai === 'Đã đặt';
      const borderCol = isBooked ? 'var(--red)' : (s.LoaiGhe === 'VIP' ? 'var(--gold)' : 'var(--muted)');
      const bgCol = isBooked ? 'rgba(229,76,76,0.15)' : (s.LoaiGhe === 'VIP' ? 'rgba(201,168,76,0.2)' : 'rgba(122,128,153,0.15)');
      const textCol = isBooked ? 'var(--red)' : (s.LoaiGhe === 'VIP' ? 'var(--gold)' : 'var(--text)');
      const style = `background:${bgCol}; border: 2px solid ${borderCol}; color: ${textCol}; cursor: default;`;
      html += `<button type="button" class="seat" style="${style}" title="${s.ViTri} — ${s.LoaiGhe} — ${s.TrangThai}">${s.ViTri.slice(1)}</button>`;
    });
    html += `</div>`;
  });
  
  html += `</div>
    <div style="text-align:center;margin-top:24px;font-size:13px;color:var(--muted)">
      Tổng số: <strong>${data.length}</strong> ghế | Đã đặt: ${data.filter(g=>g.TrangThai==='Đã đặt').length} | Còn trống: ${data.filter(g=>g.TrangThai!=='Đã đặt').length}
    </div>`;
  
  document.getElementById('modal-seat-body').innerHTML = html;
}

export function formSuatChieu(data = {}) {
  document.getElementById('modal-form-title').textContent = data.MaSchieu ? 'Sửa suất chiếu' : 'Thêm suất chiếu';
  document.getElementById('modal-form-body').innerHTML = `
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Mã suất *</label>
        <input class="form-input" id="f-MaSchieu" value="${data.MaSchieu||''}" ${data.MaSchieu?'readonly':''}></div>
      <div class="form-group"><label class="form-label">Ngày chiếu *</label>
        <input class="form-input" type="date" id="f-NgayChieu" value="${fmtDateInput(data.NgayChieu)}"></div>
      <div class="form-group"><label class="form-label">Phim *</label>
        <select class="form-select" id="f-MaPhim">
          ${sharedData.allPhim.map(p => `<option value="${p.MaPhim}" ${data.MaPhim===p.MaPhim?'selected':''}>${p.TenPhim}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Phòng *</label>
        <select class="form-select" id="f-MaPhong">
          ${sharedData.allPhong.map(p => `<option value="${p.MaPhong}" ${data.MaPhong===p.MaPhong?'selected':''}>${p.TenPhong} — ${p.TenRap||''}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Giờ bắt đầu *</label>
        <input class="form-input" type="time" id="f-ThoiGianBd" value="${data.ThoiGianBd||''}"></div>
      <div class="form-group full" style="color:var(--muted); font-size:12px;">
        <strong>Giờ kết thúc</strong> sẽ được tính tự động = Giờ bắt đầu + Thời lượng phim
      </div>
      <div class="form-group full"><label class="form-label">Hệ số giá (1.0 = giá gốc)</label>
        <input class="form-input" type="number" step="0.1" min="0.5" max="5" id="f-HeSoGia" value="${data.HeSoGia||1.0}"></div>
    </div>`;
  sharedData.formEntity = 'suatchieu';
  openModal('modal-form');
}

export async function submitSuatChieu() {
  const d = { MaSchieu:v('f-MaSchieu'), MaPhim:v('f-MaPhim'), MaPhong:v('f-MaPhong'),
    NgayChieu:v('f-NgayChieu'), ThoiGianBd:v('f-ThoiGianBd'),
    HeSoGia:v('f-HeSoGia') };
  const url = sharedData.formMode==='add' ? '/api/suatchieu' : `/api/suatchieu/${sharedData.editId}`;
  const r = await apiFetch(url, { method: sharedData.formMode==='add'?'POST':'PUT', body: JSON.stringify(d) });
  if (r?.success) { toast('Lưu thành công!', 'success'); closeModal('modal-form'); loadSuatChieu(); }
  else toast(r?.error||'Lỗi','error');
}

export function editSuatChieu(data) { sharedData.formMode='edit'; sharedData.editId=data.MaSchieu; formSuatChieu(data); }
export function deleteSuatChieu(id) {
  confirmDeleteFn(`Xóa suất chiếu "${id}"?`, async () => {
    const r = await apiFetch(`/api/suatchieu/${id}`, { method:'DELETE' });
    if (r?.success) { toast('Đã xóa!', 'success'); loadSuatChieu(); }
    else toast(r?.error||'Lỗi','error');
  });
}