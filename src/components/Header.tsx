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
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>CONNECTED: {device?.name || 'PRINTER'}</span>
            <span className="uppercase text-[10px] text-emerald-500/80 font-mono">({device?.transport})</span>
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
            <IconRefreshCw size={12} className="animate-spin" />
            <span>CONNECTING...</span>
          </div>
        );
      case 'disconnecting':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-400 text-xs font-medium">
            <span>DISCONNECTING...</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>CONNECTION ERROR</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>HARDWARE DISCONNECTED</span>
          </div>
        );
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
          <IconPrinter size={22} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-white">ThermoDiagnostix</h1>
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
              v1.0 Pro
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Professional Thermal Receipt Printer Diagnostic & Testing Web Suite
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {getStatusBadge()}

        <div className="h-5 w-px bg-slate-800 hidden sm:block" />

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors border border-slate-700/60"
          title="Profile & Hardware Settings"
        >
          <IconSettings size={14} />
          <span>Settings</span>
        </button>

        <button
          onClick={onOpenHelp}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors border border-slate-700/60"
          title="Hardware Documentation & Troubleshooting"
        >
          <IconHelpCircle size={14} />
          <span>Guide</span>
        </button>

        <button
          onClick={onReset}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Reset Dashboard State"
        >
          <IconRefreshCw size={14} />
        </button>
      </div>
    </header>
  );
};
