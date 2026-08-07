import re

with open('server.ts', 'r') as f:
    content = f.read()

content = content.replace("Food nutrition agent - Dietitian (${engine || 'gemini-3.1-flash-lite'})", "Food nutrition agent - Dietitian (${(typeof engine === 'object' ? engine?.name || engine?.model : engine) || 'gemini-3.1-flash-lite'})")
content = content.replace("Food nutrition agent - Dietitian (${engine})", "Food nutrition agent - Dietitian (${(typeof engine === 'object' ? engine?.name || engine?.model : engine)})")

with open('server.ts', 'w') as f:
    f.write(content)

