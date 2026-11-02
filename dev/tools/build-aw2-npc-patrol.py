#!/usr/bin/env python3
"""Preserve the recovered selected PNG and measure 16 safe authored patrol frames."""
import hashlib, io, json, subprocess
from pathlib import Path
from PIL import Image, __version__ as pillow_version

R = Path(__file__).resolve().parents[2]
D = R / 'dev/aw2/assets/npcs/dem-nuoc/patrol-v1'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
def write(p, value):
    p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

src, web = D/'patrol-source.png', D/'patrol.webp'
assert sha(src) == '892875ff68b00a7b70b076281554b63ba565b66269739bcf9c959c9b906d0aa3'
im = Image.open(src).convert('RGBA')
assert im.size == (1254, 1254) and im.getextrema()[3] == (0,255)
encoded = io.BytesIO()
im.save(encoded, format='WEBP', lossless=True, exact=True, method=6)
temp = web.with_suffix('.webp.tmp')
temp.write_bytes(encoded.getvalue())
temp.replace(web)
assert Image.open(web).convert('RGBA').tobytes() == im.tobytes()
frames = {}
xs, ys = [0,316,627,940,1254], [0,322,627,940,1254]
for row, facing in enumerate(['down','left','right','up']):
    for col, pose in enumerate(['idle','walk1','walk2','walk3']):
        cx,cy,cw,ch=xs[col],ys[row],xs[col+1]-xs[col],ys[row+1]-ys[row]
        alpha=im.getchannel('A').crop((cx,cy,cx+cw,cy+ch))
        bbox=alpha.point(lambda n:255 if n>8 else 0).getbbox()
        assert bbox
        l,t,r,b=bbox
        l,t,r,b=max(0,l-4),max(0,t-4),min(cw,r+4),min(ch,b+4)
        edge=max(max(alpha.crop(rect).getdata()) for rect in [(l,t,r,t+1),(l,b-1,r,b),(l,t,l+1,b),(r-1,t,r,b)])
        assert edge<=8,(facing,pose,edge)
        px=alpha.load()
        contact=[x for y in range(max(bbox[1],bbox[3]-32),bbox[3]) for x in range(bbox[0],bbox[2]) if px[x,y]>32]
        frames[f'{facing}-{pose}']=dict(cellRegion=dict(x=cx,y=cy,width=cw,height=ch),x=cx+l,y=cy+t,width=r-l,height=b-t,anchorX=round(sum(contact)/len(contact)-l,6),anchorY=bbox[3]-t-1,alphaEdgeMax=edge)

reference='dev/aw2/assets/npcs/dem-nuoc/idle-v1/idle-source.png'
base='eb70cdcfa9f0bc3619934885a9de0507aa7f1bce'
brief=dict(task='AW2-016B',entityId='aw2-npc-dem-nuoc',tool='OpenAI built-in image_gen',generationDate='2026-10-26',selected=1,rejected=0,exactPromptStatus='LOST_WITH_TEMPORARY_WORKSPACE',recoveredBrief='Own-project Em Đem Nước identity: brown twin hair buns, blue ribbons, light-blue wrap tunic with cream cuffs, brown trousers and sandals, earthenware jug. Transparent 4x4 sheet: down/left/right/up rows, idle plus three authored walk poses per row. Preserve identity, no mirrored stand-ins. This is a reconstructed brief, not the verbatim generation prompt.',references=[dict(path=reference,commit=base,blob=subprocess.check_output(['git','rev-parse',base+':'+reference],cwd=R,text=True).strip(),sha256=sha(R/reference))])
write(D/'prompts.json',brief)
asset=dict(id='aw2-npc-dem-nuoc:patrol-v1',url='/'+str(web.relative_to(R)),width=1254,height=1254,bytes=web.stat().st_size,sha256=sha(web),source=dict(path=str(src.relative_to(R)),bytes=src.stat().st_size,sha256=sha(src)))
provenance=dict(task='AW2-016B',tool=brief['tool'],model='not exposed by tool',date='2026-10-26',recoveryDate='2026-10-27',recoveredOriginalGitBlob='dd01e53149a725c29c4867df626b49786b5d6fa2',exactPromptStatus=brief['exactPromptStatus'],prompts=dict(path=str((D/'prompts.json').relative_to(R)),sha256=sha(D/'prompts.json')),references=brief['references'],licenseStatus='REVIEW_REQUIRED',commercialRelease='NOT_CLEARED',builder='dev/tools/build-aw2-npc-patrol.py',pillow=pillow_version,processing='Original recovered PNG unchanged; exact RGBA lossless WebP. Read-only alpha/foot measurements; no painting, mirroring, masking, resizing or interpolation.')
write(D/'provenance.json',provenance)
write(R/'src/aw2/assets/dem-nuoc.patrol-v1.json',dict(version=1,id='aw2-npc-dem-nuoc-patrol-v1',entityId='aw2-npc-dem-nuoc',displayName='Em Đem Nước',zoneId='aw2-zone-lantern-street',status='AUTHORED_LOCOMOTION_REFERENCE',authoredFrameCount=16,locomotionReferenceComplete=True,fullNpcComplete=False,asset=asset,frames=frames,display=dict(neutralHeight=40,scale=round(40/frames['down-idle']['height'],12)),provenance=provenance))
print(json.dumps(dict(frames=len(frames),edgeMax=max(f['alphaEdgeMax'] for f in frames.values()),sourceSha=sha(src),runtimeSha=sha(web),runtimeBytes=web.stat().st_size,pillow=pillow_version)))
