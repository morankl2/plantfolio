import os

from dotenv import load_dotenv

load_dotenv()


class Config:
    PERENUAL_API_KEY = os.environ.get("PERENUAL_API_KEY", "")
    PERENUAL_BASE_URL = os.environ.get("PERENUAL_BASE_URL", "https://perenual.com/api/v2")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "sqlite:///" + os.path.join(os.getcwd(), "plantfolio.db")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
    SECRET_KEY = os.environ.get("SECRET_KEY", "")
    FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    PERENUAL_API_KEY = "test-key"
    GOOGLE_CLIENT_ID = "test-client-id.apps.googleusercontent.com"
    SECRET_KEY = "test-secret-key"
