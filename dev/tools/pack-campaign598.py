"""Register Imagegen actors, retaining authored pixels; no synthetic poses.
Usage: python3 dev/tools/pack-campaign598.py /path/to/sources.json [campaign598|campaign599|regional5910|spring5911|vietnam5912] [--append]
Two 4x4 source sheets per actor, registered into eight states x four poses.
"""
import hashlib, json, sys
from pathlib import Path
import numpy as np
from scipy.ndimage import label, find_objects
from PIL import Image, ImageOps
ROOT = Path(__file__).resolve().parents[2]
group=sys.argv[2] if len(sys.argv)>2 else 'campaign598'
if group not in ['campaign598','campaign599','regional5910','spring5911','vietnam5912']: raise ValueError('Unknown visual cohort')
hero_cohort=group in ['regional5910','spring5911','vietnam5912']
OUT = ROOT/'public/assets/characters'/group
DOC = ROOT/'dev/docs'/('web-v'+group.removeprefix('campaign').removeprefix('regional').removeprefix('spring').removeprefix('vietnam'))
OUT.mkdir(parents=True, exist_ok=True); DOC.mkdir(parents=True, exist_ok=True)
entries=json.loads(Path(sys.argv[1]).read_text())
ids=list(dict.fromkeys(e['id'] for e in entries))
report=[]
for actor in ids:
    tiles=[]; sources=[]
    for kind in (['poses','support'] if hero_cohort else ['bossGen:', 'bossSupport:']):
        e=next(e for e in entries if e['id']==actor and e['kind']==kind)
        raw=Path(e['source']).read_bytes(); src=Image.open(e['source']).convert('RGBA')
        pixels=np.array(src); labels,n=label(pixels[:,:,3]>32)
        counts=np.bincount(labels.ravel())
        objects=find_objects(labels)
        # A pair of collapsed silhouettes can touch at the source cell boundary.
        # Split only those oversized connected pieces at their authored grid line.
        for i,slices in enumerate(objects,1):
            if slices is None: continue
            yy,xx=slices
            if xx.stop-xx.start<src.width*.42 and yy.stop-yy.start<src.height*.4: continue
            for row in range(4):
                for col in range(4):
                    y0,y1=round(row*src.height/4),round((row+1)*src.height/4)
                    x0,x1=round(col*src.width/4),round((col+1)*src.width/4)
                    part=labels[y0:y1,x0:x1]; mask=part==i
                    if mask.any(): n+=1; part[mask]=n
        counts=np.bincount(labels.ravel()); objects=find_objects(labels)
        groups=[[] for _ in range(16)]
        # Assign complete connected pieces by their centre, preserving any wings
        # crossing a nominal grid boundary. Discard only isolated alpha speckles.
        for i,slices in enumerate(objects,1):
            if counts[i]<24: continue
            if slices is None: continue
            yy,xx=slices
            cx=(xx.start+xx.stop)/2; cy=(yy.start+yy.stop)/2
            cell=min(3,int(cy/src.height*4))*4+min(3,int(cx/src.width*4))
            groups[cell].append(i)
        rects=[]
        for i,components in enumerate(groups):
            if not components: raise ValueError(f'Empty {actor} {kind} {i}')
            alpha=np.isin(labels,components)
            clean=pixels.copy(); clean[~alpha,3]=0
            tile=Image.fromarray(clean); bounds=tile.getchannel('A').point(lambda x:255 if x>32 else 0).getbbox(); tile=tile.crop(bounds)
            frame=len(tiles)
            if (actor=='moon-heron' and frame in [0,1,2,16]) or (actor=='lotus-mantis' and frame in [0,1,2]): tile=ImageOps.mirror(tile)
            if actor=='cloud-teapot' and frame==0: tile=ImageOps.mirror(tile)
            tiles.append(tile); rects.append(list(bounds))
        sources.append({'sheet':kind.rstrip(':'),'sha256':hashlib.sha256(raw).hexdigest(),'size':list(src.size),'rects':rects,'prompt':e['prompt']})
    # A repaired authored frame replaces one source pose; never count it twice.
    for repair in [e for e in entries if e['id']==actor and e['kind']=='repair']:
        frame=repair['frame']
        if not 0<=frame<32: raise ValueError('Invalid repair frame')
        raw=Path(repair['source']).read_bytes(); image=Image.open(repair['source']).convert('RGBA')
        pixels=np.array(image); labels,n=label(pixels[:,:,3]>32)
        counts=np.bincount(labels.ravel()); keep=np.flatnonzero(counts>=24);keep=keep[keep!=0]
        pixels[~np.isin(labels,keep),3]=0
        image=Image.fromarray(pixels); bounds=image.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox()
        if not bounds: raise ValueError('Empty repair')
        image=image.crop(bounds)
        height=tiles[frame].height
        image=image.resize((round(image.width*height/image.height),height),Image.Resampling.LANCZOS)
        tiles[frame]=image
        sources.append({'sheet':'repair','frame':frame,'sha256':hashlib.sha256(raw).hexdigest(),'rect':list(bounds),'normalizedHeight':height,'prompt':repair['prompt'],'reason':repair['reason']})
    scale=min(224/max(t.width for t in tiles),224/max(t.height for t in tiles))
    atlas=Image.new('RGBA',(1024,2048))
    for i,t in enumerate(tiles):
        t=t.resize((max(1,round(t.width*scale)),max(1,round(t.height*scale))),Image.Resampling.LANCZOS)
        atlas.alpha_composite(t,((i%4)*256+(256-t.width)//2,(i//4)*256+240-t.height))
    atlas.save(OUT/f'{actor}.webp','WEBP',quality=88,method=6)
    atlas.resize((256,512),Image.Resampling.NEAREST).save(OUT/f'{actor}-pixel.webp','WEBP',lossless=True,method=6)
    # Enemies reuse idle; hero cohorts keep their authored standalone portrait.
    if not hero_cohort:
        atlas.crop((0,0,256,256)).save(OUT/f'{actor}-portrait.webp','WEBP',quality=90,method=6)
    elif group!='vietnam5912':
        portrait=next(e for e in entries if e['id']==actor and e['kind']=='portrait')
        raw=Path(portrait['source']).read_bytes(); image=Image.open(portrait['source']).convert('RGB')
        if image.width!=image.height:raise ValueError('Portrait must be square')
        image.resize((512,512),Image.Resampling.LANCZOS).save(OUT/f'{actor}-portrait.webp','WEBP',quality=88,method=6)
        sources.append({'sheet':'portrait','sha256':hashlib.sha256(raw).hexdigest(),'size':list(image.size),'prompt':portrait['prompt']})
        if portrait.get('revision'):
            r=portrait['revision'];sources[-1]['revision']={'reason':r['reason'],'sourceSha256':hashlib.sha256(Path(r['source']).read_bytes()).hexdigest(),'prompt':r['prompt']}
    portrait_reference=next((r['canon'] for r in json.loads((DOC/'identity-sources.json').read_text()) if r['id']==actor),None) if group=='vietnam5912' else None
    report.append({'portraitReference':portrait_reference,'id':actor,'frames':32,'states':['idle','walk','attack','cast','ultimate' if hero_cohort else 'special/brace' if group=='campaign599' else 'phase','hit','fall','victory'],'tool':'built-in Imagegen','generatedOn':'2026-10-17','sources':sources,'uniformScale':scale,'outputs':{p.name:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(OUT.glob(f'{actor}*.webp'))}})
if '--append' in sys.argv[3:] and (DOC/'asset-provenance.json').exists():
    report=[e for e in json.loads((DOC/'asset-provenance.json').read_text()) if e['id'] not in ids]+report
(DOC/'asset-provenance.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps([{'id':r['id'],'bytes':sum(v['bytes'] for v in r['outputs'].values())} for r in report]))
