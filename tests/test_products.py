def test_home_shows_products(client, sample_product):
    response = client.get("/")
    assert response.status_code == 200
    assert sample_product.name in response.text


def test_home_hides_inactive(client, db):
    from app.models.product import Product
    p = Product(name="非表示パン", price=100, is_active=False)
    db.add(p)
    db.commit()

    response = client.get("/")
    assert "非表示パン" not in response.text
