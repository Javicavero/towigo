/** Puente JS → ActivityKit. En web/Android (o sin build nativa) no hace nada. */
import { requireOptionalNativeModule } from 'expo';

export type OwiActivityState = { mood: string; title: string; value: string; detail: string; tone: 'green' | 'coral' | 'low' };

type Native = {
  isSupported(): boolean;
  startOrUpdate(owiName: string, kind: 'injection' | 'glucose', state: OwiActivityState): Promise<void>;
  end(): Promise<void>;
};

const native = requireOptionalNativeModule<Native>('OwiLiveActivity');

export const liveActivitySupported = () => !!native && native.isSupported();
export const startOrUpdateLiveActivity = (owiName: string, kind: 'injection' | 'glucose', state: OwiActivityState) => native?.startOrUpdate(owiName, kind, state) ?? Promise.resolve();
export const endLiveActivity = () => native?.end() ?? Promise.resolve();
