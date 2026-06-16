import React from 'react';
import App from '../src/App';
import { AppProvider } from '../src/context/AppContext';
import { CallProvider } from '../src/context/CallContext';

export default function EntryPoint() {
  return (
    <AppProvider>
      <CallProvider>
        <App />
      </CallProvider>
    </AppProvider>
  );
}
