import { ImageSourcePropType } from 'react-native';

const AVATAR_SOURCES: Record<string, ImageSourcePropType> = {
  A: require('../../assets/images/avatars/avatar_A.png'),
  B: require('../../assets/images/avatars/avatar_B.png'),
  C: require('../../assets/images/avatars/avatar_C.png'),
  D: require('../../assets/images/avatars/avatar_D.png'),
  E: require('../../assets/images/avatars/avatar_E.png'),
  F: require('../../assets/images/avatars/avatar_F.png'),
  G: require('../../assets/images/avatars/avatar_G.png'),
  H: require('../../assets/images/avatars/avatar_H.png'),
  I: require('../../assets/images/avatars/avatar_I.png'),
  J: require('../../assets/images/avatars/avatar_J.png'),
  K: require('../../assets/images/avatars/avatar_K.png'),
  L: require('../../assets/images/avatars/avatar_L.png'),
  M: require('../../assets/images/avatars/avatar_M.png'),
  N: require('../../assets/images/avatars/avatar_N.png'),
  O: require('../../assets/images/avatars/avatar_O.png'),
  P: require('../../assets/images/avatars/avatar_P.png'),
  Q: require('../../assets/images/avatars/avatar_Q.png'),
  R: require('../../assets/images/avatars/avatar_R.png'),
  S: require('../../assets/images/avatars/avatar_S.png'),
  T: require('../../assets/images/avatars/avatar_T.png'),
  U: require('../../assets/images/avatars/avatar_U.png'),
  V: require('../../assets/images/avatars/avatar_V.png'),
  W: require('../../assets/images/avatars/avatar_W.png'),
  X: require('../../assets/images/avatars/avatar_X.png'),
  Y: require('../../assets/images/avatars/avatar_Y.png'),
  Z: require('../../assets/images/avatars/avatar_Z.png'),
};

export function getLocalAvatarLetter(name?: string | null): string {
  const letter = (name ?? 'A').trim().toUpperCase().replace(/[^A-Z]/g, '') || 'A';
  return letter[0];
}

export function getLocalAvatarSource(name?: string | null): ImageSourcePropType {
  const letter = getLocalAvatarLetter(name);
  return AVATAR_SOURCES[letter] ?? AVATAR_SOURCES.A;
}

export function isTrustedSrc(src?: string | null): boolean {
  if (!src || src.trim() === '') return false;
  if (src.includes('dicebear.com')) return false;
  if (src.includes('ui-avatars.com')) return false;
  if (src.includes('api.adorable.io')) return false;
  if (src.includes('robohash.org')) return false;
  return true;
}
