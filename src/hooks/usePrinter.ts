import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import {
  getPairedPrinters,
  connectToPrinter,
  disconnectPrinter,
  setPrinterWidth,
  onConnectionStatus,
  printerEvents,
} from '../modules/BluPrintsPrinter';
import { usePrintQueue } from './usePrintQueue';
import type { PrinterWidth, ConnectionStatus } from '../modules/BluPrintsTypes';

export type PrinterState = 'idle' | 'scanning' | 'connecting' | 'connected' | 'disconnecting';

export function usePrinter() {
  const [state, setState] = useState<PrinterState>('idle');
  const [pairedPrinters, setPairedPrinters] = useState<string[]>([]);
  const [connectedPrinter, setConnectedPrinter] = useState<string | null>(null);
  const [printerWidth, setPrinterWidthState] = useState<PrinterWidth>(32);
  const [error, setError] = useState<string | null>(null);

  const queue = usePrintQueue();

  // ── Connection status events from native ────────────────────────────────────
  useEffect(() => {
    const unsub = onConnectionStatus((status: ConnectionStatus) => {
      if (status === 'connected') {
        setState('connected');
        setError(null);
      } else if (status === 'disconnected') {
        setState('idle');
        setConnectedPrinter(null);
        // Cancel any pending jobs — printer is gone
        queue.cancelPending();
      } else if (status.startsWith('failed:')) {
        setState('idle');
        setError(friendlyConnectError(status.replace('failed:', '')));
        setConnectedPrinter(null);
      }
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Mid-print disconnect: native emits PrinterDisconnected ─────────────────
  useEffect(() => {
    if (!printerEvents) return;
    const sub = printerEvents.addListener('PrinterDisconnected', (reason: string) => {
      setState('idle');
      setConnectedPrinter(null);
      queue.cancelPending();
      Alert.alert(
        'Printer Disconnected',
        reason || 'The printer disconnected unexpectedly. Please reconnect.',
        [{ text: 'OK' }],
      );
    });
    return () => sub.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const scanPrinters = useCallback(async () => {
    setError(null);
    setState('scanning');
    try {
      const list = await getPairedPrinters();
      setPairedPrinters(list);
    } catch (e: any) {
      setError(e.message ?? 'Failed to get paired printers');
    } finally {
      setState('idle');
    }
  }, []);

  const connect = useCallback(async (name: string) => {
    setError(null);
    setState('connecting');
    try {
      await connectToPrinter(name);
      setConnectedPrinter(name);
    } catch (e: any) {
      setState('idle');
      setError(friendlyConnectError(e.message ?? 'Connection failed'));
    }
  }, []);

  const disconnect = useCallback(async () => {
    setState('disconnecting');
    queue.cancelPending();
    try {
      await disconnectPrinter();
    } catch (e: any) {
      setError(e.message ?? 'Disconnect failed');
    } finally {
      setState('idle');
      setConnectedPrinter(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeWidth = useCallback((width: PrinterWidth) => {
    setPrinterWidthState(width);
    setPrinterWidth(width);
  }, []);

  return {
    state,
    pairedPrinters,
    connectedPrinter,
    printerWidth,
    error,
    queue,
    scanPrinters,
    connect,
    disconnect,
    changeWidth,
  };
}

function friendlyConnectError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('service discovery failed')) {
    return 'Printer is unreachable or turned off.';
  }
  if (m.includes('device or resource busy') || m.includes('already connected')) {
    return 'Printer is already connected to another device.';
  }
  if (m.includes('permission')) {
    return 'Bluetooth permission denied.';
  }
  return msg;
}
