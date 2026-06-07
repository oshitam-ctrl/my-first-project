#!/usr/bin/env python3
# Synthesize the 3-character VOICEVOX banter for the reel.
# Outputs /tmp/voice/line_NN.wav + /tmp/voice/manifest.json (speaker,text,dur).
# Credit (required): VOICEVOX:四国めたん / ずんだもん / 雨晴はう
import glob, json, os, wave, contextlib
from voicevox_core.blocking import Onnxruntime, OpenJtalk, Synthesizer, VoiceModelFile

OUT = "/tmp/voice"; os.makedirs(OUT, exist_ok=True)
SO = glob.glob("/tmp/vv/ort/**/*onnxruntime*.so*", recursive=True)[0]
syn = Synthesizer(Onnxruntime.load_once(filename=SO), OpenJtalk("/tmp/vv/dict"))
with VoiceModelFile.open("/tmp/vv/vvms/0.vvm") as vm:  # 0.vvm has めたん/ずんだ/はう
    syn.load_voice_model(vm)

MET, ZUN, HAU = 2, 3, 10
NAME = {MET: "四国めたん", ZUN: "ずんだもん", HAU: "雨晴はう"}
SPEED = {MET: 1.10, ZUN: 1.16, HAU: 1.06}

# ワイワイ掛け合い・フック先行 (~90s)
SCRIPT = [
    (ZUN, "実在のパン屋さんが、まるごとゲームになったのだ！？"),
    (MET, "しかも全部ブラウザで動くのよ。インストール不要、無料でね。"),
    (HAU, "ここ、閉校した小学校をリノベしたパン屋さんなんだって！"),
    (ZUN, "校舎がまるごとお店なのだ〜！すごいのだ！"),
    (MET, "ショーケースを見て。焼きたてのパンがずらりよ。"),
    (ZUN, "バゲットにカンパーニュ…お腹すいてきたのだ……"),
    (MET, "看板は、天然酵母のカンパーニュなの。"),
    (HAU, "その酵母、畑の“規格外野菜”からおこすんだよ。"),
    (ZUN, "野菜からパンの酵母…魔法みたいなのだ！"),
    (MET, "“もったいない”を“おいしい”に。これがこのお店のテーマなの。"),
    (HAU, "捨てちゃう野菜が、おいしいパンに変わるなんて素敵。"),
    (ZUN, "しかも自分でパンが焼けるのだ！ホカホカなのだ！"),
    (MET, "焼けたら対面カウンターで、お客さんに売れるのよ。"),
    (HAU, "いらっしゃいませ〜！お客さんで賑わってて、可愛い！"),
    (ZUN, "奥には姉妹カフェ、サウスインノースもあるのだ！"),
    (HAU, "校庭では夕暮れまで、のんびり過ごせるんだ……素敵。"),
    (MET, "昼から夜まで、ちゃんと時間も流れるのよ。"),
    (MET, "畑で収穫して、瓶で発酵、焼いて、店主に届ける。"),
    (ZUN, "“今日のしごと”を全部クリアすると、お店が開店するのだ！"),
    (HAU, "お店が開く瞬間、ちょっと感動しちゃった。"),
    (MET, "これ全部、ブラウザで無料。気になるでしょ？"),
    (ZUN, "今すぐ遊ぶのだ〜！プロフィールのリンクからなのだ！"),
]

manifest = []
for i, (spk, text) in enumerate(SCRIPT):
    q = syn.create_audio_query(text, spk)
    q.speed_scale = SPEED[spk]
    wav = syn.synthesis(q, spk)
    fn = f"{OUT}/line_{i:02d}.wav"
    with open(fn, "wb") as f:
        f.write(wav)
    with contextlib.closing(wave.open(fn)) as w:
        dur = w.getnframes() / w.getframerate()
    manifest.append({"i": i, "speaker": spk, "name": NAME[spk], "text": text, "file": fn, "dur": round(dur, 3)})
    print(f"{i:02d} {NAME[spk]:6s} {dur:5.2f}s  {text[:24]}")

json.dump(manifest, open(f"{OUT}/manifest.json", "w"), ensure_ascii=False, indent=1)
total = sum(m["dur"] for m in manifest)
print(f"TOTAL speech: {total:.1f}s  (+gaps -> ~{total + 0.25*len(manifest):.1f}s)")
