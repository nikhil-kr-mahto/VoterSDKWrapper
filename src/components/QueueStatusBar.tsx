import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { PrintJob } from '../hooks/usePrintQueue';

interface Props {
  jobs: PrintJob[];
  isProcessing: boolean;
  onClear: () => void;
  onCancel: () => void;
}

export function QueueStatusBar({ jobs, isProcessing, onClear, onCancel }: Props) {
  const queued  = jobs.filter(j => j.status === 'queued').length;
  const running = jobs.filter(j => j.status === 'running').length;
  const done    = jobs.filter(j => j.status === 'done').length;
  const errors  = jobs.filter(j => j.status === 'error').length;

  if (jobs.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {isProcessing && <View style={styles.spinner} />}
        <Text style={styles.summary}>
          {running > 0 ? `Printing…` : queued > 0 ? `${queued} queued` : 'Queue idle'}
          {done > 0 ? `  ✓ ${done}` : ''}
          {errors > 0 ? `  ✗ ${errors}` : ''}
        </Text>
      </View>
      <View style={styles.actions}>
        {queued > 0 && (
          <TouchableOpacity onPress={onCancel} style={styles.btn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
        {(done > 0 || errors > 0) && !isProcessing && (
          <TouchableOpacity onPress={onClear} style={styles.btn}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e8eaf6',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#c5cae9',
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  spinner: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#1565c0',
    marginRight: 8,
    opacity: 0.8,
  },
  summary: { fontSize: 12, color: '#283593', fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12 },
  btn: { paddingHorizontal: 4 },
  cancelText: { fontSize: 12, color: '#c62828', fontWeight: '600' },
  clearText: { fontSize: 12, color: '#1565c0', fontWeight: '600' },
});
