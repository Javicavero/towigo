"""Hoja de muestra animada (docs/owi-animaciones.gif): las 12 emociones en bucle."""
import math, sys
from PIL import Image, ImageDraw, ImageFont
from rig import frame, LOOP
moods = list(LOOP); S = 140; N = 48
f = ImageFont.truetype('/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf', 15)
frames = []
for i in range(N):
    out = Image.new('RGB', (S * 6, (S + 22) * 2), (244, 241, 250))
    d = ImageDraw.Draw(out)
    for k, m in enumerate(moods):
        n = round(LOOP[m] * 20)
        im = frame(m, (i % n) / n).resize((S, S), Image.LANCZOS)
        x, y = (k % 6) * S, (k // 6) * (S + 22)
        out.paste(im, (x, y), im)
        d.text((x + S / 2, y + S + 10), m, font=f, fill=(91, 61, 224), anchor='mm')
    frames.append(out.quantize(160, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE))
frames[0].save(sys.argv[1], save_all=True, append_images=frames[1:], duration=50, loop=0, optimize=True)
