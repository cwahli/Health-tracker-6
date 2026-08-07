const fs = require('fs');
const content = fs.readFileSync('src/components/chat-cards/FoodCard.tsx', 'utf8');

const startIndex = content.indexOf('const LiveBackendStreamViewer = ({ logs }: { logs: string }) => {');
const endIndex = content.indexOf('export const AgentThoughtBox = ({', startIndex);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find start or end index');
  process.exit(1);
}

const replacement = `const LiveBackendStreamViewer = ({ logs }: { logs: string }) => {
  const [activeTab, setActiveTab] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = React.useState(0);
  const [copied, setCopied] = React.useState(false);
  const matchRefs = React.useRef<(HTMLSpanElement | null)[]>([]);

  const ERROR_PATTERN = /error|exception|failed to/i;
  const WARNING_PATTERN = /warn|quota exceeded|429|timed out|retry/i;
  const TAG_PATTERN = /^\\[([a-zA-Z0-9_]+)\\](?:\\[(\\d+)\\])?\\s?(.*)$/;

  const lines = React.useMemo(() => (logs || '').split('\\n'), [logs]);

  // Parse the [logType][timestamp] tag embedded by the client SSE parser (Phase 3d).
  // Older/legacy lines without a tag still work — they just won't match a specific
  // agent tab or contribute to the elapsed-time calculation.
  const parsedLines = React.useMemo(() => {
    return lines.map((line) => {
      const match = line.match(TAG_PATTERN);
      if (match) {
        return {
          logType: match[1],
          timestamp: match[2] ? parseInt(match[2], 10) : undefined,
          display: match[3] || '',
        };
      }
      return { logType: undefined, timestamp: undefined, display: line };
    });
  }, [lines]);

  const dynamicTabs = React.useMemo(() => {
    const tabs = [{ id: 'all', label: 'All' }];
    const hasScout = parsedLines.some((l) => l.logType === 'scout_instruction' || l.logType === 'scout_answer');
    const hasDb = parsedLines.some((l) => l.logType === 'db_search' || l.logType === 'db_search_complete');
    const hasDietitian = parsedLines.some((l) => l.logType === 'dietitian_instruction' || l.logType === 'dietitian_answer');
    const hasErrors = parsedLines.some((l) => ERROR_PATTERN.test(l.display));
    const hasWarnings = parsedLines.some((l) => WARNING_PATTERN.test(l.display));

    if (hasScout) tabs.push({ id: 'scout', label: 'Vision Scout' });
    if (hasDb) tabs.push({ id: 'db', label: 'DB Search' });
    if (hasDietitian) tabs.push({ id: 'dietitian', label: 'Dietitian' });
    if (hasErrors) tabs.push({ id: 'errors', label: 'Errors' });
    if (hasWarnings) tabs.push({ id: 'warnings', label: 'Warnings' });
    return tabs;
  }, [parsedLines]);

  // Tab filtering — matches on the actual logType tag rather than fuzzy text search,
  // so every line belonging to a stage is captured, not just ones containing a keyword.
  const tabFilteredDisplayLines = React.useMemo(() => {
    const filtered = parsedLines.filter((l) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'scout') return l.logType === 'scout_instruction' || l.logType === 'scout_answer';
      if (activeTab === 'db') return l.logType === 'db_search' || l.logType === 'db_search_complete';
      if (activeTab === 'dietitian') return l.logType === 'dietitian_instruction' || l.logType === 'dietitian_answer';
      if (activeTab === 'errors') return ERROR_PATTERN.test(l.display);
      if (activeTab === 'warnings') return WARNING_PATTERN.test(l.display);
      return true;
    });
    return filtered.map((l) => l.display);
  }, [parsedLines, activeTab]);

  // Total elapsed time across the visible stream (earliest to latest timestamp).
  const elapsedLabel = React.useMemo(() => {
    const timestamps = parsedLines.map((l) => l.timestamp).filter((t): t is number => typeof t === 'number');
    if (timestamps.length < 2) return null;
    const elapsedMs = Math.max(...timestamps) - Math.min(...timestamps);
    return \`\${(elapsedMs / 1000).toFixed(1)}s\`;
  }, [parsedLines]);

  // Keyword search matching line indices
  const matchingLineIndices = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const indices: number[] = [];
    tabFilteredDisplayLines.forEach((line, idx) => {
      if (line.toLowerCase().includes(q)) {
        indices.push(idx);
      }
    });
    return indices;
  }, [tabFilteredDisplayLines, searchQuery]);

  React.useEffect(() => {
    if (matchingLineIndices.length > 0 && matchRefs.current[currentMatchIndex]) {
      matchRefs.current[currentMatchIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentMatchIndex, matchingLineIndices]);

  React.useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery, activeTab]);

  const handleNextMatch = () => {
    if (matchingLineIndices.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matchingLineIndices.length);
  };

  const handlePrevMatch = () => {
    if (matchingLineIndices.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matchingLineIndices.length) % matchingLineIndices.length);
  };

  const handleCopy = () => {
    const textToCopy = tabFilteredDisplayLines.join('\\n');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderHighlightedLine = (line: string, lineIndex: number) => {
    if (!searchQuery.trim() || !line.toLowerCase().includes(searchQuery.toLowerCase().trim())) {
      return <span>{line}</span>;
    }

    const q = searchQuery.trim();
    const parts = line.split(new RegExp(\`(\${q.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&')})\`, 'gi'));
    const isCurrentMatch = matchingLineIndices[currentMatchIndex] === lineIndex;

    return (
      <span
        ref={(el) => {
          if (matchingLineIndices.includes(lineIndex)) {
            const matchPos = matchingLineIndices.indexOf(lineIndex);
            matchRefs.current[matchPos] = el;
          }
        }}
      >
        {parts.map((part, i) =>
          part.toLowerCase() === q.toLowerCase() ? (
            <mark
              key={i}
              className={\`px-0.5 rounded font-bold \${
                isCurrentMatch ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300' : 'bg-yellow-500/40 text-yellow-200'
              }\`}
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className="p-2.5 bg-slate-950 text-white font-mono text-[10px] rounded-xl border border-slate-700 shadow-inner flex flex-col gap-2">
      {/* Toolbar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800 text-[10px]">
        {/* Dynamic Agent Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex-wrap">
          {dynamicTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={\`px-2 py-0.5 rounded-md text-[9px] font-semibold transition-colors cursor-pointer \${
                activeTab === tab.id
                  ? 'bg-slate-700/60 text-white border border-slate-500'
                  : 'text-slate-400 hover:text-slate-200'
              }\`}
            >
              {tab.label}
            </button>
          ))}
          {elapsedLabel && (
            <span className="ml-1 px-2 py-0.5 text-[9px] text-slate-400 font-mono whitespace-nowrap">
              Total: {elapsedLabel}
            </span>
          )}
        </div>

        {/* Search Controls + Navigation + Copy */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (e.shiftKey) handlePrevMatch(); else handleNextMatch();
                }
              }}
              className="bg-slate-900 border border-slate-800 text-slate-200 px-2 py-0.5 rounded-md text-[9px] focus:outline-none focus:border-slate-500/50 w-28 sm:w-36"
            />
            {searchQuery.trim() && (
              <span className="text-[8px] text-slate-400 ml-1 whitespace-nowrap font-mono">
                {matchingLineIndices.length > 0
                  ? \`\${currentMatchIndex + 1}/\${matchingLineIndices.length}\`
                  : '0/0'}
              </span>
            )}
          </div>

          {searchQuery.trim() && matchingLineIndices.length > 0 && (
            <div className="flex items-center gap-0.5 bg-slate-900 rounded border border-slate-800">
              <button
                type="button"
                onClick={handlePrevMatch}
                className="px-1.5 py-0.5 text-slate-300 hover:text-white text-[9px] cursor-pointer"
                title="Previous match"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={handleNextMatch}
                className="px-1.5 py-0.5 text-slate-300 hover:text-white text-[9px] cursor-pointer"
                title="Next match"
              >
                ▼
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[9px] border border-slate-700 transition-colors cursor-pointer"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Log Output Body */}
      <div className="max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed flex flex-col gap-0.5">
        {tabFilteredDisplayLines.length > 0 ? (
          tabFilteredDisplayLines.map((line, idx) => (
            <div key={idx}>{renderHighlightedLine(line, idx)}</div>
          ))
        ) : (
          <span className="text-slate-600 italic">No matching logs found.</span>
        )}
      </div>
    </div>
  );
};

`;

const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync('src/components/chat-cards/FoodCard.tsx', newContent);
console.log('Replacement done.');
