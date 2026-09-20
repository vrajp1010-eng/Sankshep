import sys
import io
from fastapi.testclient import TestClient
from unittest.mock import patch
from main import app

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
client = TestClient(app)

def run_tests():
    print("==========================================")
    print("Sankshep.ai Full-Stack Verification Suite")
    print("==========================================")

    # 1. /status
    res = client.get("/status")
    assert res.status_code == 200
    data = res.json()
    assert data.get("name") == "Sankshep.ai"
    print(f"[PASS] Platform Status: {data.get('name')} | Engine: {data.get('engine')} ({data.get('model')})")

    # 2. /providers — only Gemini should be listed
    res = client.get("/providers")
    assert res.status_code == 200
    pdata = res.json().get("providers", [])
    assert len(pdata) == 1
    assert pdata[0]["id"] == "gemini"
    print(f"[PASS] Provider Registry: {len(pdata)} provider ({pdata[0]['label']})")

    # 3. /analytics & /history
    res = client.get("/analytics")
    assert res.status_code == 200
    h_res = client.get("/history")
    assert h_res.status_code == 200
    print(f"[PASS] Telemetry & History API: {len(h_res.json().get('history', []))} records available")

    # 4. /transform (Single mode streaming — Gemini mock)
    class MockStreamChain:
        def stream(self, vars):
            yield "# Sankshep.ai Summary\n\n"
            yield "- Bullet point 1\n"
            yield "- Bullet point 2\n"

    with patch("main.get_chain", return_value=MockStreamChain()), \
         patch("main.validate_provider_id", return_value="gemini"):
        payload = {
            "text": "Sankshep.ai is an intelligent content engine that transforms long documents into multi-platform formats.",
            "transformation_type": "summary",
            "provider": "gemini",
            "tone": "Professional"
        }
        res = client.post("/transform", json=payload)
        assert res.status_code == 200
        assert len(res.text) > 20
        print(f"[PASS] Streaming Transformation (Gemini): Received {len(res.text)} chars")

    # 5. /transform with an invalid provider -> 400
    res = client.post("/transform", json={
        "text": "Hello world",
        "transformation_type": "summary",
        "provider": "groq"
    })
    assert res.status_code == 400
    print(f"[PASS] Invalid provider 'groq' correctly rejected with 400: {res.json().get('detail')}")

    # 6. /export/pptx
    pptx_sample = """Slide 1: Introduction to Sankshep.ai\n- Gemini-powered AI\n- Real-time streaming\n\nSlide 2: Key Capabilities\n- 13+ Output Formats\n- Fast Intelligent Transformation"""
    res = client.post("/export/pptx", json={"slide_text": pptx_sample})
    assert res.status_code == 200
    assert len(res.content) > 1000
    print(f"[PASS] PowerPoint Export: Generated valid .pptx ({len(res.content)} bytes)")

    print("==========================================")
    print("All Sankshep.ai Full-Stack Tests Passed!")
    print("==========================================")

if __name__ == "__main__":
    run_tests()
