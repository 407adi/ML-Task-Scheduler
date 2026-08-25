# TEST CASES & VALIDATION DOCUMENT

**Project:** Intelligent Task Allocation and Scheduling System with ML-Assisted Execution Time Prediction  
**Team:** Shri Srivastava (2023ebcs593), Ichha Dwivedi (2023ebcs125), Aditi Singh (2023ebcs498)  
**Supervisor:** Prof. Swapnil Saurav  
**Institution:** BITS Pilani | BSc Computer Science (Online Mode)  
**Date:** August 2026  

---

## 1. Test Plan Overview

### 1.1 Testing Strategy

The project follows a multi-tiered test pyramid:
- **Unit Tests:** Validate isolated functions (mathematical formulas, token decoders, ML quantile calculations).
- **Integration Tests:** Validate full HTTP REST request-response lifecycles, ORM queries, cache interactions.
- **Contract Tests:** Ensure API response schemas match expected interfaces.
- **Performance/Load Tests:** Simulate burst task ingestion and measure throughput/latency.
- **Statistical Benchmarks:** 30-seed Monte Carlo simulations with Wilcoxon significance testing.

### 1.2 Automation Tools & Frameworks

| Subsystem | Framework | Language | Purpose |
|---|---|---|---|
| Backend API & Services | Jest v29.7 + Supertest | TypeScript | Unit, integration, and contract testing |
| Frontend Components | Vitest v1.3 + Testing Library | TypeScript | Component rendering, hooks, state stores |
| ML Inference Service | Pytest v8.0 | Python | Model accuracy, conformal calibration, REST API |
| Performance Profiling | Custom PowerShell Scripts | PowerShell | Burst ingestion throughput, latency percentiles |

---

## 2. Overall Test Execution Summary

| Component | Test Suites | Total Tests | Passed | Failed | Duration | Pass Rate |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Backend (Jest)** | 5 | 103 | 103 | 0 | 41.23s | **100%** |
| **Frontend (Vitest)** | 6 | 48 | 48 | 0 | 7.02s | **100%** |
| **ML Service (Pytest)** | 1 | 12 | 12 | 0 | 34.55s | **100%** |
| **TOTAL** | **12** | **163** | **163** | **0** | **82.80s** | **100%** |

---

## 3. Detailed Test Cases

### 3.1 Authentication & Security Test Cases

| Test Case ID | Description | Input / Precondition | Expected Output | Actual Output | Status |
|:---:|---|---|---|---|:---:
| TC-AUTH-01 | Valid Bearer token authentication | Valid JWT in Authorization header | Request passes to next middleware | Passed |  PASS |
| TC-AUTH-02 | Token read from httpOnly cookie | JWT stored in access_token cookie | Token extracted and verified | Passed |  PASS |
| TC-AUTH-03 | Reject expired tokens | Expired JWT token | 401 Unauthorized response | Returned 401 |  PASS |
| TC-AUTH-04 | Reject missing token | No token in header or cookie | 401 Unauthorized response | Returned 401 |  PASS |
| TC-AUTH-05 | Role-based authorization (allow) | User with matching role | Request passes authorization | Passed |  PASS |
| TC-AUTH-06 | Role-based authorization (block) | User without matching role | 403 Forbidden response | Returned 403 |  PASS |
| TC-AUTH-07 | Admin-only endpoint (allow) | User with ADMIN role | Access granted | Passed |  PASS |
| TC-AUTH-08 | Admin-only endpoint (block) | User without ADMIN role | 403 Forbidden response | Returned 403 |  PASS |
| TC-CSRF-01 | CSRF skip for GET requests | GET request without CSRF token | Request passes | Passed |  PASS |
| TC-CSRF-02 | CSRF skip for OPTIONS | OPTIONS preflight request | Request passes | Passed |  PASS |
| TC-CSRF-03 | CSRF reject POST without token | POST without X-CSRF-Token header | 403 Forbidden | Returned 403 |  PASS |
| TC-CSRF-04 | CSRF reject token mismatch | POST with mismatched cookie/header | 403 Forbidden | Returned 403 |  PASS |
| TC-CSRF-05 | CSRF pass matching tokens | POST with matching cookie and header | Request passes | Passed |  PASS |
| TC-CSRF-06 | CSRF cookie setter | Call setCsrfCookie | Cookie set on response | Cookie set |  PASS |

### 3.2 Task Management & API Test Cases

| Test Case ID | Description | Input / Precondition | Expected Output | Actual Output | Status |
|:---:|---|---|---|---|:---:|
| TC-API-01 | Health check endpoint | GET /api/health | 200 OK, status: 'ok' | Returned ok |  PASS |
| TC-API-02 | List all tasks | GET /api/tasks | 200 OK, array of tasks | Array returned |  PASS |
| TC-API-03 | Filter tasks by status | GET /api/tasks?status=PENDING | 200 OK, filtered tasks | Filtered correctly |  PASS |
| TC-API-04 | Create new task | POST /api/tasks with valid body | 201 Created, task object | Task created |  PASS |
| TC-API-05 | Reject invalid task creation | POST /api/tasks missing fields | 400 Bad Request | Returned 400 |  PASS |
| TC-API-06 | Get task by ID | GET /api/tasks/:validId | 200 OK, single task | Task returned |  PASS |
| TC-API-07 | Get non-existent task | GET /api/tasks/:invalidId | 404 Not Found | Returned 404 |  PASS |
| TC-API-08 | List all resources | GET /api/resources | 200 OK, array of resources | Array returned |  PASS |
| TC-API-09 | Task response schema contract | GET /api/tasks | Matches defined task schema | Schema matched |  PASS |
| TC-API-10 | Resource response schema contract | GET /api/resources | Matches defined resource schema | Schema matched |  PASS |

### 3.3 Scheduling Engine Test Cases

| Test Case ID | Description | Input / Precondition | Expected Output | Actual Output | Status |
|:---:|---|---|---|---|:---:|
| TC-SCHED-01 | Schedule pending tasks | POST /api/schedule with pending tasks | Scheduled result with assignments | Assignments returned |  PASS |
| TC-SCHED-02 | Predictions with confidence | POST /api/schedule | Result includes ML confidence scores | Confidence included |  PASS |
| TC-SCHED-03 | ML service health status | GET /api/schedule/ml-status | Status of ML service connection | Status returned |  PASS |
| TC-SCHED-04 | Empty pending queue | No PENDING tasks in database | Returns empty array | Empty array |  PASS |
| TC-SCHED-05 | No resources available | All resources OFFLINE | Throws descriptive error | Error thrown |  PASS |
| TC-SCHED-06 | Load score formula | Lower load percentage | Higher score component | Verified |  PASS |
| TC-SCHED-07 | Priority score formula | Higher priority value | Higher score component | Verified |  PASS |
| TC-SCHED-08 | Time score formula | Lower predicted time | Higher score component | Verified |  PASS |
| TC-SCHED-09 | Combined scoring formula | Mixed inputs | Score = 0.4×load + 0.3×time + 0.3×priority | Verified |  PASS |
| TC-SCHED-10 | Schedule response schema | POST /api/schedule | Matches schedule result schema | Schema matched |  PASS |
| TC-SCHED-11 | Schedule result field validity | POST /api/schedule | All fields present and valid types | Verified |  PASS |

### 3.4 Fog Computing & Mathematical Model Test Cases

| Test Case ID | Description | Input / Precondition | Expected Output | Actual Output | Status |
|:---:|---|---|---|---|:---:|
| TC-FOG-01 | Execution time calculation | Di=500Mb, θi=1000, Cj=1e9 | Correct τ_exe value | Matched |  PASS |
| TC-FOG-02 | Execution time scales with data size | Increasing Di | Proportionally increasing τ_exe | Verified |  PASS |
| TC-FOG-03 | Execution time decreases with compute | Higher Cj | Lower τ_exe | Verified |  PASS |
| TC-FOG-04 | Transmission time calculation | Di=500Mb, Bj=100Mbps | Correct τ_trans value | Matched |  PASS |
| TC-FOG-05 | Transmission time scales with data | Increasing Di | Proportionally increasing τ_trans | Verified |  PASS |
| TC-FOG-06 | Total delay = exec + transmission | Known Di, θi, Cj, Bj | T_ij = τ_trans + τ_exe | Matched |  PASS |
| TC-FOG-07 | Energy consumption calculation | Known power and time values | Correct E_ij value | Matched |  PASS |
| TC-FOG-08 | Mobile device higher energy | isMobile=true | Higher energy than stationary | Verified |  PASS |
| TC-FOG-09 | Objective function weighted sum | Known weights and values | Correct F value | Matched |  PASS |
| TC-FOG-10 | Objective function multi-task | Multiple tasks and nodes | Correct aggregated F | Matched |  PASS |
| TC-FOG-11 | Reliability percentage | Known successful/total | Correct percentage | Matched |  PASS |
| TC-FOG-12 | Max tolerance time constraint | Delay vs Ti_max | Correct constraint evaluation | Verified |  PASS |
| TC-FOG-13 | Fog scheduling response schema | POST /api/fog/schedule | Matches fog scheduling schema | Matched |  PASS |

### 3.5 Bio-Inspired Algorithm Test Cases

| Test Case ID | Description | Input / Precondition | Expected Output | Actual Output | Status |
|:---:|---|---|---|---|:---:|
| TC-IPSO-01 | IPSO finds valid solution | Simple 5-task, 3-node problem | Valid assignment array | Valid solution | ✅ PASS |
| TC-IPSO-02 | IPSO assigns to valid nodes | Task assignment indices | All indices within [0, M-1] | Verified | ✅ PASS |
| TC-IACO-01 | IACO finds valid solution | Simple 5-task, 3-node problem | Valid assignment array | Valid solution | ✅ PASS |
| TC-IACO-02 | IACO convergence | 25 iterations | Fitness improves over iterations | Converged | ✅ PASS |
| TC-HH-01 | Hybrid combines IPSO+IACO | 10-task, 5-node problem | HH fitness ≤ worst individual | HH competitive | ✅ PASS |
| TC-HH-02 | HH outperforms simple algorithms | Comparative benchmark | HH ≤ FCFS and RR fitness | Verified | ✅ PASS |
| TC-HH-03 | Single task edge case | 1 task, 3 nodes | Valid single assignment | Valid | ✅ PASS |
| TC-HH-04 | Many tasks, few nodes | 50 tasks, 3 nodes | Valid distribution | Valid | ✅ PASS |
| TC-COMP-01 | Round-Robin distributes evenly | N tasks, M nodes | Tasks ≈ equally distributed | Verified | ✅ PASS |
| TC-COMP-02 | Min-Min prioritizes small tasks | Heterogeneous task batch | Smallest tasks scheduled first | Verified | ✅ PASS |
| TC-COMP-03 | FCFS processes in order | Ordered task list | Maintained arrival order | Verified | ✅ PASS |
| TC-COMP-04 | Algorithm comparison runs all 6 | Full comparison request | All 6 results returned | All returned | ✅ PASS |
| TC-COMP-05 | HH competitive in comparison | Full comparison results | HH fitness competitive | Verified | ✅ PASS |

### 3.6 Cloud Offloading (3-Layer Architecture) Test Cases

| Test Case ID | Description | Input / Precondition | Expected Output | Actual Output | Status |
|:---:|---|---|---|---|:---:|
| TC-CLOUD-01 | Cloud execution time with latency | Known cloud parameters | τ_cloud with latency penalty | Matched | ✅ PASS |
| TC-CLOUD-02 | Cloud faster for large tasks | Large Di value | Cloud τ < Fog τ | Verified | ✅ PASS |
| TC-CLOUD-03 | Cloud cost calculation | Known computation units | Correct cost estimate | Matched | ✅ PASS |
| TC-CLOUD-04 | Cloud cost scales with task size | Increasing Di | Proportionally increasing cost | Verified | ✅ PASS |
| TC-CLOUD-05 | Prefer fog when available | Low fog load, matching capacity | Decision: fog | Fog selected | ✅ PASS |
| TC-CLOUD-06 | Offload to cloud when overloaded | All fog nodes >90% load | Decision: cloud | Cloud selected | ✅ PASS |
| TC-CLOUD-07 | Offload when constraints unmet | Task exceeds fog memory | Decision: cloud | Cloud selected | ✅ PASS |
| TC-CLOUD-08 | Decision includes cost estimate | Any offload decision | Cost field populated | Populated | ✅ PASS |
| TC-CLOUD-09 | 3-layer distributes fog/cloud | Mixed workload batch | Some fog, some cloud | Distributed | ✅ PASS |
| TC-CLOUD-10 | 3-layer calculates total costs | Full 3-layer scheduling | Total cost aggregated | Aggregated | ✅ PASS |
| TC-CLOUD-11 | 3-layer tracks delay separately | Full 3-layer scheduling | Fog and cloud delays tracked | Tracked | ✅ PASS |
| TC-CLOUD-12 | 3-layer provides decision reasons | Full 3-layer scheduling | Reason string per assignment | Reasons included | ✅ PASS |

### 3.7 ML Service Integration Test Cases

| Test Case ID | Description | Input / Precondition | Expected Output | Actual Output | Status |
|:---:|---|---|---|---|:---:|
| TC-ML-01 | Prediction from ML service | Valid task features | Predicted time > 0 | Positive prediction | ✅ PASS |
| TC-ML-02 | SMALL size maps to 1 | taskSize='SMALL' | Feature value = 1 | Mapped correctly | ✅ PASS |
| TC-ML-03 | MEDIUM size maps to 2 | taskSize='MEDIUM' | Feature value = 2 | Mapped correctly | ✅ PASS |
| TC-ML-04 | LARGE size maps to 3 | taskSize='LARGE' | Feature value = 3 | Mapped correctly | ✅ PASS |
| TC-ML-05 | Fallback when ML service fails | ML service unreachable | Fallback heuristic estimate | Fallback used | ✅ PASS |
| TC-ML-06 | Fallback based on task properties | Known task size/type | Reasonable heuristic estimate | Calculated | ✅ PASS |
| TC-ML-07 | Unknown task size handling | taskSize='UNKNOWN' | Graceful default handling | Handled | ✅ PASS |
| TC-ML-08 | IO task type multiplier | taskType='IO' | IO-specific scaling applied | Applied | ✅ PASS |
| TC-ML-09 | Circuit breaker when open | Breaker in OPEN state | Fallback used immediately | Fallback used | ✅ PASS |
| TC-ML-10 | Circuit breaker records success | Successful prediction | Success counter incremented | Incremented | ✅ PASS |
| TC-ML-11 | Circuit breaker records failure | Failed prediction | Failure counter incremented | Incremented | ✅ PASS |
| TC-ML-12 | Fallback scales with load | Varying resource load | Proportional time estimate | Scaled | ✅ PASS |
| TC-ML-13 | Fallback scales with size | Varying task size | Proportional time estimate | Scaled | ✅ PASS |
| TC-ML-14 | Positive prediction guarantee | Any input | Prediction > 0 | Always positive | ✅ PASS |
| TC-ML-15 | Extreme values handling | Very large/small inputs | No NaN, no crash | Handled | ✅ PASS |

### 3.8 Frontend Component Test Cases

| Test Case ID | Description | Input / Precondition | Expected Output | Actual Output | Status |
|:---:|---|---|---|---|:---:|
| TC-FE-KEY-01 | Keyboard shortcut triggers action | Matching key pressed | Action callback fired | Fired | ✅ PASS |
| TC-FE-KEY-02 | Shift modifier | Shift+Key pressed | Shift-specific action | Fired | ✅ PASS |
| TC-FE-KEY-03 | Ctrl modifier | Ctrl+Key pressed | Ctrl-specific action | Fired | ✅ PASS |
| TC-FE-KEY-04 | Alt modifier | Alt+Key pressed | Alt-specific action | Fired | ✅ PASS |
| TC-FE-KEY-05 | Input element suppression | Key pressed in text input | Action NOT fired | Suppressed | ✅ PASS |
| TC-FE-KEY-06 | Escape key in inputs | Escape pressed in input | Action fires (exception) | Fired | ✅ PASS |
| TC-FE-KEY-07 | Disabled shortcuts | disabled=true | Action NOT fired | Not fired | ✅ PASS |
| TC-FE-KEY-08 | Cleanup on unmount | Component unmounts | Event listener removed | Removed | ✅ PASS |
| TC-FE-TOAST-01 | Toast context provided | Component wrapped in provider | Context available | Available | ✅ PASS |
| TC-FE-TOAST-02 | Toast outside provider | Component without provider | Error thrown | Error thrown | ✅ PASS |
| TC-FE-TOAST-03 | Success toast | toast.success() | Green success notification | Shown | ✅ PASS |
| TC-FE-TOAST-04 | Error toast | toast.error() | Red error notification | Shown | ✅ PASS |
| TC-FE-TOAST-05 | Auto-dismiss toast | Wait for timeout | Toast removed | Removed | ✅ PASS |
| TC-FE-DASH-01 | Dashboard renders title | Navigate to / | 'Dashboard' heading visible | Visible | ✅ PASS |
| TC-FE-DASH-02 | Dashboard shows loading | Initial render | Loading spinner displayed | Displayed | ✅ PASS |
| TC-FE-DASH-03 | Dashboard displays stats | API returns data | Stats cards populated | Populated | ✅ PASS |
| TC-FE-DASH-04 | Dashboard handles API error | API returns 500 | Error message displayed | Displayed | ✅ PASS |

### 3.9 Performance & Scalability Test Cases

| Test Case ID | Description | Input / Precondition | Expected Output | Actual Output | Status |
|:---:|---|---|---|---|:---:|
| TC-PERF-01 | Medium-scale scheduling | 50 tasks, 10 nodes | Completes in < 2s | 1780ms | ✅ PASS |
| TC-PERF-02 | High task-to-node ratio | 100 tasks, 3 nodes | Completes without crash | 1159ms | ✅ PASS |
| TC-PERF-03 | Burst ingestion 100 tasks | 100 tasks batch | > 5000 tasks/s throughput | 5961.6 tasks/s | ✅ PASS |
| TC-PERF-04 | Burst ingestion 500 tasks | 500 tasks batch | > 1000 tasks/s throughput | 1113.8 tasks/s | ✅ PASS |

---

## 4. Statistical Validation Experiments

### 4.1 EXP-01: 30-Seed Monte Carlo Convergence

- **Protocol:** 30 independent random seeds, workloads N=50 to N=300
- **Statistical Test:** Two-sided Wilcoxon Signed-Rank Test
- **Result:** All baselines significantly outperformed (p < 0.001)
- **Makespan Reduction:** 21.8% – 61.0% over FCFS/Min-Min

### 4.2 EXP-02: Conformal Coverage Verification

- **Dataset:** 15,002 Kaggle cloud task execution records
- **Split:** 60% train, 20% calibration, 20% held-out test
- **Result:** Exact 90.00% empirical coverage at α = 0.10 (±2.399s interval)

### 4.3 EXP-03: Throughput Stress Test

- **Protocol:** Burst batch submissions from 100 to 5,000 tasks
- **Result:** Peak throughput > 5,900 tasks/second, P50 latency 16.0ms

---

## 5. Defect Summary

| Severity | Count | Status |
|---|:---:|:---:|
| Critical | 0 | — |
| High | 0 | — |
| Medium | 0 | — |
| Low | 0 | — |
| **Total Defects** | **0** | **All tests passing** |

---

## 6. Conclusion

All 163 automated test assertions across 12 test suites pass with a **100% pass rate**. The system has been validated through unit tests, integration tests, contract tests, performance benchmarks, and rigorous 30-seed statistical convergence experiments with formal significance testing. No defects remain in the current release.

---

*Document prepared as part of mandatory capstone submission documentation.*
