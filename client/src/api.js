import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Перехватчик запроса: автоматически подставляет JWT-токен из localStorage.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Перехватчик ответа: при 401 (токен недействителен/просрочен) разлогиниваемся.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    return Promise.reject(error);
  },
);

// --- Работа с аутентификацией ---

export function getToken() {
  return localStorage.getItem('token');
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// Извлекает человекочитаемое сообщение об ошибке из ответа axios.
export function getErrorMessage(error) {
  return error?.response?.data?.error || error?.message || 'Сетевая ошибка';
}

// --- Auth API ---

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data; // { token, user }
}

export async function register(email, password) {
  const { data } = await api.post('/auth/register', { email, password });
  return data;
}

// --- Meetings API ---

// params: { search, status, organizer, ... }; signal — для отмены запроса.
export async function fetchMeetings(params = {}, signal) {
  const { data } = await api.get('/meetings', { params, signal });
  return data;
}

export async function createMeeting(payload) {
  const { data } = await api.post('/meetings', payload);
  return data;
}

export async function updateMeeting(id, payload) {
  const { data } = await api.put(`/meetings/${id}`, payload);
  return data;
}

export async function deleteMeeting(id) {
  const { data } = await api.delete(`/meetings/${id}`);
  return data;
}
