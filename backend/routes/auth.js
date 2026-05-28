const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { protect } = require('../middleware/auth');

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });

    const existing = db.get('users').find({ email }).value();
    if (existing)
      return res.status(400).json({ success: false, message: 'El email ya está registrado' });

    const user = {
      id: newId(),
      name,
      email,
      password: await bcrypt.hash(password, 10),
      created_at: new Date().toISOString(),
    };
    db.get('users').push(user).write();

    const { password: _, ...safeUser } = user;
    res.status(201).json({ success: true, token: generateToken(user.id), user: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email y contraseña requeridos' });

    const user = db.get('users').find({ email }).value();
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });

    const { password: _, ...safeUser } = user;
    res.json({ success: true, token: generateToken(user.id), user: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  const { password: _, ...safeUser } = req.user;
  res.json({ success: true, user: safeUser });
});

module.exports = router;
