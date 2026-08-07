import re

with open('server.ts', 'r') as f:
    content = f.read()

# For rawParsed in callAndParseFoodAnalysis
content = content.replace('rawParsed = validateOrFallback(RouteAgentSchema, rawParsed, cleanJson, "RouteAgent", { itemsBreakdown: [] });',
                          'rawParsed = validateOrFallback(RouteAgentSchema, rawParsed, cleanJson, "RouteAgent", { itemsBreakdown: [] });\n        if (rawParsed._internalReasoning && !rawParsed.scratchpad) { rawParsed.scratchpad = rawParsed._internalReasoning; }')

# For parsedData in the dietitian
content = content.replace('parsedData.agentPrompt = `System Instruction:\\nYou are an evidence-based, pragmatic health coach',
                          'if (parsedData._internalReasoning && !parsedData.scratchpad) { parsedData.scratchpad = parsedData._internalReasoning; }\n    parsedData.agentPrompt = `System Instruction:\\nYou are an evidence-based, pragmatic health coach')

# For vision scout (this one is parsed in server.ts around line 2154)
content = content.replace('const parsed = JSON.parse(finalJson);', 'const parsed = JSON.parse(finalJson);\n        if (parsed._internalReasoning && !parsed.scratchpad) { parsed.scratchpad = parsed._internalReasoning; }')
with open('server.ts', 'w') as f:
    f.write(content)
