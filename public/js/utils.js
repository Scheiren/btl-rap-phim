// =====================================================
// TOAST
// =====================================================
export function toast(msg, type = 'info') {
  const icons = { success:'✅', error:'❌', info:'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// =====================================================
// MODAL HELPERS
// =====================================================
let deleteCallback = null;
export function openModal(id) { document.getElementById(id).classList.add('open'); }
export function closeModal(id) { document.getElementById(id).classList.remove('open'); }

export function confirmDeleteFn(msg, cb) {
  document.getElementById('delete-msg').textContent = msg;
  deleteCallback = cb;
  openModal('modal-delete');
}
export function confirmDelete() {
  if (deleteCallback) deleteCallback();
  closeModal('modal-delete');
  deleteCallback = null;
}

// =====================================================
// UTILITIES
// =====================================================
export function v(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
export function esc(s) { return String(s||'').replace(/'/g,"&#39;").replace(/"/g,'&quot;'); }
export function emptyRow(cols, msg='Không có dữ liệu') {
  return `<tr><td colspan="${cols}" style="text-align:center;padding:40px;color:var(--muted)">${msg}</td></tr>`;
}
export function fmtMoney(n) {
  return new Intl.NumberFormat('vi-VN', { style:'currency', currency:'VND' }).format(n||0);
}
export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}
export function fmtDateInput(d) {
  if (!d) return '';
  return new Date(d).toISOString().split('T')[0];
}
export function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('vi-VN');
}
export function fmtTime(t) {
  if (!t) return '—';
  const str = String(t);
  if (str.includes('T')) {
    return str.split('T')[1].substring(0, 5);
  }
  if (str.includes(':')) {
    return str.split(':').slice(0, 2).join(':');
  }
  return str.slice(0, 5);
}
export function populateSelect(id, data, valKey, labelFn, placeholder, selectedVal='') {
  const el = document.getElementById(id);
  if (!el) return;
  const cur = selectedVal || el.value;
  el.innerHTML = `<option value="">${placeholder}</option>`;
  (data||[]).forEach(r => {
    const val = r[valKey];
    const lbl = typeof labelFn === 'function' ? labelFn(r) : r[labelFn];
    const o = new Option(lbl, val);
    if (val === cur) o.selected = true;
    el.add(o);
  });
}