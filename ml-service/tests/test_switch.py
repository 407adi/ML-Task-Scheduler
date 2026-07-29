import os
import requests
import pytest

BASE_URL = os.getenv("ML_SERVICE_URL", "http://localhost:5001")


def is_server_running():
    try:
        r = requests.get(f"{BASE_URL}/api/health", timeout=1)
        return r.status_code == 200
    except Exception:
        return False


@pytest.mark.skipif(not is_server_running(), reason="Live ML service is not running on localhost:5001")
def test_model_switching():
    print("1. Checking current model info...")
    resp = requests.get(f"{BASE_URL}/api/model/info")
    assert resp.status_code == 200
    initial_info = resp.json()
    initial_type = initial_info.get('modelType') or initial_info.get('model_type')

    target_model = "xgboost" if initial_type != "xgboost" else "random_forest"

    print(f"\n2. Switching to {target_model}...")
    headers = {"X-API-Key": os.getenv("ML_API_KEY", "test-api-key")}
    resp = requests.post(f"{BASE_URL}/api/model/switch", json={"modelType": target_model}, headers=headers)
    assert resp.status_code == 200

    print("\n3. Verifying info endpoint picks up the change...")
    resp = requests.get(f"{BASE_URL}/api/model/info")
    assert resp.status_code == 200
    new_info = resp.json()
    new_type = new_info.get('modelType') or new_info.get('model_type')
    assert new_type == target_model


if __name__ == "__main__":
    test_model_switching()
