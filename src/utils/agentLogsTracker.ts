export interface AgentLogEntry {
  timestamp: string;
  message: string;
}

export interface AgentRequestLog {
  id: string;
  timestamp: string;
  summary: string;
  logs: AgentLogEntry[];
}

export const saveAgentRequestLog = (requestLog: AgentRequestLog) => {
  if (!requestLog || !requestLog.id) return;

  // Strip large base64 image data before saving to stay within localStorage quota
  const sanitized: AgentRequestLog = {
    ...requestLog,
    logs: (requestLog.logs || []).map(log => {
      const msgStr = typeof log.message === 'string' ? log.message : String(log.message || '');
      return {
        ...log,
        message: msgStr.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]{200,}/g, '[image data stripped]')
      };
    })
  };
  const existing = getAgentRequestLogs();
  
  const existingIndex = existing.findIndex(r => r.id === sanitized.id);
  if (existingIndex !== -1) {
    existing[existingIndex] = sanitized;
  } else {
    existing.unshift(sanitized);
  }
  
  // Keep up to 15 requests
  if (existing.length > 15) {
    existing.length = 15;
  }

  try {
    localStorage.setItem('agent_request_logs', JSON.stringify(existing));
  } catch (error) {
    console.warn("[Storage Quota Exceeded] Attempting to save fewer logs...");
    // Fallback: keep fewer logs
    try {
      if (existing.length > 5) {
        existing.length = 5;
        localStorage.setItem('agent_request_logs', JSON.stringify(existing));
      }
    } catch (innerErr) {
      try {
        existing.length = 2;
        localStorage.setItem('agent_request_logs', JSON.stringify(existing));
      } catch (lastErr) {
        console.error("Could not save agent request log to localStorage due to storage constraints.", lastErr);
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('agent_logs_updated'));
  }
};

export const getAgentRequestLogs = (): AgentRequestLog[] => {
  try {
    const data = localStorage.getItem('agent_request_logs');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const deleteAgentRequestLog = (id: string) => {
  const existing = getAgentRequestLogs();
  const updated = existing.filter(r => r.id !== id);
  localStorage.setItem('agent_request_logs', JSON.stringify(updated));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('agent_logs_updated'));
  }
};
