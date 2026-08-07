import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Bug,
  X,
  RefreshCw,
  Check,
  Trash2,
  MessageSquarePlus,
  ChevronDown,
  ChevronRight,
  Copy,
  AlertCircle,
  Plus,
  Link2,
  Edit2,
  Save,
  FileText,
} from 'lucide-react';
import { FlagIssueForm, CATEGORY_OPTIONS, saveBugTrackerCache } from './FlagIssueModal';
import { BugCategory } from '../utils/issueBacklog';

interface BugTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** White-on-dark styling tokens */
const textPrimary = 'text-white';
const textSecondary = 'text-white/90';
const textMuted = 'text-white/70';
const card = 'p-3.5 rounded-2xl bg-slate-800/90 border border-white/15 text-white space-y-2';
const preBlock =
  'text-[10px] text-white bg-black/40 p-2.5 rounded-xl border border-white/10 overflow-auto font-mono';
const inputCls =
  'w-full text-[11px] rounded-lg px-2 py-1.5 bg-black/40 border border-white/20 text-white placeholder:text-white/40';

function statusClass(status: string) {
  if (status === 'to_fix') return 'text-amber-400 font-bold';
  if (status === 'fixed') return 'text-emerald-300 font-bold';
  return 'text-sky-300 font-bold';
}

interface ExpandableNoteProps {
  note: string;
  maxChars?: number;
  label?: string;
  className?: string;
  labelColorClass?: string;
}

function ExpandableNote({
  note,
  maxChars = 200,
  label = 'Note: ',
  className = '',
  labelColorClass = '',
}: ExpandableNoteProps) {
  const [expanded, setExpanded] = useState(false);

  if (!note) return null;

  const isLong = note.length > maxChars;
  const displayedText = isLong && !expanded ? note.slice(0, maxChars) + '...' : note;

  return (
    <span className={className}>
      {label && <span className={labelColorClass}>{label}</span>}
      {displayedText}
      {isLong && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="ml-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline inline focus:outline-none transition-colors select-none"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </span>
  );
}

export default function BugTrackerModal({ isOpen, onClose }: BugTrackerModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    bugTags: any[];
    allReports: any[];
    deletionCandidates: any[];
  } | null>(null);

  const [activeTab, setActiveTab] = useState<BugCategory | 'all'>('all');
  const [isFlagFormOpen, setIsFlagFormOpen] = useState(false);
  const [expandedTagId, setExpandedTagId] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [logDetail, setLogDetail] = useState<any>(null);

  // Inline editing state for tag fields (title, resolution_note, whats_still_open)
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'title' | 'resolution_note' | 'whats_still_open' | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [copiedTagId, setCopiedTagId] = useState<string | null>(null);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);
  const [highlightedReportId, setHighlightedReportId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/bug-tracker/overview');
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json);
      const nowStr = new Date().toLocaleTimeString();
      setLastUpdated(nowStr);
      saveBugTrackerCache(json);
    } catch (err: any) {
      setError(err?.message || 'Failed to load bug tracker data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // 1. Instantly load saved bugs from local storage if present
      try {
        const saved = localStorage.getItem('bug_tracker_local_cache');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object' && Array.isArray(parsed.bugTags)) {
            setData(parsed);
            if (parsed._cachedAt) setLastUpdated(parsed._cachedAt);
          }
        }
      } catch (e) {
        console.warn('Failed to load local bug cache:', e);
      }
      // 2. Perform background refresh
      load();
    }
  }, [isOpen]);

  const loadLog = async (id: string) => {
    if (expandedLogId === id) {
      setExpandedLogId(null);
      setLogDetail(null);
      return;
    }
    setExpandedLogId(id);
    setLogDetail(null);
    try {
      const res = await fetch(`/api/issues/${id}`);
      const json = await res.json();
      if (res.ok) setLogDetail(json.issue);
    } catch {
      /* ignore */
    }
  };

  /** Helper to strip noisy candidate database search entries (40+ USDA matches) & huge prompt dumps from debug logs */
  const cleanLogText = (rawLog: string): string => {
    if (!rawLog || typeof rawLog !== 'string') return '';
    const lines = rawLog.split('\n');
    const filtered: string[] = [];
    let skippingDbMatches = false;
    let dbMatchCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('=== VERIFIED DATABASE MATCHES ===')) {
        skippingDbMatches = true;
        dbMatchCount = 0;
        filtered.push('=== VERIFIED DATABASE MATCHES === (searched candidates collapsed)');
        continue;
      }
      if (skippingDbMatches) {
        if (
          line.trim().startsWith('- [USDA]') ||
          line.trim().startsWith('- [OFF]') ||
          line.trim().startsWith('- [WebSearch]') ||
          line.trim().startsWith('- [OpenFoodFacts]')
        ) {
          dbMatchCount++;
          continue;
        } else {
          skippingDbMatches = false;
          if (dbMatchCount > 0) {
            filtered.push(`[... ${dbMatchCount} database search candidates omitted for brevity ...]`);
          }
        }
      }
      filtered.push(line);
    }
    if (skippingDbMatches && dbMatchCount > 0) {
      filtered.push(`[... ${dbMatchCount} database search candidates omitted for brevity ...]`);
    }
    return filtered.join('\n');
  };

  /** Helper to clean raw payload JSON for copying & display */
  const getCleanPayloadJSON = (payload: any): string => {
    if (!payload || typeof payload !== 'object') return '{}';
    try {
      const clone = JSON.parse(JSON.stringify(payload));
      delete clone.debugLogText;
      delete clone.debugLogLines;
      delete clone.logs;
      delete clone.debugLogs;
      if (clone.answer) {
        delete clone.answer.debugLogText;
        delete clone.answer.debugLogLines;
        if (typeof clone.answer.imageUrl === 'string' && clone.answer.imageUrl.length > 200) {
          clone.answer.imageUrl = `[omitted image data, length=${clone.answer.imageUrl.length}]`;
        }
      }
      if (typeof clone.imageUrl === 'string' && clone.imageUrl.length > 200) {
        clone.imageUrl = `[omitted image data, length=${clone.imageUrl.length}]`;
      }
      return JSON.stringify(clone, null, 2);
    } catch {
      return JSON.stringify(payload, null, 2);
    }
  };

  /** Helper: Format a report's complete log history, nutrient calculations, errors, and payload */
  const formatReportFullDetails = (rep: any): string => {
    if (!rep) return '(No report data)';
    const lines: string[] = [];
    lines.push(`Report ID: ${rep.id}`);
    lines.push(`Type: ${rep.issue_type || 'report'} | Status: ${rep.status || 'to_fix'} | Created: ${rep.created_at}`);
    lines.push(`Chain: ${rep.chain_key || '—'} | Dish/Query: ${rep.dish_query || '—'}`);
    if (rep.user_note) lines.push(`Flag Note: ${rep.user_note}`);
    if (rep.source_url) lines.push(`Source URL: ${rep.source_url}`);
    if (rep.context) lines.push(`Context: ${typeof rep.context === 'object' ? JSON.stringify(rep.context) : rep.context}`);

    const payload = rep.payload || {};

    if (payload.nutrientCalculation) {
      lines.push(`\n[NUTRIENT CALCULATION]`);
      lines.push(
        typeof payload.nutrientCalculation === 'string'
          ? payload.nutrientCalculation
          : JSON.stringify(payload.nutrientCalculation, null, 2)
      );
    }

    const errors = payload.pipelineErrors || payload.errors || payload.error;
    const warnings = payload.pipelineWarnings || payload.warnings;
    if (errors || warnings) {
      lines.push(`\n[PIPELINE ERRORS & WARNINGS]`);
      if (errors) lines.push(`Errors:\n${typeof errors === 'string' ? errors : JSON.stringify(errors, null, 2)}`);
      if (warnings) lines.push(`Warnings:\n${typeof warnings === 'string' ? warnings : JSON.stringify(warnings, null, 2)}`);
    }

    const rawLog =
      payload.debugLogText ||
      (Array.isArray(payload.debugLogLines)
        ? payload.debugLogLines.map((l: any) => (typeof l === 'string' ? l : l.message)).join('\n')
        : null) ||
      (Array.isArray(payload.logs) ? payload.logs.join('\n') : null) ||
      (payload.debugLogs ? JSON.stringify(payload.debugLogs, null, 2) : null);

    if (rawLog) {
      lines.push(`\n[DEBUG LOG HISTORY & TRACES]`);
      lines.push(cleanLogText(rawLog));
    }

    lines.push(`\n[PAYLOAD SUMMARY JSON]`);
    lines.push(getCleanPayloadJSON(payload));

    return lines.join('\n');
  };

  /** Requirement 13: Include all reports + all info & full log history when copying a bug */
  const copyTagSummary = async (tag: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setCopiedTagId(tag.id);

    const lines: string[] = [];
    lines.push(`==========================================`);
    lines.push(`Bug: ${tag.title}`);
    lines.push(`Category: ${tag.category || 'foodcart'}`);
    lines.push(`Status: ${tag.status}`);
    lines.push(`Tag id: ${tag.id}`);
    lines.push(`==========================================`);
    
    lines.push(`\nProgress / what's been tried & learnt:`);
    lines.push(tag.resolution_note ? tag.resolution_note : '(none yet)');
    
    if (tag.whats_still_open) {
      lines.push(`\nWhat's still open:\n${tag.whats_still_open}`);
    }

    const comments = Array.isArray(tag.comments) ? tag.comments : [];
    if (comments.length) {
      lines.push(`\nComments (${comments.length}):`);
      comments.forEach((c: any) => lines.push(`- [${c.created_at}] ${c.body}`));
    }

    const linked = tag.linked_issues || [];
    lines.push(`\n==========================================`);
    lines.push(`Associated reports & full log history (${linked.length}):`);
    lines.push(`==========================================`);

    if (linked.length === 0) {
      lines.push(`No associated reports linked.`);
    } else {
      // Fetch full report records (including debug log text & full payload) for each linked issue
      const fullReports = await Promise.all(
        linked.map(async (li: any) => {
          const inState = allReports.find((r: any) => r.id === li.id);
          if (inState && inState.payload) return inState;
          try {
            const res = await fetch(`/api/issues/${li.id}`);
            if (res.ok) {
              const data = await res.json();
              return data.issue || li;
            }
          } catch {
            /* ignore */
          }
          return li;
        })
      );

      fullReports.forEach((rep: any, idx: number) => {
        lines.push(`\n--- ASSOCIATED REPORT #${idx + 1} ---`);
        lines.push(formatReportFullDetails(rep));
      });
    }

    const fullText = lines.join('\n');
    try {
      await navigator.clipboard.writeText(fullText);
      setTimeout(() => setCopiedTagId((prev) => (prev === tag.id ? null : prev)), 2000);
    } catch {
      window.prompt('Copy this text:', fullText);
    }
  };

  /** Save direct inline edit for a tag field (Requirement 14) */
  const saveInlineEdit = async (tagId: string, field: 'title' | 'resolution_note' | 'whats_still_open') => {
    setBusy(true);
    const updatedValue = editDraft.trim();
    setData(prev => prev ? {
      ...prev,
      bugTags: prev.bugTags.map(t => t.id === tagId ? { ...t, [field]: updatedValue } : t)
    } : prev);
    try {
      const res = await fetch(`/api/issue-tags/${tagId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: updatedValue, append_note: false }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json.error || 'Failed to save edits');
        await load();
        return;
      }
      setEditingTagId(null);
      setEditingField(null);
      await load();
    } catch (err: any) {
      alert(err?.message || 'Failed to save edit');
      await load();
    } finally {
      setBusy(false);
    }
  };

  const deleteTag = async (tagId: string, title: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setDeletingTagId(tagId);
    try {
      const res = await fetch(`/api/issue-tags/${tagId}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error(json.error || `Failed to delete (HTTP ${res.status})`);
        return;
      }
      if (expandedTagId === tagId) setExpandedTagId(null);
      await load();
    } catch (err: any) {
      console.error(err?.message || 'Failed to delete bug tag');
    } finally {
      setDeletingTagId(null);
    }
  };

  const deleteLog = async (issueId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setDeletingLogId(issueId);
    try {
      const res = await fetch(`/api/issues/${issueId}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error(json.error || `Failed to delete report (HTTP ${res.status})`);
        return;
      }
      if (expandedLogId === issueId) {
        setExpandedLogId(null);
        setLogDetail(null);
      }
      await load();
    } catch (err: any) {
      console.error(err?.message || 'Failed to delete report');
    } finally {
      setDeletingLogId(null);
    }
  };

  const addTagComment = async (tagId: string) => {
    const body = commentDraft.trim();
    if (!body) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/issue-tags/${tagId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error(json.error || 'Failed to add comment');
        return;
      }
      setCommentDraft('');
      await load();
    } catch (err: any) {
      console.error(err?.message || 'Failed to add comment');
    } finally {
      setBusy(false);
    }
  };

  const deleteTagComment = async (tagId: string, commentId: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/issue-tags/${tagId}/comments/${commentId}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error(json.error || 'Failed to delete comment');
        return;
      }
      await load();
    } catch (err: any) {
      console.error(err?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const linkExistingTagToReport = async (tagId: string, issueId: string) => {
    if (!issueId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/issue-tags/${tagId}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue_id: issueId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error(json.error || 'Link failed');
        return;
      }
      await load();
    } catch (err: any) {
      console.error(err?.message || 'Link failed');
    } finally {
      setBusy(false);
    }
  };

  const unlinkReport = async (tagId: string, issueId: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/issue-tags/${tagId}/links/${issueId}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error(json.error || 'Unlink failed');
        return;
      }
      await load();
    } catch (err: any) {
      console.error(err?.message || 'Unlink failed');
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  const bugTags: any[] = data?.bugTags || [];
  const deletionCandidates: any[] = data?.deletionCandidates || [];
  const allReports: any[] = data?.allReports || [];

  // Filter bug tags by active category filter tab (Requirement 6)
  const filteredTags = bugTags.filter(
    (t: any) => activeTab === 'all' || (t.category || 'foodcart') === activeTab
  );

  return createPortal(
    <div className="fixed inset-0 z-[10050] bg-slate-900 flex flex-col w-full h-full p-0">
      <div className="flex-1 bg-slate-900 flex flex-col overflow-hidden text-white w-full h-full">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-white/15 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
              <Bug className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className={`text-base font-bold truncate ${textPrimary}`}>Bug Tracker</h2>
              <p className="text-[10px] text-white/60">
                Saved locally {lastUpdated ? `· Refreshed at ${lastUpdated}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={loading || busy}
              onClick={load}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Flag issue button moved to top header bar */}
            <button
              type="button"
              onClick={() => setIsFlagFormOpen(!isFlagFormOpen)}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white shadow-md transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Flag issue</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isFlagFormOpen ? 'rotate-180' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-white/20"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-600 text-white text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Requirement 6: Filter Tabs: foodcart, biomarker, database, Home, Other with tag count badges */}
          <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
            {[ { key: 'all', label: 'All' }, ...CATEGORY_OPTIONS ].map((c) => {
              const count = c.key === 'all' ? bugTags.length : bugTags.filter((t: any) => (t.category || 'foodcart') === c.key).length;
              const isActive = activeTab === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setActiveTab(c.key as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                    isActive
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg'
                      : 'bg-slate-800/80 border-white/10 text-white/70 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span>{c.key}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-indigo-950 text-indigo-200' : 'bg-black/40 text-white/60'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Flag Issue expandable panel */}
          {isFlagFormOpen && (
            <div className={`${card} border-indigo-500/40 p-4`}>
              <FlagIssueForm
                initialCategory={activeTab === 'all' ? 'foodcart' : activeTab}
                existingBugTags={bugTags}
                onSuccess={() => {
                  setIsFlagFormOpen(false);
                  load();
                }}
                onCancel={() => setIsFlagFormOpen(false)}
              />
            </div>
          )}

          {/* Simplified Active Bug Tags layout */}
          {filteredTags.length === 0 && !loading && (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-950/40 p-4 space-y-2">
              <p className="text-sm text-white font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" /> No active bug tags in {activeTab}
              </p>
              <p className={`text-xs ${textSecondary}`}>
                Use <strong>Flag issue</strong> in the top header bar to log an issue for {activeTab}.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {filteredTags.map((tag: any) => {
              const open = expandedTagId === tag.id;
              const comments = Array.isArray(tag.comments) ? tag.comments : [];
              const isCopied = copiedTagId === tag.id;

              return (
                <div key={tag.id} className={card}>
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      className="flex-1 min-w-0 text-left"
                      onClick={() => {
                        setExpandedTagId(open ? null : tag.id);
                        setCommentDraft('');
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        {open ? (
                          <ChevronDown className="w-3.5 h-3.5 text-white/70 shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-white/70 shrink-0" />
                        )}

                        {/* Requirement 14: Direct inline editing of title */}
                        {editingTagId === tag.id && editingField === 'title' ? (
                          <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editDraft}
                              onChange={(e) => setEditDraft(e.target.value)}
                              className={inputCls}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => saveInlineEdit(tag.id, 'title')}
                              className="p-1 rounded bg-emerald-600 text-white"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTagId(null);
                                setEditingField(null);
                              }}
                              className="p-1 rounded bg-slate-700 text-white"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <p
                            className={`font-bold text-sm hover:underline cursor-pointer ${textPrimary}`}
                            title="Click to edit title"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTagId(tag.id);
                              setEditingField('title');
                              setEditDraft(tag.title);
                            }}
                          >
                            {tag.title} <Edit2 className="w-3 h-3 inline ml-1 text-white/40" />
                          </p>
                        )}
                      </div>
                      <p className="text-[11px] mt-0.5 pl-5">
                        <span className={statusClass(tag.status)}>{tag.status}</span>
                        <span className={textMuted}>
                          {' '}
                          · {tag.linked_count ?? tag.linked_issues?.length ?? 0} report
                          {(tag.linked_count ?? 0) === 1 ? '' : 's'}
                        </span>
                      </p>
                    </button>

                    <button
                      type="button"
                      title="Copy status, progress, and all associated reports"
                      onClick={(e) => copyTagSummary(tag, e)}
                      className="shrink-0 p-2 rounded-full border border-white/20 text-white hover:bg-white/10"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      title="Mark fixed — delete tag from DB and all reports"
                      disabled={busy || deletingTagId === tag.id}
                      onClick={(e) => deleteTag(tag.id, tag.title, e)}
                      className="shrink-0 p-2 rounded-full border border-emerald-400/60 bg-emerald-500/20 text-white hover:bg-emerald-500/40 disabled:opacity-40"
                    >
                      {deletingTagId === tag.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
                      ) : (
                        <Check className="w-4 h-4" strokeWidth={3} />
                      )}
                    </button>
                  </div>

                  {/* Requirement 14: Direct inline editing of Progress (resolution_note) */}
                  <div className="space-y-1">
                    {editingTagId === tag.id && editingField === 'resolution_note' ? (
                      <div className="space-y-2 p-2 bg-black/40 rounded-lg">
                        <textarea
                          rows={3}
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          className={inputCls}
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTagId(null);
                              setEditingField(null);
                            }}
                            className="px-2 py-1 rounded bg-slate-700 text-white text-[10px]"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => saveInlineEdit(tag.id, 'resolution_note')}
                            className="px-2 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold"
                          >
                            Save Progress
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setEditingTagId(tag.id);
                          setEditingField('resolution_note');
                          setEditDraft(tag.resolution_note || '');
                        }}
                        className={`text-[10px] whitespace-pre-wrap rounded-lg p-2 bg-black/35 cursor-pointer hover:bg-black/50 transition-colors ${textSecondary}`}
                        title="Click to edit progress"
                      >
                        <span className="font-bold text-emerald-300">Progress (tried / learnt): </span>
                        {tag.resolution_note || '(click to add progress notes)'}
                        <Edit2 className="w-2.5 h-2.5 inline ml-1 text-white/40" />
                      </div>
                    )}
                  </div>

                  {/* Requirement 14: Direct inline editing of What's Still Open */}
                  <div className="space-y-1">
                    {editingTagId === tag.id && editingField === 'whats_still_open' ? (
                      <div className="space-y-2 p-2 bg-black/40 rounded-lg">
                        <textarea
                          rows={2}
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          className={inputCls}
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTagId(null);
                              setEditingField(null);
                            }}
                            className="px-2 py-1 rounded bg-slate-700 text-white text-[10px]"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => saveInlineEdit(tag.id, 'whats_still_open')}
                            className="px-2 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold"
                          >
                            Save Open Items
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setEditingTagId(tag.id);
                          setEditingField('whats_still_open');
                          setEditDraft(tag.whats_still_open || '');
                        }}
                        className={`text-[10px] whitespace-pre-wrap rounded-lg p-2 bg-black/35 cursor-pointer hover:bg-black/50 transition-colors text-amber-200`}
                        title="Click to edit open items"
                      >
                        <span className="font-bold text-amber-400">What's Still Open: </span>
                        {tag.whats_still_open || '(click to add remaining open items)'}
                        <Edit2 className="w-2.5 h-2.5 inline ml-1 text-white/40" />
                      </div>
                    )}
                  </div>

                  {!open && (tag.linked_issues || []).slice(0, 2).map((li: any) => (
                    <p key={li.id} className={`text-[10px] pl-1 border-l-2 border-white/20 ${textMuted}`}>
                      <span className="text-white/90">{li.chain_key || '—'}</span> · {li.dish_query || '—'}
                      {li.user_note ? (
                        <ExpandableNote
                          note={li.user_note}
                          maxChars={200}
                          label="Note: "
                          className="block text-white/80 mt-0.5 whitespace-pre-wrap"
                        />
                      ) : null}
                    </p>
                  ))}

                  {open && (
                    <div className="mt-2 space-y-3 border-t border-white/15 pt-2">
                      <div className="rounded-lg border border-white/15 bg-black/25 p-2 space-y-2">
                        <p className={`text-[11px] font-bold flex items-center gap-1 ${textPrimary}`}>
                          <MessageSquarePlus className="w-3.5 h-3.5" /> Comments
                        </p>
                        {comments.length === 0 && <p className={`text-[10px] ${textMuted}`}>No comments yet.</p>}
                        {comments.map((c: any) => (
                          <div
                            key={c.id}
                            className="flex gap-2 items-start rounded-md bg-white/5 border border-white/10 p-2"
                          >
                            <div className="flex-1 min-w-0">
                              <p className={`text-[10px] whitespace-pre-wrap ${textSecondary}`}>{c.body}</p>
                              <p className={`text-[9px] font-mono mt-1 ${textMuted}`}>{c.created_at}</p>
                            </div>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => deleteTagComment(tag.id, c.id)}
                              className="shrink-0 p-1.5 rounded-lg text-rose-300 hover:bg-rose-500/20"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={commentDraft}
                            onChange={(e) => setCommentDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                addTagComment(tag.id);
                              }
                            }}
                            placeholder="Add a comment…"
                            className={inputCls}
                          />
                          <button
                            type="button"
                            disabled={busy || !commentDraft.trim()}
                            onClick={() => addTagComment(tag.id)}
                            className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-indigo-500 text-white disabled:opacity-40"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {/* Requirement 13: Include multiple reports to each bug tag */}
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`text-[11px] font-bold ${textPrimary}`}>
                          Linked reports ({(tag.linked_issues || []).length})
                        </p>
                        <select
                          className={`${inputCls} max-w-xs`}
                          defaultValue=""
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v) linkExistingTagToReport(tag.id, v);
                            e.target.value = '';
                          }}
                        >
                          <option value="">+ Link another report…</option>
                          {allReports
                            .filter((r) => !(tag.linked_issue_ids || []).includes(r.id))
                            .map((r) => (
                              <option key={r.id} value={r.id}>
                                {(r.chain_key || '') + ' · ' + (r.dish_query || r.id).slice(0, 50)}
                              </option>
                            ))}
                        </select>
                      </div>

                      {(tag.linked_issues || []).map((li: any) => {
                        const titleText =
                          li.dish_query ||
                          (li.chain_key ? `${li.chain_key} report` : null) ||
                          li.issue_type ||
                          `Report ${li.id.slice(0, 8)}`;
                        return (
                          <div key={li.id} className="rounded-lg border border-white/10 bg-black/20 p-2 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <button
                                type="button"
                                className="flex-1 min-w-0 text-left group"
                                onClick={() => {
                                  const el = document.getElementById(`report-${li.id}`);
                                  if (el) {
                                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    setHighlightedReportId(li.id);
                                    setTimeout(() => setHighlightedReportId(null), 2500);
                                  } else {
                                    loadLog(li.id);
                                  }
                                }}
                              >
                                <p className={`text-[11px] font-bold truncate group-hover:underline text-indigo-300`}>
                                  {titleText}
                                </p>
                              </button>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  title="Unlink from tag"
                                  disabled={busy}
                                  onClick={() => unlinkReport(tag.id, li.id)}
                                  className="p-1 rounded text-amber-300 hover:bg-amber-500/20"
                                >
                                  <Link2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  title="Delete report from DB"
                                  disabled={busy || deletingLogId === li.id}
                                  onClick={(e) => deleteLog(li.id, e)}
                                  className="p-1 rounded text-rose-300 hover:bg-rose-500/20 disabled:opacity-40"
                                >
                                  {deletingLogId === li.id ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-300" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Deletion candidates */}
          {deletionCandidates.length > 0 && (
            <div className="space-y-2">
              <p className={`text-sm font-bold text-amber-300`}>
                Reports ready to delete ({deletionCandidates.length})
              </p>
              {deletionCandidates.map((cand: any) => (
                <div key={cand.id} className={`${card} border-amber-500/30`}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-bold ${textPrimary}`}>
                        {cand.issue_type} · {cand.chain_key || '—'}
                      </p>
                      <p className={`text-[11px] ${textSecondary}`}>{cand.dish_query || '—'}</p>
                      <p className={`text-[10px] font-mono ${textMuted}`}>{cand.id}</p>
                    </div>
                    <button
                      type="button"
                      disabled={busy || deletingLogId === cand.id}
                      onClick={(e) => deleteLog(cand.id, e)}
                      className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-40 flex items-center gap-1"
                    >
                      {deletingLogId === cand.id ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Deleting…</span>
                        </>
                      ) : (
                        <span>Delete report</span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Requirement 11: All Flagged Reports - Removed "Suggested tags", show existing tags & add/remove controls */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <p className={`text-sm font-bold ${textPrimary}`}>All flagged reports ({allReports.length})</p>
            {allReports.map((rep: any) => {
              // Find existing tags linked to this report
              const attachedTags = bugTags.filter((t: any) => (t.linked_issue_ids || []).includes(rep.id));
              const isHighlighted = highlightedReportId === rep.id;
              return (
                <div
                  key={rep.id}
                  id={`report-${rep.id}`}
                  className={`${card} transition-all duration-300 ${
                    isHighlighted ? 'ring-2 ring-indigo-400 bg-indigo-950/80 shadow-xl scale-[1.01]' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <button type="button" className="flex-1 min-w-0 text-left" onClick={() => loadLog(rep.id)}>
                      <p className={`font-bold text-sm ${textPrimary}`}>
                        {rep.issue_type} · <span className={statusClass(rep.status)}>{rep.status}</span>
                      </p>
                      <p className={`text-[11px] ${textSecondary}`}>
                        {rep.chain_key || '—'} · {rep.dish_query || '—'}
                      </p>
                      <p className={`text-[10px] font-mono ${textMuted}`}>
                        {rep.id} · {rep.created_at}
                      </p>
                    </button>
                    <button
                      type="button"
                      disabled={busy || deletingLogId === rep.id}
                      onClick={(e) => deleteLog(rep.id, e)}
                      className="shrink-0 p-2 rounded-full border border-rose-400/40 text-rose-300 hover:bg-rose-500/20 disabled:opacity-40"
                    >
                      {deletingLogId === rep.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-rose-300" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {rep.user_note ? (
                    <div className={`text-[11px] whitespace-pre-wrap rounded-lg p-2 bg-black/35 ${textSecondary}`}>
                      <ExpandableNote
                        note={rep.user_note}
                        maxChars={200}
                        label="Flag note: "
                        labelColorClass="font-bold text-amber-300"
                      />
                    </div>
                  ) : (
                    <p className={`text-[10px] ${textMuted}`}>No flag note on this report.</p>
                  )}

                  {/* Existing Tags badges and Add/Remove controls */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-white/80">Existing tags:</span>
                    {attachedTags.length === 0 && (
                      <span className="text-[10px] text-white/50 italic">None attached</span>
                    )}
                    {attachedTags.map((t: any) => (
                      <span
                        key={t.id}
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-900/60 border border-indigo-500/40 text-indigo-200"
                      >
                        <span>{t.title}</span>
                        <button
                          type="button"
                          onClick={() => unlinkReport(t.id, rep.id)}
                          className="hover:text-rose-400 text-white/60 font-bold"
                          title="Remove tag"
                        >
                          &times;
                        </button>
                      </span>
                    ))}

                    <select
                      className="text-[10px] bg-slate-950 border border-white/20 rounded-md px-1.5 py-0.5 text-white/90 ml-2"
                      defaultValue=""
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) linkExistingTagToReport(val, rep.id);
                        e.target.value = '';
                      }}
                    >
                      <option value="">+ Add existing tag…</option>
                      {bugTags
                        .filter((t: any) => !(t.linked_issue_ids || []).includes(rep.id))
                        .map((t: any) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                    </select>
                  </div>

                  {expandedLogId === rep.id && logDetail && logDetail.id === rep.id && (
                    <div className="space-y-3 border-t border-white/15 pt-3 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          Full Report Diagnostics & Logs
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const formatted = formatReportFullDetails(logDetail);
                            navigator.clipboard.writeText(formatted);
                            alert('Report full log copied to clipboard!');
                          }}
                          className="text-[10px] font-bold px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-200 border border-indigo-500/30 flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          Copy this report's log
                        </button>
                      </div>

                      {/* Section 0: Attached Screenshot */}
                      {(logDetail.payload?.screenshot_data || logDetail.payload?.screenshot_url) && (
                        <details open className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-2.5">
                          <summary className="text-[11px] font-bold text-indigo-300 cursor-pointer hover:underline">
                            Attached Screenshot
                          </summary>
                          <div className="mt-2">
                            <img
                              src={logDetail.payload.screenshot_data || logDetail.payload.screenshot_url}
                              alt="Attached Issue Screenshot"
                              className="max-h-80 rounded-lg border border-white/20 object-contain bg-black/60"
                            />
                          </div>
                        </details>
                      )}

                      {/* Section 1: Nutrient Calculation */}
                      {logDetail.payload?.nutrientCalculation && (
                        <details open className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-2.5">
                          <summary className="text-[11px] font-bold text-emerald-300 cursor-pointer hover:underline">
                            1. Nutrient Calculation
                          </summary>
                          <pre className={`${preBlock} max-h-52 mt-1`}>
                            {typeof logDetail.payload.nutrientCalculation === 'string'
                              ? logDetail.payload.nutrientCalculation
                              : JSON.stringify(logDetail.payload.nutrientCalculation, null, 2)}
                          </pre>
                        </details>
                      )}

                      {/* Section 2: Pipeline Errors & Warnings */}
                      {(logDetail.payload?.pipelineErrors ||
                        logDetail.payload?.pipelineWarnings ||
                        logDetail.payload?.errors ||
                        logDetail.payload?.error) && (
                        <details open className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-2.5">
                          <summary className="text-[11px] font-bold text-rose-300 cursor-pointer hover:underline">
                            2. Pipeline Errors & Warnings
                          </summary>
                          <div className="mt-1 space-y-2">
                            {logDetail.payload?.pipelineErrors && (
                              <div>
                                <p className="text-[10px] font-bold text-rose-400">Pipeline Errors:</p>
                                <pre className={`${preBlock} max-h-40 text-rose-200`}>
                                  {typeof logDetail.payload.pipelineErrors === 'string'
                                    ? logDetail.payload.pipelineErrors
                                    : JSON.stringify(logDetail.payload.pipelineErrors, null, 2)}
                                </pre>
                              </div>
                            )}
                            {logDetail.payload?.pipelineWarnings && (
                              <div>
                                <p className="text-[10px] font-bold text-amber-400">Pipeline Warnings:</p>
                                <pre className={`${preBlock} max-h-40 text-amber-200`}>
                                  {typeof logDetail.payload.pipelineWarnings === 'string'
                                    ? logDetail.payload.pipelineWarnings
                                    : JSON.stringify(logDetail.payload.pipelineWarnings, null, 2)}
                                </pre>
                              </div>
                            )}
                            {(logDetail.payload?.errors || logDetail.payload?.error) && (
                              <div>
                                <p className="text-[10px] font-bold text-rose-400">Errors:</p>
                                <pre className={`${preBlock} max-h-40 text-rose-200`}>
                                  {JSON.stringify(logDetail.payload.errors || logDetail.payload.error, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </details>
                      )}

                      {/* Section 3: Full Debug Log History */}
                      {(logDetail.payload?.debugLogText ||
                        logDetail.payload?.debugLogLines ||
                        logDetail.payload?.logs ||
                        logDetail.payload?.debugLogs) && (
                        <details open className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-2.5">
                          <summary className="text-[11px] font-bold text-indigo-300 cursor-pointer hover:underline">
                            3. Full Debug Log History & Traces
                          </summary>
                          <pre className={`${preBlock} max-h-64 mt-1 font-mono text-[10px] whitespace-pre-wrap`}>
                            {cleanLogText(
                              logDetail.payload.debugLogText ||
                                (Array.isArray(logDetail.payload.debugLogLines)
                                  ? logDetail.payload.debugLogLines.map((l: any) => (typeof l === 'string' ? l : l.message)).join('\n')
                                  : null) ||
                                (Array.isArray(logDetail.payload.logs)
                                  ? logDetail.payload.logs.join('\n')
                                  : null) ||
                                JSON.stringify(logDetail.payload.debugLogs, null, 2)
                            )}
                          </pre>
                        </details>
                      )}

                      {/* Section 4: Clean Payload JSON */}
                      <details className="rounded-xl border border-white/10 bg-black/40 p-2.5">
                        <summary className="text-[11px] font-bold text-white/70 cursor-pointer hover:underline">
                          4. Payload Summary JSON
                        </summary>
                        <pre className={`${preBlock} max-h-60 mt-1`}>
                          {getCleanPayloadJSON(logDetail.payload)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
