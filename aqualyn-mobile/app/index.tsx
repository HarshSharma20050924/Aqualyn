import React from 'react';
import App from '../src/App';
import { AppProvider } from '../src/context/AppContext';
import { CallProvider } from '../src/context/CallContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function EntryPoint() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <CallProvider>
          <App />
        </CallProvider>
      </AppProvider>
    </GestureHandlerRootView>
  );
}
