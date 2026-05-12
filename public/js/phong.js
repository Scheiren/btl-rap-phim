import { apiFetch } from './api.js';
import { toast, openModal, closeModal, confirmDeleteFn, v, esc, emptyRow, populateSelect } from './utils.js';
import { sharedData } from './config.js';

// =====================================================
// PHÒNG
// =====================================================
export async function loadPhong() {
  const maRap = document.getElementById('filter-phong-rap')?.value || '';
  const data = await apiFetch('/api/phong' + (maRap ? `?maRap=${maRap}` : ''));
  sharedData.allPhong = data || [];
  populateSelect('filter-ghe-phong', sharedData.allPhong, 'MaPhong', r => `${r.TenPhong} — ${r.TenRap}`, 'Chọn phòng để xem ghế');
  const tb = document.getElementById('tb-phong');
  if (!data?.length) { tb.innerHTML = emptyRow(6); return; }
  tb.innerHTML = data.map(r => `
    <tr>
      <td class="td-id">${r.MaPhong}</td>
      <td class="td-name">${r.TenPhong}</td>
      <td>${r.TenRap}</td>
      <td><span class="badge badge-blue">${r.TenTP}</span></td>
      <td><span class="badge badge-gold">${r.SoGhe} ghế</span></td>
      <td><div class="actions">
        <button class="btn-action btn-edit" onclick='editPhong(${JSON.stringify(r)})'>✏️ Sửa</button>
        <button class="btn-action btn-delete" onclick="deletePhong('${r.MaPhong}')">🗑️ Xóa</button>
      </div></td>
    </tr>`).join('');
}

export function formPhong(data = {}) {
  document.getElementById('modal-form-title').textContent = data.MaPhong ? 'Sửa phòng chiếu' : 'Thêm phòng chiếu';
  document.getElementById('modal-form-body').innerHTML = `
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Mã phòng *</label>
        <input class="form-input" id="f-MaPhong" value="${data.MaPhong||''}" ${data.MaPhong?'readonly':''}></div>
      <div class="form-group"><label class="form-label">Rạp *</label>
        <select class="form-select" id="f-MaRap">
          ${sharedData.allRap.map(r => `<option value="${r.MaRap}" ${data.MaRap===r.MaRap?'selected':''}>${r.TenRap}</option>`).join('')}
        </select></div>
      <div class="form-group full"><label class="form-label">Tên phòng *</label>
        <input class="form-input" id="f-TenPhong" value="${data.TenPhong||''}"></div>
    </div>`;
  sharedData.formEntity = 'phong';
  openModal('modal-form');
}

export async function submitPhong() {
  const d = { MaPhong: v('f-MaPhong'), TenPhong: v('f-TenPhong'), MaRap: v('f-MaRap') };
  const url = sharedData.formMode === 'add' ? '/api/phong' : `/api/phong/${sharedData.editId}`;
  const r = await apiFetch(url, { method: sharedData.formMode==='add'?'POST':'PUT', body: JSON.stringify(d) });
  if (r?.success) { toast('Lưu thành công!', 'success'); closeModal('modal-form'); loadPhong(); }
  else toast(r?.error || 'Lỗi', 'error');
}

export function editPhong(data) { sharedData.formMode='edit'; sharedData.editId=data.MaPhong; formPhong(data); }
export function deletePhong(id) {
  confirmDeleteFn(`Xóa phòng "${id}"?`, async () => {
    const r = await apiFetch(`/api/phong/${id}`, { method: 'DELETE' });
    if (r?.success) { toast('Đã xóa!', 'success'); loadPhong(); }
    else toast(r?.error || 'Lỗi', 'error');
  });
}