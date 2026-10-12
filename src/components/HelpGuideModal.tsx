import React from 'react';
import { IconHelpCircle, IconXCircle, IconBluetooth, IconUsb, IconPrinter } from '../icons/LucideIcons';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full flex flex-col shadow-2xl overflow-hidden text-slate-200 max-h-[85vh]">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconHelpCircle size={18} className="text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Thermal Hardware Diagnostic & Troubleshooting Guide
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <IconXCircle size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <IconBluetooth size={16} className="text-cyan-400" />
              <span>1. Web Bluetooth (BLE) Guidelines</span>
            </h3>
            <p>
              Web Bluetooth communicates via GATT Services and Characteristics. Many inexpensive thermal receipt printers use legacy <strong>Bluetooth Classic 2.1 (SPP/RFCOMM)</strong> instead of Bluetooth Low Energy (BLE 4.0+). Browsers cannot access Bluetooth Classic devices directly.
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
              <li>Ensure your printer is a BLE model or switched to BLE dual mode.</li>
              <li>Chrome, Edge, and Opera on Windows, macOS, Linux, and Android support Web Bluetooth.</li>
              <li>The page must be served over HTTPS or <code className="text-cyan-400">http://localhost</code>.</li>
              <li>If the device pairs but disconnects immediately, verify that the write characteristic UUID matches your printer manufacturer’s service spec.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <IconUsb size={16} className="text-indigo-400" />
              <span>2. WebUSB & Windows Driver Configuration</span>
            </h3>
            <p>
              WebUSB requires direct hardware access to the USB device’s bulk transfer endpoint.
            </p>
            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700 space-y-2">
              <span className="font-bold text-amber-400 block">Crucial for Windows Users:</span>
              <p>
                When a USB printer is plugged in on Windows, the operating system assigns a standard print driver (e.g. &quot;USB Printing Support&quot;). This prevents WebUSB from claiming the interface.
              </p>
              <p>
                To enable direct WebUSB communication:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-2">
                <li>Download the free utility <strong>Zadig</strong> (zadig.akeo.ie).</li>
                <li>Select <em>Options &rarr; List All Devices</em>.</li>
                <li>Choose your thermal receipt printer from the dropdown list.</li>
                <li>Select <strong>WinUSB</strong> as the target driver and click <em>Replace Driver</em>.</li>
                <li>Return to ThermoDiagnostix and click <strong>Connect USB</strong>.</li>
              </ol>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <IconPrinter size={16} className="text-emerald-400" />
              <span>3. Browser Print Fallback</span>
            </h3>
            <p>
              If your printer uses OS-level drivers or Bluetooth Classic, select <strong>Browser Print Spooler</strong>. This formats your receipt matching 58mm or 80mm roll width and routes output through the standard system print dialog.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-white">4. ESC/POS Compatibility & Encodings</h3>
            <p>
              Standard ESC/POS commands (initialization, line feeds, emphasis, barcodes) are widely compatible. However, 2D QR codes and auto-cut commands vary across manufacturers (e.g. Epson vs Xprinter vs Rongta). Use the <strong>Receipt Preview &gt; ESC/POS Parser</strong> tab to inspect generated bytecode sequences.
            </p>
          </section>
        </div>

        <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-900/80">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
