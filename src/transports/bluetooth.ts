import { BasePrinterTransport } from './base';
import { DeviceInfo, PrinterStatusFlags, TransferResult } from '../types/transport';
import { PrinterProfile } from '../types/printer';

// Common Thermal Printer BLE Service UUIDs
export const KNOWN_BLE_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard Printer Service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // ESC/POS POS-58/80 BLE
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent UART
  '0000ff00-0000-1000-8000-00805f9b34fb', // Custom ESC/POS BLE
  '0000fee7-0000-1000-8000-00805f9b34fb', // WeChat Hardware / IoT BLE
  '49535343-1e4d-4bd9-ba61-23c647249616', // ISSC alternate
  '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 UART BLE
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART Service (NUS - very common in thermal printers)
  '0000fff0-0000-1000-8000-00805f9b34fb', // Hoin / GOOJPRT / Xprinter BLE
  '0000ff80-0000-1000-8000-00805f9b34fb', // Zjiang POS-5802 / PT-210 BLE
  '0000af30-0000-1000-8000-00805f9b34fb', // MPT-II / Rongta BLE
  '0000ae30-0000-1000-8000-00805f9b34fb', // Portable POS / Paperang BLE
  '0000ffe5-0000-1000-8000-00805f9b34fb', // TI CC2540 alternate
];

export interface BleConnectOptions {
  profile?: PrinterProfile;
  customServiceUuid?: string;
  customCharUuid?: string;
}

export class BluetoothBleTransport extends BasePrinterTransport {
  readonly type = 'bluetooth' as const;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private device: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private gattServer: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private writeCharacteristic: any = null;
  private canWriteWithoutResponse = false;
  private canWriteWithResponse = false;

  private boundDisconnectHandler: (() => void) | null = null;
  private chunkSize = 64;
  private pacingDelayMs = 15;

  static isSupported(): { supported: boolean; reason?: string } {
    if (typeof window === 'undefined') {
      return { supported: false, reason: 'Window object not available' };
    }
    if (!window.isSecureContext) {
      return { supported: false, reason: 'Web Bluetooth requires a Secure Context (HTTPS or localhost).' };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(navigator as any).bluetooth) {
      return {
        supported: false,
        reason: 'Web Bluetooth API is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Opera on desktop/Android.'
      };
    }
    return { supported: true };
  }

  async connect(options?: BleConnectOptions): Promise<DeviceInfo> {
    const check = BluetoothBleTransport.isSupported();
    if (!check.supported) {
      this.setStatus('error', null);
      this.log('error', 'bluetooth', `Cannot connect: ${check.reason}`);
      throw new Error(check.reason);
    }

    if (this._status === 'connecting' || this._status === 'connected') {
      throw new Error('Bluetooth connection attempt already in progress or connected');
    }

    this.setStatus('connecting', null);
    this.log('info', 'bluetooth', 'Requesting Bluetooth device selection dialog...');

    const profile = options?.profile;
    if (profile) {
      this.chunkSize = profile.bleMtuChunkSize || 64;
      this.pacingDelayMs = profile.blePacingMs || 15;
    }

    try {
      // Gather service filters
      const optionalServices = [...KNOWN_BLE_PRINTER_SERVICES];
      if (options?.customServiceUuid && !optionalServices.includes(options.customServiceUuid.toLowerCase())) {
        optionalServices.push(options.customServiceUuid.toLowerCase());
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const navBt = (navigator as any).bluetooth;
      this.device = await navBt.requestDevice({
        acceptAllDevices: true,
        optionalServices: optionalServices,
      });

      if (!this.device) {
        throw new Error('No Bluetooth device was selected.');
      }

      this.log('info', 'bluetooth', `Device selected: "${this.device.name || 'Unnamed'}" (${this.device.id})`);

      // Set up disconnect listener
      this.boundDisconnectHandler = () => this.handleDeviceDisconnected();
      this.device.addEventListener('gattserverdisconnected', this.boundDisconnectHandler);

      this.log('info', 'bluetooth', 'Connecting to GATT Server...');
      this.gattServer = await this.device.gatt.connect();

      if (!this.gattServer.connected) {
        throw new Error('Failed to establish connection to GATT Server.');
      }

      this.log('info', 'bluetooth', 'GATT Server connected. Discovering primary services...');

      // Find compatible service and characteristic
      const found = await this.discoverWritableCharacteristic(options);
      if (!found) {
        const err = 'No writable BLE characteristic found. Note: Many thermal printers use Bluetooth Classic (SPP/RFCOMM) or proprietary BLE services that do not advertise standard GATT characteristics.';
        this.log('error', 'bluetooth', err);
        throw new Error(err);
      }

      const deviceInfo: DeviceInfo = {
        id: this.device.id,
        name: this.device.name || 'Thermal BLE Printer',
        transport: 'bluetooth',
        gattServiceUuid: this.writeCharacteristic.service?.uuid,
        gattCharUuid: this.writeCharacteristic.uuid,
        connectedAt: Date.now()
      };

      this.setStatus('connected', deviceInfo);
      this.log('success', 'bluetooth', `Successfully connected to BLE printer! Writable Char: ${this.writeCharacteristic.uuid}`, {
        service: this.writeCharacteristic.service?.uuid,
        char: this.writeCharacteristic.uuid,
        writeWithoutResponse: this.canWriteWithoutResponse,
        writeWithResponse: this.canWriteWithResponse
      });

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
        this.log('info', 'bluetooth', 'Bluetooth device selection cancelled by operator.');
      } else {
        this.setStatus('error', null);
        this.log('error', 'bluetooth', `BLE Connection failed: ${errMsg}`);
      }
      throw err;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async discoverWritableCharacteristic(options?: BleConnectOptions): Promise<boolean> {
    if (!this.gattServer) return false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let services: any[] = [];
    try {
      services = await this.gattServer.getPrimaryServices();
    } catch (err) {
      this.log('warn', 'bluetooth', `getPrimaryServices query failed: ${err}. Attempting known service discovery.`);
      // Fallback: iterate known services and customServiceUuid
      const candidates = [...KNOWN_BLE_PRINTER_SERVICES];
      if (options?.customServiceUuid && !candidates.includes(options.customServiceUuid.toLowerCase())) {
        candidates.unshift(options.customServiceUuid.toLowerCase());
      }
      for (const uuid of candidates) {
        try {
          const s = await this.gattServer.getPrimaryService(uuid);
          services.push(s);
        } catch {
          // ignore service not found
        }
      }
    }

    if (services.length === 0) {
      this.log('warn', 'bluetooth', 'No GATT primary services discovered.');
      return false;
    }

    for (const service of services) {
      this.log('info', 'bluetooth', `Inspecting service: ${service.uuid}`);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chars: any[] = await service.getCharacteristics();
        for (const char of chars) {
          const props = char.properties;
          this.log('info', 'bluetooth', `Characteristic ${char.uuid} properties: write=${props.write}, writeWithoutResponse=${props.writeWithoutResponse}, notify=${props.notify}`);


          if (props.write || props.writeWithoutResponse) {
            // Found a candidate
            if (options?.customCharUuid) {
              const target = options.customCharUuid.toLowerCase().trim();
              const current = char.uuid.toLowerCase();
              if (current !== target && !current.includes(target)) {
                continue;
              }
            }
            this.writeCharacteristic = char;
            this.canWriteWithResponse = !!props.write;
            this.canWriteWithoutResponse = !!props.writeWithoutResponse;
            return true;
          }
        }
      } catch (err) {
        this.log('warn', 'bluetooth', `Failed reading characteristics of ${service.uuid}: ${err}`);
      }
    }

    return false;
  }

  async send(data: Uint8Array, onProgress?: (sent: number, total: number) => void): Promise<TransferResult> {
    if (this._status !== 'connected' || !this.writeCharacteristic) {
      throw new Error('Cannot send: Bluetooth printer is not connected.');
    }

    const startTime = performance.now();
    const totalBytes = data.length;
    let bytesSent = 0;

    this.log('info', 'bluetooth', `Starting BLE transmission of ${totalBytes} bytes (chunk size: ${this.chunkSize} bytes)...`);

    try {
      while (bytesSent < totalBytes) {
        if (!this.gattServer?.connected) {
          throw new Error('Bluetooth connection lost during data transmission.');
        }

        const chunkEnd = Math.min(bytesSent + this.chunkSize, totalBytes);
        const chunk = data.slice(bytesSent, chunkEnd);

        let written = false;

        // Try Write Without Response first
        if (this.canWriteWithoutResponse && typeof this.writeCharacteristic.writeValueWithoutResponse === 'function') {
          try {
            await this.writeCharacteristic.writeValueWithoutResponse(chunk);
            written = true;
          } catch (err) {
            // If failed and chunk size > 20, the peripheral probably rejected chunk due to default 23-byte MTU
            if (this.chunkSize > 20) {
              this.log('warn', 'bluetooth', `BLE write error with ${this.chunkSize}-byte chunk: ${err}. Adapting to safe 20-byte BLE MTU.`);
              this.chunkSize = 20;
              const safeChunk = data.slice(bytesSent, Math.min(bytesSent + 20, totalBytes));
              await this.writeCharacteristic.writeValueWithoutResponse(safeChunk);
              written = true;
              bytesSent += safeChunk.length;
              if (this.pacingDelayMs > 0) {
                await new Promise(r => setTimeout(r, this.pacingDelayMs));
              }
              if (onProgress) {
                onProgress(bytesSent, totalBytes);
              }
              continue;
            } else {
              this.log('warn', 'bluetooth', `writeValueWithoutResponse failed: ${err}. Attempting writeWithResponse fallback.`);
            }
          }
        }

        if (!written) {
          if (this.canWriteWithResponse || typeof this.writeCharacteristic.writeValueWithResponse === 'function') {
            if (typeof this.writeCharacteristic.writeValueWithResponse === 'function') {
              await this.writeCharacteristic.writeValueWithResponse(chunk);
            } else {
              await this.writeCharacteristic.writeValue(chunk);
            }
          } else {
            // Fallback legacy write
            await this.writeCharacteristic.writeValue(chunk);
          }
        }

        if (this.pacingDelayMs > 0) {
          await new Promise(r => setTimeout(r, this.pacingDelayMs));
        }

        bytesSent = chunkEnd;
        if (onProgress) {
          onProgress(bytesSent, totalBytes);
        }
      }

      const durationMs = Math.round(performance.now() - startTime);
      this.log('success', 'bluetooth', `Transmitted ${totalBytes} bytes over BLE in ${durationMs}ms`);

      return {
        success: true,
        bytesSent: totalBytes,
        durationMs
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.log('error', 'bluetooth', `BLE transfer error at ${bytesSent}/${totalBytes} bytes: ${errMsg}`);
      throw err;
    }
  }

  async queryStatus(): Promise<PrinterStatusFlags> {
    // BLE printers rarely expose standard status reads over simple GATT write characteristics
    return {
      supported: false,
      message: 'Hardware status query not supported on this BLE characteristic without bidirectional UART protocol.'
    };
  }

  async disconnect(): Promise<void> {
    this.setStatus('disconnecting');
    this.log('info', 'bluetooth', 'Disconnecting Bluetooth device...');
    await this.cleanup();
    this.setStatus('disconnected', null);
    this.log('info', 'bluetooth', 'Bluetooth device disconnected.');
  }

  private handleDeviceDisconnected(): void {
    this.log('warn', 'bluetooth', 'GATT Server disconnected event received from device.');
    this.cleanup().catch(() => {});
    this.setStatus('disconnected', null);
  }

  private async cleanup(): Promise<void> {
    if (this.device && this.boundDisconnectHandler) {
      try {
        this.device.removeEventListener('gattserverdisconnected', this.boundDisconnectHandler);
      } catch {
        // ignore
      }
    }
    this.boundDisconnectHandler = null;

    if (this.gattServer?.connected) {
      try {
        await this.gattServer.disconnect();
      } catch {
        // ignore
      }
    }

    this.gattServer = null;
    this.device = null;
    this.writeCharacteristic = null;
  }
}
