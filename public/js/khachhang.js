import { apiFetch } from './api.js';
import { toast, openModal, closeModal, confirmDeleteFn, v, esc, emptyRow, fmtMoney } from './utils.js';
import { sharedData } from './config.js';

// =====================================================
// KHÁCH HÀNG
// =====================================================
export async function loadKhachHang() {
  const search = document.getElementById('search-kh')?.value || '';
  const data = await apiFetch('/api/khachhang' + (search ? `?search=${encodeURIComponent(search)}` : ''));
  const tb = document.getElementById('tb-khachhang');
  if (!data?.length) { tb.innerHTML = emptyRow(8); return; }
  tb.innerHTML = data.map(r => `
    <tr>
      <td class="td-id">${r.MaKH}</td>
      <td class="td-name">${r.HoTen}</td>
      <td>${r.Sdt}</td>
      <td style="color:var(--muted);font-size:12px">${r.Email||'—'}</td>
      <td><span class="badge badge-gold">⭐ ${r.DiemTichLuy}</span></td>
      <td><strong style="color:var(--green)">${fmtMoney(r.TongChiTieu)}</strong></td>
      <td>${r.TongVe} vé</td>
      <td><div class="actions">
        <button class="btn-action btn-edit" onclick='editKhachHang(${JSON.stringify(r)})'>✏️ Sửa</button>
        <button class="btn-action btn-delete" onclick="deleteKhachHang('${r.MaKH}')">🗑️ Xóa</button>
      </div></td>
    </tr>`).join('');
}

export function formKhachHang(data = {}) {
  document.getElementById('modal-form-title').textContent = data.MaKH ? 'Sửa khách hàng' : 'Thêm khách hàng';
  document.getElementById('modal-form-body').innerHTML = `
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Mã KH *</label>
        <input class="form-input" id="f-MaKH" value="${data.MaKH||''}" ${data.MaKH?'readonly':''}></div>
      <div class="form-group"><label class="form-label">Họ tên *</label>
        <input class="form-input" id="f-HoTen" value="${data.HoTen||''}"></div>
      <div class="form-group"><label class="form-label">SĐT *</label>
        <input class="form-input" id="f-Sdt" value="${data.Sdt||''}"></div>
      <div class="form-group"><label class="form-label">Email</label>
        <input class="form-input" type="email" id="f-Email" value="${data.Email||''}"></div>
      <div class="form-group full"><label class="form-label">Điểm tích lũy</label>
        <input class="form-input" type="number" id="f-DiemTichLuy" value="${data.DiemTichLuy||0}"></div>
    </div>`;
  sharedData.formEntity = 'khachhang';
  openModal('modal-form');
}

export async function submitKhachHang() {
  const d = { MaKH:v('f-MaKH'), HoTen:v('f-HoTen'), Sdt:v('f-Sdt'),
    Email:v('f-Email'), DiemTichLuy:v('f-DiemTichLuy') };
  const url = sharedData.formMode==='add' ? '/api/khachhang' : `/api/khachhang/${sharedData.editId}`;
  const r = await apiFetch(url, { method: sharedData.formMode==='add'?'POST':'PUT', body: JSON.stringify(d) });
  if (r?.success) { toast('Lưu thành công!', 'success'); closeModal('modal-form'); loadKhachHang(); }
  else toast(r?.error||'Lỗi','error');
}

export function editKhachHang(data) { sharedData.formMode='edit'; sharedData.editId=data.MaKH; formKhachHang(data); }
export function deleteKhachHang(id) {
  confirmDeleteFn(`Xóa khách hàng "${id}"?`, async () => {
    const r = await apiFetch(`/api/khachhang/${id}`, { method:'DELETE' });
    if (r?.success) { toast('Đã xóa!', 'success'); loadKhachHang(); }
    else toast(r?.error||'Lỗi','error');
  });
}