#!/usr/bin/env bash
# Genera la versión web del prototipo en dist/ con rutas relativas y planas
# (sin carpetas con "@" ni "_"), para alojarla en cualquier servicio estático.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf dist
EXPO_OFFLINE=1 CI=1 npx expo export --platform web
python3 - <<'PY'
import os, re, shutil, glob
d = 'dist'
js = glob.glob(f'{d}/_expo/static/js/web/*.js')[0]
os.makedirs(f'{d}/app', exist_ok=True)
os.makedirs(f'{d}/static', exist_ok=True)
src = open(js, encoding='utf-8').read()
for path in glob.glob(f'{d}/assets/**/*.*', recursive=True):
    rel = '/' + os.path.relpath(path, d).replace(os.sep, '/')
    new = 'static/' + os.path.basename(path)
    shutil.move(path, f'{d}/{new}')
    src = src.replace('"' + rel + '"', '"./' + new + '"')
jsname = 'app/' + os.path.basename(js)
open(f'{d}/{jsname}', 'w', encoding='utf-8').write(src)
shutil.rmtree(f'{d}/_expo'); shutil.rmtree(f'{d}/assets')
html = open(f'{d}/index.html', encoding='utf-8').read()
html = re.sub(r'src="/_expo/static/js/web/[^"]+"', f'src="./{jsname}"', html)
html = html.replace('href="/favicon.ico"', 'href="./favicon.ico"').replace('<html lang="en">', '<html lang="es">')
html = html.replace('</style>', '      body { background: #FFF8F1; }\n    </style>', 1)
# Instalable en el iPhone: "Compartir → Añadir a pantalla de inicio" la abre a pantalla completa.
pwa = (
    '<link rel="manifest" href="./manifest.json">\n'
    '<link rel="apple-touch-icon" href="./icon-180.png">\n'
    '<meta name="apple-mobile-web-app-capable" content="yes">\n'
    '<meta name="mobile-web-app-capable" content="yes">\n'
    '<meta name="apple-mobile-web-app-status-bar-style" content="default">\n'
    '<meta name="apple-mobile-web-app-title" content="Towigo">\n'
)
html = html.replace('</head>', pwa + '</head>', 1)
html = html.replace('width=device-width, initial-scale=1, shrink-to-fit=no', 'width=device-width, initial-scale=1, viewport-fit=cover')
for f in os.listdir('web'):
    shutil.copy(os.path.join('web', f), os.path.join(d, f))
open(f'{d}/index.html', 'w', encoding='utf-8').write(html)
assert '"/assets/' not in src, 'quedan rutas absolutas'
print('JS:', jsname)
PY
echo "Listo: dist/"
