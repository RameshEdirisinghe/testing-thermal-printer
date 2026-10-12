import React from 'react';
import { PrinterProfile } from '../types/printer';
import { ReceiptCustomData } from '../types/escpos';

interface PrintableReceiptProps {
  profile: PrinterProfile;
  receiptData: ReceiptCustomData;
  activePrintText?: string | null;
}

export const PrintableReceipt: React.FC<PrintableReceiptProps> = ({
  profile,
  receiptData,
  activePrintText,
}) => {
  const is58mm = profile.paperWidth === 58;
  const subtotal = receiptData.items.reduce((acc, item) => acc + item.qty * item.unitPrice, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const fontStyle = {
    fontFamily: 'monospace, "Noto Sans Sinhala", "Iskoola Pota", sans-serif',
  };

  // If a diagnostic test payload text was provided via BrowserPrintTransport, render it directly
  if (activePrintText) {
    return (
      <div
        id="printable-receipt"
        className="hidden print:block text-black bg-white"
        style={{
          width: is58mm ? '58mm' : '80mm',
          margin: '0 auto',
          padding: '2mm',
          fontSize: is58mm ? '10px' : '11px',
          lineHeight: '1.25',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          ...fontStyle,
        }}
      >
        <pre style={{ margin: 0, font: 'inherit', whiteSpace: 'pre-wrap' }}>
          {activePrintText}
        </pre>
      </div>
    );
  }

  return (
    <div
      id="printable-receipt"
      className="hidden print:block text-black bg-white"
      style={{
        width: is58mm ? '58mm' : '80mm',
        margin: '0 auto',
        padding: '2mm',
        fontSize: is58mm ? '10px' : '12px',
        lineHeight: '1.2',
        ...fontStyle,
      }}
    >
      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
        {receiptData.storeName || 'THERMODIAGNOSTIX'}
      </div>

      {receiptData.headerLines.map((h, i) => (
        <div key={i} style={{ textAlign: 'center', fontSize: '10px' }}>
          {h}
        </div>
      ))}

      <div style={{ textAlign: 'center', fontSize: '9px', margin: '4px 0', borderBottom: '1px dashed #000' }}>
        {new Date().toISOString().replace('T', ' ').substring(0, 19)}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '2px' }}>
        <span>ITEM</span>
        <span>QTY</span>
        <span>PRICE</span>
      </div>

      <div style={{ margin: '4px 0' }}>
        {receiptData.items.map((item) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
              {item.name}
            </span>
            <span>{item.qty}</span>
            <span>${(item.qty * item.unitPrice).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px dashed #000', paddingTop: '4px', marginTop: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Tax (8%):</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginTop: '2px' }}>
          <span>TOTAL:</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {receiptData.barcodeValue && (
        <div style={{ textAlign: 'center', margin: '8px 0' }}>
          <div style={{ fontSize: '16px', letterSpacing: '4px', fontWeight: 'bold' }}>
            ||| | |||| | |||
          </div>
          <div style={{ fontSize: '10px' }}>{receiptData.barcodeValue}</div>
        </div>
      )}

      {receiptData.qrValue && (
        <div style={{ textAlign: 'center', margin: '8px 0', fontSize: '10px' }}>
          <div>[ QR CODE ]</div>
          <div>{receiptData.qrValue}</div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '8px', borderTop: '1px dashed #000', paddingTop: '4px' }}>
        {receiptData.footerLines.map((f, i) => (
          <div key={i} style={{ fontSize: '10px' }}>
            {f}
          </div>
        ))}
      </div>
    </div>
  );
};

