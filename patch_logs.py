with open('server.ts', 'r') as f:
    text = f.read()

text = text.replace("try { res.write(`data: ${JSON.stringify({ chunk: msg + '\\n', stage: 'scout' })}\\n\\n`); } catch(e) {}", "try { res.write(`data: ${JSON.stringify({ thought: msg + '\\n', stage: 'scout' })}\\n\\n`); } catch(e) {}")
text = text.replace("try { res.write(`data: ${JSON.stringify({ chunk: msg + '\\n', stage: 'dietitian' })}\\n\\n`); } catch(e) {}", "try { res.write(`data: ${JSON.stringify({ thought: msg + '\\n', stage: 'dietitian' })}\\n\\n`); } catch(e) {}")

with open('server.ts', 'w') as f:
    f.write(text)
print("Patched!")
