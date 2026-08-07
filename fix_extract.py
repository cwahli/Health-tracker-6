import re

with open('src/components/LogChat.tsx', 'r') as f:
    content = f.read()

content = content.replace('["\'](?:scoutScratchpad|dietitianScratchpad|scratchpad)["\']', '["\'](?:scoutScratchpad|dietitianScratchpad|scratchpad|_internalReasoning)["\']')

with open('src/components/LogChat.tsx', 'w') as f:
    f.write(content)

