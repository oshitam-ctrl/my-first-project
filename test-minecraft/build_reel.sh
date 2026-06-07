#!/usr/bin/env bash
# Assemble the VOICEVOX 3-character gameplay reel.
# Prereqs (one-time, network to GitHub + PyPI):
#   pip install /tmp/voicevox_core-0.16.4-cp310-abi3-manylinux_2_34_x86_64.whl  # from VOICEVOX/voicevox_core releases
#   download onnxruntime (VOICEVOX/onnxruntime-builder), open_jtalk dict (r9y9/open_jtalk),
#   and 0.vvm (VOICEVOX/voicevox_vvm) -> /tmp/vv/{ort,dict,vvms}
#   ffmpeg = imageio-ffmpeg static build (has libass/libx264/aac).
set -e
FF=/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2
DIR="$(cd "$(dirname "$0")" && pwd)"
python3 "$DIR/tts.py"                 # -> /tmp/voice/line_*.wav + manifest.json
python3 - <<'PY'                      # concat voice + per-line timings
import json,wave
m=json.load(open("/tmp/voice/manifest.json")); GAP=0.22
o=wave.open("/tmp/voice/voice.wav","wb");fr=24000;o.setnchannels(1);o.setsampwidth(2);o.setframerate(fr)
sil=b"\x00\x00"*int(fr*GAP);t=0.0;T=[]
for x in m:
  w=wave.open(x["file"]);d=w.readframes(w.getnframes());w.close()
  T.append({**x,"start":round(t,3),"end":round(t+x["dur"],3)});o.writeframes(d);t+=x["dur"];o.writeframes(sil);t+=GAP
o.close();json.dump(T,open("/tmp/voice/timings.json","w"),ensure_ascii=False);print("voice",round(t,2),"s")
PY
node "$DIR/broll.mjs"                  # -> /tmp/broll/{A,B}/*.webm (clean gameplay)
python3 "$DIR/build_ass.py"           # -> /tmp/subs.ass (colour-coded + credit)
A=$(ls /tmp/broll/A/*.webm|head -1); B=$(ls /tmp/broll/B/*.webm|head -1)
$FF -y -ss 6.7 -i "$A" -t 20.1 -vf "scale=1080:1920,fps=30,format=yuv420p,setsar=1" -an -c:v libx264 -preset veryfast -crf 21 /tmp/aclip.mp4
$FF -y -ss 6.6 -i "$B" -t 20.4 -vf "scale=1080:1920,fps=30,format=yuv420p,setsar=1" -an -c:v libx264 -preset veryfast -crf 21 /tmp/bclip.mp4
printf "file '/tmp/aclip.mp4'\nfile '/tmp/bclip.mp4'\n%.0s" {1..3} > /tmp/brl.txt
$FF -y -f concat -safe 0 -i /tmp/brl.txt -c copy /tmp/broll.mp4
DUR=$(python3 -c "import json;print(json.load(open('/tmp/voice/timings.json'))[-1]['end']+0.1)")
$FF -y -i /tmp/broll.mp4 -i /tmp/voice/voice.wav -filter_complex "[0:v]subtitles=/tmp/subs.ass[v]" \
  -map "[v]" -map 1:a -t "$DUR" -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p \
  -c:a aac -b:a 160k -movflags +faststart /tmp/petit-hermes-voicevox.mp4
echo "done -> /tmp/petit-hermes-voicevox.mp4"
