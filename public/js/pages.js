// Export all load functions
export { loadDashboard } from './dashboard.js';
export { loadThanhPho } from './thanhpho.js';
export { loadRap } from './rap.js';
export { loadPhong } from './phong.js';
export { loadGhe } from './ghe.js';
export { loadPhim } from './phim.js';
export { loadSuatChieu } from './suatchieu.js';
export { loadVe } from './ve.js';
export { loadKhachHang } from './khachhang.js';

// Export form functions
export { openAddForm, formThanhPho, submitThanhPho, editThanhPho, deleteThanhPho } from './thanhpho.js';
export { formRap, submitRap, editRap, deleteRap } from './rap.js';
export { formPhong, submitPhong, editPhong, deletePhong } from './phong.js';
export { formPhim, submitPhim, editPhim, deletePhim } from './phim.js';
export { formSuatChieu, submitSuatChieu, editSuatChieu, deleteSuatChieu, viewSeatMap, filterSuatChieuByRap } from './suatchieu.js';
export { formVe, submitVe, huyVe, loadGheForVe } from './ve.js';
export { formKhachHang, submitKhachHang, editKhachHang, deleteKhachHang } from './khachhang.js';