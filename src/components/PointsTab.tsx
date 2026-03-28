"use client";

import { useState } from "react";
import QRScanner from "./QRScanner";
import PointsDisplay from "./PointsDisplay";
import CouponList from "./CouponList";

export default function PointsTab() {
  const [showScanner, setShowScanner] = useState(false);

  return (
    <div className="p-4 space-y-6">
      {/* ポイント表示 */}
      <PointsDisplay />

      {/* QRスキャンボタン */}
      <button
        onClick={() => setShowScanner(true)}
        className="w-full bg-[#D4A574] hover:bg-[#C09060] text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all active:scale-95 text-lg"
      >
        📷 QRコードをスキャン
      </button>

      {/* QRスキャナーモーダル */}
      {showScanner && (
        <QRScanner onClose={() => setShowScanner(false)} />
      )}

      {/* クーポン一覧 */}
      <CouponList />

      {/* 説明 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-bold text-[#8B6914] mb-2">ポイントの貯め方</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>🏪 お店のレジ横QRコードをスキャン → 1pt</li>
          <li>🎁 5ポイントで クーポンA ゲット！</li>
          <li>🎁 10ポイントで クーポンB ゲット！</li>
          <li>📅 「パンの日」はダブルポイント！</li>
        </ul>
      </div>
    </div>
  );
}
