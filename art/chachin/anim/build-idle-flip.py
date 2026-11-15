# Builds art/chachin/anim/idle-flip.png from the 8 loose frames in idle-src/.
# Run from art/chachin/anim. Fixes what Gemini got wrong between frames:
#  - frames 5-8 had the ground 160 px higher; every frame goes on one ground line,
#  - the flip height (frames 4-6) is set by hand: AIR = lowest point above the ground,
#  - the skin drifted red in frames 4-8: hue/saturation moved back to frame 1's skin.
import colorsys, numpy as np
from PIL import Image
FILES=['idle-1.jpg','idle-2.webp','idle-3.jpg','idle-4.webp','idle-5.webp','idle-6.jpg','idle-7.jpg','idle-8.webp']
AIR={4:454,5:720,6:360}
CELL_W, CELL_H, GROUND = 1500, 2600, 2500
SKIN_H, SKIN_S = colorsys.rgb_to_hsv(229/255,153/255,120/255)[:2]
def fix_skin(fig):
    a=np.asarray(fig,dtype=float)/255; r,g,b=a[...,0],a[...,1],a[...,2]
    mag=(r-g>0.27)&(b-g>0.27)
    warm=(r>g+0.1)&(r>0.3)&(r-b>0.06)&~mag
    for y,x in zip(*np.where(warm)):
        h,s,v=colorsys.rgb_to_hsv(*a[y,x]); a[y,x]=colorsys.hsv_to_rgb(SKIN_H,min(s,SKIN_S*1.2),v)
    return Image.fromarray((a*255).astype(np.uint8))
strip=Image.new('RGB',(CELL_W*len(FILES),CELL_H),(255,0,255))
for k,f in enumerate(FILES,1):
    im=Image.open('idle-src/'+f).convert('RGB')
    if im.size!=(2528,1696): im=im.resize((2528,1696),Image.BICUBIC)
    a=np.asarray(im,dtype=int); solid=~((a[...,0]-a[...,1]>70)&(a[...,2]-a[...,1]>70))
    rows=np.where(solid.sum(1)>6)[0]; cols=np.where(solid.sum(0)>6)[0]
    fig=im.crop((int(cols[0])-8,int(rows[0])-8,int(cols[-1])+9,int(rows[-1])+9))
    if k>=4: fig=fix_skin(fig)
    strip.paste(fig,((k-1)*CELL_W+(CELL_W-fig.width)//2, GROUND-AIR.get(k,0)-fig.height))
strip.save('idle-flip.png')
