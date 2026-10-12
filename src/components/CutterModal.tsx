import React from 'react';
import { PrinterProfile } from '../types/printer';
import { IconScissors, IconXCircle, IconAlertTriangle } from '../icons/LucideIcons';

interface CutterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  profile: PrinterProfile;
}

export const CutterModal: React.FC<CutterModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  profile,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full flex flex-col shadow-2xl overflow-hidden text-slate-200">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconScissors size={18} className="text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Auto Cutter Hardware Test
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <IconXCircle size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {!profile.supportsCutter ? (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-200 leading-relaxed">
              <strong>Unsupported Warning:</strong> Current profile &quot;{profile.name}&quot; indicates that this printer model lacks an automatic paper cutter. Sending cut commands may be ignored or cause unexpected behavior.
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-200 flex items-start gap-2.5">
              <IconAlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Physical Blade Actuation:</strong> This test will advance paper by {profile.feedLinesAfterPrint} lines and trigger the mechanical guillotine or rotary cutter (GS V 1). Ensure paper path is clear to avoid paper jams.
              </div>
            </div>
          )}
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
              onConfirm();
              onClose();
            }}
            className="w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md text-center"
          >
            Confirm & Send Cut Command
          </button>
        </div>
      </div>
    </div>
  );
};
