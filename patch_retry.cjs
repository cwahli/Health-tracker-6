const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `  } catch (err: any) {
    addDebugLog(\`[UnifiedLLM] First generation attempt failed: \${err.message || err}. Stack: \${err.stack}\`);

    if (googleSearch) {
      addDebugLog(\`[UnifiedLLM] Retrying without Google Search Grounding...\`);`;

const repl = `  } catch (err: any) {
    addDebugLog(\`[UnifiedLLM] First generation attempt failed: \${err.message || err}. Stack: \${err.stack}\`);

    const isAbort = err.name === 'AbortError' || (err.message && err.message.toLowerCase().includes('abort'));
    const isQuota = err.message && (err.message.includes('429') || err.message.includes('quota') || err.message.toLowerCase().includes('resource_exhausted'));
    
    if (isAbort || isQuota) {
      addDebugLog(\`[UnifiedLLM] Fatal error (\${isAbort ? 'Timeout' : 'Quota'}) detected. Throwing immediately without retry.\`);
      throw err;
    }

    if (googleSearch) {
      addDebugLog(\`[UnifiedLLM] Retrying without Google Search Grounding...\`);`;

code = code.replace(target, repl);
fs.writeFileSync('server.ts', code);
console.log("Done");
