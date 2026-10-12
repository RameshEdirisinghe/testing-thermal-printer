import React, { useState } from 'react';
import { BrowserEnvironmentInfo } from '../utils/browserDetection';
import { IconCheckCircle, IconXCircle, IconBluetooth, IconUsb } from '../icons/LucideIcons';

interface BrowserCompatibilityBannerProps {
  env: BrowserEnvironmentInfo;
}

export const BrowserCompatibilityBanner: React.FC<BrowserCompatibilityBannerProps> = ({ env }) => {
  const [expanded, setExpanded] = useState(false);

  const hasIssues = !env.isSecureContext || (!env.hasWebBluetooth && !env.hasWebUsb);

  return (
    <div className={`border-b text-xs transition-colors ${hasIssues ? 'bg-amber-950/30 border-amber-800/40' : 'bg-slate-800/40 border-slate-800'}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
          <span className="font-semibold text-slate-300 flex items-center gap-1 text-[11px] sm:text-xs">
            <span>Env:</span>
            <span className="text-white font-normal bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-[10px] sm:text-xs">
              {env.browserName}
            </span>
          </span>

          {/* Secure Context Pill */}
          <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-[10px] sm:text-[11px]">
            {env.isSecureContext ? (
              <IconCheckCircle size={11} className="text-emerald-400 flex-shrink-0" />
            ) : (
              <IconXCircle size={11} className="text-rose-400 flex-shrink-0" />
            )}
            <span className={env.isSecureContext ? 'text-slate-300' : 'text-rose-300 font-medium'}>
              <span className="sm:hidden">HTTPS</span>
              <span className="hidden sm:inline">Secure Context (HTTPS)</span>
            </span>
          </div>

          {/* Web Bluetooth Pill */}
          <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-[10px] sm:text-[11px]">
            <IconBluetooth size={11} className={env.hasWebBluetooth ? 'text-cyan-400 flex-shrink-0' : 'text-slate-500 flex-shrink-0'} />
            <span className={env.hasWebBluetooth ? 'text-slate-300' : 'text-slate-500'}>
              <span className="sm:hidden">BLE {env.hasWebBluetooth ? '✓' : '✗'}</span>
              <span className="hidden sm:inline">Web Bluetooth: {env.hasWebBluetooth ? 'Available' : 'Unavailable'}</span>
            </span>
          </div>

          {/* WebUSB Pill */}
          <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-[10px] sm:text-[11px]">
            <IconUsb size={11} className={env.hasWebUsb ? 'text-cyan-400 flex-shrink-0' : 'text-slate-500 flex-shrink-0'} />
            <span className={env.hasWebUsb ? 'text-slate-300' : 'text-slate-500'}>
              <span className="sm:hidden">USB {env.hasWebUsb ? '✓' : '✗'}</span>
              <span className="hidden sm:inline">WebUSB: {env.hasWebUsb ? 'Available' : 'Unavailable'}</span>
            </span>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-cyan-400 hover:text-cyan-300 underline font-medium text-[10px] sm:text-[11px] self-start sm:self-auto"
        >
          {expanded ? 'Hide Details' : 'Driver Guidelines'}
        </button>
      </div>

      {expanded && (
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 bg-slate-900/60 border-t border-slate-800/80 space-y-2 text-slate-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <div className="flex items-center gap-2 font-semibold text-white mb-1">
                <IconBluetooth size={14} className="text-cyan-400" />
                <span>Web Bluetooth BLE Guidelines</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {env.bluetoothRecommendation}
              </p>
              <p className="text-[11px] text-amber-400/90 mt-1 leading-relaxed">
                Note: Many receipt printers feature Bluetooth Classic (SPP 2.1) which is inaccessible via browser GATT APIs. Ensure your device is a BLE (Bluetooth 4.0+) model or configured in BLE dual-mode.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <div className="flex items-center gap-2 font-semibold text-white mb-1">
                <IconUsb size={14} className="text-cyan-400" />
                <span>WebUSB & OS Driver Guidelines</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {env.usbRecommendation}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                If direct WebUSB or BLE is unavailable, use the <strong>Browser Print Fallback</strong> card to output tests through standard system print drivers.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
