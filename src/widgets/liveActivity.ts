/**
 * Live Activity de Owi (pantalla de bloqueo, Dynamic Island y Apple Watch).
 * Solo en momentos con principio y fin: el día de la inyección (hasta que se apunta) y la glucosa del sensor en tipo 1.
 */
import type { OwiActivityState } from '../../modules/owi-live-activity';
import { t } from '../i18n';
import type { Derived } from '../state/store';
import { isT1, usesGlp1, type AppState } from '../state/types';

export type LiveActivity = { kind: 'injection' | 'glucose'; state: OwiActivityState } | null;
const ARROW = { up2: '⇈', up: '↑', flat: '→', down: '↓', down2: '⇊' } as const;

export function buildLiveActivity(state: AppState, d: Derived, now = Date.now()): LiveActivity {
  if (usesGlp1(state.profile) && !d.maintenance && !d.injectedToday && (d.daysToInjection === 0 || d.injectionOverdue))
    return {
      kind: 'injection',
      state: {
        mood: d.petMood,
        title: d.injectionOverdue ? t('la.injOverdue') : t('la.injToday'),
        value: state.glp1.time,
        detail: t('la.injSite', { site: t(`site.${d.suggestedSite}`) }),
        tone: 'coral',
      },
    };
  const g = d.lastGlucose;
  if (isT1(state.profile) && g && g.context === 'sensor' && now - new Date(g.at).getTime() < 20 * 60e3)
    return {
      kind: 'glucose',
      state: {
        mood: d.petMood,
        title: t('la.glucose'),
        value: `${g.v}${d.trend ? ` ${ARROW[d.trend]}` : ''}`,
        detail: t('la.glucoseDetail', { n: Math.max(1, Math.round((now - new Date(g.at).getTime()) / 60e3)), tir: d.tir24 }),
        tone: g.v < 70 ? 'low' : g.v > 180 ? 'coral' : 'green',
      },
    };
  return null;
}
