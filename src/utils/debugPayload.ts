/**
 * B9 / B14 — Strip heavy images from debug payloads and build a human markdown report.
 * Pure helpers (browser + Node safe).
 */

/** Recursively strip base64 / huge data-URLs; keep short https photo URLs. */
export function stripHeavyImages(value: any): any {
  if (value == null) return value;
  if (typeof value === 'string') {
    if (value.startsWith('data:image/')) {
      return `[image omitted ${Math.round(value.length / 1024)}KB]`;
    }
    if (value.length > 8000 && /base64/i.test(value)) {
      return value.replace(/data:image\/[^;]+;base64,[a-zA-Z0-9+/=]+/ig, (match) => {
        return `[image omitted ${Math.round(match.length / 1024)}KB]`;
      });
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(stripHeavyImages);
  if (typeof value === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(value)) {
      if (
        (k === 'imageUrl' ||
          k === 'imageUrls' ||
          k === 'photoUrl' ||
          k === 'images' ||
          k === 'selectedImages') &&
        (typeof v === 'string' ? v.startsWith('data:') || v.length > 8000 : true)
      ) {
        if (typeof v === 'string' && /^https?:\/\//i.test(v) && v.length < 500) {
          out[k] = v;
        } else if (Array.isArray(v)) {
          out[k] = v.map((x) =>
            typeof x === 'string' && /^https?:\/\//i.test(x) && x.length < 500
              ? x
              : typeof x === 'string'
                ? `[image omitted ${Math.round(x.length / 1024)}KB]`
                : stripHeavyImages(x)
          );
        } else if (typeof v === 'string') {
          out[k] = `[image omitted ${Math.round(v.length / 1024)}KB]`;
        } else {
          out[k] = stripHeavyImages(v);
        }
        continue;
      }
      out[k] = stripHeavyImages(v);
    }
    return out;
  }
  return value;
}

export const COLD_DEBUG_LOG = '[ColdDebug] R2 upload';

/** R2 object key for cold debug JSON (user-scoped). */
export function coldDebugR2Key(jobId: string, userId?: string | null): string {
  const uid = String(userId || 'anonymous')
    .replace(/[^a-zA-Z0-9_\-@.]/g, '_')
    .slice(0, 120);
  const jid = String(jobId || 'unknown').replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 120);
  return `debug/${uid}/${jid}.json`;
}

export type DebugReportInput = {
  jobId?: string;
  status?: string;
  message?: string;
  backendLogs?: string;
  pendingFoodLog?: any;
  scoutItems?: any[];
  receiptTable?: any;
  error?: string;
  debugUrl?: string;
  photoUrl?: string;
  exportedAt?: string;
  mode?: string;
  savable?: boolean;
  degradedStages?: string[];
  lastUserAction?: any;
  stageLedger?: any[];
  historyLog?: any[];
  version?: number;
};

/**
 * B9b — Human-readable full report (receipt summary + backend logs).
 * No base64 images.
 */
export function buildDebugMarkdownReport(input: DebugReportInput): string {
  const lines: string[] = [];
  const at = input.exportedAt || new Date().toISOString();
  lines.push(`# Health Tracker — Analysis Report`);
  lines.push('');
  lines.push(`- **Exported:** ${at}`);
  if (input.jobId) lines.push(`- **Job ID:** \`${input.jobId}\``);
  if (input.status) lines.push(`- **Status:** ${input.status}`);
  if (input.mode) lines.push(`- **Mode:** ${input.mode}`);
  if (input.version !== undefined) lines.push(`- **Version:** ${input.version}`);
  if (input.savable !== undefined) lines.push(`- **Savable:** ${input.savable}`);
  if (input.degradedStages && input.degradedStages.length > 0) lines.push(`- **Degraded Stages:** ${input.degradedStages.join(', ')}`);
  if (input.lastUserAction) lines.push(`- **Last User Action:** ${JSON.stringify(input.lastUserAction)}`);
  if (input.debugUrl) lines.push(`- **Cold debug URL:** ${input.debugUrl}`);
  if (input.photoUrl && /^https?:\/\//i.test(String(input.photoUrl))) {
    lines.push(`- **Photo:** ${input.photoUrl}`);
  }
  if (input.error) lines.push(`- **Error:** ${input.error}`);
  lines.push('');

  if (input.message) {
    lines.push(`## Agent message`);
    lines.push('');
    lines.push(String(input.message).slice(0, 8000));
    lines.push('');
  }

  const food = input.pendingFoodLog;
  if (food && typeof food === 'object') {
    lines.push(`## Meal`);
    lines.push('');
    lines.push(`- **Name:** ${food.name || food.title || '—'}`);
    if (food.quantity) lines.push(`- **Quantity:** ${food.quantity}`);
    if (food.weightGrams != null) lines.push(`- **Weight (g):** ${food.weightGrams}`);
    const n = food.nutrients || {};
    if (n && typeof n === 'object') {
      lines.push('');
      lines.push(`### Macros`);
      lines.push('');
      lines.push(`| Nutrient | Value |`);
      lines.push(`|----------|------:|`);
      const keys = [
        'calories',
        'protein',
        'totalFat',
        'saturatedFat',
        'carbohydrates',
        'addedSugar',
        'sodium',
        'totalFibre',
      ];
      for (const k of keys) {
        if (n[k] != null && n[k] !== '') lines.push(`| ${k} | ${n[k]} |`);
      }
    }
    if (Array.isArray(food.itemsBreakdown) && food.itemsBreakdown.length > 0) {
      lines.push('');
      lines.push(`### Items`);
      lines.push('');
      for (const it of food.itemsBreakdown.slice(0, 40)) {
        const nm = it.originalName || it.canonicalDbName || it.name || it.keyword || 'item';
        const w = it.weightGrams ?? it.estimatedWeightGrams ?? '';
        const cal = it.nutrients?.calories ?? it.calories ?? '';
        lines.push(`- **${nm}**${w !== '' ? ` — ${w}g` : ''}${cal !== '' ? ` — ${cal} kcal` : ''}`);
      }
    }
    const receipt = input.receiptTable || food.receiptTable;
    if (Array.isArray(receipt) && receipt.length > 0) {
      lines.push('');
      lines.push(`### Receipt`);
      lines.push('');
      lines.push(`| Item | Source | Notes |`);
      lines.push(`|------|--------|-------|`);
      for (const row of receipt.slice(0, 50)) {
        const item = String(row.item || row.name || row.food || '—').replace(/\|/g, '/');
        const src = String(row.source || row.truthSource || row.basis || '—').replace(/\|/g, '/');
        const notes = String(row.notes || row.detail || row.fdcId || '').replace(/\|/g, '/').slice(0, 80);
        lines.push(`| ${item} | ${src} | ${notes} |`);
      }
    }
    
    if (Array.isArray(input.stageLedger) && input.stageLedger.length > 0) {
      lines.push('');
      lines.push(`### Stage Ledger`);
      lines.push('');
      lines.push(`| Stage | Status | Attempt | Key Decisions | Errors |`);
      lines.push(`|-------|--------|---------|---------------|--------|`);
      for (const record of input.stageLedger) {
        const decisions = (record.decisions || []).map((d: any) => d.key).join(', ');
        const errors = (record.errors || []).map((e: any) => e.message).join(', ');
        lines.push(`| ${record.stage || '—'} | ${record.status || '—'} | ${record.attempt || '—'} | ${decisions || '—'} | ${errors || '—'} |`);
      }
    }

    if (Array.isArray(input.historyLog) && input.historyLog.length > 0) {
      lines.push('');
      lines.push(`### History Log`);
      lines.push('');
      for (const entry of input.historyLog.slice(-100)) {
        lines.push(`- **${entry.at}** [${entry.kind}]: ${entry.message} ${entry.detail ? `(${entry.detail})` : ''}`);
      }
    }

    lines.push('');
  }

  if (Array.isArray(input.scoutItems) && input.scoutItems.length > 0) {
    lines.push(`## Scout items`);
    lines.push('');
    for (const it of input.scoutItems.slice(0, 30)) {
      const nm = it.originalName || it.keyword || it.name || 'item';
      const w = it.estimatedWeightGrams ?? it.weightGrams ?? '?';
      lines.push(`- **${nm}** — ${w}g${it.portionChoiceApplied ? ` (choice ${it.portionChoiceApplied}g)` : ''}`);
    }
    lines.push('');
  }

  const logs = String(input.backendLogs || '').trim();
  lines.push(`## Backend logs`);
  lines.push('');
  if (logs) {
    lines.push('```');
    lines.push(logs.slice(0, 180_000));
    lines.push('```');
  } else {
    lines.push('_No backend logs available in this export._');
  }
  lines.push('');
  lines.push(`---`);
  lines.push(`_Generated by Health Tracker debug export (B9b). Images are never embedded as base64._`);
  lines.push('');
  return lines.join('\n');
}

/** Build report input from a job shell + message bubble. */
export function debugReportFromJobMsg(job: any, msg: any): DebugReportInput {
  const result = job?.result || msg?.data || {};
  const food =
    result.pendingFoodLog ||
    result.data ||
    msg?.pendingFoodLog ||
    msg?.data?.pendingFoodLog;
  const logs =
    result.backendLogs ||
    msg?.data?.agentResult?.backendLogs ||
    msg?.data?.agentResult?.globalLiveLogs ||
    job?.liveThoughts?.backendLogs ||
    '';
  return {
    jobId: job?.id || msg?.id,
    status: job?.status,
    mode: result.mode || job?.inputSnapshot?.mode,
    message: result.message || result.text || msg?.content,
    backendLogs: typeof logs === 'string' ? logs : String(logs || ''),
    pendingFoodLog: food,
    scoutItems: result.scoutItems || msg?.data?.scoutItems,
    receiptTable: food?.receiptTable || result.receiptTable,
    error: job?.error?.message || result.error,
    debugUrl: result.debugUrl || msg?.data?.debugUrl || job?.debugUrl,
    photoUrl: result.photoUrl || job?.photoUrl || msg?.data?.photoUrl,
    exportedAt: new Date().toISOString(),
  };
}

/* export function stripHeavyImages export function coldDebugR2Key debug/${uid}/${jid}.json export function buildDebugMarkdownReport */
