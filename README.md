# Intelligent Task Allocation and Scheduling System
## ML-Assisted Fog Computing Optimization

A full-stack, production-oriented web application implementing intelligent task scheduling across a 3-layer fog computing architecture, with machine learning predictions and bio-inspired optimization algorithms based on Wang & Li (2019).

**Team Byte_hogs** | BITS Pilani Online BSc CS Study Project

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│     Backend     │────▶│   ML Service    │
│  React 18+Vite  │     │  Node + Express │     │  Python + Flask │
│  Tailwind+Zustand│    │  Prisma + JWT   │     │  scikit-learn   │
│    Port 3000    │     │    Port 3001    │     │    Port 5001    │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
             ┌──────▼──────┐ ┌──▼───┐  ┌─────▼─────┐
             │ PostgreSQL  │ │Redis │  │  BullMQ   │
             │   30 models │ │Cache │  │  Queues   │
             │  Port 5432  │ │ 6379 │  └───────────┘
             └─────────────┘ └──────┘
```

### System Services
| Service | Technology | Port | Purpose |
|---------|------------|------|---------|
| **Frontend** | React 18 + Vite + TailwindCSS | 3000 | Operational dashboard (26 pages, 24 components) |
| **Backend** | Node.js 20 + Express + TypeScript | 3001 | API server (19 route modules), 4 BullMQ workers |
| **ML Service** | Python 3.11 + Flask + PyTorch | 5001 | Execution time prediction, MaskablePPO RL, SHAP |
| **PostgreSQL** | Postgres 15 Alpine | 5432 | Primary database (30 Prisma models) |
| **Redis** | Redis 7 Alpine | 6379 | Caching, distributed locks, pub/sub, queue store |
| **Prometheus** | Prometheus | 9090 | Telemetry scraper |
| **Grafana** | Grafana | 3002 | Operational metrics dashboard |

---

## 🏛️ Architectural Role Separation

The platform establishes a clear separation of concerns between core scheduling execution and ML intelligence:

- **Backend Service (Node.js / TypeScript)**:
  - Houses the primary scheduling engine and 10 algorithm implementations: **IPSO**, **IACO**, **Hybrid Heuristic (HH)**, **FCFS**, **Round-Robin**, **Min-Min**, **EDF**, **SJF**, **ML-Enhanced**, and **RL-PPO**.
  - Implements the 3-layer fog offloading math model, SLA violation bounds, and energy equations.
  - Manages database persistence, background BullMQ queues, and WebSocket events.

- **ML Service (Python / Flask)**:
  - Provides execution time duration predictions using **XGBoost**, **RandomForest**, and **GradientBoosting** ($R^2 = 0.9483$).
  - Implements **MaskablePPO** Deep Reinforcement Learning with dynamic dot-product attention pooling for task matrices.
  - Generates **SHAP** feature attributions and **Split Conformal Prediction** intervals ($\alpha=0.1$).

---

## 📁 Project Structure

```
PROJECT/                       # Full-stack implementation
├── backend/                   # TypeScript + Express API (146 files)
│   ├── src/
│   │   ├── routes/            # 19 route modules (70+ REST endpoints)
│   │   ├── services/          # fogComputing (1,379L), scheduler, ml, errorRecovery
│   │   ├── middleware/        # Auth, CSRF, rate limiting, error handlers
│   │   ├── workers/           # 4 BullMQ background processors
│   │   ├── queues/            # Prediction, scheduling, notification job queues
│   │   ├── lib/               # Logger, Redis, Prisma, Swagger, RedisLock
│   │   └── __tests__/         # 6 Jest test suites (~1,880 lines of tests)
│   └── prisma/
│       ├── schema.prisma      # 30 database models
│       └── seed.ts            # Idempotent database seeding
│
├── frontend/                  # React 18 + Vite + TypeScript (77 files)
│   └── src/
│       ├── pages/             # 26 pages (Dashboard, Fog, Tasks, Experiments, etc.)
│       ├── components/        # 24 reusable UI components
│       ├── store/             # Zustand state management
│       ├── contexts/          # Auth, Socket, Theme, Toast contexts
│       ├── hooks/             # Custom React hooks
│       └── lib/               # Axios client with CSRF & 401 refresh interceptors
│
├── ml-service/                # Python 3.11 + Flask (38 files)
│   ├── app_factory.py         # Flask application factory with OpenTelemetry
│   ├── model.py               # XGBoost, RandomForest, GradientBoosting models
│   ├── train_rl.py            # MaskablePPO Deep RL with attention pooling
│   ├── research.py            # SHAP, Optuna TPE, Conformal Prediction
│   ├── routes/                # 5 Flask blueprints (predict, train, admin, sim, health)
│   ├── environments/          # Gym fog scheduling environments
│   └── evaluation/            # Benchmarks, NDCG, Student's t-test, Cohen's d
│
├── infra/                     # Cloud-native infrastructure templates (108 files)
│   ├── examples/k8s/          # Kubernetes manifests (Deployments, HPA, Ingress)
│   ├── helm/                  # Parameterized Helm charts (dev/staging/prod)
│   ├── examples/terraform/    # AWS EKS, RDS, ElastiCache terraform code
│   ├── examples/istio/        # VirtualServices, mTLS, rate limiting
│   ├── grafana/               # Dashboards & SLO alerts
│   ├── prometheus/            # Metric scraping configuration
│   ├── examples/argocd/       # GitOps application manifests
│   └── examples/chaos-mesh/   # Pod & network chaos experiments
│
├── docs/                      # 21 documentation files
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── DEVELOPER_GUIDE.md
│   ├── Phase1_Project_Proposal.md
│   ├── Phase2_SRS_Document.md
│   └── Phase3_Design_Submission.md
│
└── docker-compose.yml         # Container orchestration specification
```

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

**Windows (PowerShell):**
```powershell
./docker-run.ps1
```

**Linux / Generic:**
```bash
# Start all containerized services
docker compose up -d --build

# Verify container statuses
docker compose ps

# Run Prisma database migrations and seed default data
docker exec task-scheduler-backend npx prisma db seed
```

### Observability Dashboard Endpoints

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend UI** | [http://localhost:3000](http://localhost:3000) | Operational Dashboard |
| **API Backend** | [http://localhost:3001/api/health](http://localhost:3001/api/health) | Express API Healthcheck |
| **Swagger Docs** | [http://localhost:3001/api/docs](http://localhost:3001/api/docs) | OpenAPI Specification |
| **ML Service** | [http://localhost:5001/api/health](http://localhost:5001/api/health) | ML Model Service Health |
| **Prometheus** | [http://localhost:9090](http://localhost:9090) | Metrics Collection Engine |
| **Grafana** | [http://localhost:3002](http://localhost:3002) | Telemetry & SLO Dashboards |

### Default Credentials
| Email | Password | Role |
|-------|----------|------|
| `admin@example.com` | `password123` | ADMIN |
| `demo@example.com` | `password123` | USER |
| `viewer@example.com` | `password123` | VIEWER |

---

## Option 2: Manual Local Setup

### 1. PostgreSQL Database & Redis
```bash
docker run -d --name postgres -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=task_scheduler postgres:15-alpine
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### 2. Backend Service
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

### 3. ML Service
```bash
cd ml-service
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python app.py
```

### 4. Frontend Application
```bash
cd frontend
npm install
npm run dev
```

---

## 🔧 Core API Routes (19 Route Modules)

| Module | Route Prefix | Key Functionality |
| :--- | :--- | :--- |
| **Auth** | `/api/v1/auth` | Login, Register, Google OAuth, Refresh Token, Profile, Password Reset |
| **Fog** | `/api/v1/fog` | Fog node CRUD, schedule execution, algorithm comparison, metrics export |
| **Tasks** | `/api/v1/tasks` | Task CRUD, bulk creation, task completion, comment threads |
| **Devices** | `/api/v1/devices` | IoT device registration, telemetry heartbeat, logs, metrics |
| **Experiments**| `/api/v1/experiments`| Paper reproduction benchmarks (Figures 5-8), CSV export, summary reports |
| **Simulation** | `/api/v1/simulation` | Dynamic topology graph, congestion heatmaps, simulation runs |
| **Schedule** | `/api/v1/schedule` | Schedule trigger, algorithm registry, ML status, history |
| **Reports** | `/api/v1/reports` | PDFKit PDF generation (Completion, Energy, Reliability), CSV downloads |
| **Metrics** | `/api/v1/metrics` | Real-time system telemetry, metrics timeline, anomaly analysis |
| **ML** | `/api/v1/ml` | Model registry listing, auto-retrain configuration, retrain triggers |
| **AI** | `/api/v1/ai` | NVIDIA NIM Llama 3.1 assistant chat, scenario generation |
| **Resources** | `/api/v1/resources` | Compute resource node CRUD, load capacity management |
| **Chaos** | `/api/v1/chaos` | Network latency, error injection, pod outage fault testing |
| **Chat** | `/api/v1/chat` | Real-time WebSocket chat channels and direct messaging |
| **Mail** | `/api/v1/mail` | Internal messaging system (inbox, sent, compose) |
| **Calendar** | `/api/v1/calendar` | Interactive calendar events projecting task due dates |
| **User** | `/api/v1/user` | User settings, admin management CRUD, notifications |
| **GPU** | `/api/v1/gpu` | GPU node telemetry registration and status monitoring |

---

## 🧠 Scheduling Algorithms (10 Implemented)

Based on Wang & Li (2019) *"Task Scheduling Based on a Hybrid Heuristic Algorithm for Smart Production Line with Fog Computing"* and ML enhancement models:

### Bio-Inspired Algorithms
- **Hybrid Heuristic (HH)**: Combines IPSO global search with IACO local refinement.
- **IPSO**: Improved Particle Swarm Optimization with adaptive inertia weight.
- **IACO**: Improved Ant Colony Optimization with pheromone evaporation rules.

### Heuristic & Deterministic Baselines
- **FCFS**: First-Come-First-Served baseline.
- **Round-Robin**: Cyclic node allocation.
- **Min-Min**: Assigns smallest task to fastest available compute resource.
- **EDF**: Earliest Deadline First priority queueing.
- **SJF**: Shortest Job First.

### Machine Learning & RL
- **ML-Enhanced**: Regression model predicted duration + cost minimization objective.
- **RL-PPO**: MaskablePPO policy model trained on 4-tier fog topology environments.

---

## 🗄️ Database Schema (30 Prisma Models)

- **Scheduling & Core**: `Task`, `Resource`, `ScheduleHistory`, `Prediction`, `SystemMetrics`
- **Fog Network**: `FogNode`, `FogTaskAssignment`, `Device`, `DeviceLog`, `DeviceMetric`
- **ML Operations**: `MlModel`, `TrainingJob`, `AutoRetrainConfig`
- **User & Security**: `User`, `RefreshToken`, `AuditLog`, `NotificationPreference`, `UserBehaviorProfile`
- **Collaboration**: `ChatRoom`, `ChatMember`, `ChatMessage`, `MessageAttachment`, `MailMessage`, `MailThread`, `MailThreadParticipant`, `MailRecipient`, `MailAttachment`, `TaskComment`, `TaskAttachment`, `TaskEvent`

---

## 🔒 Security Architecture

- **JWT Authentication**: Short-lived access tokens + single-use refresh token rotation.
- **CSRF Defense**: Double-submit cookie pattern enforcing `X-CSRF-Token` headers.
- **Password Protection**: `bcrypt` password hashing with salt rounds.
- **RBAC**: Role-Based Access Control (`ADMIN`, `USER`, `VIEWER`).
- **Input Sanitization**: Zod schema validation, UUID regex checks, XSS script tag stripping.
- **Rate Limiting**: 6 independent rate limiters enforcing window limits per IP.
- **Circuit Breakers**: Fault tolerance wrappers for database, Redis, ML service, and email.

---

## 📐 Reproducing Research Experiments (Figures 5–8)

The project includes an experiment reproduction suite for Wang & Li (2019) Sections 5.2–5.3.

### CLI Execution
```bash
# Execute experiment suite in backend container
docker exec -it task-scheduler-backend npx ts-node src/scripts/run_experiments.ts --mode all --iterations 3
```

### Benchmark Summary Trends

| Experiment | Metric | Expected Behavior |
|------------|--------|-------------------|
| **Fig 5** | Completion Time vs Tasks | HH maintains lowest latency; divergence increases beyond 100 tasks |
| **Fig 6** | Energy vs Tasks | HH achieves lowest energy consumption; RR highest |
| **Fig 7** | Reliability vs Tasks | Reliability declines as workload increases; HH maintains highest bound |
| **Fig 8** | Reliability vs Tolerance | Reliability increases with deadline tolerance; HH achieves highest ratio |

---

## 👥 Team

| Name | Role | Student ID |
|------|------|------------|
| Shri Srivastava | Team Lead & Developer | 2023ebcs593 |
| Ichha Dwivedi | Developer | 2023ebcs125 |
| Aditi Singh | Developer | 2023ebcs498 |

---

## 📚 References

1. Wang, J., & Li, D. (2019). "Task Scheduling Based on a Hybrid Heuristic Algorithm for Smart Production Line with Fog Computing." *Sensors*, 19(5), 1023.

---

*BITS Pilani Online | BSc Computer Science | Final Year Project 2025-26*
