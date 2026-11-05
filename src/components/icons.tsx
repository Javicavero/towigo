import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

export type IconName =
  | 'home'
  | 'plus'
  | 'chat'
  | 'trophy'
  | 'user'
  | 'mic'
  | 'play'
  | 'pause'
  | 'camera'
  | 'sync'
  | 'flame'
  | 'shield'
  | 'syringe'
  | 'meal'
  | 'smile'
  | 'walk'
  | 'headphones'
  | 'check'
  | 'send'
  | 'alert'
  | 'back'
  | 'pill'
  | 'drop'
  | 'scale'
  | 'heart'
  | 'clock'
  | 'signal'
  | 'textSize'
  | 'lock'
  | 'demo'
  | 'steth'
  | 'widget'
  | 'protein';

export function Icon({ name, size = 26, color = colors.ink, stroke = 2.2 }: { name: IconName; size?: number; color?: string; stroke?: number }) {
  const p = { stroke: color, strokeWidth: stroke, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      {name === 'home' && <Path {...p} d="M3 11 12 4l9 7v8a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />}
      {name === 'plus' && <Path {...p} d="M12 5v14M5 12h14" />}
      {name === 'chat' && <Path {...p} d="M4 5h16v11H9l-5 4z" />}
      {name === 'trophy' && (
        <>
          <Path {...p} d="M7 4h10v5a5 5 0 0 1-10 0z" />
          <Path {...p} d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v3M8 20h8M9 17h6" />
        </>
      )}
      {name === 'user' && (
        <>
          <Circle {...p} cx={12} cy={8} r={4} />
          <Path {...p} d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" />
        </>
      )}
      {name === 'mic' && (
        <>
          <Rect {...p} x={9} y={3} width={6} height={11} rx={3} />
          <Path {...p} d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </>
      )}
      {name === 'play' && <Path d="M8 5v14l11-7z" fill={color} />}
      {name === 'pause' && <Path d="M7 5h4v14H7zM13 5h4v14h-4z" fill={color} />}
      {name === 'camera' && (
        <>
          <Path {...p} d="M4 8h3l2-3h6l2 3h3v11H4z" />
          <Circle {...p} cx={12} cy={13} r={3.5} />
        </>
      )}
      {name === 'sync' && <Path {...p} d="M20 12a8 8 0 0 1-14 5M4 12a8 8 0 0 1 14-5M18 3v4h-4M6 21v-4h4" />}
      {name === 'flame' && <Path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-4-1-6 1-9z" fill={color} />}
      {name === 'shield' && <Path {...p} d="M12 3 5 6v6c0 4 3 7.5 7 9 4-1.5 7-5 7-9V6z" />}
      {name === 'syringe' && <Path {...p} d="m18 3 3 3M19.5 4.5 15 9M16 6l2 2M14 7l3 3-9 9H5v-3zM9 12l2 2M11 10l2 2" />}
      {name === 'meal' && (
        <>
          <Circle {...p} cx={12} cy={13} r={7} />
          <Path {...p} d="M3 4v5a2 2 0 0 0 2 2M5 4v16M21 4c-2 1-2 4-2 6h2v10" />
        </>
      )}
      {name === 'smile' && (
        <>
          <Circle {...p} cx={12} cy={12} r={9} />
          <Path {...p} d="M8 14c1 1.5 2.5 2 4 2s3-.5 4-2M9 9.5h.01M15 9.5h.01" />
        </>
      )}
      {name === 'walk' && (
        <>
          <Circle cx={13} cy={4} r={2} fill={color} />
          <Path {...p} d="m10 21 2-6 3 3v3M8 12l2-4 4 1 2 3 3 1M12 15l-1-4" />
        </>
      )}
      {name === 'headphones' && <Path {...p} d="M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v5H4zM17 15h3v5h-3z" />}
      {name === 'check' && <Path {...p} d="m5 12 5 5 9-10" />}
      {name === 'send' && <Path {...p} d="M4 12 20 4l-6 16-3-7z" />}
      {name === 'alert' && <Path {...p} d="M12 4 2 20h20zM12 10v4M12 17h.01" />}
      {name === 'back' && <Path {...p} d="M15 5l-7 7 7 7" />}
      {name === 'pill' && (
        <>
          <Rect {...p} x={3} y={8.5} width={18} height={7} rx={3.5} transform="rotate(-45 12 12)" />
          <Path {...p} d="m9.5 9.5 5 5" />
        </>
      )}
      {name === 'drop' && <Path {...p} d="M12 3c3.5 4.5 6 7.6 6 11a6 6 0 0 1-12 0c0-3.4 2.5-6.5 6-11z" />}
      {name === 'scale' && (
        <>
          <Rect {...p} x={3.5} y={4} width={17} height={16} rx={4} />
          <Path {...p} d="M8.5 9.5a5 5 0 0 1 7 0M12 11l1.5-2" />
        </>
      )}
      {name === 'heart' && <Path {...p} d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />}
      {name === 'clock' && (
        <>
          <Circle {...p} cx={12} cy={12} r={8.5} />
          <Path {...p} d="M12 7.5V12l3 2" />
        </>
      )}
      {name === 'signal' && <Path {...p} d="M5 12a7 7 0 0 1 14 0M8 12a4 4 0 0 1 8 0M12 12v8M10.5 20h3" />}
      {name === 'textSize' && <Path {...p} d="M4 18 8.5 6 13 18M5.5 14h6M15 18l2.75-7 2.75 7M15.9 15.7h3.7" />}
      {name === 'lock' && (
        <>
          <Rect {...p} x={5} y={10.5} width={14} height={9.5} rx={2.5} />
          <Path {...p} d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
        </>
      )}
      {name === 'demo' && (
        <>
          <Rect {...p} x={3.5} y={5} width={17} height={14} rx={3} />
          <Path d="M10 9.2v5.6l4.6-2.8z" fill={color} />
        </>
      )}
      {name === 'steth' && <Path {...p} d="M6 3v5a4 4 0 0 0 8 0V3M10 12v2a5 5 0 0 0 10 0v-1M20 13a2 2 0 1 0 0-.01" />}
      {name === 'widget' && (
        <>
          <Rect {...p} x={4} y={4} width={7} height={7} rx={2} />
          <Rect {...p} x={13} y={4} width={7} height={7} rx={2} />
          <Rect {...p} x={4} y={13} width={16} height={7} rx={2} />
        </>
      )}
      {name === 'protein' && <Path {...p} d="M15.5 4.5a4 4 0 0 1 4 4c0 3.5-4.5 4-6.5 6l-4 4a2 2 0 1 1-2.8-2.8l4-4c2-2 2.5-6.5 6-6.5zM6 15.5l2.5 2.5" />}
    </Svg>
  );
}

/** Icono estilo Ajustes de iOS: dibujo blanco sobre un cuadrado de color. */
export function Glyph({ name, bg, size = 34 }: { name: IconName; bg: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.26, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} size={size * 0.62} color="#FFFFFF" stroke={2.3} />
    </View>
  );
}
