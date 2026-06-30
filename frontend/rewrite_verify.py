import re

filepath = r"C:\Users\User\lasu-internship-platform\frontend\src\pages\super-admin\VerifyAccounts.tsx"

with open(filepath, 'r') as f:
    content = f.read()

# Replace the dummy data with state
content = re.sub(
    r"const companies = \[.*?\];",
    "const [companies, setCompanies] = useState<any[]>([]);",
    content,
    flags=re.DOTALL
)

content = re.sub(
    r"const hods = \[.*?\];",
    "const [hods, setHods] = useState<any[]>([]);",
    content,
    flags=re.DOTALL
)

# Add useEffect to fetch data
use_effect = """
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const [compRes, hodRes] = await Promise.all([
          axios.get('http://localhost:8000/api/v1/admin/pending-companies', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:8000/api/v1/admin/pending-hods', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setCompanies(compRes.data);
        setHods(hodRes.data);
      } catch (error) {
        console.error("Failed to fetch pending accounts", error);
      }
    };
    fetchPending();
  }, []);
"""

content = content.replace("const [rejectReason, setRejectReason] = useState('');", "const [rejectReason, setRejectReason] = useState('');\n" + use_effect)

# Update imports
content = content.replace("import { useState } from 'react';", "import { useState, useEffect } from 'react';")

with open(filepath, 'w') as f:
    f.write(content)

print("Rewrote VerifyAccounts.tsx")
