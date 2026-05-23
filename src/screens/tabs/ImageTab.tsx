import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { launchImageLibrary, type ImagePickerResponse } from 'react-native-image-picker';
import { AppButton } from '../../components/AppButton';
import { printImage, initializePrinter } from '../../modules/BluPrintsPrinter';
import type { PrinterWidth } from '../../modules/BluPrintsTypes';
import type { usePrintQueue } from '../../hooks/usePrintQueue';

interface Props {
  printerWidth: PrinterWidth;
  enqueue: ReturnType<typeof usePrintQueue>['enqueue'];
  onStatus: (msg: string) => void;
}

export function ImageTab({ printerWidth, enqueue, onStatus }: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);

  function pickImage() {
    launchImageLibrary(
      { mediaType: 'photo', includeBase64: true, quality: 0.8 },
      (response: ImagePickerResponse) => {
        if (response.didCancel || response.errorCode) return;
        const asset = response.assets?.[0];
        if (!asset) return;
        setImageUri(asset.uri ?? null);
        setBase64(asset.base64 ?? null);
      },
    );
  }

  function handlePrint() {
    if (!base64) { onStatus('Select an image first.'); return; }
    const b = base64, w = printerWidth;
    enqueue('Print image', async () => {
      await initializePrinter();
      await printImage(b, w);
    });
    onStatus('Job queued ✓');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppButton label="Select Image" onPress={pickImage} variant="secondary" />

      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No image selected</Text>
        </View>
      )}

      <AppButton
        label="Print Image"
        onPress={handlePrint}
        disabled={!base64}
        style={styles.btn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, alignItems: 'stretch' },
  preview: { width: '100%', height: 200, marginTop: 16, borderRadius: 8, backgroundColor: '#f0f0f0' },
  placeholder: { height: 160, marginTop: 16, borderRadius: 8, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e0e0e0', borderStyle: 'dashed' },
  placeholderText: { color: '#bbb', fontSize: 14 },
  btn: { marginTop: 20 },
});
