from sqlalchemy.orm import Session

from app.models.user import User
from app.security import hash_password, verify_password


def create_user(db: Session, email: str, password: str, name: str) -> User:
    user = User(
        email=email,
        hashed_password=hash_password(password),
        name=name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = db.query(User).filter_by(email=email).first()
    if user and verify_password(password, user.hashed_password):
        return user
    return None


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter_by(email=email).first()
