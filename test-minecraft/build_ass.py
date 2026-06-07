#!/usr/bin/env python3
# Build color-coded ASS subtitles (VOICEVOX 実況 style) from voice timings.
import json
T = json.load(open("/tmp/voice/timings.json"))
# ASS colour = &HAABBGGRR
COL = {3: "&H004fd18f", 2: "&H00ae6fff", 10: "&H00e8c77f"}  # ずんだ緑 / めたん桃 / はう水
def t(s):
    h=int(s//3600); m=int(s%3600//60); sec=s%60
    return f"{h}:{m:02d}:{sec:05.2f}"
head = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
"""
styles = ""
# MarginV raised so captions sit around the lower-middle (above Instagram's UI),
# not pinned to the very bottom.
for sid, col in COL.items():
    styles += f"Style: S{sid},IPAGothic,60,{col},&H00141414,&H00000000,1,0,0,0,100,100,0,0,1,6,3,2,80,80,660,1\n"
styles += "Style: Credit,IPAGothic,28,&H00FFFFFF,&H00000000,&H64000000,0,0,0,0,100,100,0,0,3,2,0,8,40,40,30,1\n"
total_end = T[-1]["end"] + 0.5
ev = "\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
ev += f"Dialogue: 0,{t(0)},{t(total_end)},Credit,,0,0,0,,VOICEVOX：四国めたん／ずんだもん／雨晴はう\n"
for m in T:
    sid = m["speaker"]
    name = m["name"]
    txt = m["text"].replace("\n", " ")
    line = f"{{\\fad(120,90)}}{{\\b1}}{name}{{\\b0}}\\N{txt}"
    ev += f"Dialogue: 0,{t(m['start'])},{t(m['end']+0.18)},S{sid},,0,0,0,,{line}\n"
open("/tmp/subs.ass", "w").write(head + styles + ev)
print("subs.ass written:", len(T), "lines; ends", t(T[-1]['end']))
