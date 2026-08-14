from app.extensions import db


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
