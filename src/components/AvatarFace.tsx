/**
 * Avatar 2D del usuario: busto ilustrado en SVG (mismo estilo amable que Owi).
 * Ligero, sin 3D, y funciona igual en web, iPhone y Android.
 */
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { EYE_COLORS, HAIR_COLORS, SKIN_TONES, TOP_COLORS } from '../data/avatarOptions';
import type { Avatar } from '../state/types';

export type AvatarExpression = 'smile' | 'big' | 'calm' | 'sleep';

const FACE: Record<Avatar['faceShape'], { rx: number; ry: number }> = {
  ovalada: { rx: 50, ry: 60 },
  redonda: { rx: 56, ry: 56 },
  alargada: { rx: 46, ry: 64 },
};
const SHOULDER: Record<Avatar['bodyType'], number> = { delgada: 70, media: 80, robusta: 90, grande: 100 };
const BROW_W: Record<Avatar['brows'], number> = { finas: 3, normales: 4.5, gruesas: 7 };

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * k)));
  return `#${((f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).padStart(6, '0')}`;
}

export default function AvatarFace({
  avatar,
  size = 160,
  expression = 'smile',
  label,
}: {
  avatar: Avatar;
  size?: number;
  expression?: AvatarExpression;
  label?: string;
}) {
  const skin = SKIN_TONES[avatar.skin] ?? SKIN_TONES[0];
  const skinD = shade(skin, 0.86);
  const hair = HAIR_COLORS[avatar.hairColor] ?? HAIR_COLORS[0];
  const hairD = shade(hair, 0.8);
  const iris = EYE_COLORS[avatar.eyeColor] ?? EYE_COLORS[0];
  const top = TOP_COLORS[avatar.topColor] ?? TOP_COLORS[0];
  const topD = shade(top, 0.85);
  const f = FACE[avatar.faceShape];
  const cx = 100;
  const cy = 92;
  const sw = SHOULDER[avatar.bodyType];
  const faceW = f.rx + (avatar.bodyType === 'grande' ? 4 : avatar.bodyType === 'robusta' ? 2 : 0);
  const eyeY = cy - 2;
  const eyeX = 21;
  const browY = eyeY - 19;
  const mouthY = cy + 30;
  const top0 = cy - f.ry; // coronilla

  // ---- pelo (parte trasera y delantera) ----
  const hairBack =
    avatar.hair === 'melena' ? (
      <Path d={`M${cx - faceW - 8},${cy - 10} Q${cx - faceW - 14},${cy + 70} ${cx - faceW + 6},${cy + 78} L${cx + faceW - 6},${cy + 78} Q${cx + faceW + 14},${cy + 70} ${cx + faceW + 8},${cy - 10} Z`} fill={hairD} />
    ) : avatar.hair === 'mono' ? (
      <Circle cx={cx} cy={top0 - 6} r={20} fill={hair} />
    ) : null;
  const cap = `M${cx - faceW - 3},${cy - 6} Q${cx - faceW - 6},${top0 - 14} ${cx},${top0 - 12} Q${cx + faceW + 6},${top0 - 14} ${cx + faceW + 3},${cy - 6} Q${cx + faceW - 6},${top0 + 18} ${cx + 10},${top0 + 16} Q${cx - 20},${top0 + 28} ${cx - faceW + 4},${cy - 8} Z`;
  const hairFront =
    avatar.hair === 'calvo' ? null : avatar.hair === 'rizos' ? (
      <G>
        {Array.from({ length: 13 }, (_, i) => {
          const a = Math.PI * (1.05 + (i / 12) * 0.9);
          return <Circle key={i} cx={cx + Math.cos(a) * (faceW + 2)} cy={cy - 12 + Math.sin(a) * (f.ry + 2)} r={15} fill={i % 2 ? hair : hairD} />;
        })}
        <Circle cx={cx} cy={top0 + 2} r={18} fill={hair} />
      </G>
    ) : avatar.hair === 'rapado' ? (
      <Path d={cap} fill={hair} opacity={0.55} />
    ) : (
      <Path d={cap} fill={hair} />
    );

  // ---- ojos ----
  const eye = (sx: 1 | -1) => {
    const x = cx + eyeX * sx;
    if (expression === 'big' || expression === 'sleep')
      return (
        <Path
          key={sx}
          d={expression === 'big' ? `M${x - 9},${eyeY + 3} Q${x},${eyeY - 8} ${x + 9},${eyeY + 3}` : `M${x - 9},${eyeY} Q${x},${eyeY + 7} ${x + 9},${eyeY}`}
          stroke="#2B1A12"
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
        />
      );
    return (
      <G key={sx}>
        <Ellipse cx={x} cy={eyeY} rx={10} ry={expression === 'calm' ? 9 : 11} fill="#FFFFFF" />
        <Circle cx={x + 1} cy={eyeY + 1} r={6.5} fill={iris} />
        <Circle cx={x + 1} cy={eyeY + 1} r={3.4} fill="#120B08" />
        <Circle cx={x + 3.5} cy={eyeY - 2} r={2} fill="#FFFFFF" />
        {expression === 'calm' && <Path d={`M${x - 11},${eyeY - 5} Q${x},${eyeY - 11} ${x + 11},${eyeY - 5} L${x + 11},${eyeY - 12} L${x - 11},${eyeY - 12} Z`} fill={skin} />}
      </G>
    );
  };

  // ---- boca ----
  const mouth =
    expression === 'big' ? (
      <G>
        <Path d={`M${cx - 15},${mouthY - 3} Q${cx},${mouthY - 1} ${cx + 15},${mouthY - 3} Q${cx + 12},${mouthY + 15} ${cx},${mouthY + 15} Q${cx - 12},${mouthY + 15} ${cx - 15},${mouthY - 3} Z`} fill="#6E2B22" />
        <Ellipse cx={cx} cy={mouthY + 9} rx={7} ry={4} fill="#F07B7B" />
      </G>
    ) : expression === 'sleep' ? (
      <Ellipse cx={cx} cy={mouthY + 2} rx={4} ry={5} fill="#6E2B22" />
    ) : (
      <Path d={`M${cx - 13},${mouthY} Q${cx},${mouthY + (expression === 'calm' ? 6 : 11)} ${cx + 13},${mouthY}`} stroke="#6E2B22" strokeWidth={4} strokeLinecap="round" fill="none" />
    );

  // ---- barba ----
  const jaw = `M${cx - faceW + 4},${cy + 4} Q${cx - faceW + 2},${cy + f.ry + 14} ${cx},${cy + f.ry + 16} Q${cx + faceW - 2},${cy + f.ry + 14} ${cx + faceW - 4},${cy + 4} Q${cx + faceW - 16},${cy + 22} ${cx + 18},${mouthY - 6} Q${cx},${mouthY - 10} ${cx - 18},${mouthY - 6} Q${cx - faceW + 16},${cy + 22} ${cx - faceW + 4},${cy + 4} Z`;
  const moustache = <Path d={`M${cx - 18},${mouthY - 3} Q${cx - 9},${mouthY - 13} ${cx},${mouthY - 7} Q${cx + 9},${mouthY - 13} ${cx + 18},${mouthY - 3} Q${cx},${mouthY - 5} ${cx - 18},${mouthY - 3} Z`} fill={hair} />;
  const beard =
    avatar.facialHair === 'barba' ? (
      <G>
        <Path d={jaw} fill={hair} />
        {moustache}
      </G>
    ) : avatar.facialHair === 'corta' ? (
      <Path d={jaw} fill={hair} opacity={0.35} />
    ) : avatar.facialHair === 'bigote' ? (
      moustache
    ) : avatar.facialHair === 'perilla' ? (
      <G>
        {moustache}
        <Path d={`M${cx - 12},${mouthY + 12} Q${cx},${mouthY + 34} ${cx + 12},${mouthY + 12} Q${cx},${mouthY + 18} ${cx - 12},${mouthY + 12} Z`} fill={hair} />
      </G>
    ) : null;

  // ---- ropa ----
  const body = `M${cx - sw},220 Q${cx - sw},${cy + 82} ${cx - 30},${cy + 74} L${cx + 30},${cy + 74} Q${cx + sw},${cy + 82} ${cx + sw},220 Z`;
  const clothes = (
    <G>
      {avatar.top === 'sudadera' && <Path d={`M${cx - 40},${cy + 76} Q${cx},${cy + 56} ${cx + 40},${cy + 76} Q${cx},${cy + 96} ${cx - 40},${cy + 76} Z`} fill={topD} />}
      <Path d={body} fill={top} />
      {avatar.top === 'camiseta' && <Path d={`M${cx - 24},${cy + 74} Q${cx},${cy + 96} ${cx + 24},${cy + 74}`} stroke={topD} strokeWidth={6} fill="none" />}
      {avatar.top === 'camisa' && (
        <G>
          <Path d={`M${cx - 26},${cy + 72} L${cx},${cy + 96} L${cx - 6},${cy + 104} L${cx - 32},${cy + 84} Z`} fill={shade(top, 1.08)} stroke={topD} strokeWidth={2} />
          <Path d={`M${cx + 26},${cy + 72} L${cx},${cy + 96} L${cx + 6},${cy + 104} L${cx + 32},${cy + 84} Z`} fill={shade(top, 1.08)} stroke={topD} strokeWidth={2} />
          {[112, 126].map((y) => (
            <Circle key={y} cx={cx} cy={cy + y} r={3} fill={topD} />
          ))}
        </G>
      )}
      {avatar.top === 'sudadera' && (
        <G>
          <Path d={`M${cx - 10},${cy + 88} L${cx - 12},${cy + 116}`} stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
          <Path d={`M${cx + 10},${cy + 88} L${cx + 12},${cy + 116}`} stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
        </G>
      )}
    </G>
  );

  return (
    <View accessibilityRole="image" accessibilityLabel={label} style={{ width: size, height: size * 1.1 }}>
      <Svg width={size} height={size * 1.1} viewBox="0 0 200 220">
        {hairBack}
        {/* cuello y cuerpo */}
        <Rect x={cx - 17} y={cy + 40} width={34} height={40} rx={12} fill={skinD} />
        {clothes}
        {avatar.equipped.medal && (
          <G>
            <Path d={`M${cx - 14},${cy + 76} L${cx},${cy + 120} L${cx + 14},${cy + 76}`} stroke="#1F8F6C" strokeWidth={6} fill="none" />
            <Circle cx={cx} cy={cy + 124} r={11} fill="#FFD166" stroke="#C99400" strokeWidth={2} />
          </G>
        )}
        {/* orejas y cara */}
        <Ellipse cx={cx - faceW + 1} cy={cy + 2} rx={9} ry={13} fill={skinD} />
        <Ellipse cx={cx + faceW - 1} cy={cy + 2} rx={9} ry={13} fill={skinD} />
        <Ellipse cx={cx} cy={cy} rx={faceW} ry={f.ry} fill={skin} />
        {hairFront}
        {/* cejas */}
        {[-1, 1].map((sx) => (
          <Path
            key={sx}
            d={`M${cx + sx * 11},${browY + 1} Q${cx + sx * 21},${browY - 4} ${cx + sx * 31},${browY + 1}`}
            stroke={avatar.hair === 'calvo' || avatar.hairColor >= 5 ? shade(hair, 0.7) : hairD}
            strokeWidth={BROW_W[avatar.brows]}
            strokeLinecap="round"
            fill="none"
          />
        ))}
        {eye(-1)}
        {eye(1)}
        {/* nariz y mejillas */}
        <Path d={`M${cx - 4},${cy + 14} Q${cx},${cy + 19} ${cx + 4},${cy + 14}`} stroke={skinD} strokeWidth={3} strokeLinecap="round" fill="none" />
        <Ellipse cx={cx - 30} cy={cy + 16} rx={9} ry={5} fill="#FF8F80" opacity={0.35} />
        <Ellipse cx={cx + 30} cy={cy + 16} rx={9} ry={5} fill="#FF8F80" opacity={0.35} />
        {beard}
        {mouth}
        {avatar.glasses !== 'ninguna' && (
          <G stroke="#1E2A32" strokeWidth={3.5} fill="rgba(255,255,255,0.15)">
            {[-1, 1].map((sx) =>
              avatar.glasses === 'redondas' ? (
                <Circle key={sx} cx={cx + eyeX * sx} cy={eyeY} r={15} />
              ) : (
                <Rect key={sx} x={cx + eyeX * sx - 16} y={eyeY - 12} width={32} height={24} rx={6} />
              ),
            )}
            <Path d={`M${cx - 6},${eyeY - 1} Q${cx},${eyeY - 5} ${cx + 6},${eyeY - 1}`} fill="none" />
          </G>
        )}
        {avatar.equipped.headband && <Rect x={cx - faceW - 2} y={top0 + 8} width={(faceW + 2) * 2} height={12} rx={6} fill="#FF7A59" />}
      </Svg>
    </View>
  );
}
