from pathlib import Path
import json, subprocess, numpy as np
root=Path(__file__).resolve().parents[2]
manifest=json.loads((root/'dev/docs/web-v410/audio-manifest.json').read_text())
results=[]
for entry in manifest['files']:
    file=root/entry['path']
    info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(file)]))['streams'][0]
    assert int(info['sample_rate'])==44100
    channels=int(info['channels']); assert channels==entry['channels']
    decoded=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(file),'-f','f32le','-acodec','pcm_f32le','-']),dtype='<f4').reshape(-1,channels)
    duration=len(decoded)/44100
    peak=float(np.max(np.abs(decoded)));rms=float(np.sqrt(np.mean(decoded**2)))
    assert abs(duration-entry['duration'])<.001,(file.name,duration)
    assert peak<1 and np.isfinite(decoded).all() and rms>.005,(file.name,peak,rms)
    results.append({'file':file.name,'duration':round(duration,4),'sampleRate':44100,'channels':channels,'peak':round(peak,5),'rms':round(rms,5),'clippedSamples':int(np.count_nonzero(np.abs(decoded)>=1))})
report={'decoder':'ffmpeg pcm_f32le; ffprobe metadata','files':results,'maximumPeak':max(r['peak'] for r in results),'clippedSamples':sum(r['clippedSamples'] for r in results),'scope':'Decoded PCM integrity, duration, levels; subjective listening and physical speakers not verified'}
(root/'dev/docs/web-v410/audio-decoded.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'files':len(results),'maximumPeak':report['maximumPeak'],'clippedSamples':report['clippedSamples']}))
