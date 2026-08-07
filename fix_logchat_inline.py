import re

with open('src/components/LogChat.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'const scoutMatch = accumulatedByStage.scout.match(/"scratchpad"\\s*:\\s*"([^]*?)("|$)/); const dietMatch = accumulatedByStage.dietitian.match(/"scratchpad"\\s*:\\s*"([^]*?)("|$)/);',
    'const scoutMatch = accumulatedByStage.scout.match(/"(?:scratchpad|_internalReasoning)"\\s*:\\s*"([^]*?)("|$)/); const dietMatch = accumulatedByStage.dietitian.match(/"(?:scratchpad|_internalReasoning)"\\s*:\\s*"([^]*?)("|$)/);'
)

with open('src/components/LogChat.tsx', 'w') as f:
    f.write(content)
