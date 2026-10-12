import React, { useState } from 'react';
import { IconAlertTriangle, IconXCircle, IconZap } from '../icons/LucideIcons';

interface StressTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (iterations: number) => void;
}

export const StressTestModal: React.FC<StressTestModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [iterations, setIterations] = useState(3);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full flex flex-col shadow-2xl overflow-hidden text-slate-200">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconZap size={18} className="text-purple-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Stress & Reliability Test
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <IconXCircle size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-200 flex items-start gap-2.5">
            <IconAlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Caution: Physical Paper Consumption.</strong> This test will transmit multiple sequential print jobs to stress test packet delivery, buffer flow, and transport stability.
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Repetition Count (Iterations: 1 to 10):
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={iterations}
              onChange={(e) => setIterations(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              300ms pacing delay between jobs. Stops immediately if transport disconnects.
            </span>
          </div>
        </div>

        <div className="p-3 sm:p-4 border-t border-slate-800 flex flex-col-reverse sm:flex-row justify-end gap-2 bg-slate-900/80">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold text-center"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(iterations);
              onClose();
            }}
            className="w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md text-center"
          >
            Confirm & Run Stress Test
          </button>
        </div>
      </div>
    </div>
  );
};
