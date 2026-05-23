import { useCallback, useEffect, useState } from 'react';
import { PermissionsAndroid, Platform, type Permission } from 'react-native';

export type PermissionStatus =
  | 'checking'
  | 'granted'
  | 'denied'       // asked once, user said no — can ask again
  | 'blocked'      // "never ask again" — must open Settings
  | 'unavailable'; // non-Android

// ─── Permission lists per API level ──────────────────────────────────────────

// Android 12+ (API 31+): fine-grained BT permissions replace legacy ones
const BT_PERMISSIONS_API31: Permission[] = [
  PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
  PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
  PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
];

// Android < 12: legacy coarse permissions (declared in manifest, no runtime grant needed
// on API < 23, but we request them anyway for API 23–30 devices)
const BT_PERMISSIONS_LEGACY: Permission[] = [
  PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, // required for BT scan on API < 31
];

// Storage: READ_MEDIA_IMAGES on API 33+, READ_EXTERNAL_STORAGE on API 23–32
const STORAGE_PERMISSION_API33: Permission =
  'android.permission.READ_MEDIA_IMAGES' as Permission;
const STORAGE_PERMISSION_LEGACY: Permission =
  PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getApiLevel(): number {
  // Platform.Version is the Android API level as a number on Android
  return typeof Platform.Version === 'number' ? Platform.Version : 0;
}

function buildPermissionList(): Permission[] {
  const api = getApiLevel();
  const bt = api >= 31 ? BT_PERMISSIONS_API31 : BT_PERMISSIONS_LEGACY;
  const storage = api >= 33 ? STORAGE_PERMISSION_API33 : STORAGE_PERMISSION_LEGACY;
  return [...bt, storage];
}

function resolveOverallStatus(
  results: Record<string, string>,
): PermissionStatus {
  const values = Object.values(results);
  if (values.every(v => v === PermissionsAndroid.RESULTS.GRANTED)) return 'granted';
  if (values.some(v => v === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN)) return 'blocked';
  return 'denied';
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePermissions() {
  const [status, setStatus] = useState<PermissionStatus>(
    Platform.OS !== 'android' ? 'unavailable' : 'checking',
  );
  // Per-permission detail for the UI to show which ones failed
  const [deniedList, setDeniedList] = useState<string[]>([]);

  const check = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setStatus('unavailable');
      return;
    }

    setStatus('checking');
    const permissions = buildPermissionList();

    try {
      // Check current state without prompting
      const checkResults: Record<string, string> = {};
      for (const perm of permissions) {
        const already = await PermissionsAndroid.check(perm);
        checkResults[perm] = already
          ? PermissionsAndroid.RESULTS.GRANTED
          : PermissionsAndroid.RESULTS.DENIED;
      }

      const alreadyGranted = Object.values(checkResults).every(
        v => v === PermissionsAndroid.RESULTS.GRANTED,
      );

      if (alreadyGranted) {
        setDeniedList([]);
        setStatus('granted');
        return;
      }

      // Request the ones not yet granted
      const toRequest = permissions.filter(
        p => checkResults[p] !== PermissionsAndroid.RESULTS.GRANTED,
      );
      const requestResults = await PermissionsAndroid.requestMultiple(toRequest);

      // Merge: already-granted ones stay granted
      const merged: Record<string, string> = { ...checkResults, ...requestResults };

      const denied = Object.entries(merged)
        .filter(([, v]) => v !== PermissionsAndroid.RESULTS.GRANTED)
        .map(([k]) => k.split('.').pop() ?? k); // short name for display

      setDeniedList(denied);
      setStatus(resolveOverallStatus(merged));
    } catch (e) {
      // Unexpected error — treat as denied so user can retry
      setStatus('denied');
    }
  }, []);

  // Run once on mount
  useEffect(() => {
    check();
  }, [check]);

  return { status, deniedList, requestPermissions: check };
}
