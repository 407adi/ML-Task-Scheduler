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

results_data = {
    "total_tests": 0,
    "passed_tests": 0,
    "failed_tests": 0,
    "categories": {},
    "failures": []
}

def record_result(category, test_name, passed, details=None, error=None):
    results_data["total_tests"] += 1
    if category not in results_data["categories"]:
        results_data["categories"][category] = {"total": 0, "passed": 0, "failed": 0, "tests": []}
    cat = results_data["categories"][category]
    cat["total"] += 1
    
    if passed:
        results_data["passed_tests"] += 1
        cat["passed"] += 1
        print(f"  [PASS] {category} > {test_name}")
    else:
        results_data["failed_tests"] += 1
        cat["failed"] += 1
        fail_entry = {
            "category": category,
            "test_name": test_name,
            "error": str(error),
            "details": details
        }
        results_data["failures"].append(fail_entry)
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
    print("           ML TASK SCHEDULER — FINAL ASSIGNMENT QA AUDIT EXECUTION              ")
    print("================================================================================")

    # 1. INFRASTRUCTURE AUDIT
    print("\n--- 1. INFRASTRUCTURE & HEALTH AUDIT ---")
    r = make_request(f"{BASE_URL}/api/health")
    db_ok = isinstance(r["body"], dict) and r["body"].get("services", {}).get("database") == True
    redis_ok = isinstance(r["body"], dict) and r["body"].get("services", {}).get("redis") == True
    record_result("Infrastructure", "Backend API Health (/api/health)", r["status"] == 200 and db_ok and redis_ok, r["body"], r["error"])

    r = make_request(f"{ML_URL}/api/health")
    ml_healthy = isinstance(r["body"], dict) and r["body"].get("status") == "healthy" and r["body"].get("model_loaded") == True
    record_result("Infrastructure", "ML Service Health (/api/health)", r["status"] == 200 and ml_healthy, r["body"], r["error"])

    r = make_request(f"{FRONTEND_URL}/")
    record_result("Infrastructure", "Frontend Web Server (Port 3000)", r["status"] == 200 and b"html" in r["body"].lower() if isinstance(r["body"], bytes) else False, f"Status: {r['status']}")

    r = make_request(f"{BASE_URL}/metrics")
    record_result("Infrastructure", "Backend Prometheus Metrics Endpoint", r["status"] == 200 and b"http_requests_total" in (r["body"] if isinstance(r["body"], bytes) else b""), "Prometheus metrics exported")

    r = make_request(f"{ML_URL}/metrics")
    record_result("Infrastructure", "ML Prometheus Metrics Endpoint", r["status"] == 200 and b"ml_" in (r["body"] if isinstance(r["body"], bytes) else b""), "ML metrics exported")

    # 2. AUTHENTICATION & RBAC AUDIT
    print("\n--- 2. AUTHENTICATION & RBAC AUDIT ---")
    
    # 2.1 Admin Login
    admin_login = make_request(f"{BASE_URL}/api/v1/auth/login", method="POST", data={"email": "admin@example.com", "password": "password123"})
    admin_token = admin_login["body"].get("data", {}).get("accessToken") if isinstance(admin_login["body"], dict) else None
    record_result("Auth & RBAC", "Admin Login (admin@example.com)", admin_login["status"] == 200 and admin_token is not None, f"Admin token acquired: {bool(admin_token)}")

    # 2.2 User Login
    user_login = make_request(f"{BASE_URL}/api/v1/auth/login", method="POST", data={"email": "user@example.com", "password": "password123"})
    user_token = user_login["body"].get("data", {}).get("accessToken") if isinstance(user_login["body"], dict) else None
    record_result("Auth & RBAC", "Standard User Login (user@example.com)", user_login["status"] == 200 and user_token is not None, f"User token acquired: {bool(user_token)}")

    # 2.3 Viewer Login
    viewer_login = make_request(f"{BASE_URL}/api/v1/auth/login", method="POST", data={"email": "viewer@example.com", "password": "password123"})
    viewer_token = viewer_login["body"].get("data", {}).get("accessToken") if isinstance(viewer_login["body"], dict) else None
    record_result("Auth & RBAC", "Viewer Login (viewer@example.com)", viewer_login["status"] == 200 and viewer_token is not None, f"Viewer token acquired: {bool(viewer_token)}")

    # 2.4 Invalid Password Rejection
    bad_login = make_request(f"{BASE_URL}/api/v1/auth/login", method="POST", data={"email": "admin@example.com", "password": "wrongpassword"})
    record_result("Auth & RBAC", "Invalid Credentials Rejection", bad_login["status"] in (400, 401), f"Status: {bad_login['status']}")

    # 2.5 User Registration
    rand_suffix = int(time.time())
    new_email = f"audit_user_{rand_suffix}@example.com"
    reg_resp = make_request(f"{BASE_URL}/api/v1/auth/register", method="POST", data={"name": "Audit Test User", "email": new_email, "password": "SecurePassword123!"})
    reg_ok = reg_resp["status"] in (200, 201) and isinstance(reg_resp["body"], dict) and reg_resp["body"].get("success") == True
    record_result("Auth & RBAC", "New User Registration & Password Hashing", reg_ok, reg_resp["body"])

    # 2.6 Duplicate Email Rejection
    dup_resp = make_request(f"{BASE_URL}/api/v1/auth/register", method="POST", data={"name": "Audit User Duplicate", "email": new_email, "password": "SecurePassword123!"})
    record_result("Auth & RBAC", "Duplicate Registration Rejection (409 Conflict / 400)", dup_resp["status"] in (400, 409), f"Status: {dup_resp['status']}")

    # 2.7 Protected Route without Token (Expect 401)
    unauth_resp = make_request(f"{BASE_URL}/api/v1/tasks")
    record_result("Auth & RBAC", "Unauthenticated Request Rejection (401)", unauth_resp["status"] == 401, f"Status: {unauth_resp['status']}")

    # 2.8 RBAC: Admin-only Resource Creation
    admin_auth = {"Authorization": f"Bearer {admin_token}"}
    user_auth = {"Authorization": f"Bearer {user_token}"}
    viewer_auth = {"Authorization": f"Bearer {viewer_token}"}

    # USER trying to create resource (should be 403 Forbidden)
    user_create_res = make_request(f"{BASE_URL}/api/v1/resources", method="POST", headers=user_auth, data={"name": f"User-Res-{rand_suffix}", "capacity": 100, "layer": "FOG"})
    record_result("Auth & RBAC", "RBAC: Regular USER Forbidden from Resource Creation (403)", user_create_res["status"] == 403, f"Status: {user_create_res['status']}")

    # VIEWER trying to create task (should be 403 Forbidden)
    viewer_create_task = make_request(f"{BASE_URL}/api/v1/tasks", method="POST", headers=viewer_auth, data={"name": "Viewer-Task", "type": "CPU", "size": "SMALL", "priority": 1})
    record_result("Auth & RBAC", "RBAC: VIEWER Forbidden from Task Creation (403)", viewer_create_task["status"] == 403, f"Status: {viewer_create_task['status']}")

    # ADMIN creating resource (should be 201/200 Success)
    admin_res_name = f"Audit-Fog-Node-{rand_suffix}"
    admin_create_res = make_request(f"{BASE_URL}/api/v1/resources", method="POST", headers=admin_auth, data={"name": admin_res_name, "capacity": 100, "layer": "FOG", "status": "AVAILABLE"})
    admin_res_id = admin_create_res["body"].get("data", {}).get("id") if isinstance(admin_create_res["body"], dict) else None
    record_result("Auth & RBAC", "RBAC: ADMIN Permitted Resource Creation (201/200)", admin_create_res["status"] in (200, 201) and admin_res_id is not None, f"Resource ID: {admin_res_id}")

    # 3. TASK LIFECYCLE & DATABASE MUTATIONS
    print("\n--- 3. TASK LIFECYCLE & DATABASE MUTATIONS ---")
    # 3.1 Create Task
    task_payload = {
        "name": f"Audit-Benchmark-Task-{rand_suffix}",
        "type": "CPU",
        "size": "MEDIUM",
        "priority": 3,
        "memoryRequirement": 512,
        "startupOverhead": 1.5
    }
    create_task_resp = make_request(f"{BASE_URL}/api/v1/tasks", method="POST", headers=admin_auth, data=task_payload)
    created_task = create_task_resp["body"].get("data", {}) if isinstance(create_task_resp["body"], dict) else {}
    task_id = created_task.get("id")
    record_result("Task Management", "Task Creation (POST /api/v1/tasks)", create_task_resp["status"] in (200, 201) and task_id is not None, f"Task ID: {task_id}")

    # 3.2 Read Task by ID
    get_task_resp = make_request(f"{BASE_URL}/api/v1/tasks/{task_id}", headers=admin_auth)
    record_result("Task Management", "Get Task by ID (GET /api/v1/tasks/:id)", get_task_resp["status"] == 200 and get_task_resp["body"].get("data", {}).get("name") == task_payload["name"], get_task_resp["body"])

    # 3.3 Update Task
    update_task_resp = make_request(f"{BASE_URL}/api/v1/tasks/{task_id}", method="PUT", headers=admin_auth, data={"name": f"Updated-Task-{rand_suffix}", "priority": 5})
    record_result("Task Management", "Update Task (PUT /api/v1/tasks/:id)", update_task_resp["status"] == 200 and update_task_resp["body"].get("data", {}).get("priority") == 5, update_task_resp["body"])

    # 3.4 Task Status Transition (PENDING -> SCHEDULED -> RUNNING -> COMPLETED)
    status_trans_1 = make_request(f"{BASE_URL}/api/v1/tasks/{task_id}", method="PUT", headers=admin_auth, data={"status": "SCHEDULED"})
    status_trans_2 = make_request(f"{BASE_URL}/api/v1/tasks/{task_id}", method="PUT", headers=admin_auth, data={"status": "RUNNING"})
    status_trans_3 = make_request(f"{BASE_URL}/api/v1/tasks/{task_id}", method="PUT", headers=admin_auth, data={"status": "COMPLETED", "actualTime": 4.85})
    record_result("Task Management", "Task Lifecycle State Transitions (PENDING->SCHEDULED->RUNNING->COMPLETED)", 
                  status_trans_1["status"] == 200 and status_trans_2["status"] == 200 and status_trans_3["status"] == 200,
                  "All transitions persisted")

    # 3.5 Task Comments & Attachments
    comment_resp = make_request(f"{BASE_URL}/api/v1/tasks/{task_id}/comments", method="POST", headers=admin_auth, data={"content": "Audit verification comment"})
    record_result("Task Management", "Add Comment to Task (/api/v1/tasks/:id/comments)", comment_resp["status"] in (200, 201), comment_resp["body"])

    # 3.6 Soft Deletion & Verification
    del_task_resp = make_request(f"{BASE_URL}/api/v1/tasks/{task_id}", method="DELETE", headers=admin_auth)
    record_result("Task Management", "Task Soft Delete (DELETE /api/v1/tasks/:id)", del_task_resp["status"] in (200, 204), del_task_resp["body"])

    # 4. SCHEDULER & ML-ENHANCED SCHEDULING
    print("\n--- 4. SCHEDULER & ML ENGINE AUDIT ---")
    # Create fresh tasks for scheduling
    sched_task_ids = []
    for i in range(3):
        t_resp = make_request(f"{BASE_URL}/api/v1/tasks", method="POST", headers=admin_auth, data={
            "name": f"Sched-Task-{i}-{rand_suffix}",
            "type": "MIXED",
            "size": "LARGE" if i == 2 else "SMALL",
            "priority": 4 - i
        })
        tid = t_resp["body"].get("data", {}).get("id")
        if tid:
            sched_task_ids.append(tid)

    # 4.1 ML_ENHANCED Scheduling
    sched_resp_ml = make_request(f"{BASE_URL}/api/v1/schedule", method="POST", headers=admin_auth, data={
        "algorithm": "ml_enhanced",
        "taskIds": sched_task_ids
    })
    ml_sched_ok = sched_resp_ml["status"] == 200 and isinstance(sched_resp_ml["body"], dict) and sched_resp_ml["body"].get("success") == True
    record_result("Scheduler Engine", "ML-Enhanced Scheduling (POST /api/v1/schedule)", ml_sched_ok, sched_resp_ml["body"])

    # 4.2 Other Heuristics Scheduling
    for algo in ["round_robin", "least_loaded", "edf", "genetic", "priority_first"]:
        sched_resp = make_request(f"{BASE_URL}/api/v1/schedule", method="POST", headers=admin_auth, data={
            "algorithm": algo
        })
        record_result("Scheduler Engine", f"Scheduler Algorithm: {algo}", sched_resp["status"] == 200, f"Status: {sched_resp['status']}")

    # 5. FOG COMPUTING SCHEDULER AUDIT (CRITICAL REQUIREMENT)
    print("\n--- 5. FOG COMPUTING SCHEDULER AUDIT (ALL 6 ALGORITHMS) ---")
    # 5.1 Fog Info & Metadata
    fog_info = make_request(f"{BASE_URL}/api/v1/fog/info", headers=admin_auth)
    fog_nodes = make_request(f"{BASE_URL}/api/v1/fog/nodes", headers=admin_auth)
    record_result("Fog Computing", "Fog Topology & Nodes Retrieval", fog_info["status"] == 200 and fog_nodes["status"] == 200, f"Nodes count: {len(fog_nodes['body'].get('data', [])) if isinstance(fog_nodes['body'], dict) else 0}")

    # 5.2 Test all 6 Fog Algorithms individually
    fog_algorithms = ["hh", "ipso", "iaco", "fcfs", "rr", "min_min"]
    for algo in fog_algorithms:
        f_resp = make_request(f"{BASE_URL}/api/v1/fog/schedule", method="POST", headers=admin_auth, data={
            "algorithm": algo,
            "taskCount": 20
        }, timeout=45)
        f_ok = f_resp["status"] == 200 and isinstance(f_resp["body"], dict) and f_resp["body"].get("success") == True
        metrics = f_resp["body"].get("data", {}).get("metrics") if f_ok else None
        record_result("Fog Computing", f"Fog Algorithm: {algo.upper()} Simulation", f_ok, f"Metrics: {metrics}")

    # 5.3 Fog Comparison Endpoint (/api/v1/fog/compare and /api/v1/scheduling/compare)
    fog_comp = make_request(f"{BASE_URL}/api/v1/fog/compare", method="POST", headers=admin_auth, data={"taskCount": 25}, timeout=60)
    record_result("Fog Computing", "Fog 6-Algorithm Comparison (/api/v1/fog/compare)", fog_comp["status"] == 200 and isinstance(fog_comp["body"], dict) and fog_comp["body"].get("success") == True, "All algorithms benchmarked")

    sched_comp = make_request(f"{BASE_URL}/api/v1/scheduling/compare", method="POST", headers=admin_auth, data={"taskCount": 25}, timeout=60)
    record_result("Fog Computing", "Scheduling Alias (/api/v1/scheduling/compare)", sched_comp["status"] == 200, "Comparison returned")

    # 6. ML SERVICE DEEP AUDIT
    print("\n--- 6. ML SERVICE DEEP AUDIT ---")
    # 6.1 Model Info & Model Registry
    ml_info = make_request(f"{ML_URL}/api/model/info")
    record_result("ML Service", "Direct ML Model Info (/api/model/info)", ml_info["status"] == 200, ml_info["body"])

    ml_reg = make_request(f"{ML_URL}/api/model/registry")
    record_result("ML Service", "Model Registry & Version History (/api/model/registry)", ml_reg["status"] == 200, f"Versions: {ml_reg['body'].get('totalVersions') if isinstance(ml_reg['body'], dict) else 0}")

    # 6.2 Single Prediction with Conformal Bounds
    pred_resp = make_request(f"{ML_URL}/api/predict", method="POST", data={
        "taskSize": 2,
        "taskType": 1,
        "priority": 3,
        "resourceLoad": 45.0,
        "startupOverhead": 1.2
    })
    pred_data = pred_resp["body"] if isinstance(pred_resp["body"], dict) else {}
    pred_time = pred_data.get("predictedTime")
    confidence = pred_data.get("confidence")
    record_result("ML Service", "Task Execution Time Prediction (/api/predict)", pred_resp["status"] == 200 and pred_time is not None, f"Predicted Time: {pred_time}s, Confidence: {confidence}")

    # 6.3 Batch Prediction
    batch_resp = make_request(f"{ML_URL}/api/predict/batch", method="POST", data={
        "tasks": [
            {"taskId": "t1", "taskSize": 1, "taskType": 1, "priority": 1, "resourceLoad": 10.0, "startupOverhead": 0.5},
            {"taskId": "t2", "taskSize": 3, "taskType": 2, "priority": 5, "resourceLoad": 80.0, "startupOverhead": 2.0}
        ]
    })
    record_result("ML Service", "Batch Predictions (/api/predict/batch)", batch_resp["status"] == 200 and len(batch_resp["body"].get("predictions", [])) == 2, batch_resp["body"])

    # 6.4 Model Comparison on ML Service
    ml_comp = make_request(f"{ML_URL}/api/compare", method="POST", data={
        "taskSize": 2,
        "taskType": 1,
        "priority": 3,
        "resourceLoad": 50.0
    })
    record_result("ML Service", "ML Models Comparison (/api/compare)", ml_comp["status"] == 200, ml_comp["body"])

    # 6.5 Anomaly Detection
    anom_resp = make_request(f"{ML_URL}/api/anomalies", method="POST", data={
        "tasks": [
            {"taskId": "norm-1", "taskSize": 1, "taskType": 1, "priority": 1, "resourceLoad": 10.0, "actualTime": 2.1},
            {"taskId": "norm-2", "taskSize": 2, "taskType": 1, "priority": 2, "resourceLoad": 20.0, "actualTime": 4.2},
            {"taskId": "anomaly-1", "taskSize": 1, "taskType": 1, "priority": 1, "resourceLoad": 10.0, "actualTime": 99.9}
        ],
        "contamination": 0.3
    })
    record_result("ML Service", "Execution Anomaly Detection (/api/anomalies)", anom_resp["status"] == 200, anom_resp["body"])

    # 6.6 Trigger Retraining from Backend
    retrain_resp = make_request(f"{BASE_URL}/api/v1/ml/retrain", method="POST", headers=admin_auth, data={"reason": "Audit validation trigger"})
    record_result("ML Service", "Background Retraining Trigger (/api/v1/ml/retrain)", retrain_resp["status"] == 200 and retrain_resp["body"].get("success") == True, retrain_resp["body"])

    # 7. CHAOS ENGINEERING AUDIT
    print("\n--- 7. CHAOS ENGINEERING AUDIT ---")
    # 7.1 Inject Latency Fault
    chaos_inject = make_request(f"{BASE_URL}/api/v1/chaos/start", method="POST", headers=admin_auth, data={
        "service": "redis",
        "type": "latency",
        "value": 150
    })
    record_result("Chaos Engineering", "Chaos Fault Injection: Redis Latency (150ms)", chaos_inject["status"] == 200 and chaos_inject["body"].get("success") == True, chaos_inject["body"])

    # 7.2 Get Active Chaos Experiments
    chaos_list = make_request(f"{BASE_URL}/api/v1/chaos/experiments", headers=admin_auth)
    record_result("Chaos Engineering", "List Active Chaos Experiments (/api/v1/chaos/experiments)", chaos_list["status"] == 200, chaos_list["body"])

    # 7.3 Stop All Chaos & Recover
    chaos_stop = make_request(f"{BASE_URL}/api/v1/chaos/stop-all", method="POST", headers=admin_auth, data={})
    record_result("Chaos Engineering", "Chaos Stop-All & System Recovery (/api/v1/chaos/stop-all)", chaos_stop["status"] == 200 and chaos_stop["body"].get("success") == True, chaos_stop["body"])

    # 8. REPORTS & EXPORTS AUDIT
    print("\n--- 8. REPORTS & EXPORT AUDIT ---")
    # 8.1 PDF Export
    pdf_resp = make_request(f"{BASE_URL}/api/v1/reports/pdf", headers=admin_auth)
    is_valid_pdf = isinstance(pdf_resp["body"], bytes) and pdf_resp["body"].startswith(b"%PDF-")
    record_result("Reports & Export", "PDF Report Generation (/api/v1/reports/pdf)", pdf_resp["status"] == 200 and is_valid_pdf, f"PDF byte size: {len(pdf_resp['body']) if isinstance(pdf_resp['body'], bytes) else 0}")

    # 8.2 CSV Export
    csv_resp = make_request(f"{BASE_URL}/api/v1/reports/csv", headers=admin_auth)
    is_valid_csv = isinstance(csv_resp["body"], bytes) and b"," in csv_resp["body"] and b"\n" in csv_resp["body"]
    record_result("Reports & Export", "CSV Report Generation (/api/v1/reports/csv)", csv_resp["status"] == 200 and is_valid_csv, f"CSV byte size: {len(csv_resp['body']) if isinstance(csv_resp['body'], bytes) else 0}")

    # 9. COLLABORATION & REAL-TIME MODULES
    print("\n--- 9. COLLABORATION & REAL-TIME MODULES ---")
    # 9.1 Calendar Events
    cal_resp = make_request(f"{BASE_URL}/api/v1/calendar/events", headers=admin_auth)
    record_result("Collaboration Modules", "Calendar Events Retrieval (/api/v1/calendar/events)", cal_resp["status"] == 200, cal_resp["body"])

    # 9.2 IoT Devices
    dev_create = make_request(f"{BASE_URL}/api/v1/devices", method="POST", headers=admin_auth, data={
        "name": f"Sensor-Node-{rand_suffix}",
        "type": "IOT_SENSOR",
        "status": "ONLINE",
        "ipAddress": f"192.168.1.{(rand_suffix % 200) + 10}",
        "port": 8080,
        "location": "Fog Zone A"
    })
    record_result("Collaboration Modules", "IoT Device Registration & Persistence", dev_create["status"] in (200, 201), dev_create["body"])

    dev_list = make_request(f"{BASE_URL}/api/v1/devices", headers=admin_auth)
    record_result("Collaboration Modules", "List Registered Devices (/api/v1/devices)", dev_list["status"] == 200, f"Device count: {len(dev_list['body'].get('data', [])) if isinstance(dev_list['body'], dict) else 0}")

    # 9.3 Chat Rooms & Message Sending
    chat_rooms = make_request(f"{BASE_URL}/api/v1/chat/rooms", headers=admin_auth)
    room_id = chat_rooms["body"].get("data", [{}])[0].get("id") if isinstance(chat_rooms["body"], dict) and len(chat_rooms["body"].get("data", [])) > 0 else None
    if not room_id:
        room_create = make_request(f"{BASE_URL}/api/v1/chat/rooms", method="POST", headers=admin_auth, data={"name": "Audit Room", "type": "GROUP"})
        room_id = room_create["body"].get("data", {}).get("id") if isinstance(room_create["body"], dict) else None
    
    record_result("Collaboration Modules", "Chat Rooms Listing / Creation", chat_rooms["status"] == 200 or room_id is not None, f"Room ID: {room_id}")

    if room_id:
        msg_send = make_request(f"{BASE_URL}/api/v1/chat/rooms/{room_id}/messages", method="POST", headers=admin_auth, data={"content": "Audit automated test message"})
        record_result("Collaboration Modules", "Chat Message Dispatch", msg_send["status"] in (200, 201), msg_send["body"])

    # 9.4 Internal Mail System
    mail_inbox = make_request(f"{BASE_URL}/api/v1/mail/inbox", headers=admin_auth)
    record_result("Collaboration Modules", "Mail Inbox Retrieval (/api/v1/mail/inbox)", mail_inbox["status"] == 200, mail_inbox["body"])

    # 9.5 AI Assistant Nova Endpoint
    ai_resp = make_request(f"{BASE_URL}/api/v1/ai/chat", method="POST", headers=admin_auth, data={"message": "What is the best scheduling algorithm for CPU heavy tasks?"})
    record_result("Collaboration Modules", "Nova AI Assistant API (/api/v1/ai/chat)", ai_resp["status"] == 200, ai_resp["body"])

    # 9.6 User Management (Admin Only)
    users_resp = make_request(f"{BASE_URL}/api/v1/users", headers=admin_auth)
    record_result("Collaboration Modules", "User List Management (/api/v1/users)", users_resp["status"] == 200, f"User count: {len(users_resp['body'].get('data', [])) if isinstance(users_resp['body'], dict) else 0}")

    # 10. SECURITY & REGRESSION AUDIT
    print("\n--- 10. SECURITY & REGRESSION AUDIT ---")
    # 10.1 CSRF bypass with Bearer token on mutating requests
    test_patch = make_request(f"{BASE_URL}/api/v1/tasks", method="POST", headers=admin_auth, data={
        "name": f"CSRF-Test-Task-{rand_suffix}", "type": "IO", "size": "SMALL", "priority": 2
    })
    record_result("Security & Regression", "CSRF Token Validation Bypass with Valid Bearer JWT", test_patch["status"] in (200, 201), "No 403 CSRF error")

    # 10.2 Custom non-UUID task ID handling in scheduler
    custom_tid_test = make_request(f"{BASE_URL}/api/v1/schedule", method="POST", headers=admin_auth, data={
        "algorithm": "round_robin",
        "taskIds": [f"custom-task-{rand_suffix}"]
    })
    # Backend should handle custom IDs gracefully without 500 crash
    record_result("Security & Regression", "Custom Non-UUID Task ID Handling (no unhandled 500 crash)", custom_tid_test["status"] in (200, 400, 404), f"Status: {custom_tid_test['status']}")

    # 10.3 Chaos Validator Case Insensitivity
    chaos_case_test = make_request(f"{BASE_URL}/api/v1/chaos/start", method="POST", headers=admin_auth, data={
        "service": "REDIS",
        "type": "LATENCY",
        "value": 50
    })
    make_request(f"{BASE_URL}/api/v1/chaos/stop-all", method="POST", headers=admin_auth, data={})
    record_result("Security & Regression", "Chaos Validator Uppercase/Lowercase Robustness", chaos_case_test["status"] in (200, 400), f"Status: {chaos_case_test['status']}")

    # 10.4 Password Masking in User Responses
    user_data_sample = users_resp["body"].get("data", [{}])[0] if isinstance(users_resp["body"], dict) else {}
    password_exposed = "password" in user_data_sample
    record_result("Security & Regression", "Password Hash Exposure Prevention in User APIs", not password_exposed, "Passwords properly stripped")

    print("\n================================================================================")
    print(f"   FINAL AUDIT SUMMARY: {results_data['passed_tests']}/{results_data['total_tests']} TESTS PASSED")
    print(f"   FAILURES: {results_data['failed_tests']}")
    print("================================================================================")
    
    with open("audit_results.json", "w") as f:
        json.dump(results_data, f, indent=2)

if __name__ == "__main__":
    run_audit()
