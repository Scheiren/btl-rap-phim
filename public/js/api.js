import { API } from './config.js';
import { toast } from './utils.js';

// =====================================================
// API HELPERS
// =====================================================
export async function apiFetch(url, opts = {}) {
  try {
    const r = await fetch(API + url, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });
    return await r.json();
  } catch (e) {
    toast('Lỗi kết nối server: ' + e.message, 'error');
    return null;
  }
}