# utils/formatTime.ts

## File Location
`frontend/src/utils/formatTime.ts`

## Purpose
See implementation below for details.

## Implementation

```typescript
export function formatTime(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
```
