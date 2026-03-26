import uuid
from database import db

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    tx_ref = db.Column(db.String(100), unique=True, nullable=False)
    order_id = db.Column(db.String(100), unique=True, nullable=False)

    email = db.Column(db.String(120))
    phone = db.Column(db.String(20))
    amount = db.Column(db.Integer)

    status = db.Column(db.String(50), default="pending")
    flw_transaction_id = db.Column(db.String(100))

    def generate_refs(self):
        self.tx_ref = str(uuid.uuid4())
        self.order_id = str(uuid.uuid4())
