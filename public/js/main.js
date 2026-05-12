// Import all modules
import { showPage, getPageLabel, getAddLabel, loadPageData, handleSearch, handleAdd } from './navigation.js';
import { openAddForm, formThanhPho, submitThanhPho, editThanhPho, deleteThanhPho, loadThanhPho } from './thanhpho.js';
import { formRap, submitRap, editRap, deleteRap, loadRap } from './rap.js';
import { formPhong, submitPhong, editPhong, deletePhong, loadPhong } from './phong.js';
import { loadGhe, deleteGhe, showSeatInfo } from './ghe.js';
import { formPhim, submitPhim, editPhim, deletePhim, showMovieDetail, loadPhim } from './phim.js';
import { formSuatChieu, submitSuatChieu, editSuatChieu, deleteSuatChieu, viewSeatMap, filterSuatChieuByRap, loadSuatChieu } from './suatchieu.js';
import { formVe, submitVe, huyVe, loadGheForVe, loadVe } from './ve.js';
import { formKhachHang, submitKhachHang, editKhachHang, deleteKhachHang, loadKhachHang } from './khachhang.js';
import { confirmDelete, closeModal } from './utils.js';
import { init } from './init.js';
import { sharedData } from './config.js';

// Submit form handler
async function submitForm() {
  const handlers = {
    thanhpho: submitThanhPho,
    rap: submitRap,
    phong: submitPhong,
    phim: submitPhim,
    suatchieu: submitSuatChieu,
    ve: submitVe,
    khachhang: submitKhachHang,
  };
  if (handlers[sharedData.formEntity]) await handlers[sharedData.formEntity]();
}

// Make functions global for onclick handlers
window.showPage = showPage;
window.handleSearch = handleSearch;
window.handleAdd = handleAdd;
window.openAddForm = openAddForm;
window.formThanhPho = formThanhPho;
window.submitThanhPho = submitThanhPho;
window.editThanhPho = editThanhPho;
window.deleteThanhPho = deleteThanhPho;
window.loadThanhPho = loadThanhPho;
window.formRap = formRap;
window.submitRap = submitRap;
window.editRap = editRap;
window.deleteRap = deleteRap;
window.loadRap = loadRap;
window.formPhong = formPhong;
window.submitPhong = submitPhong;
window.editPhong = editPhong;
window.deletePhong = deletePhong;
window.loadPhong = loadPhong;
window.loadGhe = loadGhe;
window.deleteGhe = deleteGhe;
window.showSeatInfo = showSeatInfo;
window.formPhim = formPhim;
window.submitPhim = submitPhim;
window.editPhim = editPhim;
window.deletePhim = deletePhim;
window.showMovieDetail = showMovieDetail;
window.loadPhim = loadPhim;
window.formSuatChieu = formSuatChieu;
window.submitSuatChieu = submitSuatChieu;
window.editSuatChieu = editSuatChieu;
window.deleteSuatChieu = deleteSuatChieu;
window.viewSeatMap = viewSeatMap;
window.filterSuatChieuByRap = filterSuatChieuByRap;
window.loadSuatChieu = loadSuatChieu;
window.formVe = formVe;
window.submitVe = submitVe;
window.huyVe = huyVe;
window.loadGheForVe = loadGheForVe;
window.loadVe = loadVe;
window.formKhachHang = formKhachHang;
window.submitKhachHang = submitKhachHang;
window.editKhachHang = editKhachHang;
window.deleteKhachHang = deleteKhachHang;
window.loadKhachHang = loadKhachHang;
window.submitForm = submitForm;
window.confirmDelete = confirmDelete;
window.closeModal = closeModal;

export function initApp() {
  init();
}