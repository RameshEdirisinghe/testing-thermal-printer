export interface BrowserEnvironmentInfo {
  browserName: string;
  osName: string;
  isSecureContext: boolean;
  hasWebBluetooth: boolean;
  hasWebUsb: boolean;
  bluetoothRecommendation: string;
  usbRecommendation: string;
}

export function detectBrowserEnvironment(): BrowserEnvironmentInfo {
  const isSecureContext = typeof window !== 'undefined' ? !!window.isSecureContext : false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = typeof navigator !== 'undefined' ? (navigator as any) : {};
  const ua = nav.userAgent || '';

  // Detect OS
  let osName = 'Unknown OS';
  if (/Windows/i.test(ua)) osName = 'Windows';
  else if (/Macintosh|Mac OS X/i.test(ua)) osName = 'macOS';
  else if (/Android/i.test(ua)) osName = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) osName = 'iOS';
  else if (/Linux/i.test(ua)) osName = 'Linux';

  // Detect Browser
  let browserName = 'Unknown Browser';
  if (/Edg\//i.test(ua)) browserName = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua) && !/OPR\//i.test(ua)) browserName = 'Google Chrome';
  else if (/OPR\//i.test(ua)) browserName = 'Opera';
  else if (/Firefox\//i.test(ua)) browserName = 'Mozilla Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browserName = 'Apple Safari';

  const hasWebBluetooth = !!nav.bluetooth && isSecureContext;
  const hasWebUsb = !!nav.usb && isSecureContext;

  // Recommendations
  let bluetoothRecommendation = 'Supported in this browser over HTTPS or localhost.';
  if (!isSecureContext) {
    bluetoothRecommendation = 'Not available: Web Bluetooth requires a Secure Context (HTTPS or http://localhost).';
  } else if (!nav.bluetooth) {
    if (browserName === 'Apple Safari' || browserName === 'Mozilla Firefox') {
      bluetoothRecommendation = `${browserName} does not implement Web Bluetooth. Please switch to Google Chrome, Microsoft Edge, or Opera.`;
    } else {
      bluetoothRecommendation = 'Web Bluetooth is not enabled or not supported on this platform.';
    }
  }

  let usbRecommendation = 'Supported in this browser over HTTPS or localhost.';
  if (!isSecureContext) {
    usbRecommendation = 'Not available: WebUSB requires a Secure Context (HTTPS or http://localhost).';
  } else if (!nav.usb) {
    if (browserName === 'Apple Safari' || browserName === 'Mozilla Firefox') {
      usbRecommendation = `${browserName} does not implement WebUSB. Please switch to Google Chrome, Microsoft Edge, or Opera.`;
    } else {
      usbRecommendation = 'WebUSB is not enabled or not supported on this platform.';
    }
  } else if (osName === 'Windows') {
    usbRecommendation = 'WebUSB is supported. On Windows, if your printer uses a standard Windows print driver, you must replace it with WinUSB (using Zadig) to enable direct browser access.';
  }

  return {
    browserName,
    osName,
    isSecureContext,
    hasWebBluetooth,
    hasWebUsb,
    bluetoothRecommendation,
    usbRecommendation,
  };
}
