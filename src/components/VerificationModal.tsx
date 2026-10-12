import React, { useState } from 'react';
import { DiagnosticTestId, DiagnosticTestResult } from '../types/test';
import { DIAGNOSTIC_TESTS } from '../diagnostics/testDefinitions';
import { IconCheckCircle, IconXCircle, IconAlertTriangle } from '../icons/LucideIcons';

interface VerificationModalProps {
  testId: DiagnosticTestId | null;
  result: DiagnosticTestResult | undefined;
  onVerify: (testId: DiagnosticTestId, status: 'passed' | 'failed' | 'skipped', notes?: string) => void;
  onClose: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  testId,
  result,
  onVerify,
  onClose,
}) => {
  const [notes, setNotes] = useState('');

  if (!testId || !result) return null;

  const def = DIAGNOSTIC_TESTS.find((d) => d.id === testId);

  const handlePass = () => {
    onVerify(testId, 'passed', notes.trim() || undefined);
    onClose();
  };

  const handleFail = () => {
    onVerify(testId, 'failed', notes.trim() || 'Visual output incorrect or paper jam');
    onClose();
  };

  const handleSkip = () => {
    onVerify(testId, 'skipped');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full flex flex-col shadow-2xl overflow-hidden text-slate-200">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconAlertTriangle size={18} className="text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Physical Output Verification
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <IconXCircle size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div>
            <h3 className="font-bold text-white text-sm">{def?.name}</h3>
            <p className="text-slate-400 mt-1">{def?.description}</p>
          </div>

          <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-cyan-200">
            <span className="font-bold block mb-1">Expected Visual Output:</span>
            <span>{def?.expectedVisualDescription}</span>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Operator Notes / Physical Inspection Feedback (Optional):
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Crisp barcode, cleanly aligned edges, margin offset slightly shifted..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-900/80">
          <button
            onClick={handleSkip}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold"
          >
            Skip Verification
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleFail}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold"
            >
              <IconXCircle size={14} />
              <span>Mark Failed</span>
            </button>
            <button
              onClick={handlePass}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
            >
              <IconCheckCircle size={14} />
              <span>Confirm Passed</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
