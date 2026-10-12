import React, { useState } from 'react';
import { PaperWidth, PrinterProfile } from '../types/printer';
import { ProfileManager } from '../profiles/profileManager';
import { IconSettings, IconXCircle, IconCheckCircle } from '../icons/LucideIcons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: PrinterProfile;
  onProfileUpdated: (profile: PrinterProfile) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  activeProfile,
  onProfileUpdated,
}) => {
  const [profile, setProfile] = useState<PrinterProfile>({ ...activeProfile });

  if (!isOpen) return null;

  const handleSave = () => {
    ProfileManager.saveCustomProfile(profile);
    ProfileManager.setActiveProfileId(profile.id);
    onProfileUpdated(profile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full flex flex-col shadow-2xl overflow-hidden text-slate-200">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconSettings size={18} className="text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Printer Profile & Hardware Configuration
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <IconXCircle size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Profile Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Paper Width</label>
              <select
                value={profile.paperWidth}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    paperWidth: Number(e.target.value) as PaperWidth,
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
              >
                <option value={58}>58 mm</option>
                <option value={80}>80 mm</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Printable Dots</label>
              <input
                type="number"
                value={profile.printableDots}
                onChange={(e) => setProfile({ ...profile, printableDots: Number(e.target.value) || 384 })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Columns Font A (12x24)</label>
              <input
                type="number"
                value={profile.columnsFontA}
                onChange={(e) => setProfile({ ...profile, columnsFontA: Number(e.target.value) || 32 })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Columns Font B (9x17)</label>
              <input
                type="number"
                value={profile.columnsFontB}
                onChange={(e) => setProfile({ ...profile, columnsFontB: Number(e.target.value) || 42 })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Feed Lines After Print</label>
              <input
                type="number"
                value={profile.feedLinesAfterPrint}
                onChange={(e) => setProfile({ ...profile, feedLinesAfterPrint: Number(e.target.value) || 3 })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Line Spacing (Dots)</label>
              <input
                type="number"
                value={profile.lineSpacingDots ?? 30}
                onChange={(e) => setProfile({ ...profile, lineSpacingDots: Number(e.target.value) || 30 })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Left Margin (Dots)</label>
              <input
                type="number"
                value={profile.marginLeftDots ?? 0}
                onChange={(e) => setProfile({ ...profile, marginLeftDots: Number(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Right Margin (Dots)</label>
              <input
                type="number"
                value={profile.marginRightDots ?? 0}
                onChange={(e) => setProfile({ ...profile, marginRightDots: Number(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Default Alignment</label>
              <select
                value={profile.defaultAlignment ?? 'left'}
                onChange={(e) => setProfile({ ...profile, defaultAlignment: e.target.value as any })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-lg space-y-2 border border-slate-700/60">
            <span className="font-bold text-slate-300 block mb-1">Hardware Capabilities</span>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.supportsCutter}
                  onChange={(e) => setProfile({ ...profile, supportsCutter: e.target.checked })}
                  className="rounded border-slate-700 text-cyan-500"
                />
                <span className="text-slate-300">Auto Cutter Present</span>
              </label>

              {profile.supportsCutter && (
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Cut Mode</label>
                  <select
                    value={profile.cutType ?? 'partial'}
                    onChange={(e) => setProfile({ ...profile, cutType: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-1 text-white text-xs font-mono"
                  >
                    <option value="partial">Partial Cut (GS V 1)</option>
                    <option value="full">Full Cut (GS V 0)</option>
                  </select>
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.supportsStatusQuery}
                onChange={(e) => setProfile({ ...profile, supportsStatusQuery: e.target.checked })}
                className="rounded border-slate-700 text-cyan-500"
              />
              <span className="text-slate-300">Bidirectional DLE EOT Status Query Supported</span>
            </label>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-lg space-y-3 border border-slate-700/60">
            <span className="font-bold text-slate-300 block">Transport Packet Tuning</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">BLE MTU Chunk (Bytes)</label>
                <input
                  type="number"
                  value={profile.bleMtuChunkSize}
                  onChange={(e) => setProfile({ ...profile, bleMtuChunkSize: Number(e.target.value) || 64 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">BLE Pacing Delay (ms)</label>
                <input
                  type="number"
                  value={profile.blePacingMs}
                  onChange={(e) => setProfile({ ...profile, blePacingMs: Number(e.target.value) || 15 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">WebUSB Chunk Size (Bytes)</label>
              <input
                type="number"
                value={profile.usbChunkSize}
                onChange={(e) => setProfile({ ...profile, usbChunkSize: Number(e.target.value) || 512 })}
                className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 flex justify-end gap-2 bg-slate-900/80">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md"
          >
            <IconCheckCircle size={14} />
            <span>Save Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
