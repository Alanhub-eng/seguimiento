const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// Inicializa SQLite y crea tablas
require('./config/db');

const app = express();

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://tu-dominio.com' : 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Rutas
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks',    require('./routes/tasks'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TaskFlow API (SQLite) corriendo 🚀' });
});

app.use((req, res) => res.status(404).json({ success: false, message: 'Ruta no encontrada' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));
