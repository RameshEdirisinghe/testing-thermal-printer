export function formatHexDump(data: Uint8Array, bytesPerLine = 16): string {
  if (!data || data.length === 0) return 'Empty buffer';

  const lines: string[] = [];
  const len = data.length;

  for (let i = 0; i < len; i += bytesPerLine) {
    const chunk = data.slice(i, i + bytesPerLine);
    const offsetHex = i.toString(16).padStart(4, '0').toUpperCase();

    // Hex part
    let hexPart = '';
    for (let j = 0; j < bytesPerLine; j++) {
      if (j < chunk.length) {
        hexPart += chunk[j].toString(16).padStart(2, '0').toUpperCase() + ' ';
      } else {
        hexPart += '   ';
      }
      if (j === 7) hexPart += ' ';
    }

    // ASCII part
    let asciiPart = '';
    for (let j = 0; j < chunk.length; j++) {
      const b = chunk[j];
      asciiPart += b >= 32 && b <= 126 ? String.fromCharCode(b) : '.';
    }

    lines.push(`${offsetHex}  ${hexPart} |${asciiPart}|`);
  }

  return lines.join('\n');
}

export function parseEscPosMnemonics(data: Uint8Array): string[] {
  const result: string[] = [];
  let i = 0;
  const len = data.length;

  while (i < len) {
    const b = data[i];

    if (b === 0x1B) { // ESC
      if (i + 1 < len) {
        const next = data[i + 1];
        if (next === 0x40) {
          result.push('[ESC @] Initialize Printer');
          i += 2;
          continue;
        } else if (next === 0x61 && i + 2 < len) {
          const align = data[i + 2] === 1 ? 'Center' : data[i + 2] === 2 ? 'Right' : 'Left';
          result.push(`[ESC a ${data[i + 2]}] Justification: ${align}`);
          i += 3;
          continue;
        } else if (next === 0x45 && i + 2 < len) {
          result.push(`[ESC E ${data[i + 2]}] Bold Emphasis: ${data[i + 2] === 1 ? 'ON' : 'OFF'}`);
          i += 3;
          continue;
        } else if (next === 0x2D && i + 2 < len) {
          result.push(`[ESC - ${data[i + 2]}] Underline: ${data[i + 2]}`);
          i += 3;
          continue;
        } else if (next === 0x64 && i + 2 < len) {
          result.push(`[ESC d ${data[i + 2]}] Feed ${data[i + 2]} lines`);
          i += 3;
          continue;
        } else if (next === 0x33 && i + 2 < len) {
          result.push(`[ESC 3 ${data[i + 2]}] Set Line Spacing (${data[i + 2]} dots)`);
          i += 3;
          continue;
        } else if (next === 0x32) {
          result.push('[ESC 2] Default Line Spacing');
          i += 2;
          continue;
        } else if (next === 0x74 && i + 2 < len) {
          result.push(`[ESC t ${data[i + 2]}] Select Code Page #${data[i + 2]}`);
          i += 3;
          continue;
        } else if (next === 0x4D && i + 2 < len) {
          result.push(`[ESC M ${data[i + 2]}] Font: ${data[i + 2] === 1 ? 'Font B' : 'Font A'}`);
          i += 3;
          continue;
        }
      }
    } else if (b === 0x1D) { // GS
      if (i + 1 < len) {
        const next = data[i + 1];
        if (next === 0x21 && i + 2 < len) {
          result.push(`[GS ! 0x${data[i + 2].toString(16).padStart(2, '0')}] Character Size Multiplier`);
          i += 3;
          continue;
        } else if (next === 0x56 && i + 2 < len) {
          const cutMode = data[i + 2];
          if ((cutMode === 0x41 || cutMode === 0x42) && i + 3 < len) {
            result.push(`[GS V ${cutMode === 0x41 ? 'A' : 'B'} ${data[i + 3]}] Feed & Cut Command`);
            i += 4;
          } else {
            result.push(`[GS V ${cutMode}] Paper Cut Command (${cutMode === 0 ? 'Full' : 'Partial'})`);
            i += 3;
          }
          continue;
        } else if (next === 0x68 && i + 2 < len) {
          result.push(`[GS h ${data[i + 2]}] Barcode Height: ${data[i + 2]} dots`);
          i += 3;
          continue;
        } else if (next === 0x77 && i + 2 < len) {
          result.push(`[GS w ${data[i + 2]}] Barcode Module Width: ${data[i + 2]}`);
          i += 3;
          continue;
        } else if (next === 0x48 && i + 2 < len) {
          result.push(`[GS H ${data[i + 2]}] Barcode HRI Position: ${data[i + 2]}`);
          i += 3;
          continue;
        } else if (next === 0x4C && i + 3 < len) {
          const leftMargin = data[i + 2] | (data[i + 3] << 8);
          result.push(`[GS L ${leftMargin}] Set Left Margin: ${leftMargin} dots`);
          i += 4;
          continue;
        } else if (next === 0x57 && i + 3 < len) {
          const printWidth = data[i + 2] | (data[i + 3] << 8);
          result.push(`[GS W ${printWidth}] Set Printable Width: ${printWidth} dots`);
          i += 4;
          continue;
        } else if (next === 0x6B && i + 3 < len) {
          const m = data[i + 2];
          const dataLen = data[i + 3];
          const barcodeData = Array.from(data.slice(i + 4, i + 4 + dataLen))
            .map(c => (c >= 32 && c <= 126 ? String.fromCharCode(c) : `\\x${c.toString(16)}`))
            .join('');
          result.push(`[GS k ${m} ${dataLen}] Barcode Payload: "${barcodeData}"`);
          i += 4 + dataLen;
          continue;
        } else if (next === 0x28 && i + 4 < len && data[i + 2] === 0x6B) {
          const pL = data[i + 3];
          const pH = data[i + 4];
          const paramLen = pL | (pH << 8);
          const fn = i + 6 < len ? data[i + 6] : 0;
          result.push(`[GS ( k] 2D QR Code Function (len: ${paramLen}, fn: ${fn})`);
          i += 5 + paramLen;
          continue;
        }
      }
    } else if (b === 0x10) { // DLE
      if (i + 2 < len && data[i + 1] === 0x04) {
        result.push(`[DLE EOT ${data[i + 2]}] Real-Time Status Query`);
        i += 3;
        continue;
      }
    } else if (b === 0x0A) {
      result.push('[LF] Line Feed');
      i++;
      continue;
    }

    // Accumulate regular printable text
    let textStr = '';
    while (i < len && data[i] >= 32 && data[i] <= 126) {
      textStr += String.fromCharCode(data[i]);
      i++;
    }

    if (textStr.length > 0) {
      result.push(`TEXT: "${textStr}"`);
    } else {
      // Single unhandled control byte
      result.push(`[BYTE 0x${b.toString(16).padStart(2, '0').toUpperCase()}]`);
      i++;
    }
  }

  return result;
}
