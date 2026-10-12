import React from 'react';
import { DiagnosticTestId, DiagnosticTestResult } from '../types/test';
import { DIAGNOSTIC_TESTS } from '../diagnostics/testDefinitions';
import { PrinterProfile } from '../types/printer';
import { IconPlay, IconCheckCircle, IconXCircle, IconAlertTriangle, IconRefreshCw, IconScissors, IconZap, IconEye } from '../icons/LucideIcons';

interface DiagnosticTestDashboardProps {
  testResults: Map<DiagnosticTestId, DiagnosticTestResult>;
  profile: PrinterProfile;
  onRunTest: (testId: DiagnosticTestId) => void;
  onPreviewTest: (testId: DiagnosticTestId) => void;
  onRunAll: () => void;
  onOpenVerification: (testId: DiagnosticTestId) => void;
  onOpenStressModal: () => void;
  onOpenCutterModal: () => void;
  isBusy: boolean;
  canRunTests: boolean;
}

export const DiagnosticTestDashboard: React.FC<DiagnosticTestDashboardProps> = ({
  testResults,
  profile,
  onRunTest,
  onPreviewTest,
  onRunAll,
  onOpenVerification,
  onOpenStressModal,
  onOpenCutterModal,
  isBusy,
  canRunTests,
}) => {
  // Compute summary metrics
  let passedCount = 0;
  let failedCount = 0;
  let awaitingCount = 0;
  let unsupportedCount = 0;
  let skippedCount = 0;

  for (const r of testResults.values()) {
    if (r.status === 'passed') passedCount++;
    else if (r.status === 'failed') failedCount++;
    else if (r.status === 'awaiting_verification') awaitingCount++;
    else if (r.status === 'unsupported') unsupportedCount++;
    else if (r.status === 'skipped') skippedCount++;
  }

  const handleTestClick = (testId: DiagnosticTestId) => {
    if (testId === 'test_h') {
      onOpenCutterModal();
    } else if (testId === 'test_j') {
      onOpenStressModal();
    } else {
      onRunTest(testId);
    }
  };

  const getStatusBadge = (res?: DiagnosticTestResult) => {
    if (!res || res.status === 'idle') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-400 border border-slate-700">
          IDLE
        </span>
      );
    }

    switch (res.status) {
      case 'running':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <IconRefreshCw size={10} className="animate-spin" />
            <span>RUNNING</span>
          </span>
        );
      case 'awaiting_verification':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <IconAlertTriangle size={10} />
            <span>AWAITING VERIFY</span>
          </span>
        );
      case 'passed':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <IconCheckCircle size={10} />
            <span>PASSED</span>
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <IconXCircle size={10} />
            <span>FAILED</span>
          </span>
        );
      case 'unsupported':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-purple-500/10 text-purple-400 border border-purple-500/30">
            UNSUPPORTED
          </span>
        );
      case 'skipped':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-400 border border-slate-700">
            SKIPPED
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Test Suite Controls Header */}
      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Diagnostic Test Suite
          </h2>
          <p className="text-xs text-slate-400">
            Individual hardware diagnostic verification routines (Tests A through J)
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRunAll}
            disabled={!canRunTests || isBusy}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-cyan-950/40 transition-all"
          >
            <IconPlay size={14} />
            <span>Run Safe Batch (A - G, I)</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/50 flex flex-col">
          <span className="text-[10px] uppercase font-bold text-emerald-400">Passed</span>
          <span className="text-xl font-bold font-mono text-emerald-300">{passedCount}</span>
        </div>
        <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-900/50 flex flex-col">
          <span className="text-[10px] uppercase font-bold text-cyan-400">Awaiting Verify</span>
          <span className="text-xl font-bold font-mono text-cyan-300">{awaitingCount}</span>
        </div>
        <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 flex flex-col">
          <span className="text-[10px] uppercase font-bold text-rose-400">Failed</span>
          <span className="text-xl font-bold font-mono text-rose-300">{failedCount}</span>
        </div>
        <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-900/50 flex flex-col">
          <span className="text-[10px] uppercase font-bold text-purple-400">Unsupported</span>
          <span className="text-xl font-bold font-mono text-purple-300">{unsupportedCount}</span>
        </div>
        <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 flex flex-col">
          <span className="text-[10px] uppercase font-bold text-slate-400">Skipped / Idle</span>
          <span className="text-xl font-bold font-mono text-slate-300">{skippedCount}</span>
        </div>
      </div>

      {/* Test List Table / Cards */}
      <div className="bg-slate-800/60 rounded-xl border border-slate-700/80 overflow-hidden">
        <div className="divide-y divide-slate-700/60">
          {DIAGNOSTIC_TESTS.map((testDef) => {
            const result = testResults.get(testDef.id);
            const isAwaiting = result?.status === 'awaiting_verification';

            return (
              <div
                key={testDef.id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-800/80 transition-colors"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white tracking-wide">
                      {testDef.name}
                    </h3>
                    {getStatusBadge(result)}
                    {testDef.id === 'test_h' && (
                      <span className="text-[10px] flex items-center gap-1 text-amber-400 font-mono">
                        <IconScissors size={11} /> Cutter
                      </span>
                    )}
                    {testDef.id === 'test_j' && (
                      <span className="text-[10px] flex items-center gap-1 text-purple-400 font-mono">
                        <IconZap size={11} /> Stress
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {testDef.description}
                  </p>
                  {result?.details && result.status !== 'idle' && (
                    <div className="text-[11px] font-mono text-slate-300 bg-slate-900/80 p-1.5 rounded border border-slate-800">
                      {result.details}
                      {result.bytesTransmitted ? ` (${result.bytesTransmitted} bytes transmitted)` : ''}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                  {testDef.requiresHardwarePrint && (
                    <button
                      onClick={() => onPreviewTest(testDef.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
                      title={`Preview exact payload for ${testDef.name}`}
                    >
                      <IconEye size={12} className="text-cyan-400" />
                      <span>Preview</span>
                    </button>
                  )}

                  {isAwaiting && (
                    <button
                      onClick={() => onOpenVerification(testDef.id)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <IconCheckCircle size={14} />
                      <span>Verify Output</span>
                    </button>
                  )}

                  {testDef.id === 'test_h' && !profile.supportsCutter ? (
                    <button
                      disabled
                      className="px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-500 text-xs font-semibold border border-slate-700/50 cursor-not-allowed"
                      title="Auto-cutter is not supported by the active printer profile"
                    >
                      <span>No Cutter</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleTestClick(testDef.id)}
                      disabled={!canRunTests || isBusy}
                      className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <IconPlay size={12} />
                      <span>Run</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
