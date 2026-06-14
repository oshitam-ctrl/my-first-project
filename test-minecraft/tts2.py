#!/usr/bin/env python3
# 神実況リールv2 — VOICEVOX 3-character banter (~60s), voice-first timeline.
# Outputs /tmp/voice2/line_NN.wav + voice.wav + timings.json.
# Credit (required): VOICEVOX:四国めたん / ずんだもん / 雨晴はう
import glob, json, os, wave, contextlib
from voicevox_core.blocking import Onnxruntime, OpenJtalk, Synthesizer, VoiceModelFile

OUT = "/tmp/voice2"; os.makedirs(OUT, exist_ok=True)
SO = glob.glob("/tmp/vv/ort/**/*onnxruntime*.so*", recursive=True)[0]
syn = Synthesizer(Onnxruntime.load_once(filename=SO), OpenJtalk("/tmp/vv/dict"))
with VoiceModelFile.open("/tmp/vv/vvms/0.vvm") as vm:
    syn.load_voice_model(vm)

MET, ZUN, HAU = 2, 3, 10
NAME = {MET: "四国めたん", ZUN: "ずんだもん", HAU: "雨晴はう"}
SPEED = {MET: 1.14, ZUN: 1.18, HAU: 1.10}

# 神実況: 短文・即リアクション・ボケ×ツッコミ×感動。scene key → render_reel.mjs
SCRIPT = [
    (ZUN, "実在のパン屋さんが、まるごとゲームになったのだ！？",            "hook"),
    (MET, "広島の廃校パン屋『プチヘルメース』。ブラウザで無料よ。",          "facade"),
    (HAU, "校章も、丸時計もある…ほんものの小学校みたい。",                 "clock"),
    (ZUN, "昇降口に下駄箱なのだ！なつかしすぎるのだ！",                    "genkan"),
    (MET, "廊下を抜けると…",                                            "corridor"),
    (ZUN, "うわぁぁ！パンの壁なのだ！！",                                  "hero"),
    (HAU, "焼きたてが、ずらり…！",                                       "hero2"),
    (MET, "看板は天然酵母のカンパーニュ。秘密はこの瓶よ。",                 "yeast"),
    (HAU, "いちご、柿、ゆず…酵母で味が変わるんだって。",                   "yeast2"),
    (ZUN, "もう我慢できないのだ！買うのだ！",                              "buy"),
    (MET, "自分で焼くこともできるの。まずは畑から。",                       "field"),
    (ZUN, "規格外野菜、救出なのだ！",                                     "field2"),
    (HAU, "瓶のなかで、ぷくぷく…かわいい。",                               "ferment"),
    (MET, "『もったいない』が『おいしい』になる瞬間よ。",                   "oven"),
    (ZUN, "焼けたのだ〜！店主さんに届けるのだ！",                          "deliver"),
    (MET, "届けると…開店よ。",                                           "open"),
    (ZUN, "行列できてるのだ！？",                                         "queue"),
    (HAU, "開店おめでとう〜！",                                           "queue2"),
    (MET, "おとなりは旧教室のカフェ、サウスインノース。",                   "cafe"),
    (ZUN, "カレーを買って、校庭で食べるのだ！",                            "lunch"),
    (HAU, "青空の下のカレー…ぜったい美味しいやつ。",                       "lunch2"),
    (MET, "体育館も校庭も、桜も、まるごと再現。",                          "gym"),
    (HAU, "杉の里山に、神社まで…ずっと居られる。",                         "valley"),
    (ZUN, "ぜんぶ無料なのだ！プロフのリンクから遊ぶのだ〜！",               "cta"),
]

manifest = []
for i, (spk, text, scene) in enumerate(SCRIPT):
    q = syn.create_audio_query(text, spk)
    q.speed_scale = SPEED[spk]
    wav = syn.synthesis(q, spk)
    fn = f"{OUT}/line_{i:02d}.wav"
    open(fn, "wb").write(wav)
    with contextlib.closing(wave.open(fn)) as w:
        dur = w.getnframes() / w.getframerate()
    manifest.append({"i": i, "speaker": spk, "name": NAME[spk], "text": text, "scene": scene, "file": fn, "dur": round(dur, 3)})
    print(f"{i:02d} {NAME[spk]:6s} {dur:5.2f}s {scene:9s} {text[:22]}")

# concat with gaps → voice.wav + per-line [start,end]
GAP = 0.14
out = wave.open(f"{OUT}/voice.wav", "wb")
fr = 24000; out.setnchannels(1); out.setsampwidth(2); out.setframerate(fr)
sil = b"\x00\x00" * int(fr * GAP)
t = 0.0
for m in manifest:
    w = wave.open(m["file"]); d = w.readframes(w.getnframes()); w.close()
    m["start"] = round(t, 3); out.writeframes(d); t += m["dur"]; m["end"] = round(t, 3)
    out.writeframes(sil); t += GAP
out.close()
json.dump(manifest, open(f"{OUT}/timings.json", "w"), ensure_ascii=False, indent=1)
print(f"TOTAL: {t:.1f}s ({len(manifest)} lines)")
