import { PrinterProfile, PaperWidth } from '../types/printer';
import { DEFAULT_PROFILES } from './defaultProfiles';

const STORAGE_KEY_PROFILES = 'thermo_diagnostix_profiles';
const STORAGE_KEY_ACTIVE = 'thermo_diagnostix_active_profile_id';

export class ProfileManager {
  private static profiles: Record<string, PrinterProfile> = { ...DEFAULT_PROFILES };
  private static activeProfileId = 'standard-80mm';

  static init(): void {
    try {
      const savedProfiles = localStorage.getItem(STORAGE_KEY_PROFILES);
      if (savedProfiles) {
        const parsed = JSON.parse(savedProfiles) as Record<string, PrinterProfile>;
        this.profiles = { ...DEFAULT_PROFILES, ...parsed };
      }
      const savedActive = localStorage.getItem(STORAGE_KEY_ACTIVE);
      if (savedActive && this.profiles[savedActive]) {
        this.activeProfileId = savedActive;
      }
    } catch {
      // Ignore localStorage issues in non-browser or sandbox environments
    }
  }

  static getProfiles(): PrinterProfile[] {
    return Object.values(this.profiles);
  }

  static getActiveProfile(): PrinterProfile {
    return this.profiles[this.activeProfileId] || DEFAULT_PROFILES['standard-80mm'];
  }

  static setActiveProfileId(id: string): PrinterProfile {
    if (this.profiles[id]) {
      this.activeProfileId = id;
      try {
        localStorage.setItem(STORAGE_KEY_ACTIVE, id);
      } catch {
        // ignore
      }
    }
    return this.getActiveProfile();
  }

  /**
   * Switches the active paper width to 58mm or 80mm using default profiles
   */
  static switchPaperWidth(width: PaperWidth): PrinterProfile {
    const targetId = width === 58 ? 'standard-58mm' : 'standard-80mm';
    return this.setActiveProfileId(targetId);
  }

  static saveCustomProfile(profile: PrinterProfile): void {
    this.profiles[profile.id] = profile;
    try {
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(this.profiles));
    } catch {
      // ignore
    }
  }
}

// Initialise right away
ProfileManager.init();
