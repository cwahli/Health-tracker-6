import re

with open('src/components/BiomarkerDictionaryModal.tsx', 'r') as f:
    content = f.read()

target = r'''              \{/\* Chat Input \*/\}
              <div className="p-3 bg-theme-bg-card border-t border-theme-border">'''

replacement = r'''              {/* Chat Input */}
              <div className="p-3 bg-theme-bg-card border-t border-theme-border flex flex-col gap-3">
                {consolidationMessages.length > 0 && selectedKeys.length > 0 && (
                  <div className="text-xs text-theme-text-secondary text-left">
                    <div className="font-bold text-theme-neutral mb-1.5 flex items-center justify-between">
                      <span>Biomarkers to Consolidate ({selectedKeys.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {selectedKeys.map(k => {
                        const def = profile.customBiomarkers?.[k] || biomarkerDefinitions.find((b: any) => b.key === k);
                        return (
                          <span key={k} className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-theme-border text-theme-neutral px-2 py-0.5 rounded-md text-[10px] leading-tight">
                            {def?.name || k}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}'''

content = re.sub(target, replacement, content)

with open('src/components/BiomarkerDictionaryModal.tsx', 'w') as f:
    f.write(content)

