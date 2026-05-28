const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect } = require('../middleware/auth');

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

router.use(protect);

// GET /api/tasks?project=:id
router.get('/', (req, res) => {
  try {
    const { project, status, priority } = req.query;
    let tasks = db.get('tasks').value();

    if (project)  tasks = tasks.filter(t => t.project_id === project);
    if (status)   tasks = tasks.filter(t => t.status === status);
    if (priority) tasks = tasks.filter(t => t.priority === priority);

    tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/tasks
router.post('/', (req, res) => {
  try {
    const {
      title, description = '', status = 'todo', priority = 'medium',
      project, due_date = null, tags = [],
    } = req.body;

    if (!title?.trim()) return res.status(400).json({ success: false, message: 'El título es requerido' });
    if (!project)       return res.status(400).json({ success: false, message: 'El proyecto es requerido' });

    const proj = db.get('projects').find({ id: project }).value();
    if (!proj) return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });

    const task = {
      id: newId(),
      title: title.trim(),
      description,
      status,
      priority,
      due_date,
      tags: Array.isArray(tags) ? tags : [],
      project_id: project,
      created_by: req.user.id,
      created_at: new Date().toISOString(),
    };
    db.get('tasks').push(task).write();
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/tasks/:id
router.get('/:id', (req, res) => {
  try {
    const task = db.get('tasks').find({ id: req.params.id }).value();
    if (!task) return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/tasks/:id
router.put('/:id', (req, res) => {
  try {
    const task = db.get('tasks').find({ id: req.params.id }).value();
    if (!task) return res.status(404).json({ success: false, message: 'Tarea no encontrada' });

    const { title, description, status, priority, due_date, tags } = req.body;
    const updates = {};
    if (title       !== undefined) updates.title       = title;
    if (description !== undefined) updates.description = description;
    if (status      !== undefined) updates.status      = status;
    if (priority    !== undefined) updates.priority    = priority;
    if (due_date    !== undefined) updates.due_date    = due_date;
    if (tags        !== undefined) updates.tags        = Array.isArray(tags) ? tags : [];

    db.get('tasks').find({ id: req.params.id }).assign(updates).write();
    const updated = db.get('tasks').find({ id: req.params.id }).value();
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  try {
    const task = db.get('tasks').find({ id: req.params.id }).value();
    if (!task) return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
    db.get('tasks').remove({ id: req.params.id }).write();
    res.json({ success: true, message: 'Tarea eliminada' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
