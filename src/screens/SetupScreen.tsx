import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { AppButton } from '../components/AppButton';
import { StatusBadge } from '../components/StatusBadge';
import { usePrinter } from '../hooks/usePrinter';
import type { PrinterWidth } from '../modules/BluPrintsTypes';

interface Props {
  printerHook: ReturnType<typeof usePrinter>;
  onProceed: () => void;
}

const WIDTH_OPTIONS: { label: string; value: PrinterWidth }[] = [
  { label: '2-inch (58mm) — 32 chars', value: 32 },
  { label: '3-inch (80mm) — 48 chars', value: 48 },
];

export function SetupScreen({ printerHook, onProceed }: Props) {
  const {
    state,
    pairedPrinters,
    connectedPrinter,
    printerWidth,
    error,
    scanPrinters,
    connect,
    disconnect,
    changeWidth,
  } = printerHook;

  const isConnected = state === 'connected';
  const isBusy = state === 'connecting' || state === 'disconnecting' || state === 'scanning';

  function handleConnect(name: string) {
    if (isConnected) {
      Alert.alert('Already Connected', `Disconnect from ${connectedPrinter} first?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: disconnect },
      ]);
      return;
    }
    connect(name);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Printer Setup</Text>

      <StatusBadge state={state} printerName={connectedPrinter} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Width selector */}
      <Text style={styles.sectionLabel}>Paper Width</Text>
      <View style={styles.row}>
        {WIDTH_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.widthBtn, printerWidth === opt.value && styles.widthBtnActive]}
            onPress={() => changeWidth(opt.value)}
          >
            <Text style={[styles.widthBtnText, printerWidth === opt.value && styles.widthBtnTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Scan */}
      <AppButton
        label="Scan for Paired Printers"
        onPress={scanPrinters}
        loading={state === 'scanning'}
        disabled={isBusy}
        style={styles.scanBtn}
      />

      {/* Printer list */}
      {pairedPrinters.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Paired Printers</Text>
          <FlatList
            data={pairedPrinters}
            keyExtractor={item => item}
            style={styles.list}
            renderItem={({ item }) => {
              const active = connectedPrinter === item;
              return (
                <TouchableOpacity
                  style={[styles.printerItem, active && styles.printerItemActive]}
                  onPress={() => handleConnect(item)}
                  disabled={isBusy}
                >
                  <Text style={[styles.printerName, active && styles.printerNameActive]}>
                    {item}
                  </Text>
                  <Text style={styles.printerHint}>
                    {active ? 'Connected ✓' : 'Tap to connect'}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </>
      )}

      {pairedPrinters.length === 0 && state !== 'scanning' && (
        <Text style={styles.hint}>Tap "Scan" to discover paired Bluetooth printers.</Text>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {isConnected && (
          <>
            <AppButton
              label="Disconnect"
              onPress={disconnect}
              variant="danger"
              loading={state === 'disconnecting'}
              style={styles.actionBtn}
            />
            <AppButton
              label="Go to Print →"
              onPress={onProceed}
              style={styles.actionBtn}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fafafa' },
  title: { fontSize: 22, fontWeight: '700', color: '#1a237e', marginBottom: 12 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginTop: 20, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  error: { color: '#c62828', fontSize: 13, marginTop: 8, backgroundColor: '#ffebee', padding: 8, borderRadius: 6 },
  row: { flexDirection: 'row', gap: 10 },
  widthBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1.5, borderColor: '#ccc', alignItems: 'center' },
  widthBtnActive: { borderColor: '#1565c0', backgroundColor: '#e3f2fd' },
  widthBtnText: { fontSize: 12, color: '#555', textAlign: 'center' },
  widthBtnTextActive: { color: '#1565c0', fontWeight: '700' },
  scanBtn: { marginTop: 20 },
  list: { maxHeight: 220, marginTop: 4 },
  printerItem: { padding: 14, borderRadius: 8, backgroundColor: '#fff', marginBottom: 8, borderWidth: 1, borderColor: '#e0e0e0' },
  printerItemActive: { borderColor: '#1565c0', backgroundColor: '#e3f2fd' },
  printerName: { fontSize: 15, fontWeight: '600', color: '#212121' },
  printerNameActive: { color: '#1565c0' },
  printerHint: { fontSize: 12, color: '#888', marginTop: 2 },
  hint: { marginTop: 24, textAlign: 'center', color: '#9e9e9e', fontSize: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 24 },
  actionBtn: { flex: 1 },
});
