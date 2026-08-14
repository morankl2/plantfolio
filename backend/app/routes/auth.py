from flask import Blueprint, current_app, jsonify, request, session
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.extensions import db
from app.models import User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/google")
def google_sign_in():
    payload = request.get_json(silent=True) or {}
    credential = payload.get("credential")
    if not credential:
        return jsonify({"error": "credential is required"}), 400

    try:
        claims = id_token.verify_oauth2_token(
            credential, google_requests.Request(), current_app.config["GOOGLE_CLIENT_ID"]
        )
    except ValueError as exc:
        return jsonify({"error": f"Invalid Google credential: {exc}"}), 401

    user = User.query.filter_by(google_sub=claims["sub"]).first()
    if user is None:
        user = User(google_sub=claims["sub"], email=claims.get("email", ""))
        db.session.add(user)
    user.email = claims.get("email", user.email)
    user.name = claims.get("name")
    user.picture = claims.get("picture")
    db.session.commit()

    session["user_id"] = user.id
    return jsonify(user.to_dict())


@auth_bp.get("/me")
def current_user():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "not signed in"}), 401

    user = db.session.get(User, user_id)
    if user is None:
        session.pop("user_id", None)
        return jsonify({"error": "not signed in"}), 401

    return jsonify(user.to_dict())


@auth_bp.post("/logout")
def logout():
    session.pop("user_id", None)
    return "", 204
