import React, { useState } from 'react';
import { LogEntry, LogSeverity } from '../types/log';
import { IconTerminal, IconDownload, IconTrash, IconFileText } from '../icons/LucideIcons';

interface ActivityLogViewerProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  onExportJson: () => void;
  onExportTxt: () => void;
}

export const ActivityLogViewer: React.FC<ActivityLogViewerProps> = ({
  logs,
  onClearLogs,
  onExportJson,
  onExportTxt,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<LogSeverity | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter((log) => {
    if (filterSeverity !== 'all' && log.severity !== filterSeverity) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        log.category.toLowerCase().includes(q) ||
        log.severity.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getSeverityStyle = (severity: LogSeverity) => {
    switch (severity) {
      case 'success':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'warn':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'error':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default:
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    }
  };

  return (
    <div className="bg-slate-800/80 rounded-xl border border-slate-700/80 shadow-md flex flex-col overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3 bg-slate-800/60">
        <div className="flex items-center gap-2">
          <IconTerminal size={18} className="text-cyan-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Live Diagnostic Activity Log
          </h2>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-mono border border-slate-700">
            {logs.length} entries
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportJson}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-colors"
            title="Download Machine-Readable JSON"
          >
            <IconDownload size={13} />
            <span>JSON</span>
          </button>

          <button
            onClick={onExportTxt}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-colors"
            title="Download Formatted Audit Report TXT"
          >
            <IconFileText size={13} />
            <span>TXT Report</span>
          </button>

          <button
            onClick={onClearLogs}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
            title="Clear Activity Log"
          >
            <IconTrash size={15} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-4 py-2.5 bg-slate-900/50 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Filter:</span>
          {(['all', 'info', 'success', 'warn', 'error'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2 py-0.5 rounded text-[11px] uppercase font-mono transition-colors ${
                filterSeverity === sev
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white bg-slate-800/80'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search log messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono w-48"
        />
      </div>

      {/* Log Stream */}
      <div className="p-3 bg-slate-950 font-mono text-xs max-h-72 overflow-y-auto space-y-1">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-6 text-slate-600 italic">No events recorded.</div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 leading-relaxed hover:bg-slate-900/50 p-1 rounded">
              <span className="text-slate-500 text-[10px] select-none flex-shrink-0 pt-0.5">
                {log.timestamp}
              </span>
              <span
                className={`text-[9px] uppercase px-1 py-0.2 rounded border font-semibold select-none flex-shrink-0 ${getSeverityStyle(
                  log.severity
                )}`}
              >
                {log.severity}
              </span>
              <span className="text-slate-400 text-[11px] select-none flex-shrink-0">
                [{log.category}]
              </span>
              <span className="text-slate-200 flex-1 break-words">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
