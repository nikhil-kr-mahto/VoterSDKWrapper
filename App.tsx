import React, { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus, StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { usePrinter } from './src/hooks/usePrinter';
import { usePermissions } from './src/hooks/usePermissions';
import { PermissionGate } from './src/components/PermissionGate';
import { SetupScreen } from './src/screens/SetupScreen';
import { PrintScreen } from './src/screens/PrintScreen';

type Screen = 'setup' | 'print';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const printerHook = usePrinter();
  const [screen, setScreen] = useState<Screen>('setup');
  const { status, deniedList, requestPermissions } = usePermissions();

  // Re-check permissions when app comes back to foreground (e.g. after Settings)
  const appState = useRef<AppStateStatus>(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        requestPermissions();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [requestPermissions]);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="#1a237e"
      />
      <PermissionGate
        status={status}
        deniedList={deniedList}
        onRequest={requestPermissions}
      >
        {screen === 'setup' ? (
          <SetupScreen
            printerHook={printerHook}
            onProceed={() => setScreen('print')}
          />
        ) : (
          <PrintScreen
            printerHook={printerHook}
            onBack={() => setScreen('setup')}
          />
        )}
      </PermissionGate>
    </SafeAreaProvider>
  );
}

export default App;
