"""Seed script: populate the database with demo data for プチヘルメース."""

import datetime as dt

import bcrypt

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models import Inventory, Product, User


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Admin user
        if not db.query(User).filter_by(email=settings.admin_email).first():
            hashed = bcrypt.hashpw(settings.admin_password.encode(), bcrypt.gensalt()).decode()
            admin = User(
                email=settings.admin_email,
                hashed_password=hashed,
                name="大下安有美",
                is_admin=True,
            )
            db.add(admin)

        # プチヘルメースの商品
        products_data = [
            (
                "天然酵母のカンパーニュ",
                "自家製酵母でじっくり発酵させた田舎パン。外はパリッと、中はもっちり。噛むほどに小麦の甘みが広がります。乳製品不使用。",
                680,
                "/static/img/campagne.svg",
            ),
            (
                "酵母の食パン",
                "毎日食べたい、やさしい味わいの食パン。自家製酵母ならではのほのかな酸味と香りが特徴。トーストにしても、そのままでも。1斤。",
                550,
                "/static/img/shokupan.svg",
            ),
            (
                "地野菜のフォカッチャ",
                "北広島町の畑から届いた規格外野菜をたっぷりのせて焼き上げました。季節の野菜とローズマリーの香り。食品ロスから生まれたおいしさです。",
                480,
                "/static/img/vegetable-focaccia.svg",
            ),
            (
                "里山スコーン",
                "地元の季節の果物やナッツを練り込んだ素朴なスコーン。バター不使用、菜種油で仕上げたやさしい味わい。3個セット。",
                450,
                "/static/img/scone.svg",
            ),
            (
                "季節のおまかせセット",
                "その日の焼き上がりから店主がセレクト。旬の素材を使ったパンの詰め合わせです。内容はお楽しみ。※水・土曜の受取限定",
                1930,
                "/static/img/seasonal.svg",
            ),
        ]

        existing = db.query(Product).count()
        if existing == 0:
            products = []
            for name, desc, price, image in products_data:
                p = Product(name=name, description=desc, price=price, image_url=image)
                db.add(p)
                products.append(p)
            db.flush()

            # Inventory for the next 7 days
            today = dt.date.today()
            for product in products:
                for i in range(7):
                    date = today + dt.timedelta(days=i)
                    # Only stock on Wed(2) and Sat(5) — actual business days
                    if date.weekday() in (2, 5):
                        qty = 5 if product.price >= 1000 else 10
                    else:
                        qty = 0
                    inv = Inventory(
                        product_id=product.id,
                        date=date,
                        total_quantity=qty,
                        reserved_quantity=0,
                    )
                    db.add(inv)

        db.commit()
        print("Seed data created successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
