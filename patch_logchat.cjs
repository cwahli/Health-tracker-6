const fs = require('fs');
let code = fs.readFileSync('src/components/LogChat.tsx', 'utf8');

const targetJSX = `  if (!isOpen) return null;

  return (
    <div className={\`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex flex-col justify-end sm:justify-center animation-fade-in font-sans \${isFullscreen ? 'p-0' : 'p-0 sm:p-4'}\`}>`;

const replJSX = `  if (!isOpen) return null;

  return (
    <>
      {globalLiveStreamLogs.length > 0 && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-green-900 text-green-100 text-xs font-mono p-2 overflow-y-auto max-h-32 border-b-2 border-green-500 shadow-lg pointer-events-none">
          <div className="font-bold mb-1 text-green-300">=== LIVE UNFILTERED BACKEND STREAM CONNECTED ===</div>
          {globalLiveStreamLogs.map((log, i) => (
            <div key={i} className="whitespace-pre-wrap break-all opacity-90">{log}</div>
          ))}
        </div>
      )}
    <div className={\`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex flex-col justify-end sm:justify-center animation-fade-in font-sans \${isFullscreen ? 'p-0' : 'p-0 sm:p-4'}\`}>`;

code = code.replace(targetJSX, replJSX);

const targetEnd = `      />
    </div>
  );
}`;

const replEnd = `      />
    </div>
    </>
  );
}`;

code = code.replace(targetEnd, replEnd);
fs.writeFileSync('src/components/LogChat.tsx', code, 'utf8');
