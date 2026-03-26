#!/bin/bash

echo "Setting up Flutterwave payment inside existing backend..."

cd backend || exit

# Create folders if not exist
mkdir -p services
mkdir -p routes
mkdir -p database/models

# =========================
# PAYMENT MODEL
# =========================
cat <<EOF > database/models/payment.py
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
EOF

# =========================
# FLUTTERWAVE SERVICE
# =========================
cat <<EOF > services/flutterwave_service.py
import requests
from flask import current_app

def initiate_payment(payment):
    url = "https://api.flutterwave.com/v3/charges?type=mobile_money_rwanda"

    payload = {
        "amount": payment.amount,
        "currency": "RWF",
        "email": payment.email,
        "tx_ref": payment.tx_ref,
        "order_id": payment.order_id,
        "phone_number": payment.phone,
        "fullname": "Customer"
    }

    headers = {
        "Authorization": f"Bearer {current_app.config.get('FLW_SECRET_KEY')}",
        "Content-Type": "application/json"
    }

    response = requests.post(url, json=payload, headers=headers)
    return response.json()
EOF

# =========================
# ROUTES
# =========================
cat <<EOF > routes/payment_routes.py
from flask import Blueprint, request, jsonify
from database import db
from database.models.payment import Payment
from services.flutterwave_service import initiate_payment

payment_bp = Blueprint("payment", __name__)

@payment_bp.route("/pay", methods=["POST"])
def pay():
    data = request.json

    payment = Payment(
        email=data["email"],
        phone=data["phone"],
        amount=data["amount"]
    )
    payment.generate_refs()

    db.session.add(payment)
    db.session.commit()

    response = initiate_payment(payment)

    return jsonify({
        "tx_ref": payment.tx_ref,
        "flutterwave": response
    })


@payment_bp.route("/webhook", methods=["POST"])
def webhook():
    payload = request.json
    data = payload.get("data", {})

    tx_ref = data.get("tx_ref")

    payment = Payment.query.filter_by(tx_ref=tx_ref).first()

    if payment:
        payment.status = data.get("status")
        payment.flw_transaction_id = str(data.get("id"))
        db.session.commit()

    return "", 200
EOF

echo "Files created successfully."

echo ""
echo "NEXT STEP:"
echo "1. Open backend/app.py"
echo "2. Add:"
echo "   from routes.payment_routes import payment_bp"
echo "   app.register_blueprint(payment_bp, url_prefix='/api')"