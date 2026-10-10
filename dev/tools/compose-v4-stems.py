"""Original 8-bar 96 BPM stem family; sample-free, deterministic, shared loop boundary."""
from pathlib import Path
import importlib.util, json, subprocess, tempfile, wave
import numpy as np
root=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('score',Path(__file__).with_name('compose-game-music.py'))
score=importlib.util.module_from_spec(spec);spec.loader.exec_module(score)
spec=importlib.util.spec_from_file_location('retro',Path(__file__).with_name('compose-retro-music.py'))
retro=importlib.util.module_from_spec(spec);spec.loader.exec_module(retro)
rate=22050; beat=60/96; length=20; size=int(length*rate)
folder=root/'public/assets/v4/audio'; folder.mkdir(exist_ok=True)
records=[]
for style in ['original','8bit']:
 layers=[np.zeros((size,2)),np.zeros((size,1)),np.zeros((size,1))]
 def add(layer,sound,at,gain,pan=0):
  indices=(round(at*rate)+np.arange(len(sound)))%size
  for ch in range(layers[layer].shape[1]):
   volume=gain*(np.sqrt((1+(-pan if ch==0 else pan))/2) if layer==0 else 1)
   np.add.at(layers[layer][:,ch],indices,sound*volume)
 def note(layer,midi,at,duration,gain,kind='pluck'):
  sound=score.voice(midi,duration,kind) if style=='original' else retro.chip(midi,duration,'triangle' if kind=='bass' else 'pulse')
  add(layer,sound,at,gain)
 roots=[48,53,55,48,50,57,55,48]
 for bar,key in enumerate(roots):
  start=bar*4*beat
  for step,interval in enumerate([12,19,24,19,16,19,26,19]): note(0,key+interval,start+step*beat/2,beat*.7,.13)
  for step in [0,2]: note(0,key-12,start+step*beat,beat*.9,.17,'bass')
  for step in range(4):
   t=np.arange(round(.18*rate))/rate
   add(1,np.sin(2*np.pi*(60*t+20*(1-np.exp(-t*20))/20))*np.exp(-t*24),start+step*beat,.18)
  for step in [1,3]: note(1,79,start+step*beat,.055,.045)
  for step,interval in enumerate([24,28,31,26]): note(2,key+interval,start+step*beat,beat*.8,.1,'flute')
 # One gain for the combined family preserves ratios; do not normalize stems independently.
 combined=layers[0]+layers[1]+layers[2]; scale=.60/max(float(np.max(np.abs(combined))),.01)
 for name,layer in zip(['base','rhythm','pressure'],layers):
  layer*=scale
  with tempfile.TemporaryDirectory() as tmp:
   wav=Path(tmp)/'stem.wav'
   with wave.open(str(wav),'wb') as f:
    f.setnchannels(layer.shape[1]);f.setsampwidth(2);f.setframerate(rate);f.writeframes((layer*32767).astype('<i2').tobytes())
   output=folder/f'stem-{style}-{name}.mp3'
   subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(wav),'-codec:a','libmp3lame','-b:a','64k' if name=='base' else '32k','-write_xing','1',str(output)],check=True)
  records.append({'path':str(output.relative_to(root)),'style':style,'layer':name,'bpm':96,'bars':8,'loopStart':0,'loopEnd':20,'channels':layer.shape[1],'sampleRate':rate,'samples':size,'bytes':output.stat().st_size,'peak':round(float(np.max(np.abs(layer))),5),'rms':round(float(np.sqrt(np.mean(layer**2))),5)})
(root/'dev/docs/major-v400/audio-stems.json').write_text(json.dumps({'combinedPeak':.60,'records':records},indent=2)+'\n')
print(json.dumps({'files':len(records),'bytes':sum(r['bytes'] for r in records)}))
