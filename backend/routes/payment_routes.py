from flask import Blueprint, request, jsonify
from database.db import get_db_connection
import requests
import os
from dotenv import load_dotenv
from datetime import datetime
import uuid

load_dotenv()

payment_routes = Blueprint("payment_routes", __name__)

FLUTTERWAVE_SECRET_KEY = os.getenv("FLUTTERWAVE_SECRET_KEY")
FLUTTERWAVE_BASE_URL = os.getenv("FLUTTERWAVE_BASE_URL", "https://api.flutterwave.com")
CURRENCY = os.getenv("FLUTTERWAVE_CURRENCY", "RWF")


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
    cursor = connection.cursor()

    cursor.execute("SELECT total_payment FROM orders WHERE order_id = %s", (order_id,))
    order = cursor.fetchone()

    if not order:
        connection.close()
        return jsonify({"error": "Order not found"}), 404

    # Convert Decimal to float for JSON serialization
    amount = float(order["total_payment"])

    # Generate unique transaction reference
    tx_ref = f"farmersconekt_{order_id}_{int(datetime.now().timestamp())}"

    url = f"{FLUTTERWAVE_BASE_URL}/v3/payments"

    headers = {
        "Authorization": f"Bearer {FLUTTERWAVE_SECRET_KEY}",
        "Content-Type": "application/json"
    }

    # Final return URL after Flutterwave completes payment
    # Force buyer dashboard tab to orders so they land in the right place.
    redirect_url = os.getenv(
        "FLUTTERWAVE_REDIRECT_URL",
        "http://localhost:8000/pages/home.html?tab=orders",
    )

    payload = {
        "tx_ref": tx_ref,
        "amount": amount,
        "currency": CURRENCY,
        "payment_options": "card,mobilemoney,ussd",
        "redirect_url": redirect_url,
        "meta": {
            "order_id": order_id
        },
        "customer": {
            "email": email,
            "phone_number": data.get("phone", ""),
            "name": data.get("customer_name", "")
        },
        "customizations": {
            "title": "Farmer Conekt",
            "description": f"Payment for Order #{order_id}",
            "logo": "https://example.com/logo.png"
        }
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        res_data = response.json()

        if not res_data.get("status") == "success":
            connection.close()
            # Include more details in error message for debugging
            error_msg = res_data.get("message") or "Unknown error"
            return jsonify({
                "error": "Failed to initialize payment", 
                "details": error_msg,
                "flutterwave_response": res_data
            }), 500

        payment_link = res_data.get("data", {}).get("link")
        
        if not payment_link:
            connection.close()
            return jsonify({
                "error": "Invalid Flutterwave response - missing payment link",
                "flutterwave_response": res_data
            }), 500

        # Save transaction reference
        cursor.execute("""
            UPDATE orders
            SET payment_reference = %s,
                payment_status = 'pending'
            WHERE order_id = %s
        """, (tx_ref, order_id))

        connection.commit()
        connection.close()

        # Extract transaction reference from URL or use tx_ref
        return jsonify({
            "payment_link": payment_link,
            "tx_ref": tx_ref,
            "transaction_id": res_data.get("data", {}).get("id", tx_ref)
        })

    except Exception as e:
        connection.close()
        return jsonify({"error": f"Payment initialization failed: {str(e)}"}), 500


# ============================
# 2️⃣ Verify Payment
# ============================
@payment_routes.route("/verify/<tx_ref>", methods=["GET"])
def verify_payment(tx_ref):
    """
    Verify payment using transaction reference (tx_ref)
    """
    url = f"{FLUTTERWAVE_BASE_URL}/v3/transactions/verify_by_reference?tx_ref={tx_ref}"

    headers = {
        "Authorization": f"Bearer {FLUTTERWAVE_SECRET_KEY}"
    }

    try:
        response = requests.get(url, headers=headers)
        res_data = response.json()

        if not res_data.get("status") == "success":
            return jsonify({"error": "Verification failed", "details": res_data.get("message")}), 400

        payment_data = res_data["data"][0] if isinstance(res_data["data"], list) else res_data["data"]
        status = payment_data.get("status", "unknown")

        connection = get_db_connection()
        cursor = connection.cursor()

        # Map Flutterwave status to our status
        if status == "successful":
            db_status = "paid"
        elif status == "failed":
            db_status = "failed"
        else:
            db_status = "pending"

        cursor.execute("""
            UPDATE orders
            SET payment_status = %s,
                payment_date = %s
            WHERE payment_reference = %s
        """, (db_status, datetime.now(), tx_ref))

        connection.commit()
        connection.close()

        return jsonify({
            "payment_status": db_status,
            "flutterwave_status": status,
            "transaction_id": payment_data.get("id"),
            "amount": payment_data.get("amount"),
            "currency": payment_data.get("currency")
        })

    except Exception as e:
        return jsonify({"error": f"Verification failed: {str(e)}"}), 500


# ============================
# 3️⃣ Get Order Payment Info
# ============================
@payment_routes.route("/order/<int:order_id>", methods=["GET"])
def get_order_payment(order_id):

    connection = get_db_connection()
    cursor = connection.cursor()

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

    return jsonify({
        "order_id": order["order_id"],
        "total_payment": float(order["total_payment"]),
        "payment_status": order["payment_status"],
        "payment_reference": order["payment_reference"],
        "payment_date": order["payment_date"].isoformat() if order["payment_date"] else None
    })


# ============================
# 4️⃣ Payment Callback (Optional)
# ============================
@payment_routes.route("/callback", methods=["GET", "POST"])
def payment_callback():
    """
    Flutterwave redirects here after payment attempt
    """
    tx_ref = request.args.get("tx_ref") or request.json.get("tx_ref")

    if not tx_ref:
        return jsonify({"error": "Missing transaction reference"}), 400

    # Verify the payment
    return verify_payment(tx_ref)