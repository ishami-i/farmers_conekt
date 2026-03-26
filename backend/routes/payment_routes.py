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
