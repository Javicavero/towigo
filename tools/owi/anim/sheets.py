import os, json, glob, sys
from PIL import Image
W=288; COLS=8
box=(40,80,680,720)
only=sys.argv[1:] or None
meta=json.load(open('../../../assets/owi/anim/meta.json')) if os.path.exists('../../../assets/owi/anim/meta.json') else {}
for d in sorted(glob.glob('out/*')):
    m=os.path.basename(d)
    if only and m not in only: continue
    fr=[Image.open(f).convert('RGBA').crop(box) for f in sorted(glob.glob(d+'/*.png'))]
    n=len(fr); rows=(n+COLS-1)//COLS
    sheet=Image.new('RGBA',(W*COLS,W*rows),(0,0,0,0))
    for i,im in enumerate(fr):
        sheet.alpha_composite(im.resize((W,W),Image.LANCZOS),((i%COLS)*W,(i//COLS)*W))
    out=f'../../../assets/owi/anim/{m}.webp'
    sheet.save(out,'WEBP',quality=74,method=4)
    meta[m]={'frames':n,'cols':COLS,'fps':20}
    g=[]
    for im in fr[::2]:
        bg=Image.new('RGBA',(640,640),(244,243,239,255)); bg.alpha_composite(im); g.append(bg.resize((240,240),Image.LANCZOS).convert('RGB').quantize(96))
    g[0].save(f'gifs/{m}.gif',save_all=True,append_images=g[1:],duration=100,loop=0)
    print(m,n,round(os.path.getsize(out)/1024),'KB',flush=True)
json.dump(meta,open('../../../assets/owi/anim/meta.json','w'),indent=1)
