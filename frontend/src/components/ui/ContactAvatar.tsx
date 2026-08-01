import React, { useState } from 'react';

interface ContactAvatarProps {
  /** The contact/user's name — used to pick the letter PNG fallback */
  name?: string | null;
  /** Optional real avatar URL (HTTP/base64). Will fall back to letter PNG on error */
  src?: string | null;
  /** CSS class applied to the <img> element */
  className?: string;
  alt?: string;
}

/**
 * Returns the path to the local pre-generated avatar PNG for a given name.
 * Uses the first letter of the name (A-Z). Falls back to 'A' for numbers/symbols.
 */
function getLocalAvatarPath(name?: string | null): string {
  const letter = (name ?? 'A').trim().toUpperCase().replace(/[^A-Z]/g, '') || 'A';
  return `/avatars/avatar_${letter[0]}.png`;
}

/**
 * Decides whether a given src URL should be trusted.
 * External APIs (dicebear, ui-avatars) are unreliable on mobile — we skip them.
 */
function isTrustedSrc(src?: string | null): boolean {
  if (!src) return false;
  // Skip known external avatar API services
  if (src.includes('dicebear.com')) return false;
  if (src.includes('ui-avatars.com')) return false;
  if (src.includes('api.adorable.io')) return false;
  if (src.includes('robohash.org')) return false;
  return true;
}

/**
 * ContactAvatar — renders a contact/user avatar with a local PNG fallback.
 *
 * Priority:
 *   1. `src` if it's a trusted URL (not an external avatar API)
 *   2. Local pre-generated glossy letter PNG based on the first letter of `name`
 *
 * This is mobile-safe and offline-safe — no external network calls for default avatars.
 */
const ContactAvatar: React.FC<ContactAvatarProps> = ({
  name,
  src,
  className = 'w-full h-full object-cover',
  alt,
}) => {
  const fallbackSrc = getLocalAvatarPath(name);
  const initialSrc = isTrustedSrc(src) ? src! : fallbackSrc;

  const [imgSrc, setImgSrc] = useState<string>(initialSrc);

  const handleError = () => {
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt ?? name ?? 'Avatar'}
      className={className}
      onError={handleError}
      loading="lazy"
      decoding="async"
    />
  );
};

export default ContactAvatar;
export { getLocalAvatarPath };
