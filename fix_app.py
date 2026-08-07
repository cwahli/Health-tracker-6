import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Fix handleBatchConsolidate
content = re.sub(
    r'  const handleBatchConsolidate = async \(mapping: \{ \[key: string\]: string \}\) => \{\n    const targetGroups: \{ \[targetKey: string\]: string\[\] \} = \{\};\n    const updatedCustomBiomarkers = \{ \.\.\.\(profile\?\.customBiomarkers \|\| \{\}\) \};',
    r'  const handleBatchConsolidate = async (mapping: { [key: string]: string }) => {\n    const targetGroups: { [targetKey: string]: string[] } = {};\n    const updatedCustomBiomarkers = { ...(profile?.customBiomarkers || {}) };\n    const deletedCustomBiomarkerKeys = { ...(profile?.deletedCustomBiomarkerKeys || {}) };',
    content
)

content = re.sub(
    r'      sourceKeys\.forEach\(k => \{\n        delete updatedCustomBiomarkers\[k\];\n      \}\);',
    r'      sourceKeys.forEach(k => {\n        delete updatedCustomBiomarkers[k];\n        deletedCustomBiomarkerKeys[k] = Date.now();\n      });',
    content
)

content = re.sub(
    r'    const updatedProfile: UserProfile = \{\n      \.\.\.profile,\n      customBiomarkers: updatedCustomBiomarkers\n    \};',
    r'    const updatedProfile: UserProfile = {\n      ...profile,\n      customBiomarkers: updatedCustomBiomarkers,\n      deletedCustomBiomarkerKeys\n    };',
    content
)

# Fix handleBatchCombineBiomarkers
content = re.sub(
    r'  const handleBatchCombineBiomarkers = async \(\n    combinations: \{\n      targetKey: string;\n      targetDef: any;\n      mergedLogs: \{ date: string; value: number \| string; originalLogId\?: string \}\[\];\n      sourceKeysToDelete: string\[\];\n    \}\[\]\n  \) => \{\n    let updatedCustomBiomarkers = \{ \.\.\.\(profile\?\.customBiomarkers \|\| \{\}\) \};\n    let updatedHistory = \[\.\.\.biomarkerHistory\];',
    r'  const handleBatchCombineBiomarkers = async (\n    combinations: {\n      targetKey: string;\n      targetDef: any;\n      mergedLogs: { date: string; value: number | string; originalLogId?: string }[];\n      sourceKeysToDelete: string[];\n    }[]\n  ) => {\n    let updatedCustomBiomarkers = { ...(profile?.customBiomarkers || {}) };\n    let deletedCustomBiomarkerKeys = { ...(profile?.deletedCustomBiomarkerKeys || {}) };\n    let updatedHistory = [...biomarkerHistory];',
    content
)

content = re.sub(
    r'            sourceKeysToDelete\.forEach\(k => \{\n        delete updatedCustomBiomarkers\[k\];\n      \}\);',
    r'            sourceKeysToDelete.forEach(k => {\n        delete updatedCustomBiomarkers[k];\n        deletedCustomBiomarkerKeys[k] = Date.now();\n      });',
    content
)

# Fix handleCombineBiomarkers
content = re.sub(
    r'  const handleCombineBiomarkers = async \(\n    targetKey: string,\n    targetDef: any,\n    mergedLogs: \{ date: string; value: number \| string; originalLogId\?: string \}\[\],\n    sourceKeysToDelete: string\[\]\n  \) => \{\n    // 1. Remove old custom definitions, and add the new one if custom\n    const updatedCustomBiomarkers = \{ \.\.\.\(profile\?\.customBiomarkers \|\| \{\}\) \};\n    sourceKeysToDelete\.forEach\(k => \{\n      delete updatedCustomBiomarkers\[k\];\n    \}\);',
    r'  const handleCombineBiomarkers = async (\n    targetKey: string,\n    targetDef: any,\n    mergedLogs: { date: string; value: number | string; originalLogId?: string }[],\n    sourceKeysToDelete: string[]\n  ) => {\n    // 1. Remove old custom definitions, and add the new one if custom\n    const updatedCustomBiomarkers = { ...(profile?.customBiomarkers || {}) };\n    const deletedCustomBiomarkerKeys = { ...(profile?.deletedCustomBiomarkerKeys || {}) };\n    sourceKeysToDelete.forEach(k => {\n      delete updatedCustomBiomarkers[k];\n      deletedCustomBiomarkerKeys[k] = Date.now();\n    });',
    content
)


with open('src/App.tsx', 'w') as f:
    f.write(content)

