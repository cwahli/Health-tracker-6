import re

with open('src/components/LogChat.tsx', 'r') as f:
    code = f.read()

# target 1
target1 = r'let displayErr = err.message \|\| "An error occurred during processing.";\s*if \(isTimeout\) \{'
repl1 = '''let displayErr = err.message || "An error occurred during processing.";
      if (err.message && err.message.lower().includes("failed to fetch")) {
        displayErr = "Network error: Failed to reach the server. Please check your internet connection or verify that the server is running. (Original error: " + err.message + ")";
      } else if (err.message && err.message.toLowerCase() === "network error") {
        displayErr = "Network error: The browser failed to complete the request (CORS, offline, or server abruptly closed the connection).";
      }

      if (isTimeout) {'''
# Note: I'll use JS `.toLowerCase()` in the JS code instead of python's `.lower()` oops. Let's fix that.
repl1 = '''let displayErr = err.message || "An error occurred during processing.";
      if (err.message && err.message.toLowerCase().includes("failed to fetch")) {
        displayErr = "Network error: Failed to reach the server. Please check your internet connection or verify that the server is running. (Original error: " + err.message + ")";
      } else if (err.message && err.message.toLowerCase() === "network error") {
        displayErr = "Network error: The browser failed to complete the request (CORS, offline, or server abruptly closed the connection).";
      }
      if (isTimeout) {'''

code = re.sub(target1, repl1, code, count=1)

# target 2 (Retry Full Analysis)
target2 = r'handleSend\(lastUserMsg.content\);'
repl2 = r'handleSend({ text: lastUserMsg.content, imageUrls: lastUserMsg.imageUrls || (lastUserMsg.imageUrl ? [lastUserMsg.imageUrl] : []) });'
code = re.sub(target2, repl2, code)

# target 3 (Retry Analysis Scout complete)
target3 = r'text: lastUserMsg.content,\s*skipScout: true,'
repl3 = r'text: lastUserMsg.content,\n                                    imageUrls: lastUserMsg.imageUrls || (lastUserMsg.imageUrl ? [lastUserMsg.imageUrl] : []),\n                                    skipScout: true,'
code = re.sub(target3, repl3, code)

# target 4 (backend raw text error)
target4 = r'(\`Request failed \(\$\{response.status\}\). Please try again.\`);'
repl4 = r'\1.replace("again.", "again.\\n" + (rawText ? "Details: " + rawText.substring(0, 500) : ""));'
# Wait, replacing the template literal directly is better:
target4 = r'\`Request failed \(\$\{response.status\}\)\. Please try again\.\`\)'
repl4 = r'`Request failed (${response.status}). Please try again.\n${rawText ? \'Details: \' + rawText.substring(0, 500) : \'\'}`)'
code = re.sub(target4, repl4, code)

with open('src/components/LogChat.tsx', 'w') as f:
    f.write(code)
print("Done py")
