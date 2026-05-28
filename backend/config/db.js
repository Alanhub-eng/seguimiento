const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fs = require('fs');

// Crear carpeta data si no existe
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const adapter = new FileSync(path.join(dataDir, 'db.json'));
const db = low(adapter);

// Estructura inicial de la base de datos
db.defaults({
  users:    [],
  projects: [],
  tasks:    [],
}).write();

console.log('✅ Base de datos local lista en: data/db.json');

module.exports = db;
