from datetime import date

import pytest

from app.extensions import db
from app.models import PlantTag, Planting, User

PLANT = "7b0e1c5e-1d6f-4f0a-9d53-111111111111"
OTHER = "7b0e1c5e-1d6f-4f0a-9d53-222222222222"


def make_user(app, sub):
    with app.app_context():
        user = User(google_sub=sub, email=f"{sub}@example.com")
        db.session.add(user)
        db.session.commit()
        return user.id


def sign_in(client, user_id):
    with client.session_transaction() as session:
        session["user_id"] = user_id


@pytest.fixture
def user_id(app, client):
    uid = make_user(app, "user-a")
    sign_in(client, uid)
    return uid


def statuses(client):
    return client.get("/api/my-plants").get_json()["plants"]


def test_everything_needs_sign_in(client):
    assert client.get("/api/my-plants").status_code == 401
    assert client.put(f"/api/my-plants/{PLANT}/want").status_code == 401
    assert client.delete(f"/api/my-plants/{PLANT}/want").status_code == 401


def test_a_session_for_a_deleted_user_is_not_signed_in(client):
    sign_in(client, 9999)
    assert client.get("/api/my-plants").status_code == 401


def test_starts_empty(client, user_id):
    assert statuses(client) == {}


def test_set_and_clear_a_tag(client, user_id):
    response = client.put(f"/api/my-plants/{PLANT}/want")
    assert response.status_code == 200
    assert response.get_json() == {"plantId": PLANT, "statuses": ["want"]}
    assert statuses(client) == {PLANT: ["want"]}

    response = client.delete(f"/api/my-plants/{PLANT}/want")
    assert response.get_json()["statuses"] == []
    assert statuses(client) == {}


def test_setting_a_status_twice_changes_nothing(client, app, user_id):
    client.put(f"/api/my-plants/{PLANT}/has_seeds")
    client.put(f"/api/my-plants/{PLANT}/has_seeds")
    client.put(f"/api/my-plants/{PLANT}/growing")
    client.put(f"/api/my-plants/{PLANT}/growing")
    with app.app_context():
        assert PlantTag.query.count() == 1
        assert Planting.query.count() == 1


def test_clearing_something_not_set_is_fine(client, user_id):
    assert client.delete(f"/api/my-plants/{PLANT}/want").status_code == 200
    assert client.delete(f"/api/my-plants/{PLANT}/growing").status_code == 200


def test_a_plant_can_have_several_statuses_in_a_fixed_order(client, user_id):
    for status in ("extra_seeds", "want", "growing", "has_seeds", "extra_plant"):
        client.put(f"/api/my-plants/{PLANT}/{status}")
    assert statuses(client) == {PLANT: ["growing", "has_seeds", "want", "extra_plant", "extra_seeds"]}


def test_growing_starts_a_planting_with_an_unknown_date(client, app, user_id):
    client.put(f"/api/my-plants/{PLANT}/growing")
    with app.app_context():
        planting = Planting.query.one()
        assert planting.plant_id == PLANT
        assert planting.user_id == user_id
        assert planting.kind == "plant"
        assert planting.planted_on is None
        assert planting.removed_on is None
    assert statuses(client) == {PLANT: ["growing"]}


def test_not_growing_any_more_keeps_the_planting_as_history(client, app, user_id):
    client.put(f"/api/my-plants/{PLANT}/growing")
    client.delete(f"/api/my-plants/{PLANT}/growing")

    assert statuses(client) == {}
    with app.app_context():
        planting = Planting.query.one()
        assert planting.removed_on == date.today()

    client.put(f"/api/my-plants/{PLANT}/growing")  # growing it again is a new planting
    assert statuses(client) == {PLANT: ["growing"]}
    with app.app_context():
        assert Planting.query.count() == 2
        assert Planting.query.filter_by(removed_on=None).count() == 1


def test_clearing_growing_ends_every_active_planting(client, app, user_id):
    with app.app_context():
        db.session.add_all([Planting(user_id=user_id, plant_id=PLANT), Planting(user_id=user_id, plant_id=PLANT)])
        db.session.commit()
    client.delete(f"/api/my-plants/{PLANT}/growing")
    assert statuses(client) == {}


def test_statuses_are_per_user(client, app, user_id):
    client.put(f"/api/my-plants/{PLANT}/want")
    client.put(f"/api/my-plants/{PLANT}/growing")

    other = make_user(app, "user-b")
    sign_in(client, other)
    assert statuses(client) == {}
    client.put(f"/api/my-plants/{OTHER}/has_seeds")

    sign_in(client, user_id)
    assert statuses(client) == {PLANT: ["growing", "want"]}
    client.delete(f"/api/my-plants/{PLANT}/growing")
    sign_in(client, other)
    assert statuses(client) == {OTHER: ["has_seeds"]}


def test_unknown_status_and_bad_plant_id_are_rejected(client, user_id):
    bad_status = client.put(f"/api/my-plants/{PLANT}/favourite")
    assert bad_status.status_code == 400
    assert "growing" in bad_status.get_json()["error"]
    assert client.delete(f"/api/my-plants/{PLANT}/favourite").status_code == 400
    assert client.put(f"/api/my-plants/{'x' * 121}/want").status_code == 400
