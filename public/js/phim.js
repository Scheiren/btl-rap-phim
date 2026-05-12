import { apiFetch } from './api.js';
import { toast, openModal, closeModal, confirmDeleteFn, v, esc, emptyRow, fmtDate, fmtDateInput } from './utils.js';
import { sharedData } from './config.js';

const GENRE_ICONS = { 'Hành động':'💥','Viễn tưởng':'🚀','Hài':'😂','Drama':'🎭',
  'Kinh dị':'👻','Hoạt hình':'🎨','Tình cảm':'❤️','Lịch sử':'📜','Tài liệu':'📽️' };

// =====================================================
// PHIM
// =====================================================
export async function loadPhim() {
  const search = document.getElementById('search-phim')?.value || '';
  const tl = document.getElementById('filter-theloai')?.value || '';
  let url = '/api/phim?';
  if (search) url += `search=${encodeURIComponent(search)}&`;
  if (tl) url += `theloai=${encodeURIComponent(tl)}`;
  const data = await apiFetch(url);
  sharedData.allPhim = data || [];
  const grid = document.getElementById('movie-grid');
  if (!data?.length) { grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🎬</div><p>Không tìm thấy phim</p></div>`; return; }
  
  grid.innerHTML = data.map(r => {
    // Lấy tên thể loại từ format "TL01:Tên,TL02:Tên,..."
    const genreNames = r.TheLoai ? r.TheLoai.split(',').map(tl => tl.split(':')[1]).filter(Boolean) : [];
    const firstGenre = genreNames[0] || '';
    const icon = Object.entries(GENRE_ICONS).find(([k]) => firstGenre.includes(k))?.[1] || '🎬';
    
    // Hiển thị ảnh, nếu ảnh lỗi (onerror) thì tự động ẩn ảnh và hiện lại icon Emoji dự phòng
    const poster = r.HinhAnh 
      ? `<img src="${r.HinhAnh}" style="width:100%; height:100%; object-fit:cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
         <div style="display:none; width:100%; height:100%; align-items:center; justify-content:center; font-size:60px;">${icon}</div>` 
      : icon;
    const safeData = esc(JSON.stringify(r));
    
    const genreBadges = genreNames.map(g => `<span class="movie-genre-badge">${g}</span>`).join('');
    
    return `
    <div class="movie-card" onclick='showMovieDetail(${safeData})'>
      <div class="movie-poster">${poster}</div>
      <div class="movie-info">
        <div class="movie-title">${r.TenPhim}</div>
        <div class="movie-meta">
          ${genreBadges}
          <span class="movie-duration">⏱ ${r.ThoiLuong} phút</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

export function showMovieDetail(r) {
  // Lấy tên thể loại từ format "TL01:Tên,TL02:Tên,..."
  const genreNamesArray = r.TheLoai ? r.TheLoai.split(',').map(tl => tl.split(':')[1]).filter(Boolean) : [];
  const genreString = genreNamesArray.join(', ');
  const firstGenre = genreNamesArray[0] || '';
  const icon = Object.entries(GENRE_ICONS).find(([k]) => firstGenre.includes(k))?.[1] || '🎬';
  
  const safeData = esc(JSON.stringify(r));
  
  const posterHTML = r.HinhAnh 
    ? `<img src="${r.HinhAnh}" style="width:100%; border-radius:8px; object-fit:cover; aspect-ratio:2/3;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
       <div style="display:none; width:100%; aspect-ratio:2/3; background:var(--surface); border:1px solid var(--border); border-radius:8px; align-items:center; justify-content:center; font-size:48px;">${icon}</div>` 
    : `<div style="width:100%; aspect-ratio:2/3; background:var(--surface); border:1px solid var(--border); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:48px">${icon}</div>`;
  
  document.getElementById('modal-movie-title').textContent = r.TenPhim;
  document.getElementById('modal-movie-body').innerHTML = `
    <div style="display:flex; gap:20px;">
      <div style="width:130px; flex-shrink:0;">${posterHTML}</div>
      <div style="flex:1;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px">
          <div><span style="color:var(--muted)">Đạo diễn</span><div style="font-weight:600;margin-top:2px">${r.DaoDien}</div></div>
          <div><span style="color:var(--muted)">Quốc gia</span><div style="font-weight:600;margin-top:2px">${r.QuocGia}</div></div>
          <div style="grid-column:1/-1"><span style="color:var(--muted)">Thể loại</span><div style="font-weight:600;margin-top:2px">${genreString}</div></div>
          <div><span style="color:var(--muted)">Thời lượng</span><div style="font-weight:600;margin-top:2px">${r.ThoiLuong} phút</div></div>
          <div><span style="color:var(--muted)">Khởi chiếu</span><div style="font-weight:600;margin-top:2px">${fmtDate(r.NgayKhoiChieu)}</div></div>
          <div><span style="color:var(--muted)">Số suất</span><div style="font-weight:600;margin-top:2px">${r.SoSuat} suất</div></div>
        </div>
      </div>
    </div>
    ${r.MoTa ? `<p style="color:var(--muted);font-size:13px;line-height:1.6;margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">${r.MoTa}</p>` : ''}
    <div style="display:flex;gap:8px;margin-top:18px">
      <button class="btn btn-ghost" onclick='editPhim(${safeData});closeModal("modal-movie")' style="flex:1">✏️ Sửa</button>
      <button class="btn btn-danger" onclick='deletePhim("${r.MaPhim}");closeModal("modal-movie")'>🗑️ Xóa</button>
    </div>`;
  openModal('modal-movie');
}

export function formPhim(data = {}) {
  document.getElementById('modal-form-title').textContent = data.MaPhim ? 'Sửa phim' : 'Thêm phim';
  
  // Parse thể loại nếu có (format: "TL01:Tên,TL02:Tên,...")
  let selectedTheLoai = [];
  if (data.TheLoai) {
    selectedTheLoai = data.TheLoai.split(',').map(tl => {
      const [ma] = tl.split(':');
      return ma;
    });
  }
  
  const allTheLoai = window.allTheLoai || [];
  const genreOptions = allTheLoai.map(tl => 
    `<div style="display:flex; gap:8px; margin:6px 0;">
      <input type="checkbox" id="f-TL-${tl.MaTheLoai}" value="${tl.MaTheLoai}" ${selectedTheLoai.includes(tl.MaTheLoai)?'checked':''}>
      <label for="f-TL-${tl.MaTheLoai}" style="flex:1; cursor:pointer;">${tl.TenTheLoai}</label>
    </div>`
  ).join('');
  
  document.getElementById('modal-form-body').innerHTML = `
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Mã phim *</label>
        <input class="form-input" id="f-MaPhim" value="${esc(data.MaPhim||'')}" ${data.MaPhim?'readonly':''}></div>
      <div class="form-group"><label class="form-label">Ngày khởi chiếu *</label>
        <input class="form-input" type="date" id="f-NgayKhoiChieu" value="${fmtDateInput(data.NgayKhoiChieu)}"></div>
      <div class="form-group full"><label class="form-label">Tên phim *</label>
        <input class="form-input" id="f-TenPhim" value="${esc(data.TenPhim||'')}"></div>
      <div class="form-group"><label class="form-label">Đạo diễn *</label>
        <input class="form-input" id="f-DaoDien" value="${esc(data.DaoDien||'')}"></div>
      <div class="form-group"><label class="form-label">Quốc gia *</label>
        <input class="form-input" id="f-QuocGia" value="${esc(data.QuocGia||'')}"></div>
      <div class="form-group full"><label class="form-label">Thể loại *</label>
        <div id="f-TheLoai-checkboxes" style="border:1px solid var(--border); border-radius:6px; padding:12px; max-height:150px; overflow-y:auto;">
          ${genreOptions}
        </div></div>
      <div class="form-group"><label class="form-label">Thời lượng (phút) *</label>
        <input class="form-input" type="number" id="f-ThoiLuong" value="${data.ThoiLuong||''}"></div>
      <div class="form-group full"><label class="form-label">Link ảnh Poster (URL)</label>
        <input class="form-input" id="f-HinhAnh" placeholder="Ví dụ: https://.../hinh.jpg" value="${esc(data.HinhAnh||'')}"></div>
      <div class="form-group full"><label class="form-label">Mô tả</label>
        <textarea class="form-textarea" id="f-MoTa">${esc(data.MoTa||'')}</textarea></div>
    </div>`;
  sharedData.formEntity = 'phim';
  openModal('modal-form');
}

export async function submitPhim() {
  // Lấy các checkbox thể loại được chọn
  const checkboxes = document.querySelectorAll('#f-TheLoai-checkboxes input[type="checkbox"]:checked');
  const TheLoai = Array.from(checkboxes).map(cb => cb.value);
  
  const d = { MaPhim:v('f-MaPhim'), TenPhim:v('f-TenPhim'), DaoDien:v('f-DaoDien'),
    QuocGia:v('f-QuocGia'), TheLoai, ThoiLuong:v('f-ThoiLuong'),
    NgayKhoiChieu:v('f-NgayKhoiChieu'), MoTa:v('f-MoTa'), HinhAnh:v('f-HinhAnh') };
  const url = sharedData.formMode==='add' ? '/api/phim' : `/api/phim/${sharedData.editId}`;
  const r = await apiFetch(url, { method: sharedData.formMode==='add'?'POST':'PUT', body: JSON.stringify(d) });
  if (r?.success) { toast('Lưu thành công!', 'success'); closeModal('modal-form'); loadPhim(); }
  else toast(r?.error||'Lỗi','error');
}

export function editPhim(data) { sharedData.formMode='edit'; sharedData.editId=data.MaPhim; formPhim(data); }
export function deletePhim(id) {
  confirmDeleteFn(`Xóa phim mã "${id}"?`, async () => {
    const r = await apiFetch(`/api/phim/${id}`, { method:'DELETE' });
    if (r?.success) { toast('Đã xóa!', 'success'); loadPhim(); }
    else toast(r?.error||'Lỗi','error');
  });
}