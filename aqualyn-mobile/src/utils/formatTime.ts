/**
 * formatTime.ts
 * Cross-platform date time formatter matching system layouts.
 */

export function formatTime(isoString: string): string {
  if (!isoString) return '';
  
  const date = new Date(isoString);
  
  // Guard against invalid date string formats parsing as NaN
  if (isNaN(date.getTime())) {
    return '';
  }

  // React Native running under certain Android builds without full ICU data support 
  // can result in inconsistent options or outputs using native .toLocaleTimeString().
  // Using explicit configurations ensures visual uniformity across iOS & Android devices.
  try {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  } catch (error) {
    // Stable primitive fallback layout if the Javascript engine lacks locale formatting support
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // true hour translation for '0' as '12'
    
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  }
}