import type { Avatar, Mood } from '../state/types';

export type OwiProps = {
  avatar: Avatar;
  mood: Mood;
  height?: number;
  interactive?: boolean;
  accessibilityLabel?: string;
};
