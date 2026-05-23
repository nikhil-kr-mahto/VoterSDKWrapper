import React, { useState } from 'react';
import { StyleSheet, ScrollView, TextInput } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { printQRCode, initializePrinter } from '../../modules/BluPrintsPrinter';
import type { usePrintQueue } from '../../hooks/usePrintQueue';

interface Props {
  enqueue: ReturnType<typeof usePrintQueue>['enqueue'];
  onStatus: (msg: string) => void;
}

export function QRTab({ enqueue, onStatus }: Props) {
  const [text, setText] = useState('https://bluprints.in');

  function handlePrint() {
    if (!text.trim()) { onStatus('Enter text to encode.'); return; }
    const t = text;
    enqueue('Print QR code', async () => {
      await initializePrinter();
      await printQRCode(t);
    });
    onStatus('Job queued ✓');
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Enter URL or text for QR code…"
        placeholderTextColor="#aaa"
        autoCapitalize="none"
      />
      <AppButton label="Print QR Code" onPress={handlePrint} style={styles.btn} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 14, color: '#212121', backgroundColor: '#fff' },
  btn: { marginTop: 20 },
});
