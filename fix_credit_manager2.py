import re

with open('src/utils/creditManager.ts', 'r') as f:
    content = f.read()

content = content.replace("const isFlashLite = modelId === 'gemini-3.5-flash-lite' || modelId === 'gemini-3.5-flash-lite' || modelId === 'gemini-3.5-flash-lite' || modelId.toLowerCase().includes('flash-lite');", "const isFlashLite = modelId === 'gemini-3.5-flash-lite' || modelId.toLowerCase().includes('flash-lite');")

with open('src/utils/creditManager.ts', 'w') as f:
    f.write(content)
