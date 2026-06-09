#!/usr/bin/env python3
# 神実況リールv2 subtitles — speaker-colored, TOP-third placement, bold outline.
import json
T = json.load(open("/tmp/voice2/timings.json"))
COL = {3: "&H004fd18f", 2: "&H00ae6fff", 10: "&H00e8c77f"}  # ずんだ緑/めたん桃/はう水 (&HAABBGGRR)
def ts(s):
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
# Alignment 8 = top-center; MarginV from TOP = 250px (≈13%) → 上1/3に表示
for sid, col in COL.items():
    styles += f"Style: S{sid},IPAGothic,62,{col},&H00141414,&H00000000,1,0,0,0,100,100,0,0,1,6,3,8,70,70,250,1\n"
styles += "Style: Credit,IPAGothic,26,&H00FFFFFF,&H00000000,&H78000000,0,0,0,0,100,100,0,0,3,2,0,8,40,40,26,1\n"
total = T[-1]["end"] + 3.5  # covers CTA card tail
ev = "\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
ev += f"Dialogue: 0,{ts(0)},{ts(total)},Credit,,0,0,0,,VOICEVOX：四国めたん／ずんだもん／雨晴はう\n"
for m in T:
    line = f"{{\\fad(80,60)}}{{\\b1}}{m['name']}{{\\b0}}\\N{m['text']}"
    ev += f"Dialogue: 0,{ts(m['start'])},{ts(m['end']+0.15)},S{m['speaker']},,0,0,0,,{line}\n"
open("/tmp/subs2.ass", "w").write(head + styles + ev)
print("subs2.ass:", len(T), "lines, total", round(total,1), "s")
