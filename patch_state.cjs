const fs = require('fs');
let code = fs.readFileSync('src/components/LogChat.tsx', 'utf8');

const targetState = `  const [debugLogsSendStatus, setDebugLogsSendStatus] = useState<'idle' | 'success' | 'error'>('idle');`;
const replState = `  const [debugLogsSendStatus, setDebugLogsSendStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [globalLiveStreamLogs, setGlobalLiveStreamLogs] = useState<string[]>([]);
  useEffect(() => {
    const sse = new EventSource("/api/debug/live-stream");
    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.message) {
          setGlobalLiveStreamLogs(prev => {
            const next = [...prev, data.message];
            return next.slice(-10); // Keep last 10 logs for the banner
          });
        }
      } catch (err) {}
    };
    return () => {
      sse.close();
    };
  }, []);`;

code = code.replace(targetState, replState);
fs.writeFileSync('src/components/LogChat.tsx', code, 'utf8');
