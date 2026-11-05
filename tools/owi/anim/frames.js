// Uso: node frames.js <mood> <nFrames> <seconds> <outDir>
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [mood, n = '1', secs = '1', out = 'frames'] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 720, height: 720 } });
  p.on('pageerror', (e) => console.log('E', e.message));
  await p.goto(`http://localhost:8790/render.html?mood=${mood}`);
  await p.waitForFunction(() => window.ready, null, { timeout: 60000 });
  // espera a que cargue el modelo (Suspense)
  for (let i = 0; i < 40; i++) { await p.evaluate(() => window.frame(0)); await p.waitForTimeout(150); }
  const N = +n;
  for (let i = 0; i < N; i++) {
    const t = 20 * +secs + (i / N) * +secs;
    const url = await p.evaluate((tt) => window.frame(tt), t);
    fs.writeFileSync(`${out}/${String(i).padStart(3, '0')}.png`, Buffer.from(url.split(',')[1], 'base64'));
  }
  await b.close();
})();
