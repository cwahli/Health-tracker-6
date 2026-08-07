const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target1 = `    } catch (firstErr: any) {
      addDebugLog(\`[Standardize Units Agent] First attempt failed: \${firstErr.message}. Retrying once in 500ms...\`, explicitSessionId);
      await new Promise(resolve => setTimeout(resolve, 500));
      textOutput = await makeStandardizationCall();
    }`;

const repl1 = `    } catch (firstErr: any) {
      const isAbort = firstErr.name === 'AbortError' || (firstErr.message && firstErr.message.toLowerCase().includes('abort'));
      const isQuota = firstErr.message && (firstErr.message.includes('429') || firstErr.message.includes('quota') || firstErr.message.toLowerCase().includes('resource_exhausted'));
      if (isAbort || isQuota) throw firstErr;
      addDebugLog(\`[Standardize Units Agent] First attempt failed: \${firstErr.message}. Retrying once in 500ms...\`, explicitSessionId);
      await new Promise(resolve => setTimeout(resolve, 500));
      textOutput = await makeStandardizationCall();
    }`;

code = code.replace(target1, repl1);

const target2 = `    } catch (firstErr: any) {
      addDebugLog(\`[Name Consolidation Agent] First attempt failed: \${firstErr.message}. Retrying once in 500ms...\`, explicitSessionId);
      await new Promise(resolve => setTimeout(resolve, 500));
      textOutput = await makeConsolidationCall();
    }`;

const repl2 = `    } catch (firstErr: any) {
      const isAbort = firstErr.name === 'AbortError' || (firstErr.message && firstErr.message.toLowerCase().includes('abort'));
      const isQuota = firstErr.message && (firstErr.message.includes('429') || firstErr.message.includes('quota') || firstErr.message.toLowerCase().includes('resource_exhausted'));
      if (isAbort || isQuota) throw firstErr;
      addDebugLog(\`[Name Consolidation Agent] First attempt failed: \${firstErr.message}. Retrying once in 500ms...\`, explicitSessionId);
      await new Promise(resolve => setTimeout(resolve, 500));
      textOutput = await makeConsolidationCall();
    }`;

code = code.replace(target2, repl2);

fs.writeFileSync('server.ts', code);
console.log("Done");
