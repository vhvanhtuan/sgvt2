// utils/infoApi.js
// Hàm fetch info cấu hình chung từ API
export async function fetchInfo() {
  const isThueXeDeDangDomain = typeof window !== 'undefined' && /(^|\.)thuexededang\.com$/i.test(window.location.hostname || '');
  const id = isThueXeDeDangDomain ? 1 : 2; // Nếu là domain thuexededang.com thì lấy id=2, ngược lại lấy id=1
  const res = await fetch(`/api/info.php?id=${id}`);
  const data = await res.json();
  if (data.status === 'success') return data.data;
  return null;
}
