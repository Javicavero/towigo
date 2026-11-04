import type { Avatar, Mood, PetLevel, PetMood } from '../../state/types';

export type SceneProps = {
  /** 'pair': tu avatar y Owi juntos; 'pet': solo Owi; 'avatar': solo tu avatar. */
  mode: 'pair' | 'pet' | 'avatar';
  avatar?: Avatar;
  avatarMood?: Mood;
  petMood?: PetMood;
  petLevel?: PetLevel;
  height?: number;
  interactive?: boolean;
  accessibilityLabel?: string;
  /** Toque sobre la escena (p. ej. Owi reacciona). */
  onTap?: () => void;
};
