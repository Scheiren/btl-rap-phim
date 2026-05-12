import { apiFetch } from './api.js';
import { toast, openModal, closeModal, confirmDeleteFn, v, esc, emptyRow } from './utils.js';
import { sharedData } from './config.js';

// =====================================================
// THÀNH PHỐ
// =====================================================
export async function loadThanhPho() {
  const data = await apiFetch('/api/thanhpho');
  sharedData.allTP = data || [];
  const tb = document.getElementById('tb-thanhpho');
  if (!data || !data.length) { tb.innerHTML = emptyRow(4); return; }
  tb.innerHTML = data.map(r => `
    <tr>
      <td class="td-id">${r.MaTP}</td>
      <td class="td-name">${r.TenTP}</td>
      <td><span class="badge badge-blue">${r.SoRap || 0} rạp</span></td>
      <td><div class="actions">
        <button class="btn-action btn-edit" onclick="editThanhPho('${r.MaTP}','${esc(r.TenTP)}')">✏️ Sửa</button>
        <button class="btn-action btn-delete" onclick="deleteThanhPho('${r.MaTP}')">🗑️ Xóa</button>
      </div></td>
    </tr>`).join('');
}

export function openAddForm(page) {
  sharedData.formEntity = page;
  sharedData.formMode = 'add'; sharedData.editId = null;
  const forms = {
    thanhpho: formThanhPho,
    rap: () => formRap(),
    phong: () => formPhong(),
    phim: formPhim,
    suatchieu: () => formSuatChieu(),
    ve: () => formVe(),
    khachhang: formKhachHang,
  };
  if (forms[page]) forms[page]();
}

export function formThanhPho(data = {}) {
  document.getElementById('modal-form-title').textContent = data.MaTP ? 'Sửa thành phố' : 'Thêm thành phố';
  document.getElementById('modal-form-body').innerHTML = `
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Mã TP *</label>
        <input class="form-input" id="f-MaTP" value="${data.MaTP||''}" ${data.MaTP?'readonly':''}></div>
      <div class="form-group"><label class="form-label">Tên thành phố *</label>
        <input class="form-input" id="f-TenTP" value="${data.TenTP||''}"></div>
    </div>`;
  sharedData.formEntity = 'thanhpho';
  openModal('modal-form');
}

export async function submitThanhPho() {
  const d = { MaTP: v('f-MaTP'), TenTP: v('f-TenTP') };
  if (!d.MaTP || !d.TenTP) { toast('Vui lòng nhập đầy đủ', 'error'); return; }
  const url = sharedData.formMode === 'add' ? '/api/thanhpho' : `/api/thanhpho/${sharedData.editId}`;
  const method = sharedData.formMode === 'add' ? 'POST' : 'PUT';
  const r = await apiFetch(url, { method, body: JSON.stringify(d) });
  if (r?.success) { toast('Lưu thành công!', 'success'); closeModal('modal-form'); loadThanhPho(); }
  else toast(r?.error || 'Lỗi', 'error');
}

export function editThanhPho(MaTP, TenTP) {
  sharedData.formMode = 'edit'; sharedData.editId = MaTP;
  formThanhPho({ MaTP, TenTP });
}

export function deleteThanhPho(id) {
  confirmDeleteFn(`Xóa thành phố mã "${id}"?`, async () => {
    const r = await apiFetch(`/api/thanhpho/${id}`, { method: 'DELETE' });
    if (r?.success) { toast('Đã xóa!', 'success'); loadThanhPho(); }
    else toast(r?.error || 'Lỗi', 'error');
  });
}