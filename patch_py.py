import re

with open('server.ts', 'r') as f:
    code = f.read()

target = r'\} catch \(err: any\) \{\n\s*addDebugLog\(`\[UnifiedLLM\] First generation attempt failed.*?`\);\n\s*if \(googleSearch\) \{'
repl = r'''} catch (err: any) {
    addDebugLog(`[UnifiedLLM] First generation attempt failed: ${err.message || err}. Stack: ${err.stack}`);
    
    const isAbort = err.name === 'AbortError' || (err.message && err.message.toLowerCase().includes('abort'));
    const isQuota = err.message && (err.message.includes('429') || err.message.includes('quota') || err.message.toLowerCase().includes('resource_exhausted'));
    
    if (isAbort || isQuota) {
      addDebugLog(`[UnifiedLLM] Fatal error (${isAbort ? 'Timeout' : 'Quota'}) detected. Throwing immediately without retry.`);
      throw err;
    }

    if (googleSearch) {'''

code = re.sub(target, repl, code, count=1, flags=re.DOTALL)
with open('server.ts', 'w') as f:
    f.write(code)
print("Done")
