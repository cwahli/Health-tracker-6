import re

with open('src/utils/creditManager.ts', 'r') as f:
    content = f.read()

content = content.replace("'gemini-2.5-flash': 1,\n  'gemini-2.5-flash': 1,\n  'gemini-2.5-flash': 1,", "'gemini-2.5-flash': 1,")

with open('src/utils/creditManager.ts', 'w') as f:
    f.write(content)

