import os

def replace_in_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    new_content = content.replace("gemini-2.5-flash", "gemini-3.5-flash-lite")
    new_content = new_content.replace("gemini-2.5-pro", "gemini-3.5-flash-lite")
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

replace_in_file('server.ts')

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            filepath = os.path.join(root, file)
            replace_in_file(filepath)

