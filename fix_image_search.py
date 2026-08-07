import re

with open('server.ts', 'r') as f:
    content = f.read()

content = content.replace('model: "gemini-3.5-flash-lite",', 'model: "gemini-2.5-flash",')

with open('server.ts', 'w') as f:
    f.write(content)
