import React from 'react';
import { ConnectionStatus, DeviceInfo } from '../types/transport';
import { IconPrinter, IconSettings, IconHelpCircle, IconRefreshCw } from '../icons/LucideIcons';

interface HeaderProps {
  status: ConnectionStatus;
  device: DeviceInfo | null;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  device,
  onOpenSettings,
  onOpenHelp,
  onReset,
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return (
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] sm:text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span className="truncate max-w-[140px] sm:max-w-none">
              <span className="sm:hidden">CONNECTED</span>
              <span className="hidden sm:inline">CONNECTED: {device?.name || 'PRINTER'}</span>
            </span>
            <span className="uppercase text-[10px] text-emerald-500/80 font-mono hidden sm:inline">({device?.transport})</span>
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] sm:text-xs font-medium">
            <IconRefreshCw size={12} className="animate-spin flex-shrink-0" />
            <span>CONNECTING...</span>
          </div>
        );
      case 'disconnecting':
        return (
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-400 text-[11px] sm:text-xs font-medium">
            <span>DISCONNECTING...</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] sm:text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
            <span>ERROR</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[11px] sm:text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-slate-500 flex-shrink-0" />
            <span>
              <span className="sm:hidden">DISCONNECTED</span>
              <span className="hidden sm:inline">HARDWARE DISCONNECTED</span>
            </span>
          </div>
        );
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40 px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
        {/* Top Brand & Status on Mobile */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 flex-shrink-0">
              <IconPrinter size={18} className="sm:w-[22px] sm:h-[22px]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-lg font-bold tracking-tight text-white leading-tight truncate">ThermoDiagnostix</h1>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono flex-shrink-0">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block">
                Professional Thermal Receipt Printer Diagnostic & Testing Web Suite
              </p>
            </div>
          </div>

          {/* On mobile screens, Status Badge sits right next to the title */}
          <div className="sm:hidden flex-shrink-0">
            {getStatusBadge()}
          </div>
        </div>

        {/* Action Controls & Desktop Status */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* On desktop screens, Status Badge sits before settings */}
          <div className="hidden sm:block">
            {getStatusBadge()}
          </div>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onOpenSettings}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors border border-slate-700/60"
              title="Profile & Hardware Settings"
            >
              <IconSettings size={14} />
              <span>Settings</span>
            </button>

            <button
              onClick={onOpenHelp}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors border border-slate-700/60"
              title="Hardware Documentation & Troubleshooting"
            >
              <IconHelpCircle size={14} />
              <span>Guide</span>
            </button>

            <button
              onClick={onReset}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors border border-slate-700/40 sm:border-0 flex-shrink-0"
              title="Reset Dashboard State"
            >
              <IconRefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
