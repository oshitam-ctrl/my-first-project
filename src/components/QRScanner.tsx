"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/lib/game-state";

interface QRScannerProps {
  onClose: () => void;
}

export default function QRScanner({ onClose }: QRScannerProps) {
  const addPoint = useGameStore((s) => s.addPoint);
  const [status, setStatus] = useState<"scanning" | "success" | "error">("scanning");
  const [message, setMessage] = useState("");
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let html5QrCode: import("html5-qrcode").Html5Qrcode | null = null;

    async function initScanner() {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (!scannerRef.current) return;

      html5QrCode = new Html5Qrcode("qr-reader");

      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            handleScan(decodedText);
            html5QrCode?.stop();
          },
          () => {}
        );
      } catch {
        setStatus("error");
        setMessage("カメラにアクセスできません。カメラの権限を確認してください。");
      }
    }

    initScanner();

    return () => {
      html5QrCode?.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleScan(data: string) {
    try {
      // QRデータ形式: {store_id}:{date}:{daily_token}
      const parts = data.split(":");
      if (parts.length !== 3) {
        setStatus("error");
        setMessage("無効なQRコードです。");
        return;
      }

      const [, date] = parts;
      const today = new Date().toISOString().split("T")[0];

      if (date !== today) {
        setStatus("error");
        setMessage("このQRコードは期限切れです。");
        return;
      }

      // TODO: サーバーサイドでトークン検証（MVP段階ではクライアントで簡易チェック）
      addPoint(1);
      setStatus("success");
      setMessage("1ポイント獲得しました！");
    } catch {
      setStatus("error");
      setMessage("エラーが発生しました。もう一度お試しください。");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="p-4 text-center">
          <h3 className="font-bold text-lg text-[#8B6914]">QRコードスキャン</h3>
          <p className="text-sm text-gray-500 mt-1">レジ横のQRコードを読み取ってください</p>
        </div>

        {status === "scanning" && (
          <div id="qr-reader" ref={scannerRef} className="w-full" />
        )}

        {status === "success" && (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-lg font-bold text-[#7CB342]">{message}</p>
          </div>
        )}

        {status === "error" && (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">😢</div>
            <p className="text-sm text-red-500">{message}</p>
          </div>
        )}

        <div className="p-4">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 font-medium"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
