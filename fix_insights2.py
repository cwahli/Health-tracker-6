with open('src/components/InsightsTab.tsx', 'r') as f:
    content = f.read()

content = content.replace('      )}\n        <BiomarkerDictionaryModal', '      )}\n      {showDictionaryModal && (\n        <BiomarkerDictionaryModal')

with open('src/components/InsightsTab.tsx', 'w') as f:
    f.write(content)
