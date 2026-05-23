import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { printBarcode, initializePrinter, autoCut } from '../../modules/BluPrintsPrinter';
import type { BarcodeType, BarcodeHeight, BarcodeCharPos } from '../../modules/BluPrintsTypes';
import type { usePrintQueue } from '../../hooks/usePrintQueue';

const TYPES: BarcodeType[] = ['CODE39', 'UPCE', 'EAN8', 'EAN13', 'UPCA'];
const HEIGHTS: BarcodeHeight[] = ['SMALL', 'MEDIUM', 'LARGE'];
const POSITIONS: BarcodeCharPos[] = ['NONE', 'ABOVE', 'BELOW', 'BOTH'];

interface Props {
  enqueue: ReturnType<typeof usePrintQueue>['enqueue'];
  onStatus: (msg: string) => void;
}

export function BarcodeTab({ enqueue, onStatus }: Props) {
  const [text, setText] = useState('*BLUPRINTS*');
  const [type, setType] = useState<BarcodeType>('CODE39');
  const [height, setHeight] = useState<BarcodeHeight>('SMALL');
  const [charPos, setCharPos] = useState<BarcodeCharPos>('BELOW');

  function handlePrint() {
    if (!text.trim()) { onStatus('Enter barcode text.'); return; }
    const t = text, ty = type, h = height, cp = charPos;
    enqueue('Print barcode', async () => {
      await initializePrinter();
      await printBarcode(t, ty, h, cp);
      await autoCut();
    });
    onStatus('Job queued ✓');
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Barcode text…"
        placeholderTextColor="#aaa"
        autoCapitalize="characters"
      />

      <Text style={styles.label}>Barcode Type</Text>
      <View style={styles.row}>
        {TYPES.map(t => (
          <TouchableOpacity key={t} style={[styles.chip, type === t && styles.chipActive]} onPress={() => setType(t)}>
            <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Height</Text>
      <View style={styles.row}>
        {HEIGHTS.map(h => (
          <TouchableOpacity key={h} style={[styles.chip, height === h && styles.chipActive]} onPress={() => setHeight(h)}>
            <Text style={[styles.chipText, height === h && styles.chipTextActive]}>{h}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Text Position</Text>
      <View style={styles.row}>
        {POSITIONS.map(p => (
          <TouchableOpacity key={p} style={[styles.chip, charPos === p && styles.chipActive]} onPress={() => setCharPos(p)}>
            <Text style={[styles.chipText, charPos === p && styles.chipTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <AppButton label="Print Barcode" onPress={handlePrint} style={styles.btn} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 14, color: '#212121', backgroundColor: '#fff' },
  label: { fontSize: 12, fontWeight: '600', color: '#555', marginTop: 16, marginBottom: 6, textTransform: 'uppercase' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#ccc', backgroundColor: '#fff' },
  chipActive: { borderColor: '#1565c0', backgroundColor: '#e3f2fd' },
  chipText: { fontSize: 13, color: '#555' },
  chipTextActive: { color: '#1565c0', fontWeight: '700' },
  btn: { marginTop: 24 },
});
