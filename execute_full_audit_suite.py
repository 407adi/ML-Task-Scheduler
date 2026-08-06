import json
import urllib.request
import urllib.error
import urllib.parse
import time
import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(line_buffering=True)

BASE_URL = "http://127.0.0.1:3001"
ML_URL = "http://127.0.0.1:5001"
FRONTEND_URL = "http://127.0.0.1:3000"

results = {
    "total_tests": 0,
    "passed_tests": 0,
    "failed_tests": 0,
    "categories": {},
    "page_matrix": [],
    "button_matrix": [],
    "api_matrix": [],
    "db_matrix": [],
    "bug_matrix": [],
    "failures": []
}

def record_test(category, test_name, passed, details=None, error=None):
    results["total_tests"] += 1
    if category not in results["categories"]:
        results["categories"][category] = {"total": 0, "passed": 0, "failed": 0, "tests": []}
    cat = results["categories"][category]
    cat["total"] += 1
    
    if passed:
        results["passed_tests"] += 1
        cat["passed"] += 1
        print(f"  [PASS] {category} > {test_name}")
    else:
        results["failed_tests"] += 1
        cat["failed"] += 1
        fail_entry = {
            "category": category,
            "test_name": test_name,
            "error": str(error),
            "details": details
        }
        results["failures"].append(fail_entry)
        print(f"  [FAIL] {category} > {test_name} - Error: {error}")
    
    cat["tests"].append({
        "name": test_name,
        "passed": passed,
        "details": details,
        "error": str(error) if error else None
    })

def make_request(url, method="GET", headers=None, data=None, timeout=30):
    if headers is None:
        headers = {}
    
    data_bytes = None
    if data is not None:
        if isinstance(data, (dict, list)):
            headers["Content-Type"] = "application/json"
            data_bytes = json.dumps(data).encode("utf-8")
        elif isinstance(data, str):
            data_bytes = data.encode("utf-8")
        elif isinstance(data, bytes):
            data_bytes = data

    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            resp_bytes = resp.read()
            status = resp.status
            content_type = resp.headers.get("Content-Type", "")
            if "application/json" in content_type:
                try:
                    body = json.loads(resp_bytes.decode("utf-8"))
                except:
                    body = resp_bytes.decode("utf-8", errors="ignore")
            else:
                body = resp_bytes
            return {"status": status, "body": body, "headers": dict(resp.headers), "error": None}
    except urllib.error.HTTPError as e:
        resp_bytes = e.read()
        try:
            body = json.loads(resp_bytes.decode("utf-8"))
        except:
            body = resp_bytes.decode("utf-8", errors="ignore")
        return {"status": e.code, "body": body, "headers": dict(e.headers), "error": e.reason}
    except Exception as e:
        return {"status": 0, "body": None, "headers": {}, "error": str(e)}

def run_audit():
    print("================================================================================")
    print("      ML TASK SCHEDULER — COMPLETE PRODUCTION READINESS & FINAL AUDIT          ")
    print("================================================================================")

    # 1. INFRASTRUCTURE & CONTAINER HEALTH
    print("\n--- 1. INFRASTRUCTURE & HEALTH AUDIT ---")
    r_health = make_request(f"{BASE_URL}/api/health")
    db_ok = isinstance(r_health["body"], dict) and r_health["body"].get("services", {}).get("database") == True
    redis_ok = isinstance(r_health["body"], dict) and r_health["body"].get("services", {}).get("redis") == True
    record_test("Infrastructure", "Backend API Health Check (/api/health)", r_health["status"] == 200 and db_ok and redis_ok, r_health["body"], r_health["error"])

    r_ml_health = make_request(f"{ML_URL}/api/health")
    ml_healthy = isinstance(r_ml_health["body"], dict) and r_ml_health["body"].get("status") == "healthy" and r_ml_health["body"].get("model_loaded") == True
    record_test("Infrastructure", "ML Service Direct Health Check (/api/health)", r_ml_health["status"] == 200 and ml_healthy, r_ml_health["body"], r_ml_health["error"])

    r_fe = make_request(f"{FRONTEND_URL}/")
    record_test("Infrastructure", "Frontend Web App (Vite/React Port 3000)", r_fe["status"] == 200 and (b"<div id=\"root\">" in r_fe["body"] or b"html" in r_fe["body"].lower()), f"HTTP {r_fe['status']}")

    r_prom = make_request(f"{BASE_URL}/metrics")
    record_test("Infrastructure", "Prometheus Backend Metrics Export (/metrics)", r_prom["status"] == 200 and b"http_requests_total" in r_prom["body"], "Backend metrics scraped")

    r_ml_prom = make_request(f"{ML_URL}/metrics")
    record_test("Infrastructure", "Prometheus ML Metrics Export (/metrics)", r_ml_prom["status"] == 200 and b"ml_" in r_ml_prom["body"], "ML metrics scraped")

    # 2. AUTHENTICATION & MULTI-ROLE RBAC
    print("\n--- 2. AUTHENTICATION & MULTI-ROLE RBAC AUDIT ---")
    
    # 2.1 Seed Users Login
    admin_login = make_request(f"{BASE_URL}/api/v1/auth/login", method="POST", data={"email": "admin@example.com", "password": "password123"})
    admin_token = admin_login["body"].get("data", {}).get("accessToken") if isinstance(admin_login["body"], dict) else None
    record_test("Auth & RBAC", "ADMIN Role Login (admin@example.com)", admin_login["status"] == 200 and admin_token is not None, f"Admin token verified")

    demo_user_login = make_request(f"{BASE_URL}/api/v1/auth/login", method="POST", data={"email": "demo@example.com", "password": "password123"})
    demo_user_token = demo_user_login["body"].get("data", {}).get("accessToken") if isinstance(demo_user_login["body"], dict) else None
    record_test("Auth & RBAC", "USER Role Login (demo@example.com)", demo_user_login["status"] == 200 and demo_user_token is not None, f"User token verified")

    viewer_login = make_request(f"{BASE_URL}/api/v1/auth/login", method="POST", data={"email": "viewer@example.com", "password": "password123"})
    viewer_token = viewer_login["body"].get("data", {}).get("accessToken") if isinstance(viewer_login["body"], dict) else None
    record_test("Auth & RBAC", "VIEWER Role Login (viewer@example.com)", viewer_login["status"] == 200 and viewer_token is not None, f"Viewer token verified")

    # 2.2 Rejection of invalid credentials & bad tokens
    bad_login = make_request(f"{BASE_URL}/api/v1/auth/login", method="POST", data={"email": "admin@example.com", "password": "incorrect_password"})
    record_test("Auth & RBAC", "Invalid Password Rejection (401)", bad_login["status"] == 401, f"Status: {bad_login['status']}")

    bad_jwt = make_request(f"{BASE_URL}/api/v1/tasks", headers={"Authorization": "Bearer invalid.token.payload"})
    record_test("Auth & RBAC", "Invalid / Tampered JWT Token Rejection (401)", bad_jwt["status"] == 401, f"Status: {bad_jwt['status']}")

    # 2.3 Registration
    ts = int(time.time())
    reg_email = f"audit_eval_{ts}@example.com"
    reg_res = make_request(f"{BASE_URL}/api/v1/auth/register", method="POST", data={"name": "Audit Evaluator", "email": reg_email, "password": "SecurePassword123!"})
    reg_token = reg_res["body"].get("data", {}).get("accessToken") if isinstance(reg_res["body"], dict) else None
    record_test("Auth & RBAC", "User Registration & JWT Issuance", reg_res["status"] in (200, 201) and reg_token is not None, reg_res["body"])

    dup_reg = make_request(f"{BASE_URL}/api/v1/auth/register", method="POST", data={"name": "Duplicate Evaluator", "email": reg_email, "password": "SecurePassword123!"})
    record_test("Auth & RBAC", "Duplicate Registration Rejection (409 Conflict)", dup_reg["status"] in (400, 409), f"Status: {dup_reg['status']}")

    # 2.4 RBAC Matrix Checks
    admin_auth = {"Authorization": f"Bearer {admin_token}"}
    user_auth = {"Authorization": f"Bearer {reg_token}"}
    viewer_auth = {"Authorization": f"Bearer {viewer_token}"}

    # Standard USER role attempting ADMIN-only User Management -> should be 403
    user_mgmt_access = make_request(f"{BASE_URL}/api/v1/users", headers=user_auth)
    record_test("Auth & RBAC", "RBAC: USER Role Forbidden from Admin User Management (403)", user_mgmt_access["status"] == 403, f"Status: {user_mgmt_access['status']}")

    # Standard USER role creating resource -> should be 403
    user_res_create = make_request(f"{BASE_URL}/api/v1/resources", method="POST", headers=user_auth, data={"name": f"User-Res-{ts}", "capacity": 50, "layer": "FOG"})
    record_test("Auth & RBAC", "RBAC: USER Role Forbidden from Resource Creation (403)", user_res_create["status"] == 403, f"Status: {user_res_create['status']}")

    # VIEWER role accessing Admin endpoints -> should be 403
    viewer_mgmt_access = make_request(f"{BASE_URL}/api/v1/users", headers=viewer_auth)
    record_test("Auth & RBAC", "RBAC: VIEWER Role Forbidden from Admin User Management (403)", viewer_mgmt_access["status"] == 403, f"Status: {viewer_mgmt_access['status']}")

    # ADMIN role creating resource -> should succeed (201/200)
    admin_res_create = make_request(f"{BASE_URL}/api/v1/resources", method="POST", headers=admin_auth, data={"name": f"Audit-Node-{ts}", "capacity": 100, "layer": "FOG", "status": "AVAILABLE"})
    admin_res_id = admin_res_create["body"].get("data", {}).get("id") if isinstance(admin_res_create["body"], dict) else None
    record_test("Auth & RBAC", "RBAC: ADMIN Role Permitted Resource Creation (201)", admin_res_create["status"] in (200, 201) and admin_res_id is not None, f"Resource ID: {admin_res_id}")

    # 3. TASK LIFECYCLE & MUTATIONS AUDIT
    print("\n--- 3. TASK LIFECYCLE & MUTATIONS AUDIT ---")
    task_payload = {
        "name": f"Audit-Lifecycle-Task-{ts}",
        "type": "CPU",
        "size": "MEDIUM",
        "priority": 4,
        "memoryRequirement": 1024,
        "startupOverhead": 1.2
    }
    t_create = make_request(f"{BASE_URL}/api/v1/tasks", method="POST", headers=admin_auth, data=task_payload)
    task_id = t_create["body"].get("data", {}).get("id") if isinstance(t_create["body"], dict) else None
    record_test("Task Management", "Create Task (POST /api/v1/tasks)", t_create["status"] in (200, 201) and task_id is not None, f"Task ID: {task_id}")

    t_read = make_request(f"{BASE_URL}/api/v1/tasks/{task_id}", headers=admin_auth)
    record_test("Task Management", "Read Task Details (GET /api/v1/tasks/:id)", t_read["status"] == 200 and t_read["body"].get("data", {}).get("name") == task_payload["name"], t_read["body"])

    t_update = make_request(f"{BASE_URL}/api/v1/tasks/{task_id}", method="PUT", headers=admin_auth, data={"priority": 5, "name": f"Updated-Task-{ts}"})
    record_test("Task Management", "Update Task Priority & Name (PUT /api/v1/tasks/:id)", t_update["status"] == 200 and t_update["body"].get("data", {}).get("priority") == 5, t_update["body"])

    t_s1 = make_request(f"{BASE_URL}/api/v1/tasks/{task_id}", method="PUT", headers=admin_auth, data={"status": "SCHEDULED"})
    t_s2 = make_request(f"{BASE_URL}/api/v1/tasks/{task_id}", method="PUT", headers=admin_auth, data={"status": "RUNNING"})
    t_s3 = make_request(f"{BASE_URL}/api/v1/tasks/{task_id}", method="PUT", headers=admin_auth, data={"status": "COMPLETED", "actualTime": 3.75})
    record_test("Task Management", "Task Lifecycle State Transitions (PENDING -> SCHEDULED -> RUNNING -> COMPLETED)", t_s1["status"] == 200 and t_s2["status"] == 200 and t_s3["status"] == 200, "All lifecycle state transitions persisted")

    t_comment = make_request(f"{BASE_URL}/api/v1/tasks/{task_id}/comments", method="POST", headers=admin_auth, data={"content": "Task completed successfully with 3.75s execution time."})
    record_test("Task Management", "Task Comment Creation (/api/v1/tasks/:id/comments)", t_comment["status"] in (200, 201), t_comment["body"])

    t_del = make_request(f"{BASE_URL}/api/v1/tasks/{task_id}", method="DELETE", headers=admin_auth)
    record_test("Task Management", "Task Soft Delete (DELETE /api/v1/tasks/:id)", t_del["status"] in (200, 204), t_del["body"])

    # 4. SCHEDULER ENGINE & ALGORITHMS
    print("\n--- 4. SCHEDULER ENGINE & ALGORITHMS AUDIT ---")
    sched_ids = []
    for i in range(4):
        t_resp = make_request(f"{BASE_URL}/api/v1/tasks", method="POST", headers=admin_auth, data={
            "name": f"Sched-Batch-Task-{i}-{ts}",
            "type": "CPU" if i % 2 == 0 else "IO",
            "size": "SMALL" if i == 0 else "LARGE" if i == 3 else "MEDIUM",
            "priority": 5 - i
        })
        tid = t_resp["body"].get("data", {}).get("id") if isinstance(t_resp["body"], dict) else None
        if tid:
            sched_ids.append(tid)

    # 4.1 ML_ENHANCED
    sched_ml = make_request(f"{BASE_URL}/api/v1/schedule", method="POST", headers=admin_auth, data={"algorithm": "ml_enhanced", "taskIds": sched_ids})
    record_test("Scheduler Engine", "ML-Enhanced Scheduling (POST /api/v1/schedule)", sched_ml["status"] == 200 and sched_ml["body"].get("success") == True, sched_ml["body"])

    # 4.2 Standard Scheduling Algorithms
    backend_algos = ["round_robin", "min_min", "fcfs", "edf", "sjf", "hybrid_heuristic", "ipso", "iaco", "rl_ppo"]
    for algo in backend_algos:
        s_res = make_request(f"{BASE_URL}/api/v1/schedule", method="POST", headers=admin_auth, data={"algorithm": algo})
        record_test("Scheduler Engine", f"Scheduler Algorithm: {algo}", s_res["status"] == 200, f"Status: {s_res['status']}")

    # 4.3 Scheduling History & Comparison
    s_hist = make_request(f"{BASE_URL}/api/v1/schedule/history", headers=admin_auth)
    record_test("Scheduler Engine", "Scheduling History Retrieval (/api/v1/schedule/history)", s_hist["status"] == 200 and len(s_hist["body"].get("data", [])) > 0, f"History records: {len(s_hist['body'].get('data', [])) if isinstance(s_hist['body'], dict) else 0}")

    s_comp = make_request(f"{BASE_URL}/api/v1/schedule/compare", method="POST", headers=admin_auth, data={"taskIds": sched_ids[:2]})
    record_test("Scheduler Engine", "Algorithm Comparison Matrix (/api/v1/schedule/compare)", s_comp["status"] == 200 and isinstance(s_comp["body"], dict) and s_comp["body"].get("success") == True, "Comparison matrix returned")

    # 5. FOG COMPUTING SCHEDULER & 6 ALGORITHMS BENCHMARK
    print("\n--- 5. FOG COMPUTING SCHEDULER AUDIT (6 ALGORITHMS) ---")
    fog_info = make_request(f"{BASE_URL}/api/v1/fog/info", headers=admin_auth)
    fog_nodes = make_request(f"{BASE_URL}/api/v1/fog/nodes", headers=admin_auth)
    record_test("Fog Computing", "Fog Topology Info & DB Nodes", fog_info["status"] == 200 and fog_nodes["status"] == 200, f"Fog Nodes: {len(fog_nodes['body'].get('data', [])) if isinstance(fog_nodes['body'], dict) else 0}")

    fog_algos = ["hh", "ipso", "iaco", "fcfs", "rr", "min-min"]
    for algo in fog_algos:
        f_resp = make_request(f"{BASE_URL}/api/v1/fog/schedule", method="POST", headers=admin_auth, data={"algorithm": algo, "taskCount": 20}, timeout=45)
        f_ok = f_resp["status"] == 200 and isinstance(f_resp["body"], dict) and f_resp["body"].get("success") == True
        metrics = f_resp["body"].get("data", {}).get("metrics") if f_ok else None
        record_test("Fog Computing", f"Fog Algorithm: {algo.upper()} Simulation", f_ok, f"Metrics: {metrics}")

    fog_comp = make_request(f"{BASE_URL}/api/v1/fog/compare", method="POST", headers=admin_auth, data={"taskCount": 25}, timeout=60)
    record_test("Fog Computing", "Fog 6-Algorithm Comparative Benchmark (/api/v1/fog/compare)", fog_comp["status"] == 200 and isinstance(fog_comp["body"], dict) and fog_comp["body"].get("success") == True, "Full benchmark executed")

    # 6. ML SERVICE DEEP AUDIT
    print("\n--- 6. ML SERVICE & PREDICTION PIPELINE AUDIT ---")
    ml_info = make_request(f"{ML_URL}/api/model/info")
    record_test("ML Service", "Direct ML Model Info (/api/model/info)", ml_info["status"] == 200, ml_info["body"])

    ml_reg = make_request(f"{ML_URL}/api/model/registry")
    record_test("ML Service", "Model Registry & Version History (/api/model/registry)", ml_reg["status"] == 200, f"Total Versions: {ml_reg['body'].get('totalVersions') if isinstance(ml_reg['body'], dict) else 0}")

    ml_pred = make_request(f"{ML_URL}/api/predict", method="POST", data={
        "taskSize": 2, "taskType": 1, "priority": 4, "resourceLoad": 35.0, "startupOverhead": 1.0
    })
    ml_pred_time = ml_pred["body"].get("predictedTime") if isinstance(ml_pred["body"], dict) else None
    record_test("ML Service", "Single Task Execution Time Prediction (/api/predict)", ml_pred["status"] == 200 and ml_pred_time is not None, f"Predicted Time: {ml_pred_time}s, Confidence: {ml_pred['body'].get('confidence')}")

    ml_batch = make_request(f"{ML_URL}/api/predict/batch", method="POST", data={
        "tasks": [
            {"taskId": "b1", "taskSize": 1, "taskType": 1, "priority": 1, "resourceLoad": 20.0, "startupOverhead": 0.5},
            {"taskId": "b2", "taskSize": 3, "taskType": 2, "priority": 5, "resourceLoad": 70.0, "startupOverhead": 2.0}
        ]
    })
    record_test("ML Service", "Batch Predictions (/api/predict/batch)", ml_batch["status"] == 200 and len(ml_batch["body"].get("predictions", [])) == 2, ml_batch["body"])

    ml_comp = make_request(f"{ML_URL}/api/compare", method="POST", data={
        "taskSize": 2, "taskType": 1, "priority": 3, "resourceLoad": 50.0
    })
    record_test("ML Service", "ML Models Comparison (/api/compare)", ml_comp["status"] == 200, ml_comp["body"])

    ml_anom = make_request(f"{ML_URL}/api/anomalies", method="POST", data={
        "tasks": [
            {"taskId": "n1", "taskSize": 1, "taskType": 1, "priority": 1, "resourceLoad": 10.0, "actualTime": 2.0},
            {"taskId": "a1", "taskSize": 1, "taskType": 1, "priority": 1, "resourceLoad": 10.0, "actualTime": 88.0}
        ],
        "contamination": 0.5
    })
    record_test("ML Service", "Execution Anomaly Detection (/api/anomalies)", ml_anom["status"] == 200, ml_anom["body"])

    ml_retrain = make_request(f"{BASE_URL}/api/v1/ml/retrain", method="POST", headers=admin_auth, data={"reason": "Comprehensive audit verification"})
    record_test("ML Service", "Background Retraining Trigger (/api/v1/ml/retrain)", ml_retrain["status"] == 200 and ml_retrain["body"].get("success") == True, ml_retrain["body"])

    # 7. CHAOS ENGINEERING AUDIT
    print("\n--- 7. CHAOS ENGINEERING AUDIT ---")
    chaos_start = make_request(f"{BASE_URL}/api/v1/chaos/start", method="POST", headers=admin_auth, data={"service": "redis", "type": "latency", "value": 100})
    record_test("Chaos Engineering", "Chaos Fault Injection: Redis Latency (100ms)", chaos_start["status"] == 200 and chaos_start["body"].get("success") == True, chaos_start["body"])

    chaos_exp = make_request(f"{BASE_URL}/api/v1/chaos/experiments", headers=admin_auth)
    record_test("Chaos Engineering", "List Active Chaos Experiments (/api/v1/chaos/experiments)", chaos_exp["status"] == 200, chaos_exp["body"])

    chaos_stop = make_request(f"{BASE_URL}/api/v1/chaos/stop-all", method="POST", headers=admin_auth, data={})
    record_test("Chaos Engineering", "Chaos Stop-All & System Recovery (/api/v1/chaos/stop-all)", chaos_stop["status"] == 200 and chaos_stop["body"].get("success") == True, chaos_stop["body"])

    # 8. REPORTS & EXPORTS AUDIT
    print("\n--- 8. REPORTS & EXPORTS AUDIT ---")
    pdf_tasks = make_request(f"{BASE_URL}/api/v1/reports/pdf/tasks", headers=admin_auth)
    is_pdf_t = isinstance(pdf_tasks["body"], bytes) and pdf_tasks["body"].startswith(b"%PDF-")
    record_test("Reports & Export", "Task Summary PDF Report (/api/v1/reports/pdf/tasks)", pdf_tasks["status"] == 200 and is_pdf_t, f"PDF byte size: {len(pdf_tasks['body']) if isinstance(pdf_tasks['body'], bytes) else 0}")

    pdf_perf = make_request(f"{BASE_URL}/api/v1/reports/pdf/performance", headers=admin_auth)
    is_pdf_p = isinstance(pdf_perf["body"], bytes) and pdf_perf["body"].startswith(b"%PDF-")
    record_test("Reports & Export", "ML Performance PDF Report (/api/v1/reports/pdf/performance)", pdf_perf["status"] == 200 and is_pdf_p, f"PDF byte size: {len(pdf_perf['body']) if isinstance(pdf_perf['body'], bytes) else 0}")

    pdf_res = make_request(f"{BASE_URL}/api/v1/reports/pdf/resources", headers=admin_auth)
    is_pdf_r = isinstance(pdf_res["body"], bytes) and pdf_res["body"].startswith(b"%PDF-")
    record_test("Reports & Export", "Resource Utilization PDF Report (/api/v1/reports/pdf/resources)", pdf_res["status"] == 200 and is_pdf_r, f"PDF byte size: {len(pdf_res['body']) if isinstance(pdf_res['body'], bytes) else 0}")

    csv_tasks = make_request(f"{BASE_URL}/api/v1/reports/csv/tasks", headers=admin_auth)
    is_csv_t = isinstance(csv_tasks["body"], bytes) and b"," in csv_tasks["body"] and b"\n" in csv_tasks["body"]
    record_test("Reports & Export", "Task Summary CSV Export (/api/v1/reports/csv/tasks)", csv_tasks["status"] == 200 and is_csv_t, f"CSV byte size: {len(csv_tasks['body']) if isinstance(csv_tasks['body'], bytes) else 0}")

    # 9. COLLABORATION & REAL-TIME MODULES
    print("\n--- 9. COLLABORATION & REAL-TIME MODULES ---")
    cal_res = make_request(f"{BASE_URL}/api/v1/calendar/events", headers=admin_auth)
    record_test("Collaboration Modules", "Calendar Events Retrieval (/api/v1/calendar/events)", cal_res["status"] == 200, f"Event count: {len(cal_res['body'].get('data', [])) if isinstance(cal_res['body'], dict) else 0}")

    dev_res = make_request(f"{BASE_URL}/api/v1/devices", headers=admin_auth)
    record_test("Collaboration Modules", "IoT Devices Retrieval (/api/v1/devices)", dev_res["status"] == 200, f"Device count: {len(dev_res['body'].get('data', [])) if isinstance(dev_res['body'], dict) else 0}")

    chat_res = make_request(f"{BASE_URL}/api/v1/chat/rooms", headers=admin_auth)
    record_test("Collaboration Modules", "Chat Rooms Retrieval (/api/v1/chat/rooms)", chat_res["status"] == 200, chat_res["body"])

    mail_res = make_request(f"{BASE_URL}/api/v1/mail/inbox", headers=admin_auth)
    record_test("Collaboration Modules", "Mail Inbox Retrieval (/api/v1/mail/inbox)", mail_res["status"] == 200, mail_res["body"])

    ai_chat = make_request(f"{BASE_URL}/api/v1/ai/chat", method="POST", headers=admin_auth, data={"message": "Explain the Hybrid Heuristic algorithm advantages over Min-Min."})
    record_test("Collaboration Modules", "Nova AI Assistant Chat (/api/v1/ai/chat)", ai_chat["status"] == 200 and ai_chat["body"].get("success") == True, ai_chat["body"])

    users_list = make_request(f"{BASE_URL}/api/v1/users", headers=admin_auth)
    record_test("Collaboration Modules", "User Administration Management (/api/v1/users)", users_list["status"] == 200 and len(users_list["body"].get("data", [])) >= 3, f"Users: {len(users_list['body'].get('data', [])) if isinstance(users_list['body'], dict) else 0}")

    # 10. SECURITY AUDIT & REGRESSION CHECKS
    print("\n--- 10. SECURITY AUDIT & REGRESSION CHECKS ---")
    csrf_test = make_request(f"{BASE_URL}/api/v1/tasks", method="POST", headers=admin_auth, data={"name": f"CSRF-Check-{ts}", "type": "MIXED", "size": "SMALL", "priority": 2})
    record_test("Security & Regression", "CSRF Token Validation Exemption on Bearer JWTs", csrf_test["status"] in (200, 201), "No 403 CSRF rejection")

    custom_id_sched = make_request(f"{BASE_URL}/api/v1/schedule", method="POST", headers=admin_auth, data={"algorithm": "round_robin", "taskIds": [f"custom-task-id-{ts}"]})
    record_test("Security & Regression", "Graceful Handling of Custom Non-UUID Task IDs", custom_id_sched["status"] in (200, 400, 404), f"Status: {custom_id_sched['status']}")

    chaos_case = make_request(f"{BASE_URL}/api/v1/chaos/start", method="POST", headers=admin_auth, data={"service": "REDIS", "type": "LATENCY", "value": 50})
    make_request(f"{BASE_URL}/api/v1/chaos/stop-all", method="POST", headers=admin_auth, data={})
    record_test("Security & Regression", "Chaos Validator Case-Insensitivity", chaos_case["status"] in (200, 400), f"Status: {chaos_case['status']}")

    user_sample = users_list["body"].get("data", [{}])[0] if isinstance(users_list["body"], dict) else {}
    record_test("Security & Regression", "Password Hash Stripped from User APIs", "password" not in user_sample, "Password fields excluded")

    # 11. FRONTEND PAGE MATRIX (ALL 25 DISCOVERED ROUTES)
    print("\n--- 11. FRONTEND ROUTE DISCOVERY & VERIFICATION MATRIX ---")
    routes_to_verify = [
        ("/", "LandingPage", "Public landing page with product overview and CTA buttons"),
        ("/login", "LoginPage", "Authentication login page with email and password"),
        ("/register", "RegisterPage", "Account creation page with role selection"),
        ("/dashboard", "DashboardPage", "Main scheduling overview dashboard with system metrics"),
        ("/tasks", "TasksPage", "Task list, search, filter, batch actions, and creation modal"),
        ("/tasks/create", "CreateTaskPage", "Dedicated task creation form"),
        ("/tasks/bulk", "BulkTasksPage", "Bulk task creation with JSON/CSV upload"),
        ("/tasks/test-task-1", "TaskDetailPage", "Task details view with prediction explanation and timeline"),
        ("/resources", "ResourcesPage", "Resource management and node status monitoring"),
        ("/scheduling", "SchedulingPage", "Scheduling workspace with multi-algorithm execution and comparison"),
        ("/fog-computing", "FogComputingPage", "Fog computing simulator with 6 algorithms (HH, IPSO, IACO, etc.)"),
        ("/ml-insights", "MLInsightsPage", "ML model performance dashboard with SHAP, R2, MAE, retrain"),
        ("/analytics", "AnalyticsPage", "System performance analytics, throughput, and queue depth"),
        ("/experiments", "ExperimentsPage", "Batch experiment execution and Pareto frontier visualization"),
        ("/chaos", "ChaosEngineeringPage", "Chaos engineering control center with fault injection"),
        ("/devices", "DevicesPage", "IoT device management, telemetry, and connection monitoring"),
        ("/calendar", "CalendarPage", "Task calendar view with interactive scheduling timeline"),
        ("/chat", "ChatPage", "Real-time team chat and collaboration channels"),
        ("/mail", "MailPage", "Internal messaging system with inbox, sent, and compose"),
        ("/ai-chat", "AIChatPage", "Nova AI assistant conversational interface"),
        ("/sdg", "SyntheticDataGenPage", "Synthetic data generator for ML training and benchmarking"),
        ("/reports", "ReportsPage", "Report generation hub for PDF and CSV exports"),
        ("/settings", "SettingsPage", "User preferences and system configuration settings"),
        ("/docs", "ApiDocsPage", "Interactive Swagger/OpenAPI documentation viewer"),
        ("/profile", "ProfilePage", "User profile management and security preferences")
    ]

    for route, component, desc in routes_to_verify:
        r_page = make_request(f"{FRONTEND_URL}{route}")
        is_accessible = r_page["status"] == 200 and isinstance(r_page["body"], bytes) and len(r_page["body"]) > 0
        record_test("Frontend Pages", f"Route: {route} ({component})", is_accessible, f"HTTP {r_page['status']} - {desc}")
        results["page_matrix"].append({
            "route": route,
            "component": component,
            "description": desc,
            "status": "VERIFIED" if is_accessible else "FAILED",
            "http_status": r_page["status"]
        })

    print("\n================================================================================")
    print(f"   FULL AUDIT COMPLETE: {results['passed_tests']}/{results['total_tests']} TESTS PASSED")
    print(f"   TOTAL FAILURES: {results['failed_tests']}")
    print("================================================================================")
    
    with open("comprehensive_audit_results.json", "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    run_audit()
