package com.bluprintrnapp.blueprints;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.net.Uri;
import android.util.Base64;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import BpPrinter.mylibrary.BluetoothConnectivity;
import BpPrinter.mylibrary.BpPrinter;

public class BluPrintsModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;
    private BluetoothConnectivity bluetoothConnectivity;
    private BpPrinter bpPrinter;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private int printerWidth = 32;

    public BluPrintsModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
        ScrybeContext scrybeContext = new ScrybeContext(context.getApplicationContext());
        this.bluetoothConnectivity = new BluetoothConnectivity(scrybeContext);
    }

    @NonNull
    @Override
    public String getName() {
        return "BluPrintsModule";
    }

    // ─── Bluetooth ────────────────────────────────────────────────────────────

    @ReactMethod
    public void getPairedPrinters(Promise promise) {
        try {
            Object raw = bluetoothConnectivity.getPairedPrinters();
            WritableArray result = new WritableNativeArray();
            if (raw instanceof List) {
                for (Object item : (List<?>) raw) {
                    if (item != null) result.pushString(item.toString());
                }
            }
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("GET_PAIRED_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void connectToPrinter(String printerName, Promise promise) {
        executor.execute(() -> {
            try {
                bluetoothConnectivity.setPrinterConnectionListener(new BluetoothConnectivity.PrinterConnectionListener() {
                    @Override
                    public void onPrinterConnected() {
                        bpPrinter = bluetoothConnectivity.getAemPrinter();
                        emitEvent("PrinterConnectionStatus", "connected");
                        promise.resolve("connected");
                    }

                    @Override
                    public void onPrinterConnectionFailed(String errorMessage) {
                        emitEvent("PrinterConnectionStatus", "failed:" + errorMessage);
                        promise.reject("CONNECT_FAILED", errorMessage);
                    }
                });
                bluetoothConnectivity.connectToPrinter(printerName);
            } catch (Exception e) {
                String msg = e.getMessage() != null ? e.getMessage() : "Unknown error";
                emitEvent("PrinterConnectionStatus", "failed:" + msg);
                promise.reject("CONNECT_ERROR", msg);
            }
        });
    }

    @ReactMethod
    public void disconnectPrinter(Promise promise) {
        executor.execute(() -> {
            try {
                bluetoothConnectivity.disConnectPrinter();
                bpPrinter = null;
                emitEvent("PrinterConnectionStatus", "disconnected");
                promise.resolve(null);
            } catch (Exception e) {
                // Still null out — we consider it disconnected regardless
                bpPrinter = null;
                promise.reject("DISCONNECT_ERROR", e.getMessage());
            }
        });
    }

    // ─── Printer Config ───────────────────────────────────────────────────────

    @ReactMethod
    public void setPrinterWidth(int width) {
        this.printerWidth = width;
    }

    @ReactMethod
    public void initializePrinter(Promise promise) {
        executor.execute(() -> {
            try {
                ensurePrinter();
                bpPrinter.Initialize_Printer();
                promise.resolve(null);
            } catch (IOException e) {
                handlePrintIOException(e, "INIT_ERROR", promise);
            }
        });
    }

    @ReactMethod
    public void autoCut(Promise promise) {
        executor.execute(() -> {
            try {
                ensurePrinter();
                bpPrinter.AutoCut();
                promise.resolve(null);
            } catch (IOException e) {
                handlePrintIOException(e, "AUTOCUT_ERROR", promise);
            }
        });
    }

    // ─── Print Text ───────────────────────────────────────────────────────────

    @ReactMethod
    public void printText(String text, int alignment, int charMode, Promise promise) {
        executor.execute(() -> {
            try {
                ensurePrinter();
                bpPrinter.POS_Set_Text_alingment((byte) alignment);
                bpPrinter.POS_Set_Char_Mode((byte) charMode);
                bpPrinter.print(text);
                promise.resolve(null);
            } catch (IOException e) {
                handlePrintIOException(e, "PRINT_TEXT_ERROR", promise);
            }
        });
    }

    // ─── Print Image (base64) ─────────────────────────────────────────────────

    @ReactMethod
    public void printImage(String base64String, int width, Promise promise) {
        executor.execute(() -> {
            try {
                ensurePrinter();
                byte[] bytes = Base64.decode(base64String, Base64.DEFAULT);
                Bitmap bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
                if (bitmap == null) {
                    promise.reject("PRINT_IMAGE_ERROR", "Failed to decode image");
                    return;
                }
                int widthFlag = (width == 48) ? 1 : 0;
                bpPrinter.POS_Set_Text_alingment((byte) 0x01);
                bpPrinter.printImage(bitmap, widthFlag);
                bpPrinter.setCarriageReturn();
                bpPrinter.setCarriageReturn();
                promise.resolve(null);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                promise.reject("PRINT_IMAGE_ERROR", "Print interrupted: " + e.getMessage());
            } catch (IOException e) {
                handlePrintIOException(e, "PRINT_IMAGE_ERROR", promise);
            }
        });
    }

    // ─── Print File ───────────────────────────────────────────────────────────

    @ReactMethod
    public void printFile(String filePath, Promise promise) {
        executor.execute(() -> {
            try {
                ensurePrinter();
                Bitmap bitmap;
                java.io.File file = new java.io.File(filePath);
                if (file.exists()) {
                    bitmap = BitmapFactory.decodeFile(filePath);
                } else {
                    java.io.InputStream is = reactContext.getAssets().open(filePath);
                    bitmap = BitmapFactory.decodeStream(is);
                    is.close();
                }
                if (bitmap == null) {
                    promise.reject("PRINT_FILE_ERROR", "Could not decode file: " + filePath);
                    return;
                }
                int widthFlag = (printerWidth == 48) ? 1 : 0;
                bpPrinter.POS_Set_Text_alingment((byte) 0x01);
                bpPrinter.printImage(bitmap, widthFlag);
                bpPrinter.setCarriageReturn();
                bpPrinter.setCarriageReturn();
                promise.resolve(null);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                promise.reject("PRINT_FILE_ERROR", "Print interrupted: " + e.getMessage());
            } catch (IOException e) {
                handlePrintIOException(e, "PRINT_FILE_ERROR", promise);
            }
        });
    }

    // ─── Print Barcode ────────────────────────────────────────────────────────

    @ReactMethod
    public void printBarcode(String text, String type, String height, String charPos, Promise promise) {
        executor.execute(() -> {
            try {
                ensurePrinter();
                BpPrinter.BARCODE_TYPE barcodeType = parseBarcodeType(type);
                BpPrinter.BARCODE_HEIGHT barcodeHeight = parseBarcodeHeight(height);
                BpPrinter.CHAR_POSITION charPosition = parseCharPosition(charPos);
                bpPrinter.printBarcode(text, barcodeType, barcodeHeight, charPosition);
                bpPrinter.setLineFeed(2);
                promise.resolve(null);
            } catch (IOException e) {
                handlePrintIOException(e, "PRINT_BARCODE_ERROR", promise);
            }
        });
    }

    // ─── Print QR Code ────────────────────────────────────────────────────────

    @ReactMethod
    public void printQRCode(String text, Promise promise) {
        executor.execute(() -> {
            try {
                ensurePrinter();
                com.google.zxing.Writer writer = new com.google.zxing.qrcode.QRCodeWriter();
                String encoded = Uri.encode(text, "UTF-8");
                com.google.zxing.common.BitMatrix bm =
                        writer.encode(encoded, com.google.zxing.BarcodeFormat.QR_CODE, 300, 300);
                Bitmap bitmap = Bitmap.createBitmap(300, 300, Bitmap.Config.ARGB_8888);
                for (int i = 0; i < 300; i++) {
                    for (int j = 0; j < 300; j++) {
                        bitmap.setPixel(i, j, bm.get(i, j) ? Color.BLACK : Color.WHITE);
                    }
                }
                int widthFlag = (printerWidth == 48) ? 1 : 0;
                bpPrinter.POS_Set_Text_alingment((byte) 0x01);
                bpPrinter.printImage(bitmap, widthFlag);
                bpPrinter.setCarriageReturn();
                bpPrinter.setCarriageReturn();
                promise.resolve(null);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                promise.reject("PRINT_QR_ERROR", "Print interrupted: " + e.getMessage());
            } catch (IOException e) {
                handlePrintIOException(e, "PRINT_QR_ERROR", promise);
            } catch (Exception e) {
                promise.reject("PRINT_QR_ERROR", e.getMessage());
            }
        });
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private void ensurePrinter() throws IOException {
        if (bpPrinter == null) {
            throw new IOException("Printer not connected");
        }
    }

    /**
     * Central handler for all print-time IOExceptions.
     * Detects socket-closed / broken-pipe as a mid-print disconnect and emits
     * the PrinterDisconnected event so the JS layer can update UI and cancel the queue.
     */
    private void handlePrintIOException(IOException e, String code, Promise promise) {
        String msg = e.getMessage() != null ? e.getMessage() : "IO error";
        String lower = msg.toLowerCase();
        boolean isDisconnect =
                lower.contains("socket closed") ||
                lower.contains("broken pipe") ||
                lower.contains("connection reset") ||
                lower.contains("econnreset");

        if (isDisconnect) {
            bpPrinter = null;
            emitEvent("PrinterConnectionStatus", "disconnected");
            emitEvent("PrinterDisconnected", "Printer turned off or out of range during printing.");
        }

        promise.reject(code, msg);
    }

    private void emitEvent(String eventName, String data) {
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, data);
    }

    private BpPrinter.BARCODE_TYPE parseBarcodeType(String type) {
        switch (type.toUpperCase()) {
            case "UPCE":  return BpPrinter.BARCODE_TYPE.UPCE;
            case "EAN8":  return BpPrinter.BARCODE_TYPE.EAN8;
            case "EAN13": return BpPrinter.BARCODE_TYPE.EAN13;
            case "UPCA":  return BpPrinter.BARCODE_TYPE.UPCA;
            default:      return BpPrinter.BARCODE_TYPE.CODE39;
        }
    }

    private BpPrinter.BARCODE_HEIGHT parseBarcodeHeight(String height) {
        switch (height.toUpperCase()) {
            case "MEDIUM": return BpPrinter.BARCODE_HEIGHT.HT_MEDIUM;
            case "LARGE":  return BpPrinter.BARCODE_HEIGHT.HT_LARGE;
            default:       return BpPrinter.BARCODE_HEIGHT.HT_SMALL;
        }
    }

    private BpPrinter.CHAR_POSITION parseCharPosition(String pos) {
        switch (pos.toUpperCase()) {
            case "ABOVE": return BpPrinter.CHAR_POSITION.POS_ABOVE;
            case "BELOW": return BpPrinter.CHAR_POSITION.POS_BELOW;
            case "BOTH":  return BpPrinter.CHAR_POSITION.POS_BOTH;
            default:      return BpPrinter.CHAR_POSITION.POS_NONE;
        }
    }
}
