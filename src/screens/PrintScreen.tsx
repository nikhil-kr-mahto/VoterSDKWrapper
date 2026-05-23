import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { StatusBadge } from '../components/StatusBadge';
import { AppButton } from '../components/AppButton';
import { QueueStatusBar } from '../components/QueueStatusBar';
import { TextTab } from './tabs/TextTab';
import { ImageTab } from './tabs/ImageTab';
import { FileTab } from './tabs/FileTab';
import { QRTab } from './tabs/QRTab';
import { BarcodeTab } from './tabs/BarcodeTab';
import { PrintAllTab } from './tabs/PrintAllTab';
import { usePrinter } from '../hooks/usePrinter';

type Tab = 'file' | 'text' | 'image' | 'qr' | 'barcode' | 'all';

const TABS: { key: Tab; label: string }[] = [
  { key: 'file',    label: 'File' },
  { key: 'text',    label: 'Text' },
  { key: 'image',   label: 'Image' },
  { key: 'qr',      label: 'QR' },
  { key: 'barcode', label: 'Barcode' },
  { key: 'all',     label: 'Print All' },
];

interface Props {
  printerHook: ReturnType<typeof usePrinter>;
  onBack: () => void;
}

export function PrintScreen({ printerHook, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('file');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const { state, connectedPrinter, printerWidth, queue } = printerHook;
  const { jobs, isProcessing, enqueue, clearHistory, cancelPending } = queue;

  function handleStatus(msg: string) {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3000);
  }

  function renderTab() {
    switch (activeTab) {
      case 'file':    return <FileTab enqueue={enqueue} onStatus={handleStatus} />;
      case 'text':    return <TextTab enqueue={enqueue} onStatus={handleStatus} />;
      case 'image':   return <ImageTab printerWidth={printerWidth} enqueue={enqueue} onStatus={handleStatus} />;
      case 'qr':      return <QRTab enqueue={enqueue} onStatus={handleStatus} />;
      case 'barcode': return <BarcodeTab enqueue={enqueue} onStatus={handleStatus} />;
      case 'all':     return <PrintAllTab printerWidth={printerWidth} enqueue={enqueue} onStatus={handleStatus} />;
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Setup</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Print Content</Text>
      </View>

      <View style={styles.statusRow}>
        <StatusBadge state={state} printerName={connectedPrinter} />
      </View>

      {/* Queue status bar */}
      <QueueStatusBar
        jobs={jobs}
        isProcessing={isProcessing}
        onClear={clearHistory}
        onCancel={cancelPending}
      />

      {/* Status toast */}
      {statusMsg && (
        <View style={[styles.toast, statusMsg.startsWith('Error') ? styles.toastError : styles.toastSuccess]}>
          <Text style={styles.toastText}>{statusMsg}</Text>
        </View>
      )}

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      <View style={styles.content}>
        {state !== 'connected' ? (
          <View style={styles.notConnected}>
            <Text style={styles.notConnectedText}>Not connected to a printer.</Text>
            <AppButton label="← Go to Setup" onPress={onBack} variant="secondary" style={styles.goSetupBtn} />
          </View>
        ) : (
          renderTab()
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backBtn: { marginRight: 12, padding: 4 },
  backText: { fontSize: 14, color: '#1565c0', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: '#1a237e' },
  statusRow: { paddingHorizontal: 16, marginBottom: 4 },
  toast: { marginHorizontal: 16, marginBottom: 6, padding: 10, borderRadius: 8 },
  toastSuccess: { backgroundColor: '#e8f5e9' },
  toastError: { backgroundColor: '#ffebee' },
  toastText: { fontSize: 13, fontWeight: '500', color: '#212121' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', backgroundColor: '#fff' },
  tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: '#1565c0' },
  tabLabel: { fontSize: 12, color: '#888', fontWeight: '500' },
  tabLabelActive: { color: '#1565c0', fontWeight: '700' },
  content: { flex: 1 },
  notConnected: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  notConnectedText: { fontSize: 15, color: '#9e9e9e', marginBottom: 20 },
  goSetupBtn: { width: 180 },
});
