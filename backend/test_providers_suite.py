import sys
import io
from fastapi.testclient import TestClient
from unittest.mock import patch
from main import app
from providers import PROVIDER_REGISTRY

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
client = TestClient(app)

def test_all():
    print("==========================================")
    print("Testing Sankshep.ai — Gemini Provider")
    print("==========================================")

    # 1. /providers — only Gemini should be returned
    res = client.get("/providers")
    assert res.status_code == 200, f"/providers failed: {res.status_code}"
    providers_data = res.json().get("providers", [])
    assert len(providers_data) == 1, f"Expected 1 provider, got {len(providers_data)}"
    assert providers_data[0]["id"] == "gemini"
    print(f"[PASS] /providers returned {len(providers_data)} provider:")
    for p in providers_data:
        print(f"       - {p['id']}: label='{p['label']}', model='{p['model']}', available={p['available']}")
        assert "key" not in p and "api_key" not in p and "key_env" not in p

    # 2. /status
    res = client.get("/status")
    assert res.status_code == 200
    st = res.json()
    assert st.get("name") == "Sankshep.ai"
    print(f"[PASS] /status returned Sankshep.ai online, active engine: {st.get('engine')}")

    # 3. /transform with invalid provider -> 400
    for bad_provider in ["groq", "openai", "../etc/passwd", "__proto__", "sk-1234567890abcdef"]:
        res = client.post("/transform", json={
            "text": "Hello world",
            "transformation_type": "summary",
            "provider": bad_provider
        })
        assert res.status_code == 400, f"Expected 400 for '{bad_provider}', got {res.status_code}"
    print(f"[PASS] /transform invalid/removed providers correctly rejected with 400")

    # 4. /transform with Gemini mock (streaming)
    class MockStreamChain:
        def stream(self, vars):
            yield "Streamed "
            yield "chunk 1. "
            yield "Streamed chunk 2."

    with patch("main.validate_provider_id", return_value="gemini"), \
         patch("main.get_chain", return_value=MockStreamChain()):
        res = client.post("/transform", json={
            "text": "Source text for streaming",
            "transformation_type": "summary",
            "provider": "gemini"
        })
        assert res.status_code == 200
        assert res.text == "Streamed chunk 1. Streamed chunk 2."
        print(f"[PASS] /transform single stream (Gemini) returned: '{res.text}'")

    # 5. /transform/compare requires at least 2 providers -> 400 when only 1 given
    res = client.post("/transform/compare", json={
        "text": "Hello world",
        "transformation_type": "summary",
        "providers": ["gemini"]
    })
    assert res.status_code == 400
    print(f"[PASS] /transform/compare (< 2 providers) rejected with 400")

    print("==========================================")
    print("All Gemini Provider Tests Passed!")
    print("==========================================")

if __name__ == "__main__":
    test_all()
