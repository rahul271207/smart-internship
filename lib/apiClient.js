import axios from 'axios';

const api = axios.create({ baseURL: '' });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('siae_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function setToken(token) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem('siae_token', token);
  else localStorage.removeItem('siae_token');
}

export async function downloadCsv(kind) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('siae_token') : '';
  const response = await api.get(`/api/admin/export/${kind}`, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${kind}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default api;
