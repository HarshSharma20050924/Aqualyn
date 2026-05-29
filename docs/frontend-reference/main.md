# main.tsx

## File Location
`frontend/src/main.tsx`

## Purpose
See implementation below for details.

## Implementation

```typescript
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AppProvider } from './context/AppContext.tsx';
import { CallProvider } from './context/CallContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <CallProvider>
        <App />
      </CallProvider>
    </AppProvider>
  </StrictMode>,
);

// Register service worker for notifications
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch((err) => {
    console.warn('[SW] Registration failed:', err);
  });
}
```
