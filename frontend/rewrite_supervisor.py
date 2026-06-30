import os

filepath = "c:/Users/User/lasu-internship-platform/frontend/src/pages/supervisor/PulseReview.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "const [feedback, setFeedback] = useState<Record<string, { action: 'endorse' | 'flag' | null, tip: string }>>({});",
    "const [feedback, setFeedback] = useState<Record<number, { action: 'endorse' | 'flag' | null, tip: string }>>({});"
)

content = content.replace(
    """  const handleAction = (evidenceUrl: string, action: 'endorse' | 'flag') => {
    setFeedback(prev => {
      const existing = prev[evidenceUrl] || { action: null, tip: '' };
      return {
        ...prev,
        [evidenceUrl]: { ...existing, action: existing.action === action ? null : action }
      };
    });
  };""",
    """  const handleAction = (index: number, action: 'endorse' | 'flag') => {
    setFeedback(prev => {
      const existing = prev[index] || { action: null, tip: '' };
      return {
        ...prev,
        [index]: { ...existing, action: existing.action === action ? null : action }
      };
    });
  };"""
)

content = content.replace(
    """  const handleTipChange = (evidenceUrl: string, tip: string) => {
    if (tip.length <= 200) {
      setFeedback(prev => {
        const existing = prev[evidenceUrl] || { action: null, tip: '' };
        return {
          ...prev,
          [evidenceUrl]: { ...existing, tip }
        };
      });
    }
  };""",
    """  const handleTipChange = (index: number, tip: string) => {
    if (tip.length <= 200) {
      setFeedback(prev => {
        const existing = prev[index] || { action: null, tip: '' };
        return {
          ...prev,
          [index]: { ...existing, tip }
        };
      });
    }
  };"""
)

content = content.replace(
    """        endorsements: (latestPulse.pin_links || []).map((url: string) => {
          const fb = feedback[url] || { action: 'endorse', tip: '' };""",
    """        endorsements: (latestPulse.pin_links || []).map((url: string, index: number) => {
          const fb = feedback[index] || { action: 'endorse', tip: '' };"""
)

content = content.replace(
    "const evFeedback = feedback[url] || { action: null, tip: '' };",
    "const evFeedback = feedback[index] || { action: null, tip: '' };"
)

content = content.replace(
    "onClick={() => handleAction(url, 'endorse')}",
    "onClick={() => handleAction(index, 'endorse')}"
)

content = content.replace(
    "onClick={() => handleAction(url, 'flag')}",
    "onClick={() => handleAction(index, 'flag')}"
)

content = content.replace(
    "onChange={(e) => handleTipChange(url, e.target.value)}",
    "onChange={(e) => handleTipChange(index, e.target.value)}"
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed PulseReview feedback bug")
