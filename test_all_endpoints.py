import json
import urllib.request
import urllib.error
import sys
import time

# Force unbuffered stdout
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(line_buffering=True)

BASE_URL = "http://127.0.0.1:3001"

def login():
    url = f"{BASE_URL}/api/auth/login"
    payload = json.dumps({"email": "admin@example.com", "password": "password123"}).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            token = None
            if isinstance(data, dict):
                if "accessToken" in data:
                    token = data["accessToken"]
                elif "token" in data:
                    token = data["token"]
                elif "data" in data and isinstance(data["data"], dict):
                    token = data["data"].get("accessToken") or data["data"].get("token")
            print(f"[LOGIN SUCCESS] Status: {resp.status}, Token acquired: {'Yes' if token is not None else 'No'}", flush=True)
            return token
    except urllib.error.HTTPError as e:
        print(f"[LOGIN FAILED] HTTP Status: {e.code}, Reason: {e.reason}", flush=True)
        body = e.read().decode('utf-8', errors='ignore')
        print(f"Response: {body}", flush=True)
        return None
    except Exception as e:
        print(f"[LOGIN FAILED] Error: {e}", flush=True)
        return None

def test_endpoint(token, method, path, payload=None, timeout=180):
    url = f"{BASE_URL}{path}"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    data_bytes = None
    if payload is not None:
        headers["Content-Type"] = "application/json"
        data_bytes = json.dumps(payload).encode('utf-8')

    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    
    start_time = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            elapsed = time.time() - start_time
            status = resp.status
            raw_body = resp.read().decode('utf-8')
            valid_data = False
            parsed_data = None
            if raw_body:
                try:
                    parsed_data = json.loads(raw_body)
                    valid_data = True
                except json.JSONDecodeError:
                    valid_data = len(raw_body.strip()) > 0
            else:
                valid_data = (status in (200, 201, 204))

            is_pass = (200 <= status < 300) and valid_data
            result_str = "PASS" if is_pass else "FAIL"
            print(f"[{result_str}] {method} {path} - Status: {status} | Valid Data: {valid_data} | Time: {elapsed:.2f}s", flush=True)
            return {
                "method": method,
                "path": path,
                "status": status,
                "pass": is_pass,
                "valid_data": valid_data,
                "elapsed": elapsed,
                "data_sample": str(parsed_data)[:100] if parsed_data is not None else raw_body[:100]
            }
    except urllib.error.HTTPError as e:
        elapsed = time.time() - start_time
        body = e.read().decode('utf-8', errors='ignore')
        valid_data = False
        if body:
            try:
                json.loads(body)
                valid_data = True
            except:
                pass
        print(f"[FAIL] {method} {path} - Status: {e.code} | Error: {e.reason} | Time: {elapsed:.2f}s", flush=True)
        return {
            "method": method,
            "path": path,
            "status": e.code,
            "pass": False,
            "valid_data": valid_data,
            "elapsed": elapsed,
            "error": body[:200]
        }
    except Exception as e:
        elapsed = time.time() - start_time
        print(f"[FAIL] {method} {path} - Error: {e} | Time: {elapsed:.2f}s", flush=True)
        return {
            "method": method,
            "path": path,
            "status": 0,
            "pass": False,
            "valid_data": False,
            "elapsed": elapsed,
            "error": str(e)
        }

def main():
    token = login()
    if not token:
        print("Could not obtain token. Aborting test.", flush=True)
        sys.exit(1)

    endpoints = [
        ("GET", "/api/v1/tasks", None),
        ("GET", "/api/v1/resources", None),
        ("GET", "/api/v1/metrics", None),
        ("GET", "/api/v1/fog/info", None),
        ("GET", "/api/v1/fog/nodes", None),
        ("GET", "/api/v1/fog/devices", None),
        ("GET", "/api/v1/fog/tasks", None),
        ("GET", "/api/v1/chaos/experiments", None),
        ("GET", "/api/v1/devices", None),
        ("GET", "/api/v1/users", None),
        ("GET", "/api/v1/ml/models", None),
        ("GET", "/api/v1/chat/rooms", None),
        ("GET", "/api/v1/mail/inbox", None),
        ("GET", "/api/v1/reports", None),
        ("POST", "/api/v1/chaos/start", {"service":"redis","type":"latency","value":200}),
        ("POST", "/api/v1/chaos/stop-all", {}),
        ("POST", "/api/v1/fog/schedule", {"algorithm":"hh"}),
        ("POST", "/api/v1/schedule", {"algorithm":"round_robin"}),
        ("GET", "/api/v1/calendar/events", None),
        ("GET", "/api/v1/fog/metrics", None),
    ]

    results = []
    print("\n--- Running API Endpoint Tests ---", flush=True)
    for method, path, payload in endpoints:
        res = test_endpoint(token, method, path, payload, timeout=180)
        results.append(res)

    print("\n--- Test Summary ---", flush=True)
    passed = sum(1 for r in results if r["pass"])
    total = len(results)
    print(f"Passed: {passed}/{total}", flush=True)

if __name__ == "__main__":
    main()
