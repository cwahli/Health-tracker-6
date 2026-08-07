const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Fix 1: Dietitian JSON Parse Error retry
const target1 = `    } catch (firstErr: any) {
      addDebugLog(\`[JSON Parse Error] First attempt failed: \${firstErr.message}. Retrying once...\`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      ({ textOutput, rawParsed } = await callAndParseFoodAnalysis(llmCallArgs));
    }`;

const repl1 = `    } catch (firstErr: any) {
      const isAbort = firstErr.name === 'AbortError' || (firstErr.message && firstErr.message.toLowerCase().includes('abort'));
      const isQuota = firstErr.message && (firstErr.message.includes('429') || firstErr.message.includes('quota') || firstErr.message.toLowerCase().includes('resource_exhausted'));
      
      if (isAbort || isQuota) {
        addDebugLog(\`[Dietitian] Fatal error (\${isAbort ? 'Timeout' : 'Quota'}) detected. Throwing immediately without retry.\`);
        throw firstErr;
      }
      addDebugLog(\`[JSON Parse Error] First attempt failed: \${firstErr.message}. Retrying once...\`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      ({ textOutput, rawParsed } = await callAndParseFoodAnalysis(llmCallArgs));
    }`;

code = code.replace(target1, repl1);

fs.writeFileSync('server.ts', code);
console.log("Done");
