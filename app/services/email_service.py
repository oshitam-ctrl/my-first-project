"""Mock email service — prints to console for demo purposes."""


def send_reservation_confirmation(email: str, reservation_id: int, pickup_date: str, pickup_time: str) -> None:
    print(f"[EMAIL] To: {email}")
    print(f"  件名: 予約確認 #{reservation_id}")
    print(f"  受取日時: {pickup_date} {pickup_time}")
    print(f"  ご予約ありがとうございます！")
    print()


def send_reservation_cancellation(email: str, reservation_id: int) -> None:
    print(f"[EMAIL] To: {email}")
    print(f"  件名: 予約キャンセル #{reservation_id}")
    print(f"  予約がキャンセルされました。")
    print()
