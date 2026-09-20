import sys
import io
import requests

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def test_api():
    base_url = "http://127.0.0.1:8000"
    
    # 1. Status Check
    status = requests.get(f"{base_url}/status").json()
    print("[OK] Status Endpoint:", status)
    
    # 2. Analytics Check
    analytics = requests.get(f"{base_url}/analytics").json()
    print(f"✓ Analytics Endpoint: total_runs={analytics.get('total_runs')}, top_formats={len(analytics.get('top_formats', []))}")
    
    # 3. Transform Streaming Test
    payload = {
        "text": "Sankshep.ai is a high-speed intelligent multi-channel content engine.",
        "transformation_type": "summary",
        "tone": "Professional"
    }
    print("Testing /transform streaming...")
    response = requests.post(f"{base_url}/transform", json=payload, stream=True)
    assert response.status_code == 200, f"Failed with {response.status_code}"
    
    content = ""
    for chunk in response.iter_content(chunk_size=64):
        if chunk:
            content += chunk.decode("utf-8", errors="ignore")
            
    print(f"[OK] Streaming Transform Success! Received {len(content)} chars.")
    print("Preview snippet:")
    print(content[:150].replace('\n', ' '))

if __name__ == "__main__":
    test_api()
