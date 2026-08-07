import fs from 'fs';
let code = fs.readFileSync('src/components/ReviewBiomarkerModal.tsx', 'utf-8');

code = code.replace(
  /return \(\s*<UniversalModal[\s\S]*?>\s*<div className="flex-1 bg-theme-bg-card rounded-none flex flex-col overflow-hidden w-full h-full relative border-none">/,
  `return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none font-sans">
      <div className={\`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out pointer-events-auto \${isOpen ? 'opacity-100' : 'opacity-0'}\`} onClick={onClose} />
      <div className={\`fixed inset-y-0 right-0 z-[100] w-full sm:w-[500px] shadow-2xl flex flex-col bg-theme-bg-card border-l border-theme-border transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] \${isOpen ? 'translate-x-0' : 'translate-x-full'} pointer-events-auto\`}>`
);

code = code.replace(
  /<\/UniversalModal>/,
  `      </div>\n    </div>`
);

fs.writeFileSync('src/components/ReviewBiomarkerModal.tsx', code);
