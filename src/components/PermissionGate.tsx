import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Linking,
  ScrollView,
} from 'react-native';
import { AppButton } from './AppButton';
import type { PermissionStatus } from '../hooks/usePermissions';

interface Props {
  status: PermissionStatus;
  deniedList: string[];
  onRequest: () => void;
  children: React.ReactNode;
}

export function PermissionGate({ status, deniedList, onRequest, children }: Props) {
  // Pass-through: non-Android or all granted
  if (status === 'granted' || status === 'unavailable') {
    return <>{children}</>;
  }

  if (status === 'checking') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1565c0" />
        <Text style={styles.checkingText}>Checking permissions…</Text>
      </View>
    );
  }

  // denied or blocked
  const isBlocked = status === 'blocked';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.icon}>🔒</Text>
      <Text style={styles.title}>Permissions Required</Text>
      <Text style={styles.body}>
        This app needs Bluetooth and storage permissions to discover printers and print files.
      </Text>

      {deniedList.length > 0 && (
        <View style={styles.deniedBox}>
          <Text style={styles.deniedTitle}>Missing permissions:</Text>
          {deniedList.map(p => (
            <Text key={p} style={styles.deniedItem}>• {formatPermName(p)}</Text>
          ))}
        </View>
      )}

      {isBlocked ? (
        <>
          <Text style={styles.blockedNote}>
            You selected "Don't ask again". Please enable the permissions manually in Settings.
          </Text>
          <AppButton
            label="Open App Settings"
            onPress={() => Linking.openSettings()}
            style={styles.btn}
          />
          <AppButton
            label="I've enabled them — Retry"
            onPress={onRequest}
            variant="secondary"
            style={styles.btn}
          />
        </>
      ) : (
        <>
          <Text style={styles.deniedNote}>
            Tap below to grant the required permissions.
          </Text>
          <AppButton
            label="Grant Permissions"
            onPress={onRequest}
            style={styles.btn}
          />
        </>
      )}
    </ScrollView>
  );
}

// Turn "BLUETOOTH_SCAN" → "Bluetooth Scan"
function formatPermName(raw: string): string {
  return raw
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  checkingText: { marginTop: 12, color: '#666', fontSize: 14 },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#fafafa',
  },
  icon: { fontSize: 52, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#1a237e', marginBottom: 12, textAlign: 'center' },
  body: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  deniedBox: {
    width: '100%',
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffe0b2',
  },
  deniedTitle: { fontSize: 13, fontWeight: '700', color: '#e65100', marginBottom: 6 },
  deniedItem: { fontSize: 13, color: '#bf360c', marginBottom: 2 },
  blockedNote: {
    fontSize: 13,
    color: '#c62828',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  deniedNote: { fontSize: 13, color: '#555', textAlign: 'center', marginBottom: 16 },
  btn: { width: '100%', marginBottom: 10 },
});
