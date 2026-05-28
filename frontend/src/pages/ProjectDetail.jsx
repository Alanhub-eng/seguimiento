import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';

const COLUMNS = [
  { id: 'todo', label: 'Por hacer', icon: '○' },
  { id: 'in_progress', label: 'En progreso', icon: '◑' },
  { id: 'review', label: 'Revisión', icon: '◐' },
  { id: 'done', label: 'Hecho', icon: '●' },
];

const PRIORITY_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#7c3aed',
};

const PRIORITY_LABELS = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' };

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', tags: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    try {
      console.log('🔍 Cargando proyecto con ID:', id);
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?project=${id}`),
      ]);
      console.log('✅ Proyecto cargado:', projRes.data);
      console.log('✅ Tareas cargadas:', tasksRes.data);
      setProject(projRes.data.data);
      setTasks(tasksRes.data.data || []);
    } catch (err) {
      console.error('❌ Error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Error cargando el proyecto');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = (status = 'todo') => {
    setEditTask(null);
    setForm({ title: '', description: '', priority: 'medium', status, dueDate: '', tags: '' });
    setShowModal(true);
  };

  const openEdit = (task) => {
    setEditTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.due_date ? task.due_date.slice(0, 10) : '',
      tags: task.tags?.join(', ') || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        status: form.status,
        priority: form.priority,
        project: id,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        due_date: form.dueDate || null,
      };
      if (editTask) {
        const { data } = await api.put(`/tasks/${editTask.id}`, payload);
        setTasks(tasks.map((t) => (t.id === editTask.id ? data.data : t)));
      } else {
        const { data } = await api.post('/tasks', payload);
        setTasks([...tasks, data.data]);
      }
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error guardando tarea');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMoveTask = async (task, newStatus) => {
    try {
      const { data } = await api.put(`/tasks/${task.id}`, { status: newStatus });
      setTasks(tasks.map((t) => (t.id === task.id ? data.data : t)));
    } catch {
      setError('Error moviendo tarea');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch {
      setError('Error eliminando tarea');
    }
  };

  if (loading) return <div className="page-loading">Cargando proyecto...</div>;

  return (
    <div className="project-detail">
      {/* Header */}
      <div className="detail-header" style={{ '--project-color': project?.color }}>
        <button className="btn-back" onClick={() => navigate('/dashboard')}>← Proyectos</button>
        <div className="detail-header-info">
          <div className="detail-color-dot" style={{ background: project?.color }} />
          <h2 className="detail-title">{project?.name}</h2>
        </div>
        {project?.description && <p className="detail-desc">{project.description}</p>}
        <button className="btn-primary" onClick={() => openCreate()}>+ Nueva tarea</button>
      </div>

      {error && <div className="error-banner">{error} <button onClick={() => setError('')}>×</button></div>}

      {/* Kanban board */}
      <div className="kanban-board">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="kanban-col">
              <div className="kanban-col-header">
                <span className="col-icon">{col.icon}</span>
                <span className="col-label">{col.label}</span>
                <span className="col-count">{colTasks.length}</span>
              </div>
              <div className="kanban-tasks">
                {colTasks.map((task) => (
                  <div key={task.id} className="task-card" onClick={() => openEdit(task)}>
                    <div className="task-priority-bar" style={{ background: PRIORITY_COLORS[task.priority] }} />
                    <div className="task-body">
                      <p className="task-title">{task.title}</p>
                      {task.description && <p className="task-desc">{task.description}</p>}
                      <div className="task-meta">
                        <span
                          className="task-priority"
                          style={{ color: PRIORITY_COLORS[task.priority] }}
                        >
                          {PRIORITY_LABELS[task.priority]}
                        </span>
                        {task.dueDate && (
                          <span className="task-due">
                            📅 {new Date(task.dueDate).toLocaleDateString('es-ES')}
                          </span>
                        )}
                      </div>
                      {task.tags?.length > 0 && (
                        <div className="task-tags">
                          {task.tags.map((tag) => (
                            <span key={tag} className="tag">{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="task-actions" onClick={(e) => e.stopPropagation()}>
                        {COLUMNS.filter((c) => c.id !== col.id).map((c) => (
                          <button
                            key={c.id}
                            className="btn-move"
                            onClick={() => handleMoveTask(task, c.id)}
                            title={`Mover a ${c.label}`}
                          >
                            → {c.label}
                          </button>
                        ))}
                        <button
                          className="btn-delete-task"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button className="btn-add-task" onClick={() => openCreate(col.id)}>
                  + Agregar tarea
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal crear / editar tarea */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editTask ? 'Editar tarea' : 'Nueva tarea'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="field-group">
                <label>Título *</label>
                <input
                  type="text"
                  placeholder="¿Qué hay que hacer?"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="field-group">
                <label>Descripción</label>
                <textarea
                  placeholder="Detalles de la tarea..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="field-group">
                  <label>Estado</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {COLUMNS.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="field-group">
                  <label>Prioridad</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="field-group">
                  <label>Fecha límite</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  />
                </div>
                <div className="field-group">
                  <label>Etiquetas (separadas por coma)</label>
                  <input
                    type="text"
                    placeholder="diseño, frontend, urgente"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Guardando...' : editTask ? 'Guardar cambios' : 'Crear tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
