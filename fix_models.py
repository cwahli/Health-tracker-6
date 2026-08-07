import re

with open('server.ts', 'r') as f:
    content = f.read()

content = content.replace("gemini-3.5-flash-lite", "gemini-2.5-flash")
content = content.replace("gemini-3.5-flash", "gemini-2.5-flash")
content = content.replace("gemini-3.1-pro", "gemini-2.5-pro")
content = content.replace("gemini-3.1-flash-lite", "gemini-2.5-flash")
content = content.replace("gemini-3.1-flash", "gemini-2.5-flash")
content = content.replace("antigravity", "gemini-2.5-pro")

with open('server.ts', 'w') as f:
    f.write(content)
