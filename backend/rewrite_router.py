import os

filepath = "c:/Users/User/lasu-internship-platform/backend/app/api/v1/router.py"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

new_content = content.replace(
    "from app.api.v1.endpoints import auth, job_families",
    "from app.api.v1.endpoints import auth, job_families, ws"
)

new_content = new_content.replace(
    "api_router.include_router(dev.router, prefix=\"/dev\", tags=[\"Development\"])",
    "api_router.include_router(dev.router, prefix=\"/dev\", tags=[\"Development\"])\napi_router.include_router(ws.router, prefix=\"/ws\", tags=[\"WebSockets\"])"
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Rewritten router.py")
