"""Seed script: populate the database with demo data."""

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
                name="管理者",
                is_admin=True,
            )
            db.add(admin)

        # Sample products
        products_data = [
            ("クロワッサン", "サクサクのバタークロワッサン", 280),
            ("食パン", "毎朝焼きたての食パン（1斤）", 350),
            ("あんぱん", "北海道産小豆のつぶあんぱん", 200),
            ("カレーパン", "スパイシーな自家製カレーパン", 250),
            ("メロンパン", "外はカリカリ、中はふわふわ", 220),
        ]

        existing = db.query(Product).count()
        if existing == 0:
            products = []
            for name, desc, price in products_data:
                p = Product(name=name, description=desc, price=price)
                db.add(p)
                products.append(p)
            db.flush()

            # Inventory for the next 7 days
            today = dt.date.today()
            for product in products:
                for i in range(7):
                    inv = Inventory(
                        product_id=product.id,
                        date=today + dt.timedelta(days=i),
                        total_quantity=20,
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
