import urllib.request
import json
import ssl

url = "http://127.0.0.1:8000/api/v1/auth/login"
data = json.dumps({
    "email": "stellaisokpehi21@student.lasu.edu.ng",
    "password": "Password123!" # I assume this might be the password or something generic, or it will just return 401
}).encode('utf-8')

req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

try:
    print("Sending request...")
    with urllib.request.urlopen(req, context=ctx, timeout=5) as response:
        result = response.read()
        print(f"Status: {response.status}")
        print("Response received.")
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(e.read().decode())
except urllib.error.URLError as e:
    print(f"URL Error: {e.reason}")
except Exception as e:
    print(f"Other Error: {e}")
