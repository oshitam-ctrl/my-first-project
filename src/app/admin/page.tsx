"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    generateDailyQR();
  }, []);

  function generateDailyQR() {
    const today = new Date().toISOString().split("T")[0];
    // 日付ベースのトークン生成（簡易版：本番はサーバーサイドで生成）
    const dailyToken = btoa(`petit-hermes:${today}:${Math.random().toString(36).slice(2, 10)}`);
    setToken(dailyToken);
    setDate(today);
  }

  const qrData = `petit-hermes:${date}:${token}`;

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-4">
      <div className="max-w-md mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-xl font-bold text-[#8B6914]">店舗管理画面</h1>
          <p className="text-sm text-gray-500">プチヘルメース</p>
        </header>

        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <h2 className="font-bold text-[#8B6914] mb-2">本日のQRコード</h2>
          <p className="text-sm text-gray-500 mb-4">{date}</p>

          <div className="bg-white p-4 rounded-xl inline-block">
            <QRCodeSVG
              value={qrData}
              size={200}
              bgColor="#ffffff"
              fgColor="#333333"
              level="M"
            />
          </div>

          <p className="text-xs text-gray-400 mt-4">
            このQRコードは本日のみ有効です。
            <br />
            レジ横に表示してお客様に読み取ってもらってください。
          </p>
        </div>

        <button
          onClick={generateDailyQR}
          className="w-full mt-4 bg-[#D4A574] text-white font-bold py-3 rounded-2xl"
        >
          QRコードを再生成
        </button>

        <button
          onClick={() => window.print()}
          className="w-full mt-3 bg-white text-[#8B6914] font-bold py-3 rounded-2xl border border-[#E8C9A0]"
        >
          🖨️ 印刷する
        </button>
      </div>
    </div>
  );
}
