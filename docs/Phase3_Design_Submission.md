# B.Sc. (CS) – System Architecture, Database Schema, and UI/UX Prototype

## Design Submission - Phase 3

---

## Document Information

| Field | Details |
|-------|---------|
| **Project Title** | Intelligent Task Allocation and Scheduling System with ML-Assisted Optimization |
| **Team Name** | Byte_hogs |
| **Submission Date** | February 2026 |

### Team Members

| Name | Student ID | Academic Email | Role |
|------|------------|----------------|------|
| Shri Srivastava | 2023ebcs593 | 2023ebcs593@wilp.bits-pilani.ac.in | Co-Developer (Joint Architecture, ML, Full-Stack) |
| Ichha Dwivedi | 2023ebcs125 | 2023ebcs125@wilp.bits-pilani.ac.in | Co-Developer (Joint Architecture, ML, Full-Stack) |
| Aditi Singh | 2023ebcs498 | 2023ebcs498@wilp.bits-pilani.ac.in | Co-Developer (Joint Architecture, ML, Full-Stack) |

*All team members collaborated equally across all architectural, frontend, backend, ML, and database design domains.*

---

## 1. Project Goal

The objective of this submission is to provide a comprehensive blueprint of the system's architecture, a scalable and normalized database schema, and user-centric UI/UX prototypes for the Intelligent Task Allocation and Scheduling System.

**This document covers:**
1. Complete system architecture with component descriptions
2. Normalized database schema with ER diagrams
3. Low and high-fidelity UI/UX prototypes
4. Component-level design with class diagrams
5. API documentation and integration planning
6. Design review summary

---

## 2. Activities in Detail

### 2.1. System Architecture Development

#### Overview of the Architecture

**Architecture Type:** Microservices-based Client-Server Architecture

**Key Technologies and Frameworks:**
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React.js + TypeScript | 18.x |
| Backend | Node.js + Express.js | 18.x / 4.x |
| ML Service | Python + Flask | 3.9 / 2.x |
| Database | PostgreSQL | 15.x |
| Cache/Queue | Redis | 7.x |
| Containerization | Docker | 24.x |

#### Component Descriptions

##### 1. Frontend (React Application)
| Component | Responsibility |
|-----------|---------------|
| **Dashboard Module** | Main view displaying task queue, resource status, and quick metrics |
| **Task Manager Module** | CRUD operations for tasks with form validation |
| **Resource Monitor Module** | Real-time resource load visualization |
| **Analytics Module** | Performance charts and algorithm comparison |
| **State Management (Zustand)** | Global state for tasks, resources, and UI state |
| **WebSocket Client** | Real-time updates from backend |

##### 2. Backend (Node.js/Express)
| Component | Responsibility |
|-----------|---------------|
| **REST API Controller** | Handle HTTP requests, route to services |
| **Task Service** | Business logic for task operations |
| **Resource Service** | Business logic for resource operations |
| **Scheduler Engine** | Core scheduling algorithm implementation |
| **ML Integration Service** | Communication with ML prediction service |
| **WebSocket Handler** | Push real-time updates to clients |
| **Authentication Middleware** | JWT token validation |
| **Logging Middleware** | Request/response logging |

##### 3. ML Service (Python/Flask)
| Component | Responsibility |
|-----------|---------------|
| **Prediction API** | REST endpoint for execution time prediction |
| **Model Manager** | Load, update, and manage ML models |
| **Feature Extractor** | Transform task data into model features |
| **Model Trainer** | Retrain model with new historical data |

##### 4. Database (PostgreSQL)
| Component | Responsibility |
|-----------|---------------|
| **Tasks Table** | Store task definitions and status |
| **Resources Table** | Store resource configurations |
| **Schedule History Table** | Store scheduling decisions |
| **Predictions Table** | Store ML predictions for analysis |

##### 5. Redis (Cache/Queue)
| Component | Responsibility |
|-----------|---------------|
| **Session Cache** | Store user sessions |
| **Task Queue** | Queue for async task processing |
| **Real-time Pub/Sub** | Message passing for WebSocket |

#### Communication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMMUNICATION FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌───────────────────┐
                    │   React Frontend  │
                    │   (Port: 3000)    │
                    └─────────┬─────────┘
                              │
              ┌───────────────┼───────────────┐
              │ HTTP/REST     │ WebSocket     │
              │ (JSON)        │ (Socket.io)   │
              ▼               ▼               │
    ┌─────────────────────────────────────┐  │
    │      Node.js Backend (Port: 3001)   │  │
    │                                     │  │
    │  ┌─────────────────────────────┐   │  │
    │  │     Express Router          │   │  │
    │  │                             │   │  │
    │  │  /api/tasks    → TaskController    │
    │  │  /api/resources→ ResourceController│
    │  │  /api/schedule → ScheduleController│
    │  │  /api/metrics  → MetricsController │
    │  └─────────────────────────────┘   │  │
    │                │                    │  │
    │                ▼                    │  │
    │  ┌─────────────────────────────┐   │  │
    │  │    Service Layer            │   │  │
    │  │                             │   │  │
    │  │  TaskService                │   │  │
    │  │  ResourceService            │   │  │
    │  │  SchedulerService ──────────┼───┼──┼──┐
    │  │  MLIntegrationService ──────┼───┼──┼──┤
    │  └─────────────────────────────┘   │  │  │
    └───────────────┬─────────────────────┘  │  │
                    │                         │  │
        ┌───────────┼───────────┐            │  │
        │           │           │            │  │
        ▼           ▼           ▼            │  │
┌───────────┐ ┌───────────┐ ┌───────────┐   │  │
│ PostgreSQL│ │   Redis   │ │ WebSocket │   │  │
│ (5432)    │ │  (6379)   │ │  Handler  │◄──┘  │
└───────────┘ └───────────┘ └───────────┘      │
                                               │
                                               │
              ┌────────────────────────────────┘
              │
              ▼
    ┌─────────────────────────────┐
    │  Python ML Service (5001)   │
    │                             │
    │  POST /api/predict-time     │
    │  {                          │
    │    taskSize: 3,             │
    │    taskType: 1,             │
    │    priority: 5,             │
    │    resourceLoad: 45         │
    │  }                          │
    │                             │
    │  Response:                  │
    │  {                          │
    │    predictedTime: 4.2,      │
    │    confidence: 0.87         │
    │  }                          │
    └─────────────────────────────┘
```

#### Architecture Diagram (High-Level)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SYSTEM ARCHITECTURE DIAGRAM                              │
└─────────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────────┐
                         │    Load Balancer    │
                         │     (Future)        │
                         └──────────┬──────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
         ▼                          ▼                          ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  React Frontend │      │  React Frontend │      │  React Frontend │
│   Instance 1    │      │   Instance 2    │      │   Instance N    │
│                 │      │                 │      │                 │
│  ┌───────────┐  │      │  ┌───────────┐  │      │  ┌───────────┐  │
│  │ Dashboard │  │      │  │ Dashboard │  │      │  │ Dashboard │  │
│  │ Tasks     │  │      │  │ Tasks     │  │      │  │ Tasks     │  │
│  │ Analytics │  │      │  │ Analytics │  │      │  │ Analytics │  │
│  └───────────┘  │      │  └───────────┘  │      │  └───────────┘  │
│                 │      │                 │      │                 │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                         ┌────────▼────────┐
                         │   API Gateway   │
                         │    (Future)     │
                         └────────┬────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  Node.js API    │      │  Node.js API    │      │    Python ML    │
│   Server 1      │      │   Server 2      │      │    Service      │
│                 │      │                 │      │                 │
│  ┌───────────┐  │      │  ┌───────────┐  │      │  ┌───────────┐  │
│  │ REST API  │  │      │  │ REST API  │  │      │  │ Predict   │  │
│  │ Scheduler │  │      │  │ Scheduler │  │      │  │ Endpoint  │  │
│  │ WebSocket │  │      │  │ WebSocket │  │      │  │           │  │
│  └───────────┘  │      │  └───────────┘  │      │  │ ┌───────┐ │  │
│                 │      │                 │      │  │ │ Model │ │  │
└────────┬────────┘      └────────┬────────┘      │  │ │ RF/LR │ │  │
         │                        │               │  │ └───────┘ │  │
         │                        │               │  └───────────┘  │
         │                        │               │                 │
         └────────────┬───────────┘               └────────┬────────┘
                      │                                    │
         ┌────────────┼────────────────────────────────────┘
         │            │
         ▼            ▼
┌─────────────────────────────────┐      ┌─────────────────┐
│                                 │      │                 │
│         PostgreSQL              │      │      Redis      │
│         Database                │      │     Cache       │
│                                 │      │                 │
│  ┌─────────┐  ┌─────────────┐  │      │  ┌───────────┐  │
│  │  Tasks  │  │  Resources  │  │      │  │  Sessions │  │
│  └─────────┘  └─────────────┘  │      │  │  Queue    │  │
│  ┌─────────┐  ┌─────────────┐  │      │  │  Pub/Sub  │  │
│  │ History │  │ Predictions │  │      │  └───────────┘  │
│  └─────────┘  └─────────────┘  │      │                 │
│                                 │      │                 │
└─────────────────────────────────┘      └─────────────────┘
```

---

### 2.2. Database Schema Design

#### ER Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ENTITY-RELATIONSHIP DIAGRAM                              │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │    resources    │
                              ├─────────────────┤
                              │ PK id           │
                              │    name         │
                              │    capacity     │
                              │    current_load │
                              │    status       │
                              │    created_at   │
                              │    updated_at   │
                              └────────┬────────┘
                                       │
                                       │ 1
                                       │
                                       │
                                       │ *
                              ┌────────▼────────┐
                              │      tasks      │
                              ├─────────────────┤
                              │ PK id           │
                              │    name         │
                              │    type         │
                              │    size         │
                              │    priority     │
                              │    status       │
                              │    predicted_time│
                              │    actual_time  │
                              │ FK resource_id  │──────────┐
                              │    created_at   │          │
                              │    scheduled_at │          │
                              │    completed_at │          │
                              └────────┬────────┘          │
                                       │                   │
              ┌────────────────────────┼───────────────────┤
              │                        │                   │
              │ 1                      │ 1                 │
              │                        │                   │
              │ *                      │ *                 │
    ┌─────────▼─────────┐    ┌────────▼────────┐         │
    │    predictions    │    │ schedule_history│         │
    ├───────────────────┤    ├─────────────────┤         │
    │ PK id             │    │ PK id           │         │
    │ FK task_id        │    │ FK task_id      │         │
    │    predicted_time │    │ FK resource_id  │─────────┘
    │    confidence     │    │    algorithm    │
    │    features       │    │    ml_enabled   │
    │    model_version  │    │    predicted_time│
    │    created_at     │    │    actual_time  │
    └───────────────────┘    │    score        │
                             │    explanation  │
                             │    created_at   │
                             └─────────────────┘

                              ┌─────────────────┐
                              │  system_metrics │
                              ├─────────────────┤
                              │ PK id           │
                              │    metric_name  │
                              │    metric_value │
                              │    timestamp    │
                              └─────────────────┘
```

#### Database Schema Document

##### Table: tasks
| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique task identifier |
| name | VARCHAR(255) | NOT NULL | Task name |
| type | task_type_enum | NOT NULL | CPU, IO, or MIXED |
| size | task_size_enum | NOT NULL | SMALL, MEDIUM, or LARGE |
| priority | INTEGER | NOT NULL, CHECK (1-5) | Task priority |
| status | task_status_enum | NOT NULL, DEFAULT 'PENDING' | Current status |
| predicted_time | DECIMAL(10,2) | NULL | ML predicted execution time |
| actual_time | DECIMAL(10,2) | NULL | Actual execution time |
| resource_id | UUID | FOREIGN KEY → resources(id) | Assigned resource |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| scheduled_at | TIMESTAMP | NULL | Scheduling timestamp |
| completed_at | TIMESTAMP | NULL | Completion timestamp |

##### Table: resources
| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique resource identifier |
| name | VARCHAR(255) | NOT NULL, UNIQUE | Resource name |
| capacity | INTEGER | NOT NULL, CHECK (> 0) | Maximum task capacity |
| current_load | DECIMAL(5,2) | NOT NULL, DEFAULT 0 | Current load percentage |
| status | resource_status_enum | NOT NULL, DEFAULT 'AVAILABLE' | Current status |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

##### Table: schedule_history
| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique history identifier |
| task_id | UUID | FOREIGN KEY → tasks(id), NOT NULL | Related task |
| resource_id | UUID | FOREIGN KEY → resources(id), NOT NULL | Assigned resource |
| algorithm | VARCHAR(50) | NOT NULL | Algorithm used |
| ml_enabled | BOOLEAN | NOT NULL, DEFAULT true | Whether ML was used |
| predicted_time | DECIMAL(10,2) | NULL | Predicted time at scheduling |
| actual_time | DECIMAL(10,2) | NULL | Actual execution time |
| score | DECIMAL(10,4) | NULL | Scheduling score |
| explanation | TEXT | NULL | Decision explanation |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record timestamp |

##### Table: predictions
| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique prediction identifier |
| task_id | UUID | FOREIGN KEY → tasks(id), NOT NULL | Related task |
| predicted_time | DECIMAL(10,2) | NOT NULL | Predicted execution time |
| confidence | DECIMAL(5,4) | NOT NULL | Prediction confidence (0-1) |
| features | JSONB | NOT NULL | Input features used |
| model_version | VARCHAR(50) | NOT NULL | Model version used |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Prediction timestamp |

##### Enum Types
```sql
CREATE TYPE task_type_enum AS ENUM ('CPU', 'IO', 'MIXED');
CREATE TYPE task_size_enum AS ENUM ('SMALL', 'MEDIUM', 'LARGE');
CREATE TYPE task_status_enum AS ENUM ('PENDING', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'FAILED');
CREATE TYPE resource_status_enum AS ENUM ('AVAILABLE', 'BUSY', 'OFFLINE');
```

#### Normalization Details

| Normal Form | Compliance | Explanation |
|-------------|------------|-------------|
| **1NF** |  Yes | All columns contain atomic values; no repeating groups |
| **2NF** |  Yes | All non-key attributes depend on the entire primary key |
| **3NF** |  Yes | No transitive dependencies; all attributes depend directly on primary key |
| **BCNF** |  Yes | Every determinant is a candidate key |

#### Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW DIAGRAM                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────┐     POST /tasks     ┌──────────────┐     INSERT     ┌──────────┐
│   User   │────────────────────►│   Backend    │───────────────►│   tasks  │
└──────────┘                     └──────────────┘                └──────────┘
                                        │
                                        │ Fetch pending tasks
                                        ▼
                                 ┌──────────────┐     SELECT     ┌──────────┐
                                 │  Scheduler   │◄───────────────│   tasks  │
                                 └──────────────┘                └──────────┘
                                        │
                                        │ Request prediction
                                        ▼
                                 ┌──────────────┐
                                 │  ML Service  │
                                 └──────────────┘
                                        │
                                        │ Return prediction
                                        ▼
                                 ┌──────────────┐     INSERT     ┌────────────┐
                                 │  Scheduler   │───────────────►│predictions │
                                 └──────────────┘                └────────────┘
                                        │
                                        │ Apply algorithm, assign task
                                        ▼
                                 ┌──────────────┐     UPDATE     ┌──────────┐
                                 │  Scheduler   │───────────────►│   tasks  │
                                 └──────────────┘                │ resources│
                                        │                        └──────────┘
                                        │ Log decision
                                        ▼
                                 ┌──────────────┐     INSERT     ┌──────────────┐
                                 │  Scheduler   │───────────────►│schedule_hist │
                                 └──────────────┘                └──────────────┘
```

---

### 2.3. UI/UX Design

#### Wireframes (Low-Fidelity)

##### Screen 1: Dashboard
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ☰  ML-Assisted Task Scheduling System              [Notifications] [User] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │   Total Tasks   │  │  Pending Tasks  │  │ Active Resources│            │
│  │      127        │  │       23        │  │       5/8       │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Recent Tasks                                    [+ Create Task]     │  │
│  ├─────────────────────────────────────────────────────────────────────┤  │
│  │  ID     Name           Type    Priority  Status      Actions        │  │
│  │  ────   ────────────   ────    ────────  ──────      ───────        │  │
│  │  001    Data Process   CPU     High      Pending     [Schedule][✏][🗑]│  │
│  │  002    File Upload    IO      Medium    Running     [View]         │  │
│  │  003    Report Gen     Mixed   Low       Completed   [View]         │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────┐  ┌──────────────────────────────┐  │
│  │  Resource Utilization           │  │  Scheduling Performance      │  │
│  │  ┌────────────────────────────┐ │  │  ┌────────────────────────┐  │  │
│  │  │  █████████░░  R1: 78%     │ │  │  │  Today: 45 tasks       │  │  │
│  │  │  ████░░░░░░░  R2: 34%     │ │  │  │  Avg Time: 12.3s       │  │  │
│  │  │  ███████░░░░  R3: 67%     │ │  │  │  ML Accuracy: 87%      │  │  │
│  │  └────────────────────────────┘ │  │  └────────────────────────┘  │  │
│  └──────────────────────────────────┘  └──────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

##### Screen 2: Create Task Form
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard           Create New Task                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │   Task Name *                                                        │  │
│  │   ┌────────────────────────────────────────────────────────────┐   │  │
│  │   │  Enter task name...                                        │   │  │
│  │   └────────────────────────────────────────────────────────────┘   │  │
│  │                                                                      │  │
│  │   Task Type *                          Task Size *                   │  │
│  │   ┌─────────────────────┐             ┌─────────────────────┐      │  │
│  │   │  CPU            ▼   │             │  Medium          ▼   │      │  │
│  │   └─────────────────────┘             └─────────────────────┘      │  │
│  │                                                                      │  │
│  │   Priority *                                                         │  │
│  │   ┌─────────────────────────────────────────────────────────────┐  │  │
│  │   │   ○ 1    ○ 2    ● 3    ○ 4    ○ 5                          │  │  │
│  │   │  (Low)               (Normal)              (High)           │  │  │
│  │   └─────────────────────────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  │   Description (Optional)                                             │  │
│  │   ┌────────────────────────────────────────────────────────────┐   │  │
│  │   │                                                            │   │  │
│  │   │                                                            │   │  │
│  │   └────────────────────────────────────────────────────────────┘   │  │
│  │                                                                      │  │
│  │              ┌──────────────┐    ┌──────────────┐                   │  │
│  │              │    Cancel    │    │ Submit Task  │                   │  │
│  │              └──────────────┘    └──────────────┘                   │  │
│  │                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

##### Screen 3: Scheduling Result
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ← Back to Queue               Scheduling Result                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │   Task Scheduled Successfully                                      │  │
│  │                                                                      │  │
│  │  Task: Data Processing (Task-001)                                    │  │
│  │  Assigned to: Resource-A (Server 1)                                  │  │
│  │                                                                      │  │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│  │
│  │                                                                      │  │
│  │   ML PREDICTION                                                    │  │
│  │  ┌────────────────────────────────────────────────────────────┐    │  │
│  │  │  Predicted Execution Time:  4.2 seconds                    │    │  │
│  │  │  Confidence Level:          87%                            │    │  │
│  │  │                                                            │    │  │
│  │  │  Features Used:                                            │    │  │
│  │  │  • Task Size: Large (3)                                    │    │  │
│  │  │  • Task Type: CPU (1)                                      │    │  │
│  │  │  • Priority: High (5)                                      │    │  │
│  │  │  • Resource Load: 45%                                      │    │  │
│  │  └────────────────────────────────────────────────────────────┘    │  │
│  │                                                                     │  │
│  │   WHY THIS DECISION?                                               │  │
│  │  ┌────────────────────────────────────────────────────────────┐    │  │
│  │  │  "Task-001 was assigned to Resource-A because:             │    │  │
│  │  │   • Resource-A has the lowest current load (45%)           │    │  │
│  │  │   • Task priority is HIGH, requiring fast processing       │    │  │
│  │  │   • Predicted execution time (4.2s) fits resource capacity │    │  │
│  │  │   • Score: 0.923 (highest among available resources)"      │    │  │
│  │  └────────────────────────────────────────────────────────────┘    │  │
│  │                                                                      │  │
│  │         ┌──────────────────┐    ┌──────────────────┐                │  │
│  │         │  View Comparison │    │  Back to Queue   │                │  │
│  │         └──────────────────┘    └──────────────────┘                │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### High-Fidelity Prototypes

**Figma Prototype Link:** [To be created in Figma]

**Design Specifications:**
| Element | Specification |
|---------|---------------|
| **Primary Color** | #3B82F6 (Blue) |
| **Secondary Color** | #10B981 (Green) |
| **Error Color** | #EF4444 (Red) |
| **Background** | #F9FAFB (Light Gray) |
| **Card Background** | #FFFFFF (White) |
| **Text Primary** | #111827 (Dark Gray) |
| **Text Secondary** | #6B7280 (Gray) |
| **Font Family** | Inter, system-ui, sans-serif |
| **Border Radius** | 8px (cards), 6px (buttons) |
| **Shadow** | 0 1px 3px rgba(0,0,0,0.1) |

#### Accessibility and Usability Testing

| Requirement | Implementation |
|-------------|----------------|
| **Color Contrast** | WCAG AA compliant (4.5:1 ratio) |
| **Keyboard Navigation** | All interactive elements focusable |
| **Screen Reader** | ARIA labels on buttons and forms |
| **Error States** | Clear visual and text indicators |
| **Loading States** | Skeleton loaders and spinners |
| **Responsive** | Mobile-first design, breakpoints at 640px, 768px, 1024px |

---

### 2.4. Component-Level Design

#### Class Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND CLASS DIAGRAM                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐       ┌─────────────────────────┐
│    TaskController       │       │   ResourceController    │
├─────────────────────────┤       ├─────────────────────────┤
│ - taskService           │       │ - resourceService       │
├─────────────────────────┤       ├─────────────────────────┤
│ + createTask()          │       │ + createResource()      │
│ + getTasks()            │       │ + getResources()        │
│ + getTaskById()         │       │ + updateResource()      │
│ + updateTask()          │       │ + deleteResource()      │
│ + deleteTask()          │       └────────────┬────────────┘
└────────────┬────────────┘                    │
             │                                  │
             │         uses                     │
             ▼                                  ▼
┌─────────────────────────┐       ┌─────────────────────────┐
│      TaskService        │       │    ResourceService      │
├─────────────────────────┤       ├─────────────────────────┤
│ - taskRepository        │       │ - resourceRepository    │
│ - schedulerService      │       ├─────────────────────────┤
├─────────────────────────┤       │ + create()              │
│ + create()              │       │ + findAll()             │
│ + findAll()             │       │ + findById()            │
│ + findById()            │       │ + update()              │
│ + update()              │       │ + delete()              │
│ + delete()              │       │ + updateLoad()          │
│ + findPending()         │       └─────────────────────────┘
└────────────┬────────────┘
             │
             │    uses
             ▼
┌─────────────────────────┐       ┌─────────────────────────┐
│   SchedulerService      │──────►│  MLIntegrationService   │
├─────────────────────────┤       ├─────────────────────────┤
│ - taskService           │       │ - mlServiceUrl          │
│ - resourceService       │       │ - httpClient            │
│ - mlService             │       ├─────────────────────────┤
│ - historyRepository     │       │ + getPrediction()       │
├─────────────────────────┤       │ + getModelHealth()      │
│ + schedule()            │       └─────────────────────────┘
│ + scheduleTask()        │
│ + calculateScore()      │
│ + findBestResource()    │
│ + recordDecision()      │
└─────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         ML SERVICE CLASS DIAGRAM                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐       ┌─────────────────────────┐
│   PredictionController  │──────►│   PredictionService     │
├─────────────────────────┤       ├─────────────────────────┤
│ - predictionService     │       │ - modelManager          │
├─────────────────────────┤       │ - featureExtractor      │
│ + predict()             │       ├─────────────────────────┤
│ + healthCheck()         │       │ + predictExecutionTime()│
└─────────────────────────┘       │ + calculateConfidence() │
                                  └────────────┬────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
                    ▼                          ▼                          ▼
         ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
         │    ModelManager     │   │  FeatureExtractor   │   │     ModelTrainer    │
         ├─────────────────────┤   ├─────────────────────┤   ├─────────────────────┤
         │ - model             │   │                     │   │ - trainingData      │
         │ - modelPath         │   ├─────────────────────┤   ├─────────────────────┤
         ├─────────────────────┤   │ + extract()         │   │ + train()           │
         │ + loadModel()       │   │ + normalize()       │   │ + evaluate()        │
         │ + predict()         │   │ + validate()        │   │ + saveModel()       │
         │ + getModelInfo()    │   └─────────────────────┘   └─────────────────────┘
         └─────────────────────┘
```

#### Module Descriptions

| Module | Functionality | Dependencies |
|--------|---------------|--------------|
| **TaskController** | Handle HTTP requests for task CRUD operations | TaskService |
| **ResourceController** | Handle HTTP requests for resource management | ResourceService |
| **SchedulerController** | Handle scheduling requests | SchedulerService |
| **TaskService** | Business logic for tasks | TaskRepository, SchedulerService |
| **ResourceService** | Business logic for resources | ResourceRepository |
| **SchedulerService** | Core scheduling algorithm | TaskService, ResourceService, MLService |
| **MLIntegrationService** | Communication with ML service | HTTP Client |
| **PredictionService** | ML prediction logic | ModelManager, FeatureExtractor |
| **ModelManager** | Load and manage ML models | scikit-learn |
| **FeatureExtractor** | Transform input to features | NumPy |

---

### 2.5. API and Integration Planning

#### API Design

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/tasks` | POST | Create task | `{ name, type, size, priority }` | `{ id, name, status, ... }` |
| `/api/tasks` | GET | List all tasks | Query: `?status=PENDING` | `[{ id, name, ... }]` |
| `/api/tasks/:id` | GET | Get task by ID | - | `{ id, name, status, ... }` |
| `/api/tasks/:id` | PUT | Update task | `{ name?, priority?, ... }` | `{ id, name, status, ... }` |
| `/api/tasks/:id` | DELETE | Delete task | - | `{ success: true }` |
| `/api/resources` | GET | List resources | - | `[{ id, name, load, ... }]` |
| `/api/resources` | POST | Create resource | `{ name, capacity }` | `{ id, name, ... }` |
| `/api/resources/:id` | PUT | Update resource | `{ capacity?, status? }` | `{ id, name, ... }` |
| `/api/schedule` | POST | Run scheduler | `{ taskIds?: [] }` | `{ results: [...] }` |
| `/api/schedule/history` | GET | Get history | Query: `?limit=50` | `[{ id, task, ... }]` |
| `/api/predict` | POST | Get prediction | `{ taskSize, taskType, priority, resourceLoad }` | `{ predictedTime, confidence }` |
| `/api/metrics` | GET | Get metrics | - | `{ avgTime, accuracy, ... }` |
| `/api/comparison` | GET | Compare algorithms | - | `{ withML, withoutML }` |

#### Sample Request/Response

**POST /api/tasks**
```json
// Request
{
  "name": "Data Processing Job",
  "type": "CPU",
  "size": "LARGE",
  "priority": 5
}

// Response (201 Created)
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Data Processing Job",
  "type": "CPU",
  "size": "LARGE",
  "priority": 5,
  "status": "PENDING",
  "predictedTime": null,
  "actualTime": null,
  "resourceId": null,
  "createdAt": "2026-03-15T10:30:00.000Z",
  "scheduledAt": null,
  "completedAt": null
}
```

**POST /api/schedule**
```json
// Request
{
  "taskIds": ["550e8400-e29b-41d4-a716-446655440000"]
}

// Response (200 OK)
{
  "success": true,
  "results": [
    {
      "taskId": "550e8400-e29b-41d4-a716-446655440000",
      "resourceId": "660e8400-e29b-41d4-a716-446655440001",
      "resourceName": "Server-A",
      "predictedTime": 4.2,
      "confidence": 0.87,
      "score": 0.923,
      "explanation": "Assigned to Server-A due to lowest load (45%) and high task priority"
    }
  ],
  "scheduledAt": "2026-03-15T10:35:00.000Z"
}
```

#### Security Measures

| Measure | Implementation |
|---------|----------------|
| **Authentication** | JWT tokens with 24h expiration |
| **Authorization** | Role-based access control (RBAC) |
| **Input Validation** | Zod schema validation on all endpoints |
| **Rate Limiting** | 100 requests/minute per IP |
| **CORS** | Whitelist allowed origins |
| **SQL Injection** | Prisma ORM parameterized queries |
| **XSS Prevention** | Helmet.js security headers |

---

### 2.6. Design Review Summary

#### Review Process

| Review Stage | Date | Participants | Focus Area |
|--------------|------|--------------|------------|
| Architecture Review | Mar 1, 2026 | All team members | System design validation |
| Database Review | Mar 8, 2026 | Aditi, Shri | Schema normalization |
| UI/UX Review | Mar 15, 2026 | Ichha, Team | Wireframe feedback |
| API Review | Mar 22, 2026 | Shri, Team | Endpoint design |
| Final Review | Mar 29, 2026 | All + Supervisor | Complete design validation |

#### Feedback and Improvements

| Feedback | Source | Change Implemented |
|----------|--------|--------------------|
| Add explanation field to scheduling results | Supervisor | Added `explanation` column to schedule_history |
| Include confidence score in predictions | Team review | Added `confidence` field to prediction response |
| Simplify task creation form | Usability test | Removed optional fields from main form |
| Add batch scheduling support | Architecture review | Added `taskIds` array to schedule endpoint |
| Improve error messages | UI review | Added detailed error codes and messages |

---

## 3. Final Deliverables Checklist

| Deliverable | Description | File Format | Status |
|-------------|-------------|-------------|--------|
| Architecture Diagrams | High-level system flow and interaction diagrams | PDF/PNG |  |
| Database Design | ER diagrams and schema details | PDF/PNG/SQL |  |
| UI/UX Wireframes | Low-fidelity wireframes outlining screen layouts | PDF/PNG |  |
| UI/UX Prototypes | High-fidelity designs demonstrating interactivity | Figma link |  |
| Technical Design Document | Comprehensive document covering all design aspects | PDF/Docx |  |
| API Documentation | List of API endpoints with specifications | PDF/Docx |  |
| Component Diagrams | UML class and sequence diagrams | PDF/PNG |  |
| Design Review Report | Feedback summary and changes made | PDF/Docx |  |

---

## 4. Submission Guidelines

### Folder Structure
```
/Byte_hogs_Phase3_Submission
    /Architecture
        - system_architecture_diagram.pdf
        - component_diagram.pdf
        - communication_flow.pdf
    /Database
        - er_diagram.png
        - schema.sql
        - normalization_notes.pdf
    /UIUX
        - wireframes.pdf
        - high_fidelity_prototype.fig (Figma link)
        - design_specifications.pdf
    /APIs
        - api_documentation.pdf
        - sample_requests.json
    /Components
        - class_diagram.pdf
        - sequence_diagrams.pdf
    /Review
        - design_review_report.pdf
    README.md
```

---

## 5. Appendix

### A. SQL Schema Script

```sql
-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE task_type_enum AS ENUM ('CPU', 'IO', 'MIXED');
CREATE TYPE task_size_enum AS ENUM ('SMALL', 'MEDIUM', 'LARGE');
CREATE TYPE task_status_enum AS ENUM ('PENDING', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'FAILED');
CREATE TYPE resource_status_enum AS ENUM ('AVAILABLE', 'BUSY', 'OFFLINE');

-- Create resources table
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    current_load DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (current_load >= 0 AND current_load <= 100),
    status resource_status_enum NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type task_type_enum NOT NULL,
    size task_size_enum NOT NULL,
    priority INTEGER NOT NULL CHECK (priority >= 1 AND priority <= 5),
    status task_status_enum NOT NULL DEFAULT 'PENDING',
    predicted_time DECIMAL(10,2),
    actual_time DECIMAL(10,2),
    resource_id UUID REFERENCES resources(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    scheduled_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Create schedule_history table
CREATE TABLE schedule_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id),
    resource_id UUID NOT NULL REFERENCES resources(id),
    algorithm VARCHAR(50) NOT NULL,
    ml_enabled BOOLEAN NOT NULL DEFAULT true,
    predicted_time DECIMAL(10,2),
    actual_time DECIMAL(10,2),
    score DECIMAL(10,4),
    explanation TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create predictions table
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id),
    predicted_time DECIMAL(10,2) NOT NULL,
    confidence DECIMAL(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    features JSONB NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_resource_id ON tasks(resource_id);
CREATE INDEX idx_schedule_history_task_id ON schedule_history(task_id);
CREATE INDEX idx_predictions_task_id ON predictions(task_id);
```

### B. References

1. Wang, J., & Li, D. (2019). "Task Scheduling Based on a Hybrid Heuristic Algorithm for Smart Production Line with Fog Computing." *Sensors*, 19(5), 1023.
2. Fowler, M. (2002). "Patterns of Enterprise Application Architecture." Addison-Wesley.
3. React Documentation - https://react.dev/
4. Express.js Documentation - https://expressjs.com/
5. PostgreSQL Documentation - https://www.postgresql.org/docs/
6. Figma Design System Guidelines - https://www.figma.com/

---

*Submitted by Team Byte_hogs | BITS Pilani Online | February 2026*
