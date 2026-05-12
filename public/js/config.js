// =====================================================
// CONFIG & STATE
// =====================================================
export const API = '';  // same origin, server serves static files

// Shared data object to allow mutation
export const sharedData = {
  currentPage: 'dashboard',
  formMode: 'add',
  formEntity: '',
  editId: null,
  deleteCallback: null,
  allTP: [],
  allRap: [],
  allPhong: [],
  allPhim: []
};