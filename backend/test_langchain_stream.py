import os
import sys
import io
from dotenv import load_dotenv
from chains import get_chain

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
load_dotenv()

def test_stream():
    chain = get_chain("summary")
    try:
        for chunk in chain.stream({"text": "Sankshep.ai turns long form content into posts and slides."}):
            print(chunk, end="", flush=True)
        print("\n\n✓ Streaming completed successfully.")
    except Exception as e:
        print(f"\n[Stream Test Error]: {e}")

if __name__ == "__main__":
    test_stream()
