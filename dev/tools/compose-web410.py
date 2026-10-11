"""Soul of Meal 4.1: original 32-bar scores and regional, synchronized stems.
No external samples or melodies. Deterministic additive synthesis; numpy/ffmpeg.
Long scores: intro → statement → answer → interlude → reprise → cadence.
"""
from pathlib import Path
import importlib.util, json, subprocess, tempfile, wave, hashlib
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/assets/v4/audio/web410'
OUT.mkdir(parents=True, exist_ok=True)
RATE = 44100

def module(name, file):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(file))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    m.RATE = RATE
    return m

acoustic = module('acoustic410', 'compose-game-music.py')
retro = module('retro410', 'compose-retro-music.py')
records = []

THEMES = [
 ('lobby', 84, [48,53,55,48,57,53,55,48], [72,76,79,81,79,76,74,72], 'warm'),
 ('expedition', 100, [50,53,55,57,50,58,55,50], [74,77,81,79,77,74,72,69], 'journey'),
 ('story-warm', 76, [53,48,55,48,53,57,55,48], [77,79,81,84,81,79,76,72], 'warm'),
 ('story-mystery', 68, [50,58,53,57,50,55,57,50], [74,77,81,84,81,77,74,69], 'mystery'),
 ('auto-prepare', 92, [48,55,53,48,57,53,55,48], [72,79,76,74,72,76,79,84], 'journey'),
 ('auto-story', 80, [53,55,48,57,53,50,55,48], [77,81,79,76,74,72,76,77], 'warm'),
 ('market-warm', 96, [48,53,55,48,57,53,55,48], [72,76,79,74,76,72,69,72], 'journey'),
 ('harbor-warm', 72, [50,57,55,50,58,53,57,50], [74,77,81,79,77,74,72,74], 'mystery'),
 ('kitchen-warm', 88, [53,48,55,48,57,53,55,48], [77,79,84,81,79,77,76,72], 'warm'),
]

def encode(name, data, style, bpm, bars, layer=None):
    path = OUT / f'{style}-{name}.mp3'
    with tempfile.TemporaryDirectory() as temp:
        wav = Path(temp)/'score.wav'
        with wave.open(str(wav), 'wb') as f:
            f.setnchannels(data.shape[1]); f.setsampwidth(2); f.setframerate(RATE)
            f.writeframes((data*32767).astype('<i2').tobytes())
        bitrate = ('64k' if data.shape[1] == 2 else '32k') if layer else ('96k' if style == 'original' else '64k')
        encoded = Path(temp)/'score.mp3'
        subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(wav),'-codec:a','libmp3lame','-b:a',bitrate,'-write_xing','1','-metadata',f'title=Soul of Meal 4.1 - {name} ({style})',str(encoded)],check=True)
        # Publish only a closed, complete file; build/watchers must not see partial MP3s.
        encoded.replace(path)
    records.append({'path':str(path.relative_to(ROOT)), 'theme':name, 'style':style, 'layer':layer,
        'bpm':bpm,'bars':bars,'duration':round(len(data)/RATE,6),'sampleRate':RATE,'channels':data.shape[1],
        'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'peak':round(float(np.max(np.abs(data))),5),'rms':round(float(np.sqrt(np.mean(data**2))),5),
        'structure':'synchronized 8-bar layer' if layer else 'intro / theme / answer / interlude / reprise / cadence'})
    print(json.dumps({'file':path.name,'bytes':path.stat().st_size}), flush=True)

def score(name, bpm, roots, motif, mood, style):
    beat = 60/bpm; bars = 32; length = round(bars*4*beat*RATE)
    mix = np.zeros((length,2)); rng=np.random.default_rng(410)
    cache = {}
    def add(sound, at, gain, pan=0):
        start=round(at*RATE)%length; end=min(length-start,len(sound))
        gains=np.sqrt([(1-pan)/2,(1+pan)/2])*gain
        mix[start:start+end] += sound[:end,None]*gains
        if end<len(sound): mix[:len(sound)-end] += sound[end:,None]*gains
    def note(pitch, at, duration, kind, gain, pan=0):
        key=(pitch,round(duration,5),kind)
        if key not in cache: cache[key]=acoustic.voice(pitch,duration,kind) if style=='original' else retro.chip(pitch,duration,'triangle' if kind in ['bass','pad'] else 'pulse')
        sound=cache[key]; add(sound,at,gain,pan)
        if style=='original' and kind in ['pluck','flute']:
            add(sound,at+.19,gain*.12,-pan);add(sound,at+.37,gain*.06,pan)
    for bar in range(bars):
        root=roots[bar%8]; at=bar*4*beat
        # Real changes in orchestration and melody, not concatenated copies.
        intro=bar<4; interlude=16<=bar<20; answer=8<=bar<16; reprise=20<=bar<28
        third=3 if root%12 in [2,9,10] else 4
        for pitch,pan in [(root+12,-.4),(root+12+third,.1),(root+19,.4)]:
            note(pitch,at,4.2*beat,'pad',.027 if style=='original' else .014,pan)
        for step in range(4 if intro or interlude else 8):
            interval=[0,7,12,third,7,14,12,7][(step+bar%2)%8]
            note(root+12+interval,at+step*beat/(1 if intro or interlude else 2),beat*.8,'pluck',.10 if not interlude else .06,(-.25 if step%2 else .25))
        for step in [0,2]: note(root-12,at+step*beat,beat*.8,'bass',.12 if mood=='journey' else .075)
        if not intro and not interlude:
            phrase=motif[2:]+motif[:2] if answer else motif
            for step,pitch in enumerate(phrase):
                if (step+bar)%3==1: continue
                offset=12 if reprise and step in [0,4] else 0
                note(pitch+offset,at+step*beat/2,beat*(.75 if step%2 else 1.2),'flute',.08,.12)
        if mood=='journey' and not intro:
            t=np.arange(round(.16*RATE))/RATE
            kick=np.sin(2*np.pi*(60*t+20*(1-np.exp(-t*28))/28))*np.exp(-t*25)
            brush=rng.normal(0,1,round(.07*RATE))*np.exp(-np.arange(round(.07*RATE))/RATE*70)
            for step in [0,2]:add(kick,at+step*beat,.12)
            for step in [1,3]:add(brush,at+step*beat,.021,-.15)
        if bar>=28: # open cadence leading back to the sparse introduction
            note(root+12,at,beat*3,'flute',.045)
    mix*=.66/max(float(np.max(np.abs(mix))),.01)
    encode(name,mix,style,bpm,bars)

for theme in THEMES:
    for style in ['original','8bit']: score(*theme,style)

for region, roots, motif in [('market',[48,53,55,48,57,53,55,48],[24,28,31,26]),('harbor',[50,57,55,50,58,53,57,50],[24,27,31,29]),('kitchen',[53,48,55,48,57,53,55,48],[24,28,31,33])]:
    for style in ['original','8bit']:
        length=20*RATE; layers=[np.zeros((length,2)),np.zeros((length,1)),np.zeros((length,1))];beat=.625
        def add(layer,pitch,at,duration,gain,kind='pluck'):
            sound=acoustic.voice(pitch,duration,kind) if style=='original' else retro.chip(pitch,duration,'triangle' if kind=='bass' else 'pulse')
            start=round(at*RATE)%length;end=min(length-start,len(sound));data=layers[layer]
            data[start:start+end]+=sound[:end,None]*gain/(1.414 if layer==0 else 1)
            if end<len(sound):data[:len(sound)-end]+=sound[end:,None]*gain/(1.414 if layer==0 else 1)
        for bar,key in enumerate(roots):
            at=bar*4*beat
            for step,interval in enumerate([12,19,24,19,15 if region=='harbor' else 16,19,26,19]): add(0,key+interval,at+step*beat/2,beat*.7,.14)
            for step in [0,2]: add(0,key-12,at+step*beat,beat*.9,.18,'bass')
            for step in range(4): add(1,36 if step%2==0 else 43,at+step*beat,.14,.18,'bass')
            for step,interval in enumerate(motif):add(2,key+interval,at+step*beat,beat*.8,.09,'flute')
        combined=layers[0]+layers[1]+layers[2];scale=.6/max(float(np.max(np.abs(combined))),.01)
        for layer,data in zip(['base','rhythm','pressure'],layers): encode(f'stem-{region}-{layer}',data*scale,style,96,8,layer)

report={'version':'4.1.0','generator':'dev/tools/compose-web410.py','samples':'none; deterministic additive synthesis','combinedStemPeak':.6,'files':records,'bytes':sum(r['bytes'] for r in records)}
(ROOT/'dev/docs/web-v410/audio-manifest.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'files':len(records),'bytes':report['bytes']}),flush=True)
