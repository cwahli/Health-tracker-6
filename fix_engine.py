import re

with open('server.ts', 'r') as f:
    content = f.read()

# Replace all instances of `modelId: engine ||` or `modelId: engine,` or `modelId: engine\n` with `modelId: (typeof engine === 'object' ? engine.name : engine) ||`
content = re.sub(r'modelId:\s*engine\s*\|\|', r"modelId: (typeof engine === 'object' ? engine?.name || engine?.model : engine) ||", content)
content = re.sub(r'modelId:\s*engine,', r"modelId: (typeof engine === 'object' ? engine?.name || engine?.model : engine),", content)

with open('server.ts', 'w') as f:
    f.write(content)


# Also fix `const modelId = engine ||`
with open('server.ts', 'r') as f:
    content = f.read()

content = re.sub(r'const modelId = engine\s*\|\|', r"const modelId = (typeof engine === 'object' ? engine?.name || engine?.model : engine) ||", content)

with open('server.ts', 'w') as f:
    f.write(content)

# Also fix `const engine = modelId ||` just in case
with open('server.ts', 'r') as f:
    content = f.read()

content = re.sub(r'const engine = modelId\s*\|\|', r"const engine = (typeof modelId === 'object' ? modelId?.name || modelId?.model : modelId) ||", content)

with open('server.ts', 'w') as f:
    f.write(content)
