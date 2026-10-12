import React, { useState } from 'react';
import { ConnectionStatus, DeviceInfo } from '../types/transport';
import { PrinterProfile } from '../types/printer';
import { BrowserEnvironmentInfo } from '../utils/browserDetection';
import { IconBluetooth, IconUsb, IconPrinter, IconZap, IconAlertTriangle, IconRefreshCw } from '../icons/LucideIcons';

interface ConnectionPanelProps {
  status: ConnectionStatus;
  activeDevice: DeviceInfo | null;
  activeProfile: PrinterProfile;
  env: BrowserEnvironmentInfo;
  onConnectBle: (customService?: string, customChar?: string) => Promise<void>;
  onConnectUsb: (vendorId?: number, productId?: number) => Promise<void>;
  onConnectBrowserFallback: () => Promise<void>;
  onConnectMock: () => Promise<void>;
  onDisconnect: () => Promise<void>;
}

export const ConnectionPanel: React.FC<ConnectionPanelProps> = ({
  status,
  activeDevice,
  env,
  onConnectBle,
  onConnectUsb,
  onConnectBrowserFallback,
  onConnectMock,
  onDisconnect,
}) => {
  const [bleServiceUuid, setBleServiceUuid] = useState('');
  const [bleCharUuid, setBleCharUuid] = useState('');
  const [showBleAdvanced, setShowBleAdvanced] = useState(false);

  const [usbVendorId, setUsbVendorId] = useState('');
  const [usbProductId, setUsbProductId] = useState('');
  const [showUsbAdvanced, setShowUsbAdvanced] = useState(false);

  const [connectingCard, setConnectingCard] = useState<string | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const [mobileTransportTab, setMobileTransportTab] = useState<'bluetooth' | 'usb' | 'browser' | 'mock'>('bluetooth');

  React.useEffect(() => {
    if (activeDevice?.transport) {
      setMobileTransportTab(activeDevice.transport as any);
    }
  }, [activeDevice?.transport]);

  const isConnected = status === 'connected';
  const isBusy = status === 'connecting' || status === 'disconnecting';

  const handleBleClick = async () => {
    setCardError(null);
    setConnectingCard('ble');
    try {
      await onConnectBle(bleServiceUuid || undefined, bleCharUuid || undefined);
    } catch (err: unknown) {
      setCardError(err instanceof Error ? err.message : String(err));
    } finally {
      setConnectingCard(null);
    }
  };

  const handleUsbClick = async () => {
    setCardError(null);
    setConnectingCard('usb');
    try {
      const parseHex = (val: string, name: string): number | undefined => {
        const clean = val.trim().replace(/^0x/i, '');
        if (!clean) return undefined;
        if (!/^[0-9a-fA-F]{1,4}$/.test(clean)) {
          throw new Error(`Invalid ${name} "${val}". Must be a valid 16-bit hex code (e.g. 0x0416 or 0416).`);
        }
        const parsed = parseInt(clean, 16);
        if (isNaN(parsed)) {
          throw new Error(`Invalid ${name} "${val}".`);
        }
        return parsed;
      };

      const vid = parseHex(usbVendorId, 'Vendor ID');
      const pid = parseHex(usbProductId, 'Product ID');
      await onConnectUsb(vid, pid);
    } catch (err: unknown) {
      setCardError(err instanceof Error ? err.message : String(err));
    } finally {
      setConnectingCard(null);
    }
  };

  const handleBrowserFallbackClick = async () => {
    setCardError(null);
    setConnectingCard('browser');
    try {
      await onConnectBrowserFallback();
    } catch (err: unknown) {
      setCardError(err instanceof Error ? err.message : String(err));
    } finally {
      setConnectingCard(null);
    }
  };

  const handleMockClick = async () => {
    setCardError(null);
    setConnectingCard('mock');
    try {
      await onConnectMock();
    } catch (err: unknown) {
      setCardError(err instanceof Error ? err.message : String(err));
    } finally {
      setConnectingCard(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <span>Printer Transports & Hardware Connect</span>
        </h2>
        {isConnected && (
          <button
            onClick={onDisconnect}
            disabled={isBusy}
            className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Disconnect {activeDevice?.name}</span>
          </button>
        )}
      </div>

      {cardError && (
        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-200 text-xs flex items-start gap-2">
          <IconAlertTriangle size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Connection Notice: </span>
            <span>{cardError}</span>
          </div>
          <button onClick={() => setCardError(null)} className="text-rose-400 hover:text-white font-bold ml-2">
            &times;
          </button>
        </div>
      )}

      {/* Mobile Transport Segmented Tabs (Visible on < md) */}
      <div className="grid grid-cols-4 md:hidden rounded-xl bg-slate-900/90 p-1 border border-slate-700/80 shadow-sm text-xs">
        <button
          type="button"
          onClick={() => setMobileTransportTab('bluetooth')}
          className={`py-2 px-1 rounded-lg font-semibold text-[11px] transition-all flex flex-col items-center justify-center gap-1 ${
            mobileTransportTab === 'bluetooth'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <IconBluetooth size={16} />
          <span>BLE</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTransportTab('usb')}
          className={`py-2 px-1 rounded-lg font-semibold text-[11px] transition-all flex flex-col items-center justify-center gap-1 ${
            mobileTransportTab === 'usb'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <IconUsb size={16} />
          <span>USB</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTransportTab('browser')}
          className={`py-2 px-1 rounded-lg font-semibold text-[11px] transition-all flex flex-col items-center justify-center gap-1 ${
            mobileTransportTab === 'browser'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <IconPrinter size={16} />
          <span>Browser</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTransportTab('mock')}
          className={`py-2 px-1 rounded-lg font-semibold text-[11px] transition-all flex flex-col items-center justify-center gap-1 ${
            mobileTransportTab === 'mock'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <IconZap size={16} />
          <span>Simulator</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Bluetooth BLE Card */}
        <div
          className={`rounded-xl p-4 border flex flex-col justify-between transition-all ${
            mobileTransportTab === 'bluetooth' ? 'flex' : 'hidden md:flex'
          } ${
            activeDevice?.transport === 'bluetooth'
              ? 'bg-slate-800/90 border-cyan-500 shadow-lg shadow-cyan-950/40'
              : 'bg-slate-800/50 border-slate-700/80 hover:border-slate-600'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <IconBluetooth size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Bluetooth BLE</h3>
                  <span className="text-[10px] text-slate-400">GATT Characteristic Write</span>
                </div>
              </div>
              {activeDevice?.transport === 'bluetooth' && (
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                  ACTIVE
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Connect to Bluetooth 4.0+ BLE thermal receipt printers via browser GATT Server.
            </p>

            {/* Support check */}
            {!env.hasWebBluetooth && (
              <div className="text-[11px] text-amber-400/90 bg-amber-950/30 p-2 rounded border border-amber-900/50">
                Unavailable in this browser or context. Chrome/Edge over HTTPS required.
              </div>
            )}

            {/* Custom UUIDs collapsible */}
            <div>
              <button
                type="button"
                onClick={() => setShowBleAdvanced(!showBleAdvanced)}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                {showBleAdvanced ? 'Hide Custom UUIDs' : 'Configure Custom UUIDs'}
              </button>
              {showBleAdvanced && (
                <div className="mt-2 space-y-2 text-xs bg-slate-900/80 p-2 rounded border border-slate-800">
                  <div>
                    <label className="text-[10px] text-slate-400">Custom Service UUID</label>
                    <input
                      type="text"
                      placeholder="e.g. e7810a71-..."
                      value={bleServiceUuid}
                      onChange={(e) => setBleServiceUuid(e.target.value)}
                      className="w-full mt-0.5 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Custom Characteristic UUID</label>
                    <input
                      type="text"
                      placeholder="e.g. 0000ff02-..."
                      value={bleCharUuid}
                      onChange={(e) => setBleCharUuid(e.target.value)}
                      className="w-full mt-0.5 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 text-xs font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-auto">
            {activeDevice?.transport === 'bluetooth' ? (
              <button
                onClick={onDisconnect}
                disabled={isBusy}
                className="w-full py-2 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/40 transition-colors"
              >
                Disconnect BLE
              </button>
            ) : (
              <button
                onClick={handleBleClick}
                disabled={!env.hasWebBluetooth || isBusy || isConnected}
                className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md transition-colors flex items-center justify-center gap-2"
              >
                {connectingCard === 'ble' && <IconRefreshCw size={14} className="animate-spin" />}
                <span>Connect Bluetooth</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. WebUSB Card */}
        <div
          className={`rounded-xl p-4 border flex flex-col justify-between transition-all ${
            mobileTransportTab === 'usb' ? 'flex' : 'hidden md:flex'
          } ${
            activeDevice?.transport === 'usb'
              ? 'bg-slate-800/90 border-cyan-500 shadow-lg shadow-cyan-950/40'
              : 'bg-slate-800/50 border-slate-700/80 hover:border-slate-600'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <IconUsb size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Direct WebUSB</h3>
                  <span className="text-[10px] text-slate-400">Bulk OUT Transfer</span>
                </div>
              </div>
              {activeDevice?.transport === 'usb' && (
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                  ACTIVE
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Connect to compatible USB thermal POS printers directly through WebUSB endpoints.
            </p>

            {!env.hasWebUsb && (
              <div className="text-[11px] text-amber-400/90 bg-amber-950/30 p-2 rounded border border-amber-900/50">
                Unavailable in this browser or context. Chrome/Edge required.
              </div>
            )}

            {/* Custom VID/PID */}
            <div>
              <button
                type="button"
                onClick={() => setShowUsbAdvanced(!showUsbAdvanced)}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                {showUsbAdvanced ? 'Hide Custom VID/PID' : 'Filter by VID / PID'}
              </button>
              {showUsbAdvanced && (
                <div className="mt-2 space-y-2 text-xs bg-slate-900/80 p-2 rounded border border-slate-800">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400">Vendor ID (Hex)</label>
                      <input
                        type="text"
                        placeholder="0x0416"
                        value={usbVendorId}
                        onChange={(e) => setUsbVendorId(e.target.value)}
                        className="w-full mt-0.5 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Product ID (Hex)</label>
                      <input
                        type="text"
                        placeholder="0x5011"
                        value={usbProductId}
                        onChange={(e) => setUsbProductId(e.target.value)}
                        className="w-full mt-0.5 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-auto">
            {activeDevice?.transport === 'usb' ? (
              <button
                onClick={onDisconnect}
                disabled={isBusy}
                className="w-full py-2 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/40 transition-colors"
              >
                Disconnect USB
              </button>
            ) : (
              <button
                onClick={handleUsbClick}
                disabled={!env.hasWebUsb || isBusy || isConnected}
                className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md transition-colors flex items-center justify-center gap-2"
              >
                {connectingCard === 'usb' && <IconRefreshCw size={14} className="animate-spin" />}
                <span>Connect USB</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Browser Print Fallback */}
        <div
          className={`rounded-xl p-4 border flex flex-col justify-between transition-all ${
            mobileTransportTab === 'browser' ? 'flex' : 'hidden md:flex'
          } ${
            activeDevice?.transport === 'browser'
              ? 'bg-slate-800/90 border-cyan-500 shadow-lg shadow-cyan-950/40'
              : 'bg-slate-800/50 border-slate-700/80 hover:border-slate-600'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <IconPrinter size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Browser Print</h3>
                  <span className="text-[10px] text-slate-400">OS Driver Fallback</span>
                </div>
              </div>
              {activeDevice?.transport === 'browser' && (
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                  ACTIVE
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Standard operating system print dialog fallback. Works on any browser with installed printer drivers.
            </p>

            <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800">
              Uses @media print CSS matching the exact 58mm / 80mm receipt width geometry.
            </div>
          </div>

          <div className="pt-4 mt-auto">
            {activeDevice?.transport === 'browser' ? (
              <button
                onClick={onDisconnect}
                disabled={isBusy}
                className="w-full py-2 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/40 transition-colors"
              >
                Disconnect Spooler
              </button>
            ) : (
              <button
                onClick={handleBrowserFallbackClick}
                disabled={isBusy || isConnected}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md transition-colors flex items-center justify-center gap-2"
              >
                {connectingCard === 'browser' && <IconRefreshCw size={14} className="animate-spin" />}
                <span>Use Browser Spooler</span>
              </button>
            )}
          </div>
        </div>

        {/* 4. Virtual Simulator (Mock) */}
        <div
          className={`rounded-xl p-4 border flex flex-col justify-between transition-all ${
            mobileTransportTab === 'mock' ? 'flex' : 'hidden md:flex'
          } ${
            activeDevice?.transport === 'mock'
              ? 'bg-slate-800/90 border-cyan-500 shadow-lg shadow-cyan-950/40'
              : 'bg-slate-800/50 border-slate-700/80 hover:border-slate-600'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <IconZap size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Hardware Simulator</h3>
                  <span className="text-[10px] text-purple-400 font-mono">Emulated POS Engine</span>
                </div>
              </div>
              {activeDevice?.transport === 'mock' && (
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                  ACTIVE
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Virtual hardware simulator for test verification without requiring a physical printer attached.
            </p>

            <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800">
              Captures raw ESC/POS bytes, simulates latency, packet pacing, and buffer verification.
            </div>
          </div>

          <div className="pt-4 mt-auto">
            {activeDevice?.transport === 'mock' ? (
              <button
                onClick={onDisconnect}
                disabled={isBusy}
                className="w-full py-2 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/40 transition-colors"
              >
                Disconnect Simulator
              </button>
            ) : (
              <button
                onClick={handleMockClick}
                disabled={isBusy || isConnected}
                className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md transition-colors flex items-center justify-center gap-2"
              >
                {connectingCard === 'mock' && <IconRefreshCw size={14} className="animate-spin" />}
                <span>Activate Simulator</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
