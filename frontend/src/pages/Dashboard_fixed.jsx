import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const STATUS_LABELS = {
  active: 'Activo',
  paused: 'Pausado',
  completed: 'Completado',
  archived: 'Archivado',
};

const COLORS = ['#7c6f64', '#a89968', '#5a7d6f', '#a26d5b', '#6b7280', '#8b5cf6', '#c1453f'];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: '#7c6f64', deadline: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data.data);
    } catch {
      setError('No se pudieron cargar los proyectos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/projects', form);
      setProjects([data.data, ...projects]);
      setShowModal(false);
      setForm({ name: '', description: '', color: '#7c6f64', deadline: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear proyecto');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar este proyecto y todas sus tareas?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(projects.filter((p) => p.id !== id));
    } catch {
      setError('Error al eliminar');
    }
  };

  const getProgress = (p) =>
    p.task_count > 0 ? Math.round((p.done_count / p.task_count) * 100) : 0;

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">TF</div>
        <nav className="sidebar-nav">
          <a className="nav-item active">
            <span className="nav-icon">▦</span> Proyectos
          </a>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-email">{user?.email}</span>
            </div>
          </div>
          <button className="btn-logout" onClick={logout}>Salir</button>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-header">
          <div>
            <h2 className="page-title">Mis Proyectos</h2>
            <p className="page-subtitle">{projects.length} proyecto{projects.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + Nuevo proyecto
          </button>
        </div>

        {error && <div className="error-banner">{error} <button onClick={() => setError('')}>×</button></div>}

        {loading ? (
          <div className="loading-grid">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton-card" />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No tienes proyectos aún</h3>
            <p>Crea tu primer proyecto para empezar a organizar tus tareas</p>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              Crear primer proyecto
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => {
              const progress = getProgress(project);
              return (
                <div
                   key={project.id}
                   className="project-card"
                   onClick={() => navigate(`/projects/${project.id}`)}
                   style={{ '--project-color': project.color }}
                >
                  <div className="project-color-bar" />
                  <div className="project-card-body">
                    <div className="project-card-header">
                      <h3 className="project-name">{project.name}</h3>
                      <span className={`status-badge status-${project.status}`}>
                        {STATUS_LABELS[project.status]}
                      </span>
                    </div>
                    {project.description && (
                       <p className="project-desc">{project.description}</p>
                    )}
                    <div className="project-progress">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%`, background: project.color }} />
                      </div>
                      <span className="progress-label">{progress}%</span>
                    </div>
                    <div className="project-meta">
                       <span className="meta-item">📌 {project.task_count} tareas</span>
                       <span className="meta-item">✅ {project.done_count} hechas</span>
                      {project.deadline && (
                        <span className="meta-item">
                          📅 {new Date(project.deadline).toLocaleDateString('es-ES')}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="btn-delete-project"
                    onClick={(e) => handleDelete(project.id, e)}
                    title="Eliminar proyecto"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nuevo Proyecto</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreate} className="modal-form">
              <div className="field-group">
                <label>Nombre del proyecto *</label>
                <input
                  type="text"
                  placeholder="ej. Rediseño web, App móvil..."
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="field-group">
                <label>Descripción</label>
                <textarea
                  placeholder="¿De qué trata este proyecto?"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="field-group">
                <label>Color</label>
                <div className="color-picker">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`color-dot ${form.color === c ? 'selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => setForm({ ...form, color: c })}
                    />
                  ))}
                </div>
              </div>
              <div className="field-group">
                <label>Fecha límite</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Creando...' : 'Crear proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
