from app.dependencies import SESSION_COOKIE


def test_register_success(client):
    response = client.get("/auth/register")
    assert response.status_code == 200

    # Extract CSRF token from cookie
    csrf_token = client.cookies.get("csrf_token")
    assert csrf_token

    response = client.post("/auth/register", data={
        "email": "new@example.com",
        "password": "newpass123",
        "name": "新規ユーザー",
        "csrf_token": csrf_token,
    }, follow_redirects=False)
    assert response.status_code == 303
    assert SESSION_COOKIE in response.cookies


def test_register_short_password(client):
    client.get("/auth/register")
    csrf_token = client.cookies.get("csrf_token")

    response = client.post("/auth/register", data={
        "email": "new@example.com",
        "password": "short",
        "name": "ユーザー",
        "csrf_token": csrf_token,
    })
    assert response.status_code == 200
    assert "8文字以上" in response.text


def test_register_duplicate_email(client, test_user):
    client.get("/auth/register")
    csrf_token = client.cookies.get("csrf_token")

    response = client.post("/auth/register", data={
        "email": test_user.email,
        "password": "password123",
        "name": "重複ユーザー",
        "csrf_token": csrf_token,
    })
    assert response.status_code == 200
    assert "既に登録" in response.text


def test_login_success(client, test_user):
    client.get("/auth/login")
    csrf_token = client.cookies.get("csrf_token")

    response = client.post("/auth/login", data={
        "email": test_user.email,
        "password": "password123",
        "csrf_token": csrf_token,
    }, follow_redirects=False)
    assert response.status_code == 303
    assert SESSION_COOKIE in response.cookies


def test_login_wrong_password(client, test_user):
    client.get("/auth/login")
    csrf_token = client.cookies.get("csrf_token")

    response = client.post("/auth/login", data={
        "email": test_user.email,
        "password": "wrongpassword",
        "csrf_token": csrf_token,
    })
    assert response.status_code == 200
    assert "正しくありません" in response.text


def test_logout(auth_client):
    response = auth_client.post("/auth/logout", follow_redirects=False)
    assert response.status_code == 303


def test_reservations_require_login(client):
    response = client.get("/reservations", follow_redirects=False)
    assert response.status_code == 303
