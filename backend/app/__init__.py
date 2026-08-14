from flask import Flask
from flask_cors import CORS

from app.config import Config
from app.extensions import db


def create_app(config_object: type[Config] = Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_object)

    db.init_app(app)
    CORS(app, supports_credentials=True, origins=[app.config["FRONTEND_ORIGIN"]])

    from app.routes.plants import plants_bp
    from app.routes.lists import lists_bp
    from app.routes.auth import auth_bp

    app.register_blueprint(plants_bp)
    app.register_blueprint(lists_bp)
    app.register_blueprint(auth_bp)

    with app.app_context():
        db.create_all()

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    return app
