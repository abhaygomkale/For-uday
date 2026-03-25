import uvicorn
from main import app
import threading
import time
import requests

def run_server():
    uvicorn.run(app, host="127.0.0.1", port=8001)

threading.Thread(target=run_server, daemon=True).start()
time.sleep(3)

print("DEBUG GROQ:", requests.get("http://127.0.0.1:8001/api/debug_groq_key").text)
print("CHAT 500:", requests.post("http://127.0.0.1:8001/chat", json={"message":"test","session_id":"t"}).text)
