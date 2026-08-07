import re

with open('src/components/LogChat.tsx', 'r') as f:
    code = f.read()

# Pattern 1
target1 = """      try {
        const logsRes = await fetch(`/api/gemini/debug-logs?sessionId=${currentReqId}`);
        if (logsRes.ok) { 
           const logsData = await safeParseResponse(logsRes, null);
           if (logsData && logsData.logs && logsData.logs.length > 0) {
              saveAgentRequestLog({ 
                 id: currentReqId, 
                 timestamp: new Date().toISOString(), 
                 summary: `[Medical Analyze] Batch ${nextBatch} (Continue)`, 
                 logs: logsData.logs 
              });
           } 
        }
      } catch (e) {
        console.warn("Could not save agent request logs", e);
      }"""

# Remove target1 from before response.ok check
code = code.replace(target1, "")

# Add debug log fetch after setMessages in batch continue block
target_insert1 = """      setMessages(prev => prev.map(m => {"""
repl_insert1 = """      try {
        fetch(`/api/gemini/debug-logs?sessionId=${currentReqId}`).then(async (logsRes) => {
          if (logsRes.ok) { 
             const logsData = await safeParseResponse(logsRes, null);
             if (logsData && logsData.logs && logsData.logs.length > 0) {
                saveAgentRequestLog({ 
                   id: currentReqId, 
                   timestamp: new Date().toISOString(), 
                   summary: `[Medical Analyze] Batch ${nextBatch} (Continue)`, 
                   logs: logsData.logs 
                });
             } 
          }
        }).catch(e => console.warn("Could not save agent request logs", e));
      } catch (e) {}

      setMessages(prev => prev.map(m => {"""

code = code.replace(target_insert1, repl_insert1, 1)

# Pattern 2
target2 = """      try {
        const logsRes = await fetch(`/api/gemini/debug-logs?sessionId=${currentReqId}`);
        if (logsRes.ok) { 
           const logsData = await safeParseResponse(logsRes, null);
           if (logsData && logsData.logs && logsData.logs.length > 0) {
              saveAgentRequestLog({ 
                 id: currentReqId, 
                 timestamp: new Date().toISOString(), 
                 summary: `[Medical Analyze] Processing Step: ${step}`, 
                 logs: logsData.logs 
              });
           } 
        }
      } catch (e) {
        console.warn("Could not save agent request logs", e);
      }"""

code = code.replace(target2, "")

target_insert2 = """      const assistantMsg: ChatMessage & { agentTypeStep?: string } = {"""
repl_insert2 = """      try {
        fetch(`/api/gemini/debug-logs?sessionId=${currentReqId}`).then(async (logsRes) => {
          if (logsRes.ok) { 
             const logsData = await safeParseResponse(logsRes, null);
             if (logsData && logsData.logs && logsData.logs.length > 0) {
                saveAgentRequestLog({ 
                   id: currentReqId, 
                   timestamp: new Date().toISOString(), 
                   summary: `[Medical Analyze] Processing Step: ${step}`, 
                   logs: logsData.logs 
                });
             } 
          }
        }).catch(e => console.warn("Could not save agent request logs", e));
      } catch (e) {}

      const assistantMsg: ChatMessage & { agentTypeStep?: string } = {"""

code = code.replace(target_insert2, repl_insert2, 1)

with open('src/components/LogChat.tsx', 'w') as f:
    f.write(code)

print("Done patching LogChat.tsx")
