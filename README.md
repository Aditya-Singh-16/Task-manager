# TaskFlow – Team Task Manager

A full-stack web application for creating projects, assigning tasks, and tracking progress with role-based access control (Admin/Member).

---

## 🚀 Tech Stack

| Layer | Tech |
|---|---|
| Backend | Node.js, Express.js |
| ORM | Prisma |
| Database | PostgreSQL (Railway) |
| Auth | JWT + bcryptjs |
| Frontend | React 18, React Router v6 |
| HTTP Client | Axios |
| Deployment | Railway |

---

## 📁 Project Structure

```
task-manager/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Layout, Sidebar, ProtectedRoute
│   │   ├── context/        # AuthContext
│   │   ├── pages/          # Login, Signup, Dashboard, Projects, ProjectDetail
│   │   └── utils/          # Axios API calls
│   └── package.json
│
├── server/                 # Node.js backend
│   ├── config/db.js        # Prisma client
│   ├── controllers/        # authController, projectController, taskController, dashboardController
│   ├── middleware/         # authMiddleware (JWT + role checks)
│   ├── routes/             # authRoutes, projectRoutes, taskRoutes, dashboardRoutes
│   ├── prisma/schema.prisma
│   ├── server.js
│   └── .env
│
└── README.md
```

---

## ⚙️ Local Setup

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/task-manager.git
cd task-manager
```

### 2. Setup Backend

```bash
cd server
npm install
```

Create your `.env` file:
```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL="postgresql://postgres:NwylaAfYlaMRKTiNOFsejcsPZNTKqhag@ballast.proxy.rlwy.net:30630/railway"
JWT_SECRET="taskmanager_super_secret_jwt_key_2024_railway"
PORT=5000
CLIENT_URL="http://localhost:3000"
```

Push schema to DB and start:
```bash
npx prisma generate
npx prisma db push
npm run dev
```

Backend runs at: `http://localhost:5000`

### 3. Setup Frontend

```bash
cd ../client
npm install
npm start
```

Frontend runs at: `http://localhost:3000`

---

## 🌐 Deploy to Railway

### Backend Deployment

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Select the `server/` folder as the root directory
3. Set these **Environment Variables** in Railway dashboard:
   ```
   DATABASE_URL=postgresql://postgres:NwylaAfYlaMRKTiNOFsejcsPZNTKqhag@ballast.proxy.rlwy.net:30630/railway
   JWT_SECRET=taskmanager_super_secret_jwt_key_2024_railway
   PORT=5000
   CLIENT_URL=https://your-frontend-url.up.railway.app
   NODE_ENV=production
   ```
4. Railway will auto-detect Node.js, run `npm install`, `prisma generate`, `prisma db push`, then `node server.js`

### Frontend Deployment

1. New Railway service → Deploy from same repo, root = `client/`
2. Set build command: `npm run build`
3. Set start command: `npx serve -s build -l 3000`
4. Set environment variable:
   ```
   REACT_APP_API_URL=https://your-backend.up.railway.app/api
   ```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/signup | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |

### Projects
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/projects | List my projects | ✅ |
| POST | /api/projects | Create project | ✅ |
| GET | /api/projects/:id | Get project details | ✅ |
| PUT | /api/projects/:id | Update project | Admin |
| DELETE | /api/projects/:id | Delete project | Admin |
| POST | /api/projects/:id/members | Add member | Admin |
| DELETE | /api/projects/:id/members/:userId | Remove member | Admin |
| PUT | /api/projects/:id/members/:userId | Update member role | Admin |

### Tasks
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /api/tasks | Create task | ✅ |
| GET | /api/tasks/project/:projectId | Get project tasks | ✅ |
| PUT | /api/tasks/:taskId | Update task | ✅ |
| PATCH | /api/tasks/:taskId/status | Quick status update | ✅ |
| DELETE | /api/tasks/:taskId | Delete task | Admin |

### Dashboard
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/dashboard | Get stats + recent tasks | ✅ |

---

## 🔐 Role-Based Access

| Action | Member | Admin |
|---|---|---|
| View projects | ✅ | ✅ |
| Create project | ✅ | ✅ |
| Create/Edit tasks | ✅ | ✅ |
| Delete tasks | ❌ | ✅ |
| Add/Remove members | ❌ | ✅ |
| Update member roles | ❌ | ✅ |
| Delete project | ❌ | ✅ |

---

## ✨ Features

- 🔐 JWT Authentication (signup, login, token expiry)
- 📁 Project management with team members
- ✅ Task CRUD with status (todo / in-progress / done)
- 🎯 Priority levels (low / medium / high)
- 📅 Due dates with overdue tracking
- 🗂️ Kanban board view per project
- 📊 Dashboard with task stats
- 👥 Role-based access (project admin vs member)
- 🌙 Dark theme UI
- 📱 Responsive design
