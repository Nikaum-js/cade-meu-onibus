import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import screens
import { MapScreen } from './src/screens/map-screen';

export function App() {
  return (
    <SafeAreaProvider>
      <MapScreen />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
