#!/bin/bash
# Assemble the 神実況リール v2: frames → video + CTA card + subs + voice.
set -e
FF=/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2

# 1) frames → smooth 30fps gameplay video (1080x1920)
$FF -hide_banner -y -framerate 30 -i /tmp/frames2/f_%06d.jpg \
  -vf "scale=1080:1920,setsar=1,format=yuv420p" \
  -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p /tmp/reel2_game.mp4 2>/dev/null
echo "game: $($FF -hide_banner -i /tmp/reel2_game.mp4 2>&1 | grep -o 'Duration: [0-9:.]*')"

# 2) CTA card → 3.2s clip with slow zoom
$FF -hide_banner -y -loop 1 -i /tmp/cta2.png \
  -vf "scale=2160:3840,zoompan=z='min(zoom+0.0009,1.08)':d=96:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30,format=yuv420p,setsar=1" \
  -frames:v 96 -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p /tmp/reel2_cta.mp4 2>/dev/null

# 3) concat (same codec params → stream copy)
printf "file '/tmp/reel2_game.mp4'\nfile '/tmp/reel2_cta.mp4'\n" > /tmp/reel2.txt
$FF -hide_banner -y -f concat -safe 0 -i /tmp/reel2.txt -c copy /tmp/reel2_v.mp4 2>/dev/null

# 4) burn subtitles + mux voice (voice is shorter than video tail → apad)
$FF -hide_banner -y -i /tmp/reel2_v.mp4 -i /tmp/voice2/voice.wav \
  -filter_complex "[0:v]subtitles=/tmp/subs2.ass[v];[1:a]apad[a]" \
  -map "[v]" -map "[a]" -shortest \
  -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -c:a aac -b:a 160k \
  -movflags +faststart /tmp/petit-hermes-reel-v2.mp4 2>/dev/null
echo "FINAL:"; $FF -hide_banner -i /tmp/petit-hermes-reel-v2.mp4 2>&1 | grep -E "Duration|Video|Audio"
ls -la /tmp/petit-hermes-reel-v2.mp4 | awk '{print $5}'
