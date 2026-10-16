"""Decode every shipped clip and sound; reject truncated media and record real codec/hash/bytes."""
import concurrent.futures, hashlib, json, pathlib, subprocess
ROOT=pathlib.Path(__file__).resolve().parents[2]
MEDIA=ROOT/'public/assets/rpg/awakening530'
ids=[r['id'] for r in json.loads((ROOT/'dev/docs/web-v530/summon-catalog.json').read_text())]
native={m['id'] for m in json.loads((ROOT/'dev/docs/web-v530/movie-manifest.json').read_text()) if m.get('renderer','').startswith('native')}
def check(id):
    result={'id':id}
    for kind,ext in [('movies','mp4'),('sounds','mp3')]:
        if kind=='movies' and id in native:continue
        file=MEDIA/kind/(id+'.'+ext)
        raw=file.read_bytes()
        meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=codec_name,width,height,r_frame_rate,nb_frames,sample_rate,channels:format=duration','-of','json',str(file)]))
        decoded=subprocess.run(['ffmpeg','-v','error','-i',str(file),'-f','null','-'],capture_output=True)
        assert decoded.returncode==0 and not decoded.stderr,(id,decoded.stderr.decode())
        duration=float(meta['format']['duration']);assert 2.3<duration<2.7,(id,duration)
        stream=meta['streams'][0]
        if ext=='mp4':assert stream['codec_name']=='h264' and stream['width']==1280 and stream['height']==720 and stream['r_frame_rate']=='24/1',stream
        else:assert stream['codec_name']=='mp3' and stream['sample_rate']=='24000' and stream['channels']==1,stream
        result[kind]={'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'duration':duration,'stream':stream}
    return result
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(check,ids))
assert len({r['movies']['sha256'] for r in results if 'movies' in r})==len(ids)-len(native)
assert len({r['sounds']['sha256'] for r in results})==139
record={'decodedVideos':len(ids)-len(native),'nativeTimelines':len(native),'decodedSounds':139,'totalBytes':sum(r[k]['bytes'] for r in results for k in ['movies','sounds'] if k in r),'results':results}
file=ROOT/'dev/docs/web-v530/media-qa.json';temp=file.with_suffix('.tmp');temp.write_text(json.dumps(record,indent=2)+'\n');temp.replace(file)
print(json.dumps({k:v for k,v in record.items() if k!='results'}))
