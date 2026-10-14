"""Original 2.4-second spirit leitmotifs and impact sound design. No external samples."""
import json, pathlib, subprocess, tempfile, wave
import numpy as np
ROOT=pathlib.Path(__file__).resolve().parents[2]
roster=json.loads((ROOT/'src/game/adventureRpg/awakenedRoster.ts').read_text().split(' = ',1)[1].strip().rstrip(';'))
cards={c['id']:c for c in json.loads((ROOT/'dev/docs/web-v530/summon-catalog.json').read_text())}
OUT=ROOT/'public/assets/rpg/awakening530/sounds'; OUT.mkdir(parents=True,exist_ok=True)
RATE=24000; SECONDS=2.4; LENGTH=int(RATE*SECONDS)
SCHOOLS=['hearth','ember','grove','tide','sugar']
SCALES=[[0,2,4,7,9],[0,3,5,7,10],[0,2,4,7,11],[0,2,5,7,9],[0,3,7,10,12]]
manifest=[]
for index,(id,title,primary,support,ultimate,passive,oath,motif,iconCell) in enumerate(roster):
    school=SCHOOLS.index(cards[id]['school']); rng=np.random.default_rng(53000+index)
    audio=np.zeros(LENGTH);scale=SCALES[school];base=[146.83,164.81,196,174.61,220][school]
    def add(at,duration,frequency,volume,timbre):
        start=int(at*RATE);n=min(int(duration*RATE),LENGTH-start)
        if n<=0:return
        t=np.arange(n)/RATE;env=(1-np.exp(-t*75))*np.exp(-t/(duration*.28))
        phase=2*np.pi*frequency*t
        if timbre==0:signal=np.sin(phase)+.38*np.sin(phase*2)*np.exp(-t*8)+.12*np.sin(phase*3)
        elif timbre==1:signal=np.sin(phase+.55*np.sin(phase*2))+np.sin(phase*.5)*.2
        elif timbre==2:signal=np.sin(phase)+.2*np.sin(phase*2.006)+.14*np.sin(phase*3.99)
        elif timbre==3:signal=np.sin(phase+.025*np.sin(t*37))+np.sin(phase*2)*.16
        else:signal=np.sin(phase)+np.sin(phase*2.73)*.12*np.exp(-t*12)
        audio[start:start+n]+=signal*env*volume
    # Charge phrase, then a recognisable motif whose melody and rhythm are authored by the kit.
    intervals=[scale[(motif+oath+j*(1+ultimate%3))%5]+(12 if j>3 else 0) for j in range(6)]
    for j,note in enumerate(intervals):add(.08+j*.104+(motif%3)*.012,.6,base*2**(note/12),.12,school)
    impact=.75+(ultimate%4)*.09
    add(impact,.55,base/2,.23,1 if school==1 else 0)
    for j in range(3+ultimate%4):add(impact+j*.14,.52,base*2**((scale[(j+passive)%5]+12)/12),.1,school)
    # Filtered whoosh, soft chime tails, water/shield/leaf textures; all synthetic, not sampled.
    noise=rng.standard_normal(LENGTH);smooth=np.convolve(noise,np.ones(9+school*3)/(9+school*3),mode='same')
    time=np.arange(LENGTH)/RATE
    envelope=np.exp(-((time-impact)/(.1+.035*(ultimate%3)))**2)
    audio+=smooth*envelope*(.24 if school==1 else .13)
    audio+=np.sin(2*np.pi*(70+80*time)*time)*np.exp(-((time-.48)/.22)**2)*.05
    for j in range(3):add(1.45+j*.16,.62,base*2**((scale[(motif+j)%5]+12)/12),.065,school)
    # Stereo is unnecessary for a mobile action cue; leave headroom for the existing music mixer.
    audio=np.tanh(audio*1.5)*.64
    audio*=np.minimum(1,(SECONDS-time)*8)
    with tempfile.NamedTemporaryFile(suffix='.wav') as temp:
        with wave.open(temp.name,'wb') as wav:wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(RATE);wav.writeframes((audio*32767).astype('<i2').tobytes())
        file=OUT/(id+'.mp3');subprocess.run(['ffmpeg','-loglevel','error','-y','-i',temp.name,'-c:a','libmp3lame','-b:a','32k','-ar','24000','-map_metadata','-1',str(file)],check=True)
    manifest.append({'id':id,'path':f'/assets/rpg/awakening530/sounds/{id}.mp3','bytes':file.stat().st_size,'seconds':SECONDS,'sampleRate':RATE,'peak':float(np.max(np.abs(audio))),'notes':intervals,'school':SCHOOLS[school],'ultimate':ultimate})
(ROOT/'dev/docs/web-v530/audio-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'sounds':len(manifest),'bytes':sum(m['bytes'] for m in manifest),'maxPeak':max(m['peak'] for m in manifest)}))
