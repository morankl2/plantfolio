from unittest.mock import patch


CLAIMS = {
    "sub": "google-user-123",
    "email": "jamie@example.com",
    "name": "Jamie Rivera",
    "picture": "https://example.com/avatar.jpg",
}


def test_me_requires_session(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


@patch("app.routes.auth.id_token.verify_oauth2_token")
def test_google_sign_in_creates_user_and_session(mock_verify, client):
    mock_verify.return_value = CLAIMS

    response = client.post("/api/auth/google", json={"credential": "fake-jwt"})

    assert response.status_code == 200
    body = response.get_json()
    assert body["email"] == "jamie@example.com"
    assert body["name"] == "Jamie Rivera"

    # Session cookie should now authenticate subsequent requests.
    me_response = client.get("/api/auth/me")
    assert me_response.status_code == 200
    assert me_response.get_json()["email"] == "jamie@example.com"


@patch("app.routes.auth.id_token.verify_oauth2_token")
def test_google_sign_in_reuses_existing_user(mock_verify, client):
    mock_verify.return_value = CLAIMS

    first = client.post("/api/auth/google", json={"credential": "fake-jwt"}).get_json()
    second = client.post("/api/auth/google", json={"credential": "fake-jwt"}).get_json()

    assert first["id"] == second["id"]


def test_google_sign_in_requires_credential(client):
    response = client.post("/api/auth/google", json={})
    assert response.status_code == 400


@patch("app.routes.auth.id_token.verify_oauth2_token")
def test_google_sign_in_rejects_invalid_token(mock_verify, client):
    mock_verify.side_effect = ValueError("Token expired")

    response = client.post("/api/auth/google", json={"credential": "bad-jwt"})

    assert response.status_code == 401


@patch("app.routes.auth.id_token.verify_oauth2_token")
def test_logout_clears_session(mock_verify, client):
    mock_verify.return_value = CLAIMS
    client.post("/api/auth/google", json={"credential": "fake-jwt"})

    logout_response = client.post("/api/auth/logout")
    assert logout_response.status_code == 204

    me_response = client.get("/api/auth/me")
    assert me_response.status_code == 401
