import re

with open('server.ts', 'r') as f:
    content = f.read()

# Replace all instances of `modelId: engine ||` or `modelId: engine,` or `modelId: engine\n` with `modelId: (typeof engine === 'object' ? engine.name : engine) ||`
content = re.sub(r'modelId:\s*engine\s*\n', r"modelId: (typeof engine === 'object' ? engine?.name || engine?.model : engine),\n", content)

with open('server.ts', 'w') as f:
    f.write(content)

