import json
import urllib.request
import urllib.error
import time

BASE_URL = "http://127.0.0.1:3001"

def login():
    url = f"{BASE_URL}/api/auth/login"
    payload = json.dumps({"email": "admin@example.com", "password": "password123"}).encode('utf-8')
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        return data["data"]["accessToken"]

def test_fog_metrics_extended():
    token = login()
    url = f"{BASE_URL}/api/v1/fog/metrics"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"}, method="GET")
    start = time.time()
    print("Testing GET /api/v1/fog/metrics with 180s timeout...", flush=True)
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            elapsed = time.time() - start
            body = resp.read().decode('utf-8')
            data = json.loads(body)
            valid = data.get("success") is True or "data" in data
            print(f"PASS - Status: {resp.status} | Valid Data: {valid} | Time: {elapsed:.2f}s", flush=True)
            return True
    except urllib.error.HTTPError as e:
        elapsed = time.time() - start
        print(f"FAIL - Status: {e.code} | Time: {elapsed:.2f}s", flush=True)
        return False
    except Exception as e:
        elapsed = time.time() - start
        print(f"FAIL - Error: {e} | Time: {elapsed:.2f}s", flush=True)
        return False

if __name__ == "__main__":
    test_fog_metrics_extended()
