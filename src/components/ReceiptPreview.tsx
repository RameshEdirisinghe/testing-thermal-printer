import React, { useState } from 'react';
import { PrinterProfile } from '../types/printer';
import { ReceiptCustomData } from '../types/escpos';
import { formatHexDump, parseEscPosMnemonics } from '../utils/hexFormatter';
import { IconEye, IconPrinter, IconSettings } from '../icons/LucideIcons';

interface ReceiptPreviewProps {
  profile: PrinterProfile;
  receiptData: ReceiptCustomData;
  generatedBytes: Uint8Array;
  onOpenCustomizer: () => void;
  onPrintReceipt: () => void;
  isPrinting: boolean;
  canPrint: boolean;
  previewTitle?: string;
  onResetPreview?: () => void;
  onRefreshPreview?: () => void;
}

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({
  profile,
  receiptData,
  generatedBytes,
  onOpenCustomizer,
  onPrintReceipt,
  isPrinting,
  canPrint,
  previewTitle,
  onResetPreview,
  onRefreshPreview,
}) => {
  const [viewMode, setViewMode] = useState<'visual' | 'hex' | 'mnemonics' | 'text'>('visual');

  const cols = profile.columnsFontA;
  const is58mm = profile.paperWidth === 58;

  // Calculate totals
  const subtotal = receiptData.items.reduce((acc, item) => acc + item.qty * item.unitPrice, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  // Calculate column overflow warnings
  const overflows: string[] = [];
  if (receiptData.storeName.length > cols) {
    overflows.push(`Store title (${receiptData.storeName.length} chars)`);
  }
  receiptData.headerLines.forEach((h, i) => {
    if (h.length > cols) overflows.push(`Header line #${i + 1} (${h.length} chars)`);
  });
  receiptData.items.forEach((item) => {
    const itemTotalStr = `$${(item.qty * item.unitPrice).toFixed(2)}`;
    const lineLen = item.name.length + item.qty.toString().length + itemTotalStr.length + 2;
    if (lineLen > cols) {
      overflows.push(`Item "${item.name}" exceeds row allocation`);
    }
  });
  receiptData.footerLines.forEach((f, i) => {
    if (f.length > cols) overflows.push(`Footer line #${i + 1} (${f.length} chars)`);
  });

  return (
    <div className="bg-slate-800/80 rounded-xl border border-slate-700/80 shadow-md flex flex-col h-full overflow-hidden">
      {/* Card Header & Controls */}
      <div className="p-3 sm:p-4 border-b border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/60">
        <div className="flex items-center gap-2 flex-wrap">
          <IconEye size={18} className="text-cyan-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Receipt Preview
          </h2>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-900 text-cyan-400 font-mono border border-slate-700">
            {profile.paperWidth}mm ({cols}c)
          </span>
        </div>

        {/* View Mode Tabs */}
        <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-700 text-xs overflow-x-auto max-w-full">
          <button
            onClick={() => setViewMode('visual')}
            className={`px-2.5 py-1.5 sm:py-1 rounded font-medium transition-all flex-shrink-0 ${
              viewMode === 'visual' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="sm:hidden">Visual</span>
            <span className="hidden sm:inline">Visual Paper</span>
          </button>
          <button
            onClick={() => setViewMode('hex')}
            className={`px-2.5 py-1.5 sm:py-1 rounded font-medium transition-all flex-shrink-0 ${
              viewMode === 'hex' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="sm:hidden">Hex</span>
            <span className="hidden sm:inline">Hex Dump</span>
          </button>
          <button
            onClick={() => setViewMode('mnemonics')}
            className={`px-2.5 py-1.5 sm:py-1 rounded font-medium transition-all flex-shrink-0 ${
              viewMode === 'mnemonics' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="sm:hidden">Parser</span>
            <span className="hidden sm:inline">ESC/POS Parser</span>
          </button>
          <button
            onClick={() => setViewMode('text')}
            className={`px-2.5 py-1.5 sm:py-1 rounded font-medium transition-all flex-shrink-0 ${
              viewMode === 'text' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="sm:hidden">Text</span>
            <span className="hidden sm:inline">Raw Text</span>
          </button>
        </div>
      </div>

      {/* Preview Context & Overflow Alert Banners */}
      {previewTitle && previewTitle !== 'Custom Test Receipt' && (
        <div className="px-3 sm:px-4 py-2 bg-cyan-950/40 border-b border-cyan-800/40 text-xs text-cyan-300 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-medium truncate">
            <IconEye size={14} className="text-cyan-400 flex-shrink-0" />
            <span className="truncate">Previewing: <strong>{previewTitle}</strong></span>
          </div>
          {onResetPreview && (
            <button
              onClick={onResetPreview}
              className="px-2 py-0.5 rounded bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 text-[11px] font-semibold border border-cyan-700/60 transition-colors flex-shrink-0"
            >
              Reset to Receipt
            </button>
          )}
        </div>
      )}

      {overflows.length > 0 && (
        <div className="px-3 sm:px-4 py-2 bg-amber-950/40 border-b border-amber-800/40 text-[11px] text-amber-300 flex items-start gap-1.5">
          <span className="font-bold flex-shrink-0">⚠️ Overflow:</span>
          <span className="leading-relaxed">
            {overflows.length} item(s) exceed {cols} columns for {profile.paperWidth}mm paper ({overflows.slice(0, 2).join(', ')}{overflows.length > 2 ? ` +${overflows.length - 2} more` : ''}). Content will wrap or clip on physical printer.
          </span>
        </div>
      )}

      {/* Main Preview Container */}
      <div className="flex-1 p-3 sm:p-4 bg-slate-950/60 overflow-y-auto max-h-[600px] flex items-start justify-center">
        {viewMode === 'visual' && (
          <div
            className={`bg-[#fafaf7] text-[#111827] shadow-2xl rounded-sm p-4 font-mono select-none transition-all duration-200 border-x border-slate-300 relative ${
              is58mm ? 'w-full max-w-[260px] text-[11px]' : 'w-full max-w-[340px] sm:max-w-[360px] text-[12px]'
            }`}
            style={{
              lineHeight: '1.25',
              backgroundImage: 'repeating-linear-gradient(0deg, #fafaf7, #fafaf7 20px, #f5f5f0 21px)',
            }}
          >
            {/* Top Serrated Edge Graphic */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-repeat-x opacity-60 pointer-events-none"
                 style={{ backgroundImage: 'radial-gradient(circle, transparent 2px, #fafaf7 2px)', backgroundSize: '6px 6px' }} />

            {/* Header */}
            <div className="text-center font-bold text-sm tracking-wide mb-1">
              {receiptData.storeName || 'THERMODIAGNOSTIX'}
            </div>
            {receiptData.headerLines.map((line, idx) => (
              <div key={idx} className="text-center text-[10px] text-gray-700">
                {line}
              </div>
            ))}

            <div className="my-2 border-b border-dashed border-gray-400 text-center text-[9px] text-gray-500">
              {new Date().toISOString().replace('T', ' ').substring(0, 19)}
            </div>

            {/* Table Header */}
            <div className="flex justify-between font-bold border-b border-gray-400 pb-0.5 text-[10px]">
              <span className="flex-1">ITEM</span>
              <span className="w-8 text-center">QTY</span>
              <span className="w-14 text-right">TOTAL</span>
            </div>

            {/* Items */}
            <div className="space-y-1 my-1.5">
              {receiptData.items.map((item) => (
                <div key={item.id} className="flex justify-between text-[11px]">
                  <span className="flex-1 truncate pr-1">{item.name}</span>
                  <span className="w-8 text-center">{item.qty}</span>
                  <span className="w-14 text-right">${(item.qty * item.unitPrice).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Separator */}
            <div className="border-b border-dashed border-gray-400 my-1.5" />

            {/* Totals */}
            <div className="space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (8%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-xs pt-1 border-t border-gray-300">
                <span>TOTAL:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Barcode Mock Visual */}
            {receiptData.barcodeValue && (
              <div className="my-3 text-center">
                <div className="h-10 mx-auto bg-repeat-x bg-[length:4px_100%] bg-gradient-to-r from-black via-black to-transparent max-w-[180px] border-x border-black" />
                <div className="text-[10px] font-mono tracking-widest mt-0.5">{receiptData.barcodeValue}</div>
              </div>
            )}

            {/* QR Code Mock Visual */}
            {receiptData.qrValue && (
              <div className="my-3 text-center">
                <div className="w-20 h-20 mx-auto border-2 border-black flex items-center justify-center bg-white p-1">
                  <div className="w-full h-full bg-slate-900/90 flex items-center justify-center text-[9px] text-white font-mono p-1 text-center">
                    QR CODE
                  </div>
                </div>
                <div className="text-[9px] text-gray-600 truncate mt-0.5">{receiptData.qrValue}</div>
              </div>
            )}

            {/* Footer */}
            <div className="border-b border-dashed border-gray-400 my-2" />
            <div className="text-center space-y-0.5 text-[10px] text-gray-600">
              {receiptData.footerLines.map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>

            {/* Feed & Cut representation */}
            <div className="mt-3 text-center text-[9px] text-gray-400 italic">
              --- Paper Fed ({receiptData.feedLines} lines) & {receiptData.includeCut ? 'Cut' : 'Torn'} ---
            </div>
          </div>
        )}

        {viewMode === 'hex' && (
          <div className="w-full h-full">
            <div className="text-[11px] text-slate-400 mb-2 font-mono">
              Payload Buffer Size: {generatedBytes.length} bytes (0x{generatedBytes.length.toString(16).toUpperCase()})
            </div>
            <pre className="font-mono text-xs bg-slate-900 p-3 rounded border border-slate-800 text-emerald-400 overflow-x-auto whitespace-pre">
              {formatHexDump(generatedBytes)}
            </pre>
          </div>
        )}

        {viewMode === 'mnemonics' && (
          <div className="w-full h-full">
            <div className="text-[11px] text-slate-400 mb-2 font-mono">
              Interpreted ESC/POS Command Sequence:
            </div>
            <div className="space-y-1 font-mono text-xs bg-slate-900 p-3 rounded border border-slate-800 text-cyan-300 max-h-[480px] overflow-y-auto">
              {parseEscPosMnemonics(generatedBytes).map((item, i) => (
                <div key={i} className="py-0.5 border-b border-slate-800/60 font-mono text-[11px]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'text' && (
          <div className="w-full h-full">
            <pre className="font-mono text-xs bg-slate-900 p-3 rounded border border-slate-800 text-slate-200 overflow-x-auto whitespace-pre">
              {Array.from(generatedBytes)
                .map((b) => (b === 10 ? '\n' : b >= 32 && b <= 126 ? String.fromCharCode(b) : ''))
                .join('')}
            </pre>
          </div>
        )}
      </div>

      {/* Action Footer with distinct Preview and Print actions */}
      <div className="p-3 sm:p-4 border-t border-slate-700/80 bg-slate-800/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setViewMode('visual');
              if (onRefreshPreview) onRefreshPreview();
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 transition-colors"
            title="Update and view visual preview without transmitting to hardware"
          >
            <IconEye size={14} />
            <span>Preview Receipt</span>
          </button>

          <button
            onClick={onOpenCustomizer}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-colors"
          >
            <IconSettings size={14} />
            <span>Customize</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t border-slate-800/40 sm:border-0">
          <span className="text-[11px] text-slate-400 text-center sm:text-right">
            {canPrint ? 'Ready to transmit' : 'Connect printer to print'}
          </span>
          <button
            onClick={onPrintReceipt}
            disabled={!canPrint || isPrinting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-cyan-950/40 transition-colors"
          >
            <IconPrinter size={16} />
            <span>{isPrinting ? 'Printing...' : 'Print Test Receipt'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
