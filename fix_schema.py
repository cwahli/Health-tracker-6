import re

with open('server.ts', 'r') as f:
    content = f.read()

content = content.replace("scratchpad: { type: Type.STRING, description: \"Use this as a brief, lightweight scratchpad to support your thinking", "_internalReasoning: { type: Type.STRING, description: \"Use this as a brief, lightweight scratchpad to support your thinking")

with open('server.ts', 'w') as f:
    f.write(content)
