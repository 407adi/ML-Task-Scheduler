# INSTALLATION GUIDE

**Project:** Intelligent Task Allocation and Scheduling System with ML-Assisted Execution Time Prediction  
**Repository:** https://github.com/shri33/ML-Task-Scheduler  

---

## 1. System Requirements

### 1.1 Minimum Hardware Requirements

| Component | Minimum | Recommended |
|---|---|---|
| **CPU** | Dual-core 2.0 GHz | Quad-core 3.0 GHz or higher |
| **RAM** | 4 GB | 8 GB or higher |
| **Disk Space** | 5 GB free | 10 GB free |
| **Network** | Internet connection for initial setup | Broadband for cloud deployment |

### 1.2 Software Prerequisites

| Software | Required Version | Download Link |
|---|---|---|
| **Git** | 2.30+ | https://git-scm.com/downloads |
| **Docker Desktop** | 24.0+ | https://www.docker.com/products/docker-desktop |
| **Docker Compose** | v2.20+ | Included with Docker Desktop |
| **Node.js** (manual only) | v20.x LTS | https://nodejs.org/ |
| **Python** (manual only) | 3.11+ | https://www.python.org/downloads/ |
| **Web Browser** | Chrome 100+ / Firefox 100+ / Edge 100+ | — |

---

## 2. Installation Method A: Docker Compose (Recommended)

This is the recommended method. It installs and configures all services automatically.

### Step 1: Clone the Repository

```bash
git clone https://github.com/shri33/ML-Task-Scheduler.git
cd ML-Task-Scheduler
```

### Step 2: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` if needed. The default values work for local development:

```ini
# Application
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Security
JWT_SECRET=your_jwt_secret_key_here
COOKIE_SECRET=your_cookie_secret_here

# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/task_scheduler?schema=public

# Redis
REDIS_URL=redis://redis:6379

# ML Service
ML_SERVICE_URL=http://ml-service:5001
```

### Step 3: Build and Start All Services

```bash
docker-compose up -d --build
```

This will start:
- **Frontend** (React) on port `3000`
- **Backend** (Node.js/Express) on port `3001`
- **ML Service** (Python/Flask) on port `5001`
- **PostgreSQL** database on port `5432`
- **Redis** cache on port `6379`

### Step 4: Initialize Database

```bash
# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Seed sample data (fog nodes, resources, sample tasks)
docker-compose exec backend npm run seed
```

### Step 5: Verify Installation

Open your browser and navigate to:

| Service | URL | Expected Response |
|---|---|---|
| **Frontend Dashboard** | http://localhost:3000 | React application loads |
| **Backend Health Check** | http://localhost:3001/api/health | `{"status": "ok"}` |
| **ML Service Health** | http://localhost:5001/api/health | `{"status": "healthy"}` |

### Step 6: Login with Default Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@scheduler.local | Admin@123 |
| **User** | user@scheduler.local | User@123 |

---

## 3. Installation Method B: Manual (Bare-Metal)

Use this method if Docker is unavailable.

### Step 1: Install External Services

1. **PostgreSQL 15:** Install and create a database named `task_scheduler`.
2. **Redis 7:** Install and ensure it runs on default port 6379.

### Step 2: Clone and Configure

```bash
git clone https://github.com/shri33/ML-Task-Scheduler.git
cd ML-Task-Scheduler
cp .env.example .env
```

Update `.env` with your local PostgreSQL and Redis connection strings:

```ini
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/task_scheduler?schema=public
REDIS_URL=redis://localhost:6379
ML_SERVICE_URL=http://localhost:5001
```

### Step 3: Install Backend Dependencies

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed
```

### Step 4: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### Step 5: Install ML Service Dependencies

```bash
cd ../ml-service
pip install -r requirements.txt
```

### Step 6: Start All Services

Open three separate terminals:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 — ML Service:**
```bash
cd ml-service
python app.py
```

---

## 4. Running Tests

### Backend Tests (Jest)
```bash
cd backend
npm test
```

### Frontend Tests (Vitest)
```bash
cd frontend
npm test
```

### ML Service Tests (Pytest)
```bash
cd ml-service
pytest
```

### Full Test Suite (All Components)
```bash
# From project root (Windows PowerShell)
./full-test-suite.ps1
```

---

## 5. Cloud Deployment

### 5.1 Vercel (Frontend)

1. Connect your GitHub repository to Vercel.
2. Set the root directory to `frontend`.
3. Deploy — Vercel auto-detects Vite configuration.

### 5.2 Render (Backend + ML Service)

1. Connect your GitHub repository to Render.
2. The `render.yaml` blueprint defines all services.
3. Set environment variables in the Render dashboard.

### 5.3 Google Cloud Run

```bash
# Build and push Docker images
docker build -t gcr.io/ml-task-schedule/backend ./backend
docker build -t gcr.io/ml-task-schedule/ml-service ./ml-service

# Deploy to Cloud Run
gcloud run deploy backend --image gcr.io/ml-task-schedule/backend --region us-central1
gcloud run deploy ml-service --image gcr.io/ml-task-schedule/ml-service --region us-central1
```

---

## 6. Stopping and Cleanup

### Stop All Services
```bash
docker-compose down
```

### Stop and Remove All Data (Reset)
```bash
docker-compose down -v --remove-orphans
```

---

## 7. Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| Port 3000/3001/5001 already in use | Another process using the port | Stop the conflicting process or change ports in `.env` |
| Database connection refused | PostgreSQL not running | Run `docker-compose up postgres -d` or start PostgreSQL manually |
| ML Service returns 500 | Model file not found | Run `python ml-service/train_model.py` to generate model files |
| Prisma migration fails | Schema mismatch | Run `npx prisma migrate reset` (warning: deletes all data) |
| Redis connection error | Redis not started | Run `docker-compose up redis -d` or start Redis manually |
| Frontend blank page | Backend not reachable | Ensure backend is running and CORS origin matches frontend URL |
| Docker build fails | Insufficient disk space | Free disk space and retry `docker system prune` |

---

## 8. Project Directory Structure

```
ML-Task-Scheduler/
├── backend/                 # Node.js + Express + Prisma API
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── services/        # Business logic (scheduling, fog computing)
│   │   ├── middleware/      # Auth, CSRF, rate limiting
│   │   └── __tests__/       # Jest test suites
│   ├── prisma/              # Database schema and migrations
│   └── Dockerfile
├── frontend/                # React 18 + Vite + TypeScript
│   ├── src/
│   │   ├── pages/           # Application pages
│   │   ├── components/      # Reusable UI components
│   │   └── __tests__/       # Vitest test suites
│   └── Dockerfile
├── ml-service/              # Python + Flask ML inference
│   ├── app.py               # Flask API entry point
│   ├── services/            # Prediction and conformal engines
│   ├── models/              # Trained model files (.joblib)
│   └── requirements.txt
├── docs/                    # Project documentation
├── results/                 # Experiment results and benchmarks
├── docker-compose.yml       # Multi-service orchestration
├── .env.example             # Environment variable template
└── README.md                # Project overview and quick start
```

---

## 9. Support & Contact

- **GitHub Issues:** https://github.com/shri33/ML-Task-Scheduler/issues
- **Repository:** https://github.com/shri33/ML-Task-Scheduler
- **Team Email:** Contact through BITS Pilani student portal

---

*This installation guide is provided as part of the mandatory capstone project documentation.*
