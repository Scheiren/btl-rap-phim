import { apiFetch } from './api.js';
import { toast, openModal, closeModal, confirmDeleteFn, v, esc, emptyRow, populateSelect, fmtDateTime, fmtMoney, fmtDate, fmtTime } from './utils.js';
import { sharedData } from './config.js';

// =====================================================
// VÉ
// =====================================================
export async function loadVe() {
  const tt = document.getElementById('filter-ve-tt')?.value || '';
  const data = await apiFetch('/api/ve' + (tt ? `?trangThai=${encodeURIComponent(tt)}` : ''));
  const tb = document.getElementById('tb-ve');
  if (!data?.length) { tb.innerHTML = emptyRow(9); return; }
  tb.innerHTML = data.map(r => `
    <tr>
      <td class="td-id">${r.MaVe}</td>
      <td><div class="td-name">${r.HoTen}</div><div class="td-sub">${r.Sdt}</div></td>
      <td class="td-name">${r.TenPhim}</td>
      <td><div>${r.TenPhong}</div><div class="td-sub">${r.TenRap}</div></td>
      <td><strong>${r.ViTri}</strong></td>
      <td style="font-size:12px">${fmtDateTime(r.NgayDat)}</td>
      <td><strong style="color:var(--gold)">${fmtMoney(r.ThanhTien)}</strong></td>
      <td><span class="badge ${r.TrangThai==='Đã đặt'?'badge-green':r.TrangThai==='Đã hủy'?'badge-red':'badge-gray'}">${r.TrangThai}</span></td>
      <td><div class="actions">
        ${r.TrangThai==='Đã đặt'?`<button class="btn-action btn-delete" onclick="huyVe('${r.MaVe}')">❌ Hủy</button>`:''}
      </div></td>
    </tr>`).join('');
}

export function formVe(data = {}) {
  document.getElementById('modal-form-title').textContent = 'Đặt vé mới';
  document.getElementById('modal-form-body').innerHTML = `
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Mã khách hàng *</label>
        <input class="form-input" id="f-MaKH" placeholder="VD: KH001"></div>
      <div class="form-group"><label class="form-label">Suất chiếu *</label>
        <select class="form-select" id="f-MaSchieu" onchange="loadGheForVe()">
          <option value="">Chọn suất chiếu</option>
        </select></div>
      <div class="form-group"><label class="form-label">Phòng *</label>
        <input class="form-input" id="f-MaPhong" placeholder="Tự động từ suất chiếu" readonly></div>
      <div class="form-group"><label class="form-label">Vị trí ghế *</label>
        <select class="form-select" id="f-ViTri"><option>Chọn suất chiếu trước</option></select></div>
      <div class="form-group full"><label class="form-label">Giá gốc (VNĐ) *</label>
        <input class="form-input" type="number" id="f-GiaGoc" value="100000"></div>
    </div>`;
  sharedData.formEntity = 've';
  
  // Populate suất chiếu
  apiFetch('/api/suatchieu').then(data => {
    if (!data) return;
    const sel = document.getElementById('f-MaSchieu');
    data.forEach(sc => {
      const o = new Option(`${sc.MaSchieu} — ${sc.TenPhim} (${fmtDate(sc.NgayChieu)} ${fmtTime(sc.ThoiGianBd)})`, sc.MaSchieu);
      o.dataset.maPhong = sc.MaPhong;
      sel.add(o);
    });
  });
  
  openModal('modal-form');
}

export async function loadGheForVe() {
  const sel = document.getElementById('f-MaSchieu');
  const maSchieu = sel.value;
  if (!maSchieu) return;
  const opt = sel.options[sel.selectedIndex];
  document.getElementById('f-MaPhong').value = opt.dataset.maPhong || '';
  
  const data = await apiFetch(`/api/suatchieu/${maSchieu}/soghe`);
  const gheSel = document.getElementById('f-ViTri');
  gheSel.innerHTML = '';
  (data||[]).filter(g => g.TrangThai !== 'Đã đặt').forEach(g => {
    gheSel.add(new Option(`${g.ViTri} (${g.LoaiGhe})`, g.ViTri));
  });
  if (!gheSel.options.length) gheSel.add(new Option('Không còn ghế trống', ''));
}

export async function submitVe() {
  const d = { MaKH:v('f-MaKH'), MaSchieu:v('f-MaSchieu'), MaPhong:v('f-MaPhong'),
    ViTri:v('f-ViTri'), GiaGoc:v('f-GiaGoc') };
  if (!d.MaKH || !d.MaSchieu || !d.ViTri) { toast('Nhập đầy đủ thông tin', 'error'); return; }
  const r = await apiFetch('/api/ve', { method:'POST', body: JSON.stringify(d) });
  if (r?.success) { toast(`Đặt vé thành công! Mã vé: ${r.MaVe}`, 'success'); closeModal('modal-form'); loadVe(); }
  else toast(r?.error||'Lỗi','error');
}

export function huyVe(id) {
  confirmDeleteFn(`Hủy vé mã "${id}"?`, async () => {
    const r = await apiFetch(`/api/ve/${id}/huy`, { method:'PUT' });
    if (r?.success) { toast('Đã hủy vé!', 'success'); loadVe(); }
    else toast(r?.error||'Lỗi','error');
  });
}