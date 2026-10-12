import React, { useState, useMemo } from 'react';
import { ReceiptCustomData, ReceiptItem } from '../types/escpos';
import { IconTrash, IconXCircle, IconCheckCircle, IconAlertTriangle } from '../icons/LucideIcons';
import { TextFormatter } from '../escpos/formatter';

interface ReceiptBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: ReceiptCustomData;
  onSave: (data: ReceiptCustomData) => void;
}

export const ReceiptBuilderModal: React.FC<ReceiptBuilderModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSave,
}) => {
  const [data, setData] = useState<ReceiptCustomData>({ ...initialData });
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(4.5);

  const scriptWarning = useMemo(() => {
    const combined = `${data.storeName} ${data.headerLines.join(' ')} ${data.items.map((i) => i.name).join(' ')} ${data.footerLines.join(' ')}`;
    return TextFormatter.detectUnsupportedScripts(combined);
  }, [data]);

  if (!isOpen) return null;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: ReceiptItem = {
      id: `item-${Date.now()}`,
      name: newItemName.trim(),
      qty: Number(newItemQty) || 1,
      unitPrice: Number(newItemPrice) || 0,
    };

    setData({
      ...data,
      items: [...data.items, newItem],
    });

    setNewItemName('');
    setNewItemQty(1);
    setNewItemPrice(4.5);
  };

  const handleRemoveItem = (id: string) => {
    setData({
      ...data,
      items: data.items.filter((item) => item.id !== id),
    });
  };

  const handleSave = () => {
    onSave(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Customize Test Receipt Layout</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <IconXCircle size={20} />
          </button>
        </div>

        {/* Script Notice */}
        {scriptWarning.warning && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-start gap-2">
            <IconAlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{scriptWarning.warning}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Store Name & Header */}
          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Store / Business Name</label>
              <input
                type="text"
                value={data.storeName}
                onChange={(e) => setData({ ...data, storeName: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Header Sub-lines (comma-separated)</label>
              <input
                type="text"
                value={data.headerLines.join(', ')}
                onChange={(e) =>
                  setData({
                    ...data,
                    headerLines: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          {/* Product Items Table */}
          <div className="space-y-2">
            <label className="block text-slate-400 font-semibold">Receipt Product Line Items</label>
            <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
              <div className="grid grid-cols-12 gap-2 p-2 bg-slate-800/80 font-semibold text-slate-400 text-[11px]">
                <span className="col-span-6">Item Name</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-3 text-right">Unit Price</span>
                <span className="col-span-1 text-center"></span>
              </div>

              <div className="divide-y divide-slate-800/60 max-h-40 overflow-y-auto">
                {data.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 p-2 items-center text-slate-200">
                    <span className="col-span-6 truncate font-medium">{item.name}</span>
                    <span className="col-span-2 text-center font-mono">{item.qty}</span>
                    <span className="col-span-3 text-right font-mono">${item.unitPrice.toFixed(2)}</span>
                    <span className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <IconTrash size={14} />
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Item Row */}
            <form onSubmit={handleAddItem} className="flex flex-col sm:grid sm:grid-cols-12 gap-2 pt-2">
              <input
                type="text"
                placeholder="Product name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full sm:col-span-6 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 sm:py-1.5 text-white"
              />
              <div className="flex gap-2 sm:contents">
                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
                  className="flex-1 sm:col-span-2 bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 sm:py-1.5 text-white text-center"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(parseFloat(e.target.value) || 0)}
                  className="flex-1 sm:col-span-2 bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 sm:py-1.5 text-white text-right"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:col-span-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-2 sm:py-1.5 font-semibold text-xs"
              >
                + Add Item
              </button>
            </form>
          </div>

          {/* Alignment & Font Style Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/60">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Receipt Header Alignment</label>
              <select
                value={data.alignment || 'center'}
                onChange={(e) => setData({ ...data, alignment: e.target.value as any, headerAlignment: e.target.value as any })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              >
                <option value="center">Center-Aligned</option>
                <option value="left">Left-Aligned</option>
                <option value="right">Right-Aligned</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Title Font Style & Size</label>
              <select
                value={data.fontStyle || 'bold'}
                onChange={(e) => setData({ ...data, fontStyle: e.target.value as any })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              >
                <option value="normal">Standard Font (1x1 Normal)</option>
                <option value="bold">Bold / Emphasized</option>
                <option value="doubleWidth">Double Width (2x1)</option>
                <option value="doubleHeight">Double Height (1x2)</option>
                <option value="expanded">Expanded 2x2</option>
              </select>
            </div>
          </div>

          {/* Barcode & QR Code settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Barcode Value (CODE128)</label>
              <input
                type="text"
                value={data.barcodeValue || ''}
                onChange={(e) => setData({ ...data, barcodeValue: e.target.value })}
                placeholder="e.g. REC-99201"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">QR Code Content / URL</label>
              <input
                type="text"
                value={data.qrValue || ''}
                onChange={(e) => setData({ ...data, qrValue: e.target.value })}
                placeholder="e.g. https://store.example.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          {/* Footer & Feed / Cut */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-semibold mb-1">Footer Message</label>
              <input
                type="text"
                value={data.footerLines.join('; ')}
                onChange={(e) =>
                  setData({
                    ...data,
                    footerLines: e.target.value.split(';').map((s) => s.trim()).filter(Boolean),
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Feed Lines After Print</label>
              <input
                type="number"
                min="0"
                max="20"
                value={data.feedLines}
                onChange={(e) => setData({ ...data, feedLines: Number(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.includeCut}
                onChange={(e) => setData({ ...data, includeCut: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span className="text-slate-300 font-medium">Issue Paper Cut Command (If Supported)</span>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 bg-slate-900/80">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-center"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md"
          >
            <IconCheckCircle size={16} />
            <span>Apply to Preview</span>
          </button>
        </div>
      </div>
    </div>
  );
};
