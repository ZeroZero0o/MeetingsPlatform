import { useState } from 'react';
import { login, register, setAuth, getErrorMessage } from '../api.js';

export default function LoginForm({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isLogin = mode === 'login';

  function switchMode() {
    setMode(isLogin ? 'register' : 'login');
    setError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { token, user } = await login(email, password);
        setAuth(token, user);
        onAuth(user);
      } else {
        await register(email, password);
        // После регистрации сразу входим, чтобы получить JWT-токен.
        const { token, user } = await login(email, password);
        setAuth(token, user);
        onAuth(user);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Система управления собраниями</h1>
        <p className="login-subtitle">
          {isLogin ? 'Вход в систему' : 'Регистрация нового пользователя'}
        </p>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@meetings.local"
            required
            autoComplete="email"
          />
        </label>

        <label>
          Пароль
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Минимум 6 символов"
            required
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Подождите…' : isLogin ? 'Войти' : 'Зарегистрироваться'}
        </button>

        <button type="button" className="button-link" onClick={switchMode}>
          {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </button>
      </form>
    </div>
  );
}
