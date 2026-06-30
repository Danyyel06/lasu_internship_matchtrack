import os
import sys

def search_file(path, word):
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        for i, line in enumerate(lines):
            if word.lower() in line.lower():
                print(f"{i+1}: {line.strip()}")

search_file(sys.argv[1], sys.argv[2])
