import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import type {
  PrinterWidth,
  TextAlignment,
  CharMode,
  BarcodeType,
  BarcodeHeight,
  BarcodeCharPos,
  ConnectionStatus,
} from './BluPrintsTypes';

// ─── Guard ────────────────────────────────────────────────────────────────────

if (Platform.OS !== 'android') {
  console.warn('BluPrintsModule is Android-only. All calls will be no-ops on iOS.');
}

const { BluPrintsModule: NativeModule } = NativeModules;

if (!NativeModule && Platform.OS === 'android') {
  throw new Error(
    'BluPrintsModule native module not found. ' +
    'Ensure BluPrintsPackage is registered in MainApplication.kt and the app has been rebuilt.',
  );
}

// ─── Event Emitter ────────────────────────────────────────────────────────────

export const printerEvents = NativeModule
  ? new NativeEventEmitter(NativeModule)
  : null;

/**
 * Subscribe to printer connection status changes.
 * @returns unsubscribe function
 */
export function onConnectionStatus(
  callback: (status: ConnectionStatus) => void,
): () => void {
  if (!printerEvents) return () => {};
  const sub = printerEvents.addListener('PrinterConnectionStatus', callback);
  return () => sub.remove();
}

// ─── Bluetooth ────────────────────────────────────────────────────────────────

/** Returns the names of all Bluetooth-paired printers. */
export function getPairedPrinters(): Promise<string[]> {
  return NativeModule.getPairedPrinters();
}

/**
 * Connects to a paired Bluetooth printer by name.
 * Resolves with "connected" on success.
 */
export function connectToPrinter(name: string): Promise<string> {
  return NativeModule.connectToPrinter(name);
}

/** Disconnects the current printer. */
export function disconnectPrinter(): Promise<void> {
  return NativeModule.disconnectPrinter();
}

// ─── Printer Config ───────────────────────────────────────────────────────────

/**
 * Sets the printer paper width.
 * 32 = 2-inch printer, 48 = 3-inch printer.
 */
export function setPrinterWidth(width: PrinterWidth): void {
  NativeModule.setPrinterWidth(width);
}

/** Resets printer formatting to defaults. */
export function initializePrinter(): Promise<void> {
  return NativeModule.initializePrinter();
}

/** Triggers the auto-cut mechanism. */
export function autoCut(): Promise<void> {
  return NativeModule.autoCut();
}

// ─── Print Text ───────────────────────────────────────────────────────────────

/**
 * Prints a text string with the given alignment and character mode.
 *
 * @param text      - The string to print (include \n for line breaks)
 * @param alignment - 0=right, 1=center, 2=left (default: 2)
 * @param charMode  - 0x00=normal, 0x01=tahoma, 0x02=calibri, 0x03=verdana,
 *                    0x10=double-height, 0x20=double-width, 0x80=underline
 */
export function printText(
  text: string,
  alignment: TextAlignment = 2,
  charMode: CharMode = 0x00,
): Promise<void> {
  return NativeModule.printText(text, alignment, charMode);
}

// ─── Print File ───────────────────────────────────────────────────────────────

/**
 * Prints an image file from the device.
 *
 * @param filePath - Absolute path to the file (e.g. from react-native-fs)
 *                   or an asset filename bundled in the app.
 *
 * This is the primary method for sending a file from the RN app to the printer.
 *
 * Example with react-native-fs:
 *   const path = `${RNFS.DocumentDirectoryPath}/receipt.jpg`;
 *   await printFile(path);
 */
export function printFile(filePath: string): Promise<void> {
  return NativeModule.printFile(filePath);
}

// ─── Print Image (base64) ─────────────────────────────────────────────────────

/**
 * Prints an image from a base64-encoded string.
 *
 * @param base64      - Base64 string of the image (no data URI prefix)
 * @param printerWidth - 32 or 48 chars wide
 */
export function printImage(
  base64: string,
  printerWidth: PrinterWidth = 32,
): Promise<void> {
  return NativeModule.printImage(base64, printerWidth);
}

// ─── Print Barcode ────────────────────────────────────────────────────────────

/**
 * Prints a barcode.
 *
 * @param text    - Barcode data string
 * @param type    - "CODE39" | "UPCE" | "EAN8" | "EAN13" | "UPCA"
 * @param height  - "SMALL" | "MEDIUM" | "LARGE"
 * @param charPos - "NONE" | "ABOVE" | "BELOW" | "BOTH"
 */
export function printBarcode(
  text: string,
  type: BarcodeType = 'CODE39',
  height: BarcodeHeight = 'SMALL',
  charPos: BarcodeCharPos = 'BELOW',
): Promise<void> {
  return NativeModule.printBarcode(text, type, height, charPos);
}

// ─── Print QR Code ────────────────────────────────────────────────────────────

/**
 * Generates a QR code from text and prints it.
 *
 * @param text - The content to encode in the QR code
 */
export function printQRCode(text: string): Promise<void> {
  return NativeModule.printQRCode(text);
}
