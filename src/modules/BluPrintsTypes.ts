export type PrinterWidth = 32 | 48;

export type TextAlignment =
  | 0  // right
  | 1  // center
  | 2; // left

export type CharMode =
  | 0x00  // normal
  | 0x01  // tahoma
  | 0x02  // calibri
  | 0x03  // verdana
  | 0x10  // double height
  | 0x20  // double width
  | 0x80; // underline

export type BarcodeType = 'CODE39' | 'UPCE' | 'EAN8' | 'EAN13' | 'UPCA';
export type BarcodeHeight = 'SMALL' | 'MEDIUM' | 'LARGE';
export type BarcodeCharPos = 'NONE' | 'ABOVE' | 'BELOW' | 'BOTH';

export type ConnectionStatus =
  | 'connected'
  | 'disconnected'
  | `failed:${string}`;
