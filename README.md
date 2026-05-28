# TaskFlow — Gestor de Tareas y Proyectos

Stack: **React + Vite** | **Node.js + Express** | **SQLite (better-sqlite3)**

> Sin configuración de base de datos externa. SQLite crea el archivo `taskflow.db`
> automáticamente la primera vez que arrancas el servidor.

---

## 🚀 Instalación

### Backend
```bash
cd backend
npm install
copy .env.example .env   # Windows
# cp .env.example .env   # Mac / Linux
# Abre .env y pon tu JWT_SECRET
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173

---

## ⚙️ Variables de entorno (backend/.env)

```env
PORT=5000
JWT_SECRET=cualquier_clave_larga_secreta
JWT_EXPIRE=7d
NODE_ENV=development
```

Solo necesitas cambiar `JWT_SECRET`. El resto funciona por defecto.

---

## 📡 Endpoints

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/register | Registrar usuario |
| POST | /api/auth/login | Iniciar sesión |
| GET  | /api/auth/me | Usuario actual |

### Proyectos (requieren JWT)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET    | /api/projects | Listar proyectos |
| POST   | /api/projects | Crear proyecto |
| GET    | /api/projects/:id | Ver proyecto |
| PUT    | /api/projects/:id | Actualizar proyecto |
| DELETE | /api/projects/:id | Eliminar proyecto + tareas |

### Tareas (requieren JWT)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET    | /api/tasks?project=:id | Listar tareas |
| POST   | /api/tasks | Crear tarea |
| PUT    | /api/tasks/:id | Actualizar / mover tarea |
| DELETE | /api/tasks/:id | Eliminar tarea |

---

## 🗄️ Base de datos

SQLite guarda todo en `backend/taskflow.db`. No necesitas instalar nada extra.
Las tablas se crean automáticamente al primer arranque.

Tablas: **users**, **projects**, **tasks**
