import { BasePrinterTransport } from './base';
import { DeviceInfo, PrinterStatusFlags, TransferResult } from '../types/transport';
import { PrinterProfile } from '../types/printer';

export interface UsbConnectOptions {
  profile?: PrinterProfile;
  vendorId?: number;
  productId?: number;
}

// Well-known USB Printer Vendor IDs
export const KNOWN_USB_VENDOR_IDS = [
  0x04b8, // Epson
  0x0416, // Winbond / Generic POS (POS-58, POS-80)
  0x0fe6, // ICS Advent / Generic POS
  0x1fc9, // NXP / Thermal POS
  0x0483, // STMicroelectronics / Custom POS
  0x1a86, // QinHeng Electronics (CH340 USB-Serial printer chip)
  0x28e9, // GigaDevice
  0x0519, // Star Micronics
  0x0dd4, // Custom Engineering
  0x1504, // Bixolon
  0x067b, // Prolific
  0x20d1, // Rongta Technology
  0x6868, // Xprinter
  0x2d37, // HPRT
  0x2730, // Citizen Systems
  0x0a5f, // Zebra Technologies
  0x10c4, // Silicon Labs / Sewoo
  0x0471, // Zhuhai / Philips POS
  0x18e8, // Arkmicro
  0x0525, // Netchip
];

export class WebUsbTransport extends BasePrinterTransport {
  readonly type = 'usb' as const;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private device: any = null;
  private interfaceNumber: number | null = null;
  private endpointOutNumber: number | null = null;
  private endpointInNumber: number | null = null;
  private chunkSize = 512;
  private lastClaimError: string | null = null;
  private boundDisconnectListener: ((event: unknown) => void) | null = null;

  static isSupported(): { supported: boolean; reason?: string } {
    if (typeof window === 'undefined') {
      return { supported: false, reason: 'Window object not available' };
    }
    if (!window.isSecureContext) {
      return { supported: false, reason: 'WebUSB requires a Secure Context (HTTPS or localhost).' };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(navigator as any).usb) {
      return {
        supported: false,
        reason: 'WebUSB API is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Opera on desktop/Android.'
      };
    }
    return { supported: true };
  }

  async connect(options?: UsbConnectOptions): Promise<DeviceInfo> {
    const check = WebUsbTransport.isSupported();
    if (!check.supported) {
      this.setStatus('error', null);
      this.log('error', 'usb', `Cannot connect: ${check.reason}`);
      throw new Error(check.reason);
    }

    if (this._status === 'connecting' || this._status === 'connected') {
      throw new Error('USB connection attempt already in progress or connected');
    }

    this.setStatus('connecting', null);
    this.log('info', 'usb', 'Opening WebUSB device selection chooser...');

    const profile = options?.profile;
    if (profile) {
      this.chunkSize = profile.usbChunkSize || 512;
    }

    try {
      // Build filters
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filters: any[] = [];
      if (options?.vendorId) {
        filters.push({
          vendorId: options.vendorId,
          ...(options.productId ? { productId: options.productId } : {})
        });
      } else {
        // Add known vendor IDs as filters, plus generic class 7 (Printers)
        for (const vid of KNOWN_USB_VENDOR_IDS) {
          filters.push({ vendorId: vid });
        }
        filters.push({ classCode: 0x07 }); // Standard USB Printer Class
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const navUsb = (navigator as any).usb;
      this.device = await navUsb.requestDevice({ filters });

      if (!this.device) {
        throw new Error('No USB device selected');
      }

      const devName = this.device.productName || `USB Device (${this.device.vendorId.toString(16)}:${this.device.productId.toString(16)})`;
      this.log('info', 'usb', `Selected device: "${devName}" (Vendor: 0x${this.device.vendorId.toString(16)}, Product: 0x${this.device.productId.toString(16)})`);

      // Disconnect listener
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.boundDisconnectListener = (event: any) => {
        if (event.device === this.device) {
          this.handleDeviceDisconnected();
        }
      };
      navUsb.addEventListener('disconnect', this.boundDisconnectListener);

      // Open device
      await this.device.open();
      const targetConfigValue = this.device.configurations?.[0]?.configurationValue ?? 1;
      this.log('info', 'usb', `Device opened successfully. Selecting configuration ${targetConfigValue}...`);

      if (this.device.configuration === null || this.device.configuration.configurationValue !== targetConfigValue) {
        try {
          await this.device.selectConfiguration(targetConfigValue);
        } catch (configErr) {
          this.log('warn', 'usb', `selectConfiguration warning: ${configErr}`);
        }
      }

      // Discover interfaces and bulk OUT endpoint
      this.lastClaimError = null;
      const endpointFound = await this.discoverAndClaimInterface();
      if (!endpointFound) {
        let msg = 'No compatible bulk OUT endpoint found or interface could not be claimed.';
        if (this.lastClaimError) {
          msg = `Unable to claim USB printer interface (${this.lastClaimError}). On Windows, if the native printer driver (usbprint.sys) or Print Spooler holds the printer, WebUSB is blocked. To test this printer without reconfiguring drivers, use the 'Browser Print' fallback card; or use Zadig to install the WinUSB driver.`;
        }
        this.log('error', 'usb', msg);
        throw new Error(msg);
      }

      const deviceInfo: DeviceInfo = {
        id: `${this.device.vendorId}:${this.device.productId}`,
        name: devName,
        transport: 'usb',
        usbVendorId: this.device.vendorId,
        usbProductId: this.device.productId,
        usbManufacturerName: this.device.manufacturerName,
        usbProductName: this.device.productName,
        connectedAt: Date.now()
      };

      this.setStatus('connected', deviceInfo);
      this.log('success', 'usb', `Successfully connected to USB printer! Interface: ${this.interfaceNumber}, Bulk OUT Endpoint: ${this.endpointOutNumber}`);

      return deviceInfo;
    } catch (err: unknown) {
      await this.cleanup();
      const errMsg = err instanceof Error ? err.message : String(err);
      const isCancel = err instanceof Error && (
        err.name === 'NotFoundError' ||
        errMsg.toLowerCase().includes('no device') ||
        errMsg.toLowerCase().includes('cancel')
      );

      if (isCancel) {
        this.setStatus('disconnected', null);
        this.log('info', 'usb', 'USB device selection cancelled by operator.');
      } else {
        this.setStatus('error', null);
        this.log('error', 'usb', `WebUSB connection failed: ${errMsg}`);
      }
      throw err;
    }
  }

  private async discoverAndClaimInterface(): Promise<boolean> {
    if (!this.device?.configuration) return false;

    // Search interfaces
    for (const iface of this.device.configuration.interfaces) {
      for (const alt of iface.alternates) {
        // Look for bulk OUT endpoint
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const outEndpoint = alt.endpoints.find((ep: any) => ep.direction === 'out' && ep.type === 'bulk');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const inEndpoint = alt.endpoints.find((ep: any) => ep.direction === 'in' && ep.type === 'bulk');

        if (outEndpoint) {
          this.interfaceNumber = iface.interfaceNumber;
          this.endpointOutNumber = outEndpoint.endpointNumber;
          if (inEndpoint) {
            this.endpointInNumber = inEndpoint.endpointNumber;
          }

          this.log('info', 'usb', `Found bulk OUT endpoint #${outEndpoint.endpointNumber} on interface #${iface.interfaceNumber}. Claiming interface...`);

          try {
            await this.device.claimInterface(this.interfaceNumber);
            if (alt.alternateSetting !== 0) {
              await this.device.selectAlternateInterface(this.interfaceNumber, alt.alternateSetting);
            }
            return true;
          } catch (claimErr: unknown) {
            this.lastClaimError = claimErr instanceof Error ? claimErr.message : String(claimErr);
            this.log('warn', 'usb', `Failed to claim interface ${this.interfaceNumber}: ${claimErr}`);
          }
        }
      }
    }

    return false;
  }

  async send(data: Uint8Array, onProgress?: (sent: number, total: number) => void): Promise<TransferResult> {
    if (this._status !== 'connected' || !this.device || this.endpointOutNumber === null) {
      throw new Error('Cannot send: USB printer is not connected.');
    }

    const startTime = performance.now();
    const totalBytes = data.length;
    let bytesSent = 0;

    this.log('info', 'usb', `Starting USB bulk transfer of ${totalBytes} bytes (chunk size: ${this.chunkSize} bytes)...`);

    try {
      while (bytesSent < totalBytes) {
        const chunkEnd = Math.min(bytesSent + this.chunkSize, totalBytes);
        const chunk = data.slice(bytesSent, chunkEnd);

        const result = await this.device.transferOut(this.endpointOutNumber, chunk);
        if (result.status !== 'ok') {
          throw new Error(`USB transfer failed with status: ${result.status}`);
        }

        const written = (typeof result.bytesWritten === 'number' && result.bytesWritten > 0)
          ? result.bytesWritten
          : chunk.length;
        bytesSent += written;

        if (onProgress) {
          onProgress(bytesSent, totalBytes);
        }

        // Hardware FIFO buffer pacing for physical printers:
        // Brief pause between chunks if multiple chunks remain, preventing receive buffer overflow
        if (bytesSent < totalBytes) {
          await new Promise(r => setTimeout(r, 4));
        }
      }

      const durationMs = Math.round(performance.now() - startTime);
      this.log('success', 'usb', `Transmitted ${totalBytes} bytes over USB in ${durationMs}ms`);

      return {
        success: true,
        bytesSent: totalBytes,
        durationMs
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.log('error', 'usb', `USB transfer error at ${bytesSent}/${totalBytes} bytes: ${errMsg}`);
      throw err;
    }
  }

  async queryStatus(): Promise<PrinterStatusFlags> {
    if (this._status !== 'connected' || !this.device || this.endpointInNumber === null) {
      return {
        supported: false,
        message: 'USB printer does not have a bulk IN endpoint claimed for status reading.'
      };
    }

    try {
      // Transfer DLE EOT 1 command
      await this.send(new Uint8Array([0x10, 0x04, 0x01]));
      // Try to read 1 byte from endpoint In with 2-second timeout protection
      const readPromise = this.device.transferIn(this.endpointInNumber, 1);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('USB status query transferIn timed out after 2000ms')), 2000);
      });
      const readResult = await Promise.race([readPromise, timeoutPromise]);

      if (readResult && readResult.data && readResult.data.byteLength > 0) {
        const statusByte = readResult.data.getUint8(0);
        const paperOut = (statusByte & 0x20) !== 0;
        const offline = (statusByte & 0x08) !== 0;
        return {
          supported: true,
          message: `Hardware status received: ${paperOut ? 'Paper Out' : 'Paper OK'}, ${offline ? 'Offline' : 'Online'}`,
          paperOut,
          offline,
          rawByte: statusByte
        };
      }
    } catch (err) {
      this.log('warn', 'usb', `Status query transferIn failed: ${err}`);
    }

    return {
      supported: false,
      message: 'Status read timed out or was not acknowledged by the device.'
    };
  }

  async disconnect(): Promise<void> {
    this.setStatus('disconnecting');
    this.log('info', 'usb', 'Disconnecting USB device...');
    await this.cleanup();
    this.setStatus('disconnected', null);
    this.log('info', 'usb', 'USB device disconnected.');
  }

  private handleDeviceDisconnected(): void {
    this.log('warn', 'usb', 'USB device disconnection event detected.');
    this.cleanup().catch(() => {});
    this.setStatus('disconnected', null);
  }

  private async cleanup(): Promise<void> {
    if (this.boundDisconnectListener) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (navigator as any).usb?.removeEventListener('disconnect', this.boundDisconnectListener);
      } catch {
        // ignore
      }
      this.boundDisconnectListener = null;
    }

    if (this.device) {
      if (this.interfaceNumber !== null) {
        try {
          await this.device.releaseInterface(this.interfaceNumber);
        } catch {
          // ignore
        }
      }
      try {
        await this.device.close();
      } catch {
        // ignore
      }
    }

    this.device = null;
    this.interfaceNumber = null;
    this.endpointOutNumber = null;
    this.endpointInNumber = null;
  }
}
