"""Piezas de Owi (docs/owi/piezas): recorte de cada parte desde la plantilla del usuario."""
import numpy as np
from PIL import Image

P = '/home/user/towigo/docs/owi/piezas'
BOX = {  # cajas en piezas.webp (alpha>128)
    'arm': (523, 66, 701, 386), 'arm2': (963, 66, 1143, 387),
    'foot': (40, 538, 366, 727), 'foot2': (465, 538, 789, 728),
    'eyeR': (887, 479, 1202, 786), 'eyeL': (57, 892, 371, 1202),
    'iris': (491, 900, 756, 1190), 'nose': (904, 946, 1181, 1159),
}

def clean(im):
    a = np.asarray(im.getchannel('A')).astype(np.float32)
    a = np.clip((a - 24) * 255 / (255 - 24), 0, 255).astype(np.uint8)  # quita la neblina de baja opacidad
    im = im.copy(); im.putalpha(Image.fromarray(a)); return im

def load():
    sheet = clean(Image.open(f'{P}/piezas.webp').convert('RGBA'))
    parts = {}
    for k, (x0, y0, x1, y1) in BOX.items():
        c = sheet.crop((x0 - 6, y0 - 6, x1 + 7, y1 + 7))
        parts[k] = c.crop(c.getbbox())
    parts['body'] = clean(Image.open(f'{P}/owi-base.webp').convert('RGBA'))
    parts['front'] = clean(Image.open(f'{P}/owi-frente.webp').convert('RGBA'))
    return parts
