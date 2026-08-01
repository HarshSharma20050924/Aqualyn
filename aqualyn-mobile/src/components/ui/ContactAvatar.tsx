import React, { useEffect, useMemo, useState } from 'react';
import { Image, ImageResizeMode, ImageStyle, StyleProp } from 'react-native';
import { getLocalAvatarSource, isTrustedSrc } from '../../utils/avatars';

interface ContactAvatarProps {
  name?: string | null;
  src?: string | null;
  style?: StyleProp<ImageStyle>;
  blurRadius?: number;
  resizeMode?: ImageResizeMode;
}

const ContactAvatar: React.FC<ContactAvatarProps> = ({
  name,
  src,
  style,
  blurRadius,
  resizeMode = 'cover',
}) => {
  const fallbackSource = useMemo(() => getLocalAvatarSource(name), [name]);
  const [useFallback, setUseFallback] = useState(() => !isTrustedSrc(src));

  useEffect(() => {
    setUseFallback(!isTrustedSrc(src));
  }, [src, name]);

  const source = useFallback ? fallbackSource : { uri: src! };

  return (
    <Image
      source={source}
      style={style}
      blurRadius={blurRadius}
      resizeMode={resizeMode}
      onError={() => setUseFallback(true)}
    />
  );
};

export default ContactAvatar;
export { getLocalAvatarSource, isTrustedSrc } from '../../utils/avatars';
