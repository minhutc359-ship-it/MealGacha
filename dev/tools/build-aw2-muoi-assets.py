"""AW2-004J: preserve image_gen pixels; measure safe cells and encode losslessly."""
from pathlib import Path
import argparse, hashlib, importlib.util, json
from PIL import Image
ROOT = Path(__file__).resolve().parents[2]
DIRECTORY = ROOT / 'dev/aw2/assets/muoi/base-v1'
spec = importlib.util.spec_from_file_location('than_build', Path(__file__).with_name('build-aw2-than-assets.py'))
util = importlib.util.module_from_spec(spec)
spec.loader.exec_module(util)
util.ASSETS = DIRECTORY
util.URL = '/dev/aw2/assets/muoi/base-v1/'
IDENTITY = 'aw2-muoi'
STATES = util.STATES
SLOTS = ['basic', 'auto', 'passive', 'ultimate']

def cut_line(alpha, axis, nominal, low, high, span=None):
    width, height = alpha.size
    def rank(line):
        box = (line-1, 0, line+1, height) if axis == 0 else (span[0], line-1, span[1], line+1)
        return alpha.crop(box).getextrema()[1], abs(line-nominal), line
    result = min(rank(line) for line in range(low, high+1))
    assert result[0] <= 8, ('No alpha-safe cut', axis, nominal, result)
    return result[2]

def grid(name, labels, scale=1):
    alpha = Image.open(DIRECTORY / f'{name}.png').getchannel('A')
    width, height = alpha.size
    xs = [0]+[cut_line(alpha, 0, round(width*i/4), round(width*(i-.16)/4), round(width*(i+.16)/4)) for i in [1,2,3]]+[width]
    result = {}
    for col in range(4):
        ys = [0]+[cut_line(alpha, 1, round(height*i/4), round(height*(i-.22)/4), round(height*(i+.22)/4), xs[col:col+2]) for i in [1,2,3]]+[height]
        result.update(util.frames(name, xs[col:col+2], ys, [[labels[row][col]] for row in range(4)]))
    for frame in result.values(): frame['renderScale'] = scale
    return result

def build():
    names = ['portrait','world','battle-motion-a-v3','battle-motion-b-v3','fx']
    assets = {name:util.encode(name) for name in names}
    for name, asset in assets.items():asset['id'] = f'{IDENTITY}:{name}:base-v1'
    assets['battle'] = {**assets['battle-motion-a-v3'], 'id':f'{IDENTITY}:battle:base-v1'}
    assets['reference'] = {**assets['portrait'], 'id':f'{IDENTITY}:reference:base-v1'}
    frames = grid('world', [[f'world.{d}.{i}' for i in range(4)] for d in ['down','left','right','up']])
    for sheet, states in [('battle-motion-a-v3',STATES[:4]),('battle-motion-b-v3',STATES[4:])]:
        frames.update(grid(sheet, [[f'battle.{s}.{i}' for i in range(4)] for s in states],1.5))
    frames.update(grid('fx', [[f'fx.{s}.{i}' for i in range(4)] for s in SLOTS]))
    battle = util.reference_battle_clips(IDENTITY)
    timing = {'idle':[0,300,600,900],'move':[0,170,340,510],'attack':[0,260,700,820],
              'cast':[0,210,420,740],'hit':[0,80,180,340],'guard':[0,180,400,700],
              'ultimate':[0,280,560,960],'defeat':[0,220,480,760]}
    for state in STATES:
        clip = battle[state]
        if state == 'attack':clip['durationMs'] = 1000
        clip['motion'] = util.track((0,0,0,0,1,1),(clip['durationMs'],0,0,0,1,1))
        clip['frames'] = [{'atMs':at,'frame':f'battle.{state}.{i}'} for i,at in enumerate(timing[state])]
        clip['reducedMotionFrame'] = f'battle.{state}.0'
        clip['method'] = 'four distinct generated reference cels; authored timing; independent anatomy/continuity/contact review pending'
        clip['markers'] = [{'atMs':260,'kind':'launch','skill':'basic'},{'atMs':700,'kind':'impact-preview','skill':'basic'}] if state == 'attack' else [{'atMs':420,'kind':'mark-preview','skill':'auto'}] if state == 'cast' else [{'atMs':560,'kind':'burst-preview','skill':'ultimate'}] if state == 'ultimate' else []
    skills = {}
    for i,(slot,name,state,at) in enumerate(zip(SLOTS,['Hạt Chạm','Nêm Đúng Chỗ','Vị Còn Lại','Một Nhúm Đủ Rồi'],['attack','cast','guard','ultimate'],[700,420,180,560])):
        sound = util.cue(slot,[.18,.32,.22,.46][i],[(330+i*90,160,.17),(660+i*120,-100,.08)],.012)
        sound['id'] = f'{IDENTITY}:audio:{slot}'
        skills[slot] = {'id':f'{IDENTITY}:skill:{slot}','displayName':name,'battleState':state,'fx':[f'fx.{slot}.{j}' for j in range(4)],'fxFrameMs':90 if slot=='basic' else 110,'fxTriggerAtMs':at,'fxCueAtMs':[at],
            'fxPlacement':{'attachment':'contact','layer':'front','x':260,'y':-230,'scale':.9 if slot=='basic' else 1.15},
            'trigger':'preview only; combat must confirm a bounded existing-target mark refresh; no automatic proc or replicated marks' if slot=='passive' else 'reference presentation only; actual debuff/removable-protection combat follows007E',
            'audio':sound,'projectile':{'frames':['fx.basic.0','fx.basic.1'],'frameMs':100,'launchAtMs':260,'impactAtMs':700,'from':{'x':80,'y':-230},'to':{'x':260,'y':-230},'scale':.6} if slot=='basic' else None,
            'scope':'asset reference only; no implemented Muối combat, collection, leveling or final numerical balance'}
    manifest = {'version':1,'spiritId':IDENTITY,'displayName':'Muối Đen','artVariantId':'base-v1','status':'MOTION_REFERENCE_IMPLEMENTED','fullCharacterComplete':False,'assets':assets,'frames':frames,'battle':battle,
        'world':{d:{'idle':f'world.{d}.0','walk':[f'world.{d}.{i}' for i in range(4)],'frameMs':150} for d in ['down','left','right','up']},'skills':skills,
        'provenance':{'generator':'OpenAI built-in image_gen','model':'not exposed by tool','date':'2026-10-22','prompts':util.URL+'prompts.json','externalReferences':[],'referenceAsset':f'{IDENTITY}:portrait:base-v1','licenseStatus':'REVIEW_REQUIRED','commercialRelease':'NOT_CLEARED','audio':'original deterministic additive synthesis +seeded noise; source build-aw2-muoi-assets.py and preserved helper build-aw2-than-assets.py; human listening pending','processing':'source PNGs unchanged; measured per-column alpha-safe rectangles/visible anchors and logical renderScale; lossless visible RGBA/alpha encoding; no repaint/mask/mirror/resize','alphaEdgeTolerance':8}}
    (ROOT/'src/aw2/assets/muoi.base-v1.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    unique={a['url']:a for a in assets.values()}
    result={'task':'AW2-004J','status':'PASS','frames':len(frames),'runtimeWebpBytes':sum(a['bytes'] for a in unique.values()),'decodedRGBA':sum(a['width']*a['height']*4 for a in unique.values()),'maxEdgeAlpha':max(f['maxEdgeAlpha'] for f in frames.values())}
    print(json.dumps(result))

if __name__ == '__main__':build()
