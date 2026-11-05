/**
 * Mapa del cuerpo para elegir la zona de inyección (abdomen, muslos, brazos).
 * Marca la zona usada la última vez y la siguiente de la rotación (educación general habitual:
 * alternar zonas). No es una indicación clínica.
 */
import { Pressable, View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { t } from '../i18n';
import type { InjectionSite } from '../state/types';
import { colors } from '../theme';
import { T } from './ui';

const ZONES: Record<InjectionSite, { x: number; y: number; w: number; h: number }> = {
  brazoDer: { x: 22, y: 78, w: 26, h: 44 }, // derecha del paciente = izquierda de la imagen
  brazoIzq: { x: 152, y: 78, w: 26, h: 44 },
  abdDer: { x: 72, y: 118, w: 26, h: 36 },
  abdIzq: { x: 102, y: 118, w: 26, h: 36 },
  musloDer: { x: 66, y: 182, w: 30, h: 46 },
  musloIzq: { x: 104, y: 182, w: 30, h: 46 },
};

export default function BodyMap({
  selected,
  last,
  suggested,
  onSelect,
}: {
  selected: InjectionSite | null;
  last?: InjectionSite;
  suggested: InjectionSite;
  onSelect: (s: InjectionSite) => void;
}) {
  const W = 200;
  const H = 260;
  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <View style={{ width: W, height: H }}>
        <Svg width={W} height={H}>
          {/* silueta */}
          <Circle cx={100} cy={34} r={24} fill="#EADFD3" />
          <Path d="M64,66 Q100,56 136,66 L150,130 Q138,170 132,176 L68,176 Q62,170 50,130 Z" fill="#EADFD3" />
          <Rect x={20} y={70} width={30} height={92} rx={14} fill="#EADFD3" />
          <Rect x={150} y={70} width={30} height={92} rx={14} fill="#EADFD3" />
          <Rect x={64} y={172} width={34} height={84} rx={14} fill="#EADFD3" />
          <Rect x={102} y={172} width={34} height={84} rx={14} fill="#EADFD3" />
          <Ellipse cx={100} cy={146} rx={3} ry={3} fill="#CDBFAF" />
        </Svg>
        {(Object.keys(ZONES) as InjectionSite[]).map((s) => {
          const z = ZONES[s];
          const isSel = selected === s;
          const isSug = suggested === s && !selected;
          const isLast = last === s;
          return (
            <Pressable
              key={s}
              accessibilityRole="button"
              accessibilityState={{ selected: isSel }}
              accessibilityLabel={`${t(`site.${s}`)}${isLast ? `, ${t('site.lastTime')}` : ''}${suggested === s ? `, ${t('site.next')}` : ''}`}
              onPress={() => onSelect(s)}
              style={{
                position: 'absolute',
                left: z.x,
                top: z.y,
                width: z.w,
                height: z.h,
                borderRadius: 10,
                borderWidth: 3,
                borderStyle: isLast && !isSel ? 'dashed' : 'solid',
                borderColor: isSel ? colors.greenText : isSug ? colors.coral : isLast ? colors.secondary : 'rgba(0,0,0,0.12)',
                backgroundColor: isSel ? 'rgba(23,120,90,0.35)' : isSug ? 'rgba(255,122,89,0.25)' : 'rgba(255,255,255,0.4)',
              }}
            />
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <T v="small" color={colors.coralText}>
          ● {t('site.next')}
        </T>
        <T v="small" color={colors.secondary}>
          ┅ {t('site.lastTime')}
        </T>
      </View>
    </View>
  );
}
