const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect } = require('../middleware/auth');

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

router.use(protect);

// GET /api/projects
router.get('/', (req, res) => {
  try {
    const projects = db.get('projects')
      .filter({ owner_id: req.user.id })
      .orderBy(['created_at'], ['desc'])
      .value();

    const withStats = projects.map(p => {
      const allTasks  = db.get('tasks').filter({ project_id: p.id }).value();
      const doneTasks = allTasks.filter(t => t.status === 'done');
      return { ...p, task_count: allTasks.length, done_count: doneTasks.length };
    });

    res.json({ success: true, data: withStats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/projects
router.post('/', (req, res) => {
  try {
    const { name, description = '', color = '#6366f1', deadline = null } = req.body;
    if (!name?.trim())
      return res.status(400).json({ success: false, message: 'El nombre es requerido' });

    const project = {
      id: newId(),
      name: name.trim(),
      description,
      color,
      status: 'active',
      deadline,
      owner_id: req.user.id,
      created_at: new Date().toISOString(),
    };
    db.get('projects').push(project).write();
    res.status(201).json({ success: true, data: { ...project, task_count: 0, done_count: 0 } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/projects/:id
router.get('/:id', (req, res) => {
  try {
    const project = db.get('projects').find({ id: req.params.id }).value();
    if (!project) return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
    if (project.owner_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Sin acceso a este proyecto' });
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/projects/:id
router.put('/:id', (req, res) => {
  try {
    const project = db.get('projects').find({ id: req.params.id }).value();
    if (!project) return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
    if (project.owner_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Solo el dueño puede editar' });

    const { name, description, color, status, deadline } = req.body;
    const updates = {};
    if (name        !== undefined) updates.name        = name;
    if (description !== undefined) updates.description = description;
    if (color       !== undefined) updates.color       = color;
    if (status      !== undefined) updates.status      = status;
    if (deadline    !== undefined) updates.deadline    = deadline;

    db.get('projects').find({ id: req.params.id }).assign(updates).write();
    const updated = db.get('projects').find({ id: req.params.id }).value();
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', (req, res) => {
  try {
    const project = db.get('projects').find({ id: req.params.id }).value();
    if (!project) return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
    if (project.owner_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Solo el dueño puede eliminar' });

    db.get('tasks').remove({ project_id: req.params.id }).write();
    db.get('projects').remove({ id: req.params.id }).write();
    res.json({ success: true, message: 'Proyecto y tareas eliminados' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
