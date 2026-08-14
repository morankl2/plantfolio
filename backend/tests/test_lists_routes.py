def test_create_and_get_list(client):
    response = client.post("/api/lists", json={"name": "Front Yard", "emoji": "\U0001F33F"})
    assert response.status_code == 201
    created = response.get_json()
    assert created["name"] == "Front Yard"
    assert created["plantIds"] == []

    response = client.get("/api/lists")
    assert response.status_code == 200
    assert len(response.get_json()) == 1


def test_create_list_requires_name(client):
    response = client.post("/api/lists", json={})
    assert response.status_code == 400


def test_add_and_remove_plant_from_list(client):
    list_id = client.post("/api/lists", json={"name": "Shade Garden"}).get_json()["id"]

    response = client.post(f"/api/lists/{list_id}/plants", json={"plantId": "42"})
    assert response.status_code == 201
    assert response.get_json()["plantIds"] == ["42"]

    # Adding the same plant twice should not duplicate it.
    client.post(f"/api/lists/{list_id}/plants", json={"plantId": "42"})
    response = client.get("/api/lists")
    assert response.get_json()[0]["plantIds"] == ["42"]

    response = client.delete(f"/api/lists/{list_id}/plants/42")
    assert response.status_code == 200
    assert response.get_json()["plantIds"] == []


def test_delete_list(client):
    list_id = client.post("/api/lists", json={"name": "Temp"}).get_json()["id"]

    response = client.delete(f"/api/lists/{list_id}")
    assert response.status_code == 204

    response = client.get("/api/lists")
    assert response.get_json() == []
