import re

with open('server.ts', 'r') as f:
    code = f.read()

# Replace scout onStream
old_scout = """              onStream: (chunk: string, isThought?: boolean) => {
                if (isStream && hasSentHeaders) {
                  res.write(`data: ${JSON.stringify({ type: 'stream', chunk, stage: 'scout' })}\\n\\n`);
                  if (typeof (res as any).flush === 'function') (res as any).flush();
                }
              },"""

new_scout = """              onStream: (chunk: string, isThought?: boolean) => {
                if (isStream && hasSentHeaders) {
                  try {
                    res.write(`data: ${JSON.stringify({ type: 'stream', chunk, stage: 'scout' })}\\n\\n`);
                    if (typeof (res as any).flush === 'function') (res as any).flush();
                  } catch (e) {}
                }
              },"""

code = code.replace(old_scout, new_scout)

# Replace dietitian onStream
old_diet = """        callArgs.onStream = (chunk: string, isThought?: boolean) => {
          if (isThought) {
            res.write(`data: ${JSON.stringify({ type: 'stream', thought: chunk, stage: 'dietitian' })}\\n\\n`);
          } else {
            res.write(`data: ${JSON.stringify({ type: 'stream', chunk, stage: 'dietitian' })}\\n\\n`);
          }
          if (typeof (res as any).flush === 'function') (res as any).flush();
        };"""

new_diet = """        callArgs.onStream = (chunk: string, isThought?: boolean) => {
          try {
            if (isThought) {
              res.write(`data: ${JSON.stringify({ type: 'stream', thought: chunk, stage: 'dietitian' })}\\n\\n`);
            } else {
              res.write(`data: ${JSON.stringify({ type: 'stream', chunk, stage: 'dietitian' })}\\n\\n`);
            }
            if (typeof (res as any).flush === 'function') (res as any).flush();
          } catch (e) {}
        };"""

code = code.replace(old_diet, new_diet)

# Replace health baseline onStream
old_health = """      onStream: isStream ? (chunk: string, isThought?: boolean) => {
        if (isThought) {
          res.write(`data: ${JSON.stringify({ type: 'stream', thought: chunk, stage: 'dietitian' })}\\n\\n`);
        } else {
          res.write(`data: ${JSON.stringify({ type: 'stream', chunk, stage: 'dietitian' })}\\n\\n`);
        }
        if (typeof (res as any).flush === 'function') (res as any).flush();
      } : undefined,"""

new_health = """      onStream: isStream ? (chunk: string, isThought?: boolean) => {
        try {
          if (isThought) {
            res.write(`data: ${JSON.stringify({ type: 'stream', thought: chunk, stage: 'dietitian' })}\\n\\n`);
          } else {
            res.write(`data: ${JSON.stringify({ type: 'stream', chunk, stage: 'dietitian' })}\\n\\n`);
          }
          if (typeof (res as any).flush === 'function') (res as any).flush();
        } catch (e) {}
      } : undefined,"""

code = code.replace(old_health, new_health)

# Replace consolidate onStream
old_cons = """          onStream: isStream ? (chunk: string, isThought?: boolean) => {
            if (isThought) {
              res.write(`data: ${JSON.stringify({ thought: chunk })}\\n\\n`);
            } else {
              res.write(`data: ${JSON.stringify({ chunk })}\\n\\n`);
            }
            if (typeof (res as any).flush === 'function') (res as any).flush();
          } : undefined"""

new_cons = """          onStream: isStream ? (chunk: string, isThought?: boolean) => {
            try {
              if (isThought) {
                res.write(`data: ${JSON.stringify({ thought: chunk })}\\n\\n`);
              } else {
                res.write(`data: ${JSON.stringify({ chunk })}\\n\\n`);
              }
              if (typeof (res as any).flush === 'function') (res as any).flush();
            } catch (e) {}
          } : undefined"""

code = code.replace(old_cons, new_cons)

with open('server.ts', 'w') as f:
    f.write(code)

print("Done patching onStream handlers")
