import React from 'react';
import { DeviceInfo } from '../types/transport';
import { PrinterProfile } from '../types/printer';
import { IconPrinter, IconBluetooth, IconUsb, IconZap } from '../icons/LucideIcons';

interface PrinterInfoCardProps {
  device: DeviceInfo | null;
  profile: PrinterProfile;
  totalBytesTransmitted: number;
}

export const PrinterInfoCard: React.FC<PrinterInfoCardProps> = ({
  device,
  profile,
  totalBytesTransmitted,
}) => {
  if (!device) return null;

  const getTransportIcon = () => {
    switch (device.transport) {
      case 'bluetooth':
        return <IconBluetooth size={16} className="text-cyan-400" />;
      case 'usb':
        return <IconUsb size={16} className="text-indigo-400" />;
      case 'mock':
        return <IconZap size={16} className="text-purple-400" />;
      default:
        return <IconPrinter size={16} className="text-emerald-400" />;
    }
  };

  return (
    <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60">
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          {getTransportIcon()}
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Connected Hardware Info: {device.name}
          </span>
          {device.isEmulated && (
            <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded font-mono">
              EMULATED
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          Session Transmitted: <strong className="text-cyan-400">{totalBytesTransmitted}</strong> bytes
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 text-xs">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Transport Protocol</span>
          <span className="text-slate-200 font-medium font-mono uppercase">{device.transport}</span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Identifier / Address</span>
          <span className="text-slate-200 font-mono truncate block" title={device.id}>
            {device.id}
          </span>
        </div>

        {device.transport === 'bluetooth' && (
          <>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">GATT Service UUID</span>
              <span className="text-slate-200 font-mono text-[11px] truncate block" title={device.gattServiceUuid}>
                {device.gattServiceUuid || 'Default Service'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Writable Characteristic</span>
              <span className="text-slate-200 font-mono text-[11px] truncate block" title={device.gattCharUuid}>
                {device.gattCharUuid || 'Auto-Discovered'}
              </span>
            </div>
          </>
        )}

        {device.transport === 'usb' && (
          <>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">USB VID / PID</span>
              <span className="text-slate-200 font-mono">
                {device.usbVendorId !== undefined
                  ? `0x${device.usbVendorId.toString(16)} : 0x${device.usbProductId?.toString(16)}`
                  : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Product Description</span>
              <span className="text-slate-200 truncate block">
                {device.usbProductName || device.name}
              </span>
            </div>
          </>
        )}

        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Active Paper Profile</span>
          <span className="text-slate-200 font-mono">
            {profile.paperWidth}mm ({profile.printableDots} dots / {profile.columnsFontA} cols)
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Auto Cutter Capable</span>
          <span className="text-slate-200 font-mono">
            {profile.supportsCutter ? 'Supported' : 'Not Supported'}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Transfer Chunk Size</span>
          <span className="text-slate-200 font-mono">
            {device.transport === 'bluetooth'
              ? `${profile.bleMtuChunkSize} bytes (${profile.blePacingMs}ms delay)`
              : `${profile.usbChunkSize} bytes`}
          </span>
        </div>
      </div>
    </div>
  );
};
