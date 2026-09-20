import sys
import io
import dotenv
from google import generativeai as genai

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
dotenv.load_dotenv()

import os
genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))

models_to_test = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
]

for m in models_to_test:
    try:
        model = genai.GenerativeModel(m)
        res = model.generate_content("Write 1 short sentence about AI.")
        print(f"[OK]  {m}: {res.text.strip()}")
    except Exception as e:
        print(f"[ERR] {m}: {e}")
