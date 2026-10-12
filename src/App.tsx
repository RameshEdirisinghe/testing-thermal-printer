import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ConnectionStatus, DeviceInfo, PrinterTransport } from './types/transport';
import { PrinterProfile } from './types/printer';
import { DiagnosticTestId, DiagnosticTestResult } from './types/test';
import { LogEntry, LogSeverity, LogCategory } from './types/log';
import { ReceiptCustomData } from './types/escpos';
import { ProfileManager } from './profiles/profileManager';
import { detectBrowserEnvironment } from './utils/browserDetection';
import { generateDiagnosticJson, generateDiagnosticTxt, downloadFile } from './utils/exportReport';
import { EscPosBuilder } from './escpos/builder';
import { BasePrinterTransport } from './transports/base';
import { BluetoothBleTransport } from './transports/bluetooth';
import { WebUsbTransport } from './transports/usb';
import { BrowserPrintTransport } from './transports/browser';
import { MockPrinterTransport } from './transports/mock';
import { PrintJobQueue } from './transports/queue';
import { DiagnosticTestRunner } from './diagnostics/testRunner';
import { DIAGNOSTIC_TESTS } from './diagnostics/testDefinitions';

import { Header } from './components/Header';
import { BrowserCompatibilityBanner } from './components/BrowserCompatibilityBanner';
import { PrinterProfileSelector } from './components/PrinterProfileSelector';
import { ConnectionPanel } from './components/ConnectionPanel';
import { PrinterInfoCard } from './components/PrinterInfoCard';
import { ReceiptPreview } from './components/ReceiptPreview';
import { DiagnosticTestDashboard } from './components/DiagnosticTestDashboard';
import { ActivityLogViewer } from './components/ActivityLogViewer';
import { ReceiptBuilderModal } from './components/ReceiptBuilderModal';
import { SettingsModal } from './components/SettingsModal';
import { HelpGuideModal } from './components/HelpGuideModal';
import { VerificationModal } from './components/VerificationModal';
import { StressTestModal } from './components/StressTestModal';
import { CutterModal } from './components/CutterModal';
import { PrintableReceipt } from './components/PrintableReceipt';

const DEFAULT_RECEIPT_DATA: ReceiptCustomData = {
  storeName: 'THE ROASTERY & BAKERY',
  headerLines: ['124 Market St, Suite 400', 'Tel: (555) 019-2834', 'VAT ID: 8829-1029'],
  items: [
    { id: '1', name: 'Artisan Espresso Double', qty: 2, unitPrice: 3.5 },
    { id: '2', name: 'Almond Croissant', qty: 1, unitPrice: 4.25 },
    { id: '3', name: 'Iced Matcha Latte', qty: 1, unitPrice: 5.75 },
    { id: '4', name: 'Caramel Macchiato', qty: 1, unitPrice: 5.2 },
  ],
  footerLines: ['Thank you for your visit!', 'Keep this receipt for returns', 'www.theroastery.sample'],
  barcodeValue: 'REC-2026-904',
  qrValue: 'https://theroastery.sample/feedback',
  includeCut: true,
  feedLines: 4,
};

export const App: React.FC = () => {
  const [activeProfile, setActiveProfile] = useState<PrinterProfile>(ProfileManager.getActiveProfile());
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [activeDevice, setActiveDevice] = useState<DeviceInfo | null>(null);
  const [totalBytesTransmitted, setTotalBytesTransmitted] = useState<number>(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [receiptData, setReceiptData] = useState<ReceiptCustomData>(DEFAULT_RECEIPT_DATA);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [previewTestPayload, setPreviewTestPayload] = useState<{ id: DiagnosticTestId; title: string; bytes: Uint8Array } | null>(null);
  const [browserPrintText, setBrowserPrintText] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'tests' | 'preview' | 'logs'>('tests');

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isReceiptBuilderOpen, setIsReceiptBuilderOpen] = useState(false);
  const [isStressModalOpen, setIsStressModalOpen] = useState(false);
  const [isCutterModalOpen, setIsCutterModalOpen] = useState(false);
  const [activeVerifyTestId, setActiveVerifyTestId] = useState<DiagnosticTestId | null>(null);

  // Core Service Instances
  const queueRef = useRef<PrintJobQueue>(new PrintJobQueue());
  const runnerRef = useRef<DiagnosticTestRunner>(new DiagnosticTestRunner());
  const activeTransportRef = useRef<PrinterTransport | null>(null);
  const unsubStateRef = useRef<(() => void) | null>(null);

  const [testResults, setTestResults] = useState<Map<DiagnosticTestId, DiagnosticTestResult>>(
    runnerRef.current.getResults()
  );

  const env = useMemo(() => detectBrowserEnvironment(), []);

  // Logger helper
  const addLog = useCallback((severity: LogSeverity, category: LogCategory, message: string, data?: Record<string, unknown>) => {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toTimeString().substring(0, 8),
      severity,
      category,
      message,
      data,
    };
    setLogs((prev) => [entry, ...prev.slice(0, 199)]); // Keep last 200 logs
  }, []);

  // Subscribe to transport log events
  useEffect(() => {
    const unsubLog = BasePrinterTransport.onLog((severity, category, msg, data) => {
      addLog(severity, category, msg, data);
    });

    const unsubTest = runnerRef.current.subscribe((updatedResults) => {
      setTestResults(updatedResults);
    });

    const unsubBrowserPayload = BrowserPrintTransport.onPrintPayload((text) => {
      setBrowserPrintText(text);
    });

    addLog('info', 'system', `ThermoDiagnostix initialized in ${env.browserName} on ${env.osName}`);

    return () => {
      unsubLog();
      unsubTest();
      unsubBrowserPayload();
    };
  }, [addLog, env]);

  // Set up transport listener
  const bindTransport = useCallback((transport: PrinterTransport | null) => {
    if (unsubStateRef.current) {
      unsubStateRef.current();
      unsubStateRef.current = null;
    }

    activeTransportRef.current = transport;
    queueRef.current.setTransport(transport);

    if (transport) {
      unsubStateRef.current = transport.onStateChange((newStatus, info) => {
        setStatus(newStatus);
        setActiveDevice(info);
      });
    } else {
      setStatus('disconnected');
      setActiveDevice(null);
    }
  }, []);

  const handleDisconnect = async () => {
    if (activeTransportRef.current) {
      const prev = activeTransportRef.current;
      activeTransportRef.current = null;
      try {
        await prev.disconnect();
      } catch (err) {
        console.warn('Disconnect error:', err);
      }
      bindTransport(null);
    }
  };

  // Connection Handlers
  const handleConnectBle = async (customService?: string, customChar?: string) => {
    await handleDisconnect();
    const transport = new BluetoothBleTransport();
    bindTransport(transport);
    try {
      await transport.connect({ profile: activeProfile, customServiceUuid: customService, customCharUuid: customChar });
    } catch (err) {
      bindTransport(null);
      throw err;
    }
  };

  const handleConnectUsb = async (vendorId?: number, productId?: number) => {
    await handleDisconnect();
    const transport = new WebUsbTransport();
    bindTransport(transport);
    try {
      await transport.connect({ profile: activeProfile, vendorId, productId });
    } catch (err) {
      bindTransport(null);
      throw err;
    }
  };

  const handleConnectBrowserFallback = async () => {
    await handleDisconnect();
    const transport = new BrowserPrintTransport();
    bindTransport(transport);
    await transport.connect();
  };

  const handleConnectMock = async () => {
    await handleDisconnect();
    const transport = new MockPrinterTransport({ name: 'Virtual Thermal POS Simulator' });
    bindTransport(transport);
    await transport.connect();
  };

  // Compile ESC/POS payload for the test receipt
  const generatedReceiptBytes = useMemo(() => {
    const cols = activeProfile.columnsFontA;
    const subtotal = receiptData.items.reduce((acc, item) => acc + item.qty * item.unitPrice, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    const builder = new EscPosBuilder().init();

    // Hardware Left Margin
    if (activeProfile.marginLeftDots && activeProfile.marginLeftDots > 0) {
      builder.leftMargin(activeProfile.marginLeftDots);
    }
    // Hardware Line Spacing
    if (activeProfile.lineSpacingDots) {
      builder.lineSpacing(activeProfile.lineSpacingDots);
    }

    const titleAlign = receiptData.alignment || 'center';
    builder.align(titleAlign);

    // Font Style & Size Multipliers
    if (receiptData.fontStyle === 'normal') {
      builder.bold(false).size(1, 1);
    } else if (receiptData.fontStyle === 'doubleWidth') {
      builder.size(2, 1);
    } else if (receiptData.fontStyle === 'doubleHeight') {
      builder.size(1, 2);
    } else if (receiptData.fontStyle === 'expanded') {
      builder.size(2, 2);
    } else if (receiptData.fontStyle === 'bold') {
      builder.bold(true);
    } else if (activeProfile.paperWidth === 80) {
      builder.bold(true).size(2, 2);
    } else {
      builder.bold(true);
    }

    builder.line(receiptData.storeName || 'THERMODIAGNOSTIX')
      .size(1, 1)
      .bold(false);

    for (const h of receiptData.headerLines) {
      builder.line(h);
    }

    builder
      .rule(cols, '-')
      .align('left')
      .tableRow('ITEM', 'QTY', 'AMOUNT', cols)
      .rule(cols, '-');

    for (const item of receiptData.items) {
      builder.tableRow(item.name, item.qty.toString(), `$${(item.qty * item.unitPrice).toFixed(2)}`, cols);
    }

    builder
      .rule(cols, '-')
      .justify('Subtotal:', `$${subtotal.toFixed(2)}`, cols)
      .justify('Tax (8%):', `$${tax.toFixed(2)}`, cols)
      .bold(true)
      .justify('TOTAL:', `$${total.toFixed(2)}`, cols)
      .bold(false);

    if (receiptData.barcodeValue) {
      builder.feed(1).align('center').barcode(receiptData.barcodeValue, {
        type: 'CODE128',
        height: 60,
        width: activeProfile.paperWidth === 58 ? 2 : 3,
        hriPosition: 'below',
      });
    }

    if (receiptData.qrValue) {
      builder.feed(1).align('center').qrcode(receiptData.qrValue, {
        size: activeProfile.paperWidth === 58 ? 5 : 6,
        errorCorrection: 'M',
      });
      builder.feed(1).line(receiptData.qrValue);
    }

    builder.rule(cols, '-').align(receiptData.footerAlignment || 'center');
    for (const f of receiptData.footerLines) {
      builder.line(f);
    }

    builder.feed(receiptData.feedLines || 3);

    if (receiptData.includeCut && activeProfile.supportsCutter) {
      builder.cut(activeProfile.cutType || 'partial', 0);
    }

    return builder.build();
  }, [activeProfile, receiptData]);

  // Preview Diagnostic Test Payload in ReceiptPreview inspector without printing
  const handlePreviewTest = (testId: DiagnosticTestId) => {
    const def = DIAGNOSTIC_TESTS.find((t) => t.id === testId);
    const bytes = runnerRef.current.getTestPayload(testId, activeProfile, activeTransportRef.current);
    setPreviewTestPayload({
      id: testId,
      title: def?.name || testId,
      bytes,
    });
    setMobileTab('preview');
    addLog('info', 'test', `Previewing test payload in inspector: ${def?.name || testId}`);
  };

  // Print Receipt handler
  const handlePrintReceipt = async () => {
    if (!activeTransportRef.current || status !== 'connected') return;
    setIsBusy(true);
    try {
      const res = await queueRef.current.enqueue('Custom Receipt Print', generatedReceiptBytes);
      setTotalBytesTransmitted((prev) => prev + res.bytesSent);
      addLog('success', 'queue', `Receipt print job completed successfully (${res.bytesSent} bytes)`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog('error', 'queue', `Receipt print job failed: ${msg}`);
    } finally {
      setIsBusy(false);
    }
  };

  // Diagnostic Test execution
  const handleRunDiagnosticTest = async (testId: DiagnosticTestId, stressIterations = 3) => {
    setIsBusy(true);
    try {
      const result = await runnerRef.current.runTest(
        testId,
        activeTransportRef.current,
        queueRef.current,
        activeProfile,
        stressIterations
      );
      if (result.bytesTransmitted) {
        setTotalBytesTransmitted((prev) => prev + (result.bytesTransmitted || 0));
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleRunAllTests = async () => {
    setIsBusy(true);
    try {
      await runnerRef.current.runAll(activeTransportRef.current, queueRef.current, activeProfile);
    } finally {
      setIsBusy(false);
    }
  };

  const handleVerifyOutput = (testId: DiagnosticTestId, userVerification: 'passed' | 'failed' | 'skipped', notes?: string) => {
    runnerRef.current.updateVerification(testId, userVerification, notes);
    addLog('info', 'test', `Test ${testId.toUpperCase()} verified as ${userVerification.toUpperCase()}`);
  };

  // Export handlers
  const handleExportJson = () => {
    const jsonStr = generateDiagnosticJson(
      env,
      activeProfile,
      activeDevice,
      Array.from(testResults.values()),
      logs
    );
    downloadFile(jsonStr, `thermodiagnostix_report_${Date.now()}.json`, 'application/json');
  };

  const handleExportTxt = () => {
    const txtStr = generateDiagnosticTxt(
      env,
      activeProfile,
      activeDevice,
      Array.from(testResults.values()),
      logs
    );
    downloadFile(txtStr, `thermodiagnostix_report_${Date.now()}.txt`, 'text/plain');
  };

  const handleResetState = () => {
    runnerRef.current = new DiagnosticTestRunner();
    setTestResults(runnerRef.current.getResults());
    setLogs([]);
    setTotalBytesTransmitted(0);
    addLog('info', 'system', 'Dashboard diagnostic test state reset.');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans w-full max-w-full overflow-x-hidden">
      {/* Top Header */}
      <Header
        status={status}
        device={activeDevice}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onReset={handleResetState}
      />

      {/* Browser Compatibility Status Banner */}
      <BrowserCompatibilityBanner env={env} />

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-6 space-y-4 sm:space-y-6 overflow-x-hidden">
        {/* Receipt Width & Profile Bar */}
        <PrinterProfileSelector
          activeProfile={activeProfile}
          onProfileChange={(newProf) => setActiveProfile(newProf)}
          onOpenProfileSettings={() => setIsSettingsOpen(true)}
        />

        {/* Hardware Transports Connection Panel */}
        <ConnectionPanel
          status={status}
          activeDevice={activeDevice}
          activeProfile={activeProfile}
          env={env}
          onConnectBle={handleConnectBle}
          onConnectUsb={handleConnectUsb}
          onConnectBrowserFallback={handleConnectBrowserFallback}
          onConnectMock={handleConnectMock}
          onDisconnect={handleDisconnect}
        />

        {/* Connected Hardware Info Card */}
        {activeDevice && (
          <PrinterInfoCard
            device={activeDevice}
            profile={activeProfile}
            totalBytesTransmitted={totalBytesTransmitted}
          />
        )}

        {/* Mobile View Switcher (Visible only on screens below lg) */}
        <div className="grid grid-cols-3 lg:hidden rounded-xl bg-slate-900/90 p-1 border border-slate-700/80 shadow-md">
          <button
            type="button"
            onClick={() => setMobileTab('tests')}
            className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
              mobileTab === 'tests'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🧪</span>
            <span className="truncate">Tests (A–J)</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
              mobileTab === 'preview'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🧾</span>
            <span className="truncate">Preview</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('logs')}
            className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
              mobileTab === 'logs'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📜</span>
            <span className="truncate">Live Logs</span>
          </button>
        </div>

        {/* 2-Column Split: Receipt Preview vs Diagnostic Suite */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Receipt Preview & Inspector (5 Cols) */}
          <div className={`lg:col-span-5 h-full min-w-0 ${mobileTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
            <ReceiptPreview
              profile={activeProfile}
              receiptData={receiptData}
              generatedBytes={previewTestPayload ? previewTestPayload.bytes : generatedReceiptBytes}
              previewTitle={previewTestPayload ? previewTestPayload.title : 'Custom Test Receipt'}
              onResetPreview={() => setPreviewTestPayload(null)}
              onRefreshPreview={() => setPreviewTestPayload(null)}
              onOpenCustomizer={() => setIsReceiptBuilderOpen(true)}
              onPrintReceipt={handlePrintReceipt}
              isPrinting={isBusy}
              canPrint={status === 'connected'}
            />
          </div>

          {/* Right Column: Diagnostic Test Dashboard (7 Cols) */}
          <div className={`lg:col-span-7 space-y-6 min-w-0 ${mobileTab === 'tests' ? 'block' : 'hidden lg:block'}`}>
            <DiagnosticTestDashboard
              testResults={testResults}
              profile={activeProfile}
              onRunTest={(id) => handleRunDiagnosticTest(id)}
              onPreviewTest={handlePreviewTest}
              onRunAll={handleRunAllTests}
              onOpenVerification={(id) => setActiveVerifyTestId(id)}
              onOpenStressModal={() => setIsStressModalOpen(true)}
              onOpenCutterModal={() => setIsCutterModalOpen(true)}
              isBusy={isBusy}
              canRunTests={status === 'connected'}
            />
          </div>
        </div>

        {/* Activity Log Stream */}
        <div className={`min-w-0 ${mobileTab === 'logs' ? 'block' : 'hidden lg:block'}`}>
          <ActivityLogViewer
            logs={logs}
            onClearLogs={() => setLogs([])}
            onExportJson={handleExportJson}
            onExportTxt={handleExportTxt}
          />
        </div>
      </main>

      {/* Hidden printable receipt formatted for browser fallback printing */}
      <PrintableReceipt
        profile={activeProfile}
        receiptData={receiptData}
        activePrintText={browserPrintText}
      />

      {/* Modals */}
      <ReceiptBuilderModal
        isOpen={isReceiptBuilderOpen}
        onClose={() => setIsReceiptBuilderOpen(false)}
        initialData={receiptData}
        onSave={(updated) => setReceiptData(updated)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        activeProfile={activeProfile}
        onProfileUpdated={(updated) => setActiveProfile(updated)}
      />

      <HelpGuideModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <VerificationModal
        testId={activeVerifyTestId}
        result={activeVerifyTestId ? testResults.get(activeVerifyTestId) : undefined}
        onVerify={handleVerifyOutput}
        onClose={() => setActiveVerifyTestId(null)}
      />

      <StressTestModal
        isOpen={isStressModalOpen}
        onClose={() => setIsStressModalOpen(false)}
        onConfirm={(iterations) => handleRunDiagnosticTest('test_j', iterations)}
      />

      <CutterModal
        isOpen={isCutterModalOpen}
        onClose={() => setIsCutterModalOpen(false)}
        onConfirm={() => handleRunDiagnosticTest('test_h')}
        profile={activeProfile}
      />
    </div>
  );
};

export default App;
