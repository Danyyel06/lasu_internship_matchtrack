import json
import os

transcript_path = r"C:\Users\User\.gemini\antigravity\brain\0a7f5de2-34c7-4f67-b5af-b9060171352b\.system_generated\logs\transcript.jsonl"

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('source') == 'MODEL' and 'content' in data:
                content = data['content']
                if '6.' in content and '1.' in content and '2.' in content:
                    print(f"--- STEP {data.get('step_index')} ---")
                    print(content[:500] + "...\n")
        except:
            pass
