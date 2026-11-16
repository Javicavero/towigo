import sys
from PIL import Image, ImageDraw
from rig import frame, STILL, LOOP
moods=list(LOOP)
out=Image.new('RGB',(320*6,330*2),(232,226,248))
for i,m in enumerate(moods):
  f=frame(m,STILL[m]); out.paste(f,((i%6)*320,(i//6)*330),f)
  ImageDraw.Draw(out).text(((i%6)*320+8,(i//6)*330+4),m,fill=(0,0,0))
out.save(sys.argv[1])
