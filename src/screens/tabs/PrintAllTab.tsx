import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { launchImageLibrary, type ImagePickerResponse } from 'react-native-image-picker';
import { AppButton } from '../../components/AppButton';
import {
  initializePrinter,
  printText,
  printFile,
  printQRCode,
  printBarcode,
  autoCut,
} from '../../modules/BluPrintsPrinter';
import type { PrinterWidth } from '../../modules/BluPrintsTypes';
import type { usePrintQueue } from '../../hooks/usePrintQueue';

interface Props {
  printerWidth: PrinterWidth;
  enqueue: ReturnType<typeof usePrintQueue>['enqueue'];
  onStatus: (msg: string) => void;
}

type StepStatus = 'idle' | 'running' | 'done' | 'error';
type Step = { label: string; status: StepStatus };

const INITIAL_STEPS: Step[] = [
  { label: 'Initialize printer', status: 'idle' },
  { label: 'Print text',         status: 'idle' },
  { label: 'Print file/image',   status: 'idle' },
  { label: 'Print QR code',      status: 'idle' },
  { label: 'Print barcode',      status: 'idle' },
  { label: 'Auto cut',           status: 'idle' },
];

export function PrintAllTab({ enqueue, onStatus }: Props) {
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [filePath, setFilePath] = useState<string | null>(null);

  function setStep(i: number, status: StepStatus) {
    setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status } : s));
  }

  function pickFile() {
    launchImageLibrary({ mediaType: 'photo', quality: 1 }, (r: ImagePickerResponse) => {
      if (r.didCancel || r.errorCode) return;
      const asset = r.assets?.[0];
      if (!asset?.uri) return;
      setFilePath(asset.uri.replace('file://', ''));
    });
  }

  function handlePrintAll() {
    setSteps(INITIAL_STEPS);
    const fp = filePath;

    enqueue('Print All', async () => {
      setStep(0, 'running');
      await initializePrinter();
      setStep(0, 'done');

      setStep(1, 'running');
      await printText('BluPrints Print All Test\n', 1, 0x00);
      setStep(1, 'done');

      setStep(2, 'running');
      if (fp) {
        await printFile(fp);
        setStep(2, 'done');
      } else {
        setStep(2, 'error');
      }

      setStep(3, 'running');
      await printQRCode('https://bluprints.in');
      setStep(3, 'done');

      setStep(4, 'running');
      await printBarcode('*BLUPRINTS*', 'CODE39', 'SMALL', 'BELOW');
      setStep(4, 'done');

      setStep(5, 'running');
      await autoCut();
      setStep(5, 'done');
    });

    onStatus('Print All queued ✓');
  }

  const icon  = (s: StepStatus) => s === 'done' ? '✓' : s === 'error' ? '✗' : s === 'running' ? '…' : '○';
  const color = (s: StepStatus) => s === 'done' ? '#2e7d32' : s === 'error' ? '#c62828' : s === 'running' ? '#1565c0' : '#9e9e9e';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.description}>
        Sequentially prints: text → file → QR code → barcode → auto cut.
      </Text>

      <AppButton
        label={filePath ? 'Change File' : 'Select File (optional)'}
        onPress={pickFile}
        variant="secondary"
        style={styles.pickBtn}
      />
      {filePath && <Text style={styles.pathText} numberOfLines={1}>{filePath}</Text>}

      <View style={styles.stepList}>
        {steps.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <Text style={[styles.stepIcon, { color: color(step.status) }]}>{icon(step.status)}</Text>
            <Text style={[styles.stepLabel, { color: color(step.status) }]}>{step.label}</Text>
          </View>
        ))}
      </View>

      <AppButton label="Print All" onPress={handlePrintAll} style={styles.btn} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  description: { fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 20 },
  pickBtn: { marginBottom: 8 },
  pathText: { fontSize: 11, color: '#888', marginBottom: 12, fontFamily: 'monospace' },
  stepList: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', padding: 12, marginBottom: 20 },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  stepIcon: { fontSize: 16, width: 24, fontWeight: '700' },
  stepLabel: { fontSize: 14 },
  btn: { marginTop: 4 },
});
