import { useEffect, useState } from 'react';
import LoginForm from './components/LoginForm.jsx';
import MeetingList from './components/MeetingList.jsx';
import { getToken, getStoredUser, clearAuth } from './api.js';
import './App.css';

export default function App() {
  const [user, setUser] = useState(() => (getToken() ? getStoredUser() : null));

  useEffect(() => {
    // Разлогинивание при недействительном токене (событие из api.js).
    function handleLogout() {
      setUser(null);
    }
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  function handleLogout() {
    clearAuth();
    setUser(null);
  }

  if (!user) {
    return <LoginForm onAuth={setUser} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Система управления собраниями и встречами</h1>
        <p className="app-subtitle">Лабораторная работа №5 — работа с REST API</p>
        <div className="app-user">
          <span>{user.email}</span>
          <button type="button" className="button-secondary" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </header>
      <main className="app-main">
        <MeetingList />
      </main>
    </div>
  );
}
