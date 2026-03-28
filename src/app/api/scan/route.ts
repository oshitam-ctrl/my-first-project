import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { storeId, date, token, userId } = await request.json();

    // バリデーション
    if (!storeId || !date || !token || !userId) {
      return NextResponse.json(
        { error: "必須パラメータが不足しています" },
        { status: 400 }
      );
    }

    // 日付チェック
    const today = new Date().toISOString().split("T")[0];
    if (date !== today) {
      return NextResponse.json(
        { error: "このQRコードは期限切れです" },
        { status: 400 }
      );
    }

    // TODO: Supabase連携で以下を検証
    // 1. daily_tokensテーブルでトークンの有効性を確認
    // 2. pointsテーブルで同日スキャン済みでないか確認
    // 3. 有効であればpointsに1pt追加

    return NextResponse.json({
      success: true,
      message: "1ポイント獲得しました！",
      points: 1,
    });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
