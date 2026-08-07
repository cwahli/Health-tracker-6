with open('src/components/InsightsTab.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.startswith('      {showDictionaryModal && (      {showCustomDataReviewBatchModal && ('):
        new_lines.append('      {showCustomDataReviewBatchModal && (\n')
    else:
        new_lines.append(line)

with open('src/components/InsightsTab.tsx', 'w') as f:
    f.writelines(new_lines)
