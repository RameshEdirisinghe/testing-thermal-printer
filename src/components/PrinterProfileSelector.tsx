import React from 'react';
import { PaperWidth, PrinterProfile } from '../types/printer';
import { ProfileManager } from '../profiles/profileManager';
import { IconSettings } from '../icons/LucideIcons';

interface PrinterProfileSelectorProps {
  activeProfile: PrinterProfile;
  onProfileChange: (profile: PrinterProfile) => void;
  onOpenProfileSettings: () => void;
}

export const PrinterProfileSelector: React.FC<PrinterProfileSelectorProps> = ({
  activeProfile,
  onProfileChange,
  onOpenProfileSettings,
}) => {
  const allProfiles = ProfileManager.getProfiles();

  const handleWidthSelect = (width: PaperWidth) => {
    if (activeProfile.paperWidth !== width) {
      const updated = ProfileManager.switchPaperWidth(width);
      onProfileChange(updated);
    }
  };

  const handleProfileSelect = (profileId: string) => {
    const updated = ProfileManager.setActiveProfileId(profileId);
    onProfileChange(updated);
  };

  return (
    <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      {/* 58mm / 80mm Fast Width Switcher */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Receipt Width:
        </span>
        <div className="inline-flex rounded-lg bg-slate-900 p-1 border border-slate-700">
          <button
            onClick={() => handleWidthSelect(58)}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeProfile.paperWidth === 58
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>58 mm</span>
            <span className="text-[10px] opacity-80">(~2.25 in)</span>
          </button>

          <button
            onClick={() => handleWidthSelect(80)}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeProfile.paperWidth === 80
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>80 mm</span>
            <span className="text-[10px] opacity-80">(~3.125 in)</span>
          </button>
        </div>
      </div>

      {/* Profile Details & Picker */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div className="flex items-center gap-2">
          <label htmlFor="profile-select" className="text-xs text-slate-400">
            Profile:
          </label>
          <select
            id="profile-select"
            value={activeProfile.id}
            onChange={(e) => handleProfileSelect(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            {allProfiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.paperWidth}mm)
              </option>
            ))}
          </select>
        </div>

        {/* Profile metrics badges */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 font-mono bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
          <span>{activeProfile.printableDots} dots</span>
          <span>•</span>
          <span>{activeProfile.columnsFontA} cols (A)</span>
          <span>•</span>
          <span>{activeProfile.supportsCutter ? 'Auto-Cutter: Yes' : 'No Cutter'}</span>
        </div>

        <button
          onClick={onOpenProfileSettings}
          className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-700/50 transition-colors"
          title="Edit Profile Specifications"
        >
          <IconSettings size={15} />
        </button>
      </div>
    </div>
  );
};
