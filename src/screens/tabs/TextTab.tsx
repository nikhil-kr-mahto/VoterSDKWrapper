import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { printText, initializePrinter } from '../../modules/BluPrintsPrinter';
import type { TextAlignment, CharMode } from '../../modules/BluPrintsTypes';
import type { usePrintQueue } from '../../hooks/usePrintQueue';

const ALIGNMENTS: { label: string; value: TextAlignment }[] = [
  { label: 'Left', value: 2 },
  { label: 'Center', value: 1 },
  { label: 'Right', value: 0 },
];

const CHAR_MODES: { label: string; value: CharMode }[] = [
  { label: 'Normal', value: 0x00 },
  { label: 'Tahoma', value: 0x01 },
  { label: 'Calibri', value: 0x02 },
  { label: 'Verdana', value: 0x03 },
  { label: 'Dbl Height', value: 0x10 },
  { label: 'Dbl Width', value: 0x20 },
  { label: 'Underline', value: 0x80 },
];

interface Props {
  enqueue: ReturnType<typeof usePrintQueue>['enqueue'];
  onStatus: (msg: string) => void;
}

export function TextTab({ enqueue, onStatus }: Props) {
  const [text, setText] = useState('Hello from BluPrints!\n');
  const [alignment, setAlignment] = useState<TextAlignment>(2);
  const [charMode, setCharMode] = useState<CharMode>(0x00);

  function handlePrint() {
    if (!text.trim()) { onStatus('Enter some text first.'); return; }
    const t = text, a = alignment, c = charMode;
    enqueue('Print text', async () => {
      await initializePrinter();
      await printText(t, a, c);
    });
    onStatus('Job queued ✓');
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <TextInput
        style={styles.input}
        multiline
        value={text}
        onChangeText={setText}
        placeholder="Enter text to print…"
        placeholderTextColor="#aaa"
      />

      <Text style={styles.label}>Alignment</Text>
      <View style={styles.row}>
        {ALIGNMENTS.map(a => (
          <TouchableOpacity
            key={a.value}
            style={[styles.chip, alignment === a.value && styles.chipActive]}
            onPress={() => setAlignment(a.value)}
          >
            <Text style={[styles.chipText, alignment === a.value && styles.chipTextActive]}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Font Style</Text>
      <View style={styles.row}>
        {CHAR_MODES.map(m => (
          <TouchableOpacity
            key={m.value}
            style={[styles.chip, charMode === m.value && styles.chipActive]}
            onPress={() => setCharMode(m.value)}
          >
            <Text style={[styles.chipText, charMode === m.value && styles.chipTextActive]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <AppButton label="Print Text" onPress={handlePrint} style={styles.btn} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, minHeight: 100, fontSize: 14, color: '#212121', backgroundColor: '#fff', textAlignVertical: 'top' },
  label: { fontSize: 12, fontWeight: '600', color: '#555', marginTop: 16, marginBottom: 6, textTransform: 'uppercase' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#ccc', backgroundColor: '#fff' },
  chipActive: { borderColor: '#1565c0', backgroundColor: '#e3f2fd' },
  chipText: { fontSize: 13, color: '#555' },
  chipTextActive: { color: '#1565c0', fontWeight: '700' },
  btn: { marginTop: 24 },
});
