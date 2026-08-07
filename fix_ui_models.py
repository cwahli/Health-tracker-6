import re

def replace_in_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    content = content.replace("gemini-3.5-flash-lite", "gemini-2.5-flash")
    content = content.replace("gemini-3.5-flash", "gemini-2.5-flash")
    content = content.replace("gemini-3.1-pro", "gemini-2.5-pro")
    content = content.replace("gemini-3.1-flash-lite", "gemini-2.5-flash")
    content = content.replace("gemini-3.1-flash", "gemini-2.5-flash")
    content = content.replace("gemini-2.5-flash-lite", "gemini-2.5-flash")

    with open(filepath, 'w') as f:
        f.write(content)

replace_in_file('src/components/BiomarkerDictionaryModal.tsx')
replace_in_file('src/components/LogChat.tsx')

