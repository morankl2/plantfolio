from datetime import date

from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    google_sub = db.Column(db.String(255), unique=True, nullable=False)
    email = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255), nullable=True)
    picture = db.Column(db.String(500), nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "picture": self.picture,
        }


class PlantList(db.Model):
    __tablename__ = "plant_lists"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    emoji = db.Column(db.String(8), nullable=False, default="\U0001F33F")
    saved_plants = db.relationship(
        "SavedPlant", backref="plant_list", cascade="all, delete-orphan", lazy=True
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "emoji": self.emoji,
            "plantIds": [sp.plant_id for sp in self.saved_plants],
        }


class SavedPlant(db.Model):
    __tablename__ = "saved_plants"
    __table_args__ = (db.UniqueConstraint("list_id", "plant_id", name="uq_list_plant"),)

    id = db.Column(db.Integer, primary_key=True)
    list_id = db.Column(db.Integer, db.ForeignKey("plant_lists.id"), nullable=False)
    plant_id = db.Column(db.String(120), nullable=False)
    notes = db.Column(db.Text, nullable=True)


class PlantTag(db.Model):
    """A status a user has set on a plant: want, has_seeds, extra_plant or extra_seeds.

    `plant_id` is the plant data's own ID (a string). It is deliberately not a foreign key:
    the plant data lives in a separate, read-only store (docs/DATA_INTEGRATION.md).
    "Growing" is not a tag; it is derived from plantings (see Planting).
    """

    __tablename__ = "plant_tags"
    __table_args__ = (db.UniqueConstraint("user_id", "plant_id", "tag", name="uq_user_plant_tag"),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    plant_id = db.Column(db.String(120), nullable=False)
    tag = db.Column(db.String(20), nullable=False)
    set_on = db.Column(db.Date, nullable=False, default=date.today)


class Planting(db.Model):
    """One planting of a plant by a user. A user is "growing" a plant while at least one
    of its plantings has no `removed_on`. The date is optional (None = unknown).
    """

    __tablename__ = "plantings"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    plant_id = db.Column(db.String(120), nullable=False)
    kind = db.Column(db.String(10), nullable=False, default="plant")  # "plant" or "seed"
    planted_on = db.Column(db.Date, nullable=True)
    removed_on = db.Column(db.Date, nullable=True)
    created_on = db.Column(db.Date, nullable=False, default=date.today)
