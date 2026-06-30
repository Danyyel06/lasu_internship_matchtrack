import requests

url = "http://localhost:8000/api/v1/auth/login"
payload = {
    "email": "admin@lasu.edu.ng",
    "password": "password123"
}

response = requests.post(url, json=payload)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
