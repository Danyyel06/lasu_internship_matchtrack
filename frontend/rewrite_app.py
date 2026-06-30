import os

filepath = "c:/Users/User/lasu-internship-platform/frontend/src/App.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

if "import { WebSocketProvider }" not in content:
    content = "import { WebSocketProvider } from './components/WebSocketProvider';\n" + content
    
    # We need to wrap the Router inside WebSocketProvider, but because WebSocketProvider needs auth, 
    # it's best placed inside the Router so it can access useNavigate if needed, but here it's fine 
    # outside or inside. Wait, WebSocketProvider uses localStorage directly. We can wrap the whole app.
    
    content = content.replace("<Router>", "<Router>\n      <WebSocketProvider>")
    content = content.replace("</Router>", "      </WebSocketProvider>\n    </Router>")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Rewritten App.tsx to include WebSocketProvider")
