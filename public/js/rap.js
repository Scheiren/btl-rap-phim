import { apiFetch } from './api.js';
import { toast, openModal, closeModal, confirmDeleteFn, v, esc, emptyRow, populateSelect } from './utils.js';
import { sharedData } from './config.js';

// =====================================================
// RẠP
// =====================================================
export async function loadRap() {
  const tp = document.getElementById('filter-rap-tp')?.value || '';
  let url = '/api/rap';
  const data = await apiFetch(url);
  const filtered = tp ? data?.filter(r => r.MaTP === tp) : data;
  sharedData.allRap = data || [];
  populateSelect('filter-phong-rap', sharedData.allRap, 'MaRap', 'TenRap', 'Tất cả rạp');
  populateSelect('filter-rap-tp', sharedData.allTP, 'MaTP', 'TenTP', 'Tất cả thành phố', tp);
  const tb = document.getElementById('tb-rap');
  if (!filtered?.length) { tb.innerHTML = emptyRow(6); return; }
  tb.innerHTML = filtered.map(r => `
    <tr>
      <td class="td-id">${r.MaRap}</td>
      <td><div class="td-name">${r.TenRap}</div></td>
      <td style="color:var(--muted);font-size:13px">${r.DiaChi}</td>
      <td><span class="badge badge-blue">${r.TenTP}</span></td>
      <td><span class="badge badge-gold">${r.SoPhong} phòng</span></td>
      <td><div class="actions">
        <button class="btn-action btn-edit" onclick='editRap(${JSON.stringify(r)})'>✏️ Sửa</button>
        <button class="btn-action btn-delete" onclick="deleteRap('${r.MaRap}')">🗑️ Xóa</button>
      </div></td>
    </tr>`).join('');
}

export function formRap(data = {}) {
  document.getElementById('modal-form-title').textContent = data.MaRap ? 'Sửa rạp chiếu phim' : 'Thêm rạp chiếu phim';
  document.getElementById('modal-form-body').innerHTML = `
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Mã rạp *</label>
        <input class="form-input" id="f-MaRap" value="${data.MaRap||''}" ${data.MaRap?'readonly':''}></div>
      <div class="form-group"><label class="form-label">Thành phố *</label>
        <select class="form-select" id="f-MaTP">
          ${sharedData.allTP.map(tp => `<option value="${tp.MaTP}" ${data.MaTP===tp.MaTP?'selected':''}>${tp.TenTP}</option>`).join('')}
        </select></div>
      <div class="form-group full"><label class="form-label">Tên rạp *</label>
        <input class="form-input" id="f-TenRap" value="${data.TenRap||''}"></div>
      <div class="form-group full"><label class="form-label">Địa chỉ *</label>
        <input class="form-input" id="f-DiaChi" value="${data.DiaChi||''}"></div>
    </div>`;
  sharedData.formEntity = 'rap';
  openModal('modal-form');
}

export async function submitRap() {
  const d = { MaRap: v('f-MaRap'), TenRap: v('f-TenRap'), DiaChi: v('f-DiaChi'), MaTP: v('f-MaTP') };
  if (!d.MaRap || !d.TenRap || !d.DiaChi) { toast('Nhập đầy đủ thông tin', 'error'); return; }
  const url = sharedData.formMode === 'add' ? '/api/rap' : `/api/rap/${sharedData.editId}`;
  const r = await apiFetch(url, { method: sharedData.formMode==='add'?'POST':'PUT', body: JSON.stringify(d) });
  if (r?.success) { toast('Lưu thành công!', 'success'); closeModal('modal-form'); loadRap(); }
  else toast(r?.error || 'Lỗi', 'error');
}

export function editRap(data) { sharedData.formMode='edit'; sharedData.editId=data.MaRap; formRap(data); }
export function deleteRap(id) {
  confirmDeleteFn(`Xóa rạp mã "${id}"? Toàn bộ phòng sẽ bị xóa theo!`, async () => {
    const r = await apiFetch(`/api/rap/${id}`, { method: 'DELETE' });
    if (r?.success) { toast('Đã xóa!', 'success'); loadRap(); }
    else toast(r?.error || 'Lỗi', 'error');
  });
}