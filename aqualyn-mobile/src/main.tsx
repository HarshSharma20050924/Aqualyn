/**
 * index.js / index.tsx
 * Native Application Core Entry Gate
 */

import { registerRootComponent } from 'expo'; // or import { AppRegistry } from 'react-native';
import React from 'react';
import App from './App';
import { AppProvider } from './context/AppContext';
import { CallProvider } from './context/CallContext';

function NativeRoot() {
  return (
    <AppProvider>
      <CallProvider>
        <App />
      </CallProvider>
    </AppProvider>
  );
}

// Registers the main component gate cleanly mapped onto iOS and Android native platforms
registerRootComponent(NativeRoot);