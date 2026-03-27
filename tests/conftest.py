import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.dependencies import get_db, SESSION_COOKIE
from app.main import app
from app.security import create_session_token, hash_password
from app.models.user import User
from app.models.product import Product
from app.models.inventory import Inventory
import datetime as dt

TEST_DB_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db):
    user = User(
        email="test@example.com",
        hashed_password=hash_password("password123"),
        name="テストユーザー",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_user(db):
    user = User(
        email="admin@example.com",
        hashed_password=hash_password("admin12345"),
        name="管理者",
        is_admin=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_client(client, test_user):
    token = create_session_token(test_user.id, test_user.is_admin)
    client.cookies.set(SESSION_COOKIE, token)
    return client


@pytest.fixture
def admin_client(client, admin_user):
    token = create_session_token(admin_user.id, admin_user.is_admin)
    client.cookies.set(SESSION_COOKIE, token)
    return client


@pytest.fixture
def sample_product(db):
    product = Product(name="テストパン", description="テスト用", price=300)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@pytest.fixture
def sample_inventory(db, sample_product):
    today = dt.date.today()
    inv = Inventory(
        product_id=sample_product.id,
        date=today,
        total_quantity=10,
        reserved_quantity=0,
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv
