import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PrinterState } from '../hooks/usePrinter';

interface Props {
  state: PrinterState;
  printerName: string | null;
}

export function StatusBadge({ state, printerName }: Props) {
  const connected = state === 'connected';
  const label =
    state === 'connecting'    ? 'Connecting…' :
    state === 'disconnecting' ? 'Disconnecting…' :
    state === 'scanning'      ? 'Scanning…' :
    connected                 ? `Connected: ${printerName}` :
    'Disconnected';

  return (
    <View style={[styles.badge, connected ? styles.connected : styles.disconnected]}>
      <View style={[styles.dot, { backgroundColor: connected ? '#4caf50' : '#9e9e9e' }]} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  connected:    { backgroundColor: '#e8f5e9' },
  disconnected: { backgroundColor: '#f5f5f5' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  text: { fontSize: 13, color: '#333', fontWeight: '500' },
});
