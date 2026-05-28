import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [localError, setLocalError] = useState('');
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        if (!form.name.trim()) return setLocalError('El nombre es requerido');
        await register(form.name, form.email, form.password);
      }
      navigate('/dashboard');
    } catch (err) {
      setLocalError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="brand-logo">TF</div>
        <h1 className="brand-name">TaskFlow</h1>
        <p className="brand-tagline">Proyectos. Tareas. Control total.</p>
      </div>

      <div className="auth-card">
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setLocalError(''); }}
          >
            Iniciar sesión
          </button>
          <button
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setLocalError(''); }}
          >
            Crear cuenta
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="field-group">
              <label>Nombre completo</label>
              <input
                type="text"
                placeholder="Tu nombre"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          )}
          <div className="field-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="hola@ejemplo.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="field-group">
            <label>Contraseña</label>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
          </div>

          {localError && <div className="auth-error">{localError}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
}
