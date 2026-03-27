def test_admin_dashboard(admin_client):
    response = admin_client.get("/admin")
    assert response.status_code == 200
    assert "管理画面" in response.text


def test_non_admin_blocked(auth_client):
    response = auth_client.get("/admin")
    assert response.status_code == 403


def test_admin_products(admin_client, sample_product):
    response = admin_client.get("/admin/products")
    assert response.status_code == 200
    assert sample_product.name in response.text


def test_admin_create_product(admin_client):
    admin_client.get("/admin/products/new")
    csrf_token = admin_client.cookies.get("csrf_token")

    response = admin_client.post("/admin/products/new", data={
        "name": "新しいパン",
        "description": "新商品です",
        "price": 500,
        "csrf_token": csrf_token,
    }, follow_redirects=False)
    assert response.status_code == 303


def test_admin_inventory(admin_client, sample_product, sample_inventory):
    response = admin_client.get("/admin/inventory")
    assert response.status_code == 200
    assert sample_product.name in response.text
