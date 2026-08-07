import re
with open('server.ts') as f:
    text = f.read()

for i, line in enumerate(text.split('\n')):
    if 'res.write(' in line:
        print(f"{i+1}: {line.strip()}")
