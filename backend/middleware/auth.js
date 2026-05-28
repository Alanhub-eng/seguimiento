const jwt = require('jsonwebtoken');
const db = require('../config/db');

const protect = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'No autorizado, token requerido' });

  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    const user = db.get('users').find({ id: decoded.id }).value();
    if (!user) return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
};

module.exports = { protect };
