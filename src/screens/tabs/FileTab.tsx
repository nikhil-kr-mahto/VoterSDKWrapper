import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { launchImageLibrary, type ImagePickerResponse } from 'react-native-image-picker';
import { AppButton } from '../../components/AppButton';
import { printFile, initializePrinter } from '../../modules/BluPrintsPrinter';
import type { usePrintQueue } from '../../hooks/usePrintQueue';

interface Props {
  enqueue: ReturnType<typeof usePrintQueue>['enqueue'];
  onStatus: (msg: string) => void;
}

export function FileTab({ enqueue, onStatus }: Props) {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  function pickFile() {
    launchImageLibrary({ mediaType: 'photo', quality: 1 }, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorCode) return;
      const asset = response.assets?.[0];
      if (!asset?.uri) return;
      setFilePath(asset.uri.replace('file://', ''));
      setPreviewUri(asset.uri);
    });
  }

  function handlePrint() {
    if (!filePath) { onStatus('Select a file first.'); return; }
    const path = filePath;
    enqueue('Print file', async () => {
      await initializePrinter();
      await printFile(path);
    });
    onStatus('Job queued ✓');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.description}>
        Select an image file from your device. It will be sent directly to the printer.
      </Text>

      <AppButton label="Select File" onPress={pickFile} variant="secondary" />

      {previewUri ? (
        <>
          <Image source={{ uri: previewUri }} style={styles.preview} resizeMode="contain" />
          <Text style={styles.pathText} numberOfLines={2}>{filePath}</Text>
        </>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No file selected</Text>
        </View>
      )}

      <AppButton
        label="Send to Printer"
        onPress={handlePrint}
        disabled={!filePath}
        style={styles.btn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  description: { fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 20 },
  preview: { width: '100%', height: 200, marginTop: 16, borderRadius: 8, backgroundColor: '#f0f0f0' },
  placeholder: { height: 160, marginTop: 16, borderRadius: 8, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e0e0e0', borderStyle: 'dashed' },
  placeholderText: { color: '#bbb', fontSize: 14 },
  pathText: { fontSize: 11, color: '#888', marginTop: 8, fontFamily: 'monospace' },
  btn: { marginTop: 20 },
});
