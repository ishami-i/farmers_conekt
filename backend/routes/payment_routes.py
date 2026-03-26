from flask import Blueprint, request, jsonify
from database.db import get_db_connection
import requests
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

payment_routes = Blueprint("payment_routes", __name__)

PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY")
PAYSTACK_BASE_URL = os.getenv("PAYSTACK_BASE_URL")


# ============================
# 1️⃣ Initialize Payment
# ============================
@payment_routes.route("/initialize", methods=["POST"])
def initialize_payment():
    data = request.json

    order_id = data.get("order_id")
    email = data.get("email")

    if not order_id or not email:
        return jsonify({"error": "order_id and email required"}), 400

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute("SELECT total_payment FROM orders WHERE order_id = %s", (order_id,))
    order = cursor.fetchone()

    if not order:
        return jsonify({"error": "Order not found"}), 404

    amount = int(order["total_payment"] * 100)  # Paystack uses kobo/cents

    url = f"{PAYSTACK_BASE_URL}/transaction/initialize"

    headers = {
        "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "email": email,
        "amount": amount,
        "metadata": {
            "order_id": order_id
        }
    }

    response = requests.post(url, json=payload, headers=headers)
    res_data = response.json()

    if not res_data.get("status"):
        return jsonify({"error": "Failed to initialize payment"}), 500

    reference = res_data["data"]["reference"]
    authorization_url = res_data["data"]["authorization_url"]

    # Save reference
    cursor.execute("""
        UPDATE orders
        SET payment_reference = %s,
            payment_status = 'pending'
        WHERE order_id = %s
    """, (reference, order_id))

    connection.commit()
    connection.close()

    return jsonify({
        "authorization_url": authorization_url,
        "reference": reference
    })


# ============================
# 2️⃣ Verify Payment
# ============================
@payment_routes.route("/verify/<reference>", methods=["GET"])
def verify_payment(reference):

    url = f"{PAYSTACK_BASE_URL}/transaction/verify/{reference}"

    headers = {
        "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}"
    }

    response = requests.get(url, headers=headers)
    res_data = response.json()

    if not res_data.get("status"):
        return jsonify({"error": "Verification failed"}), 400

    payment_data = res_data["data"]

    status = payment_data["status"]

    connection = get_db_connection()
    cursor = connection.cursor()

    if status == "success":
        db_status = "paid"
    else:
        db_status = "failed"

    cursor.execute("""
        UPDATE orders
        SET payment_status = %s,
            payment_date = %s
        WHERE payment_reference = %s
    """, (db_status, datetime.now(), reference))

    connection.commit()
    connection.close()

    return jsonify({
        "payment_status": db_status,
        "paystack_status": status
    })


# ============================
# 3️⃣ Get Order Payment Info
# ============================
@payment_routes.route("/order/<int:order_id>", methods=["GET"])
def get_order_payment(order_id):

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute("""
        SELECT order_id, total_payment, payment_status,
               payment_reference, payment_date
        FROM orders
        WHERE order_id = %s
    """, (order_id,))

    order = cursor.fetchone()
    connection.close()

    if not order:
        return jsonify({"error": "Order not found"}), 404

    return jsonify(order)