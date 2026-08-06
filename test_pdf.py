import urllib.request
import json

login_req = urllib.request.Request(
    'http://127.0.0.1:3001/api/v1/auth/login',
    data=json.dumps({"email": "admin@example.com", "password": "password123"}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
token = json.loads(urllib.request.urlopen(login_req).read().decode())['data']['accessToken']

try:
    pdf_req = urllib.request.Request(
        'http://127.0.0.1:3001/api/v1/reports/pdf/tasks',
        headers={'Authorization': f'Bearer {token}'}
    )
    resp = urllib.request.urlopen(pdf_req)
    data = resp.read()
    print("SUCCESS -> Status:", resp.status, "Length:", len(data), "Start:", data[:20])
except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code, e.read().decode())
except Exception as e:
    print("ERROR:", e)
