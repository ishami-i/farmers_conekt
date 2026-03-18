from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.db import get_db_connection

payment_routes = Blueprint("payment_routes", __name__)

@payment_routes.route("/process", methods=["POST"])
@jwt_required()
def process_payment():
    data = request.json
    order_id = data.get("order_id")
    amount = data.get("amount")

    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        # Update order payment status
        cursor.execute("UPDATE orders SET payment_status = %s, payment_date = NOW() WHERE order_id = %s", ("paid", order_id))

        # Get order details and calculate earnings distribution
        cursor.execute("""
            SELECT o.total_payment, d.delivery_fee, d.delivery_id
            FROM orders o
            JOIN deliveries d ON o.order_id = d.order_id
            WHERE o.order_id = %s
        """, (order_id,))
        order_data = cursor.fetchone()

        if order_data:
            total_payment = order_data['total_payment']
            delivery_fee = order_data['delivery_fee']
            delivery_id = order_data['delivery_id']

            # Calculate product subtotal (total - delivery fee)
            product_subtotal = total_payment - delivery_fee

            # Get farmer_id from order details
            cursor.execute("""
                SELECT DISTINCT p.farmer_id
                FROM order_details od
                JOIN products p ON od.product_id = p.product_id
                WHERE od.order_id = %s
                LIMIT 1
            """, (order_id,))
            farmer_data = cursor.fetchone()

            if farmer_data:
                farmer_id = farmer_data['farmer_id']

                # Record farmer earning
                cursor.execute("""
                    INSERT INTO farmer_earnings (farmer_id, order_id, amount, status)
                    VALUES (%s, %s, %s, 'paid')
                """, (farmer_id, order_id, product_subtotal))

        connection.commit()
        return jsonify({"message": "Payment processed successfully", "order_id": order_id})

    except Exception as e:
        connection.rollback()
        return jsonify({"error": "Payment processing failed", "details": str(e)}), 500
    finally:
        connection.close()

@payment_routes.route("/status/<int:order_id>", methods=["GET"])
@jwt_required()
def payment_status(order_id):
    connection = get_db_connection()
    cursor = connection.cursor()
    
    cursor.execute("SELECT payment_status FROM orders WHERE order_id = %s", (order_id,))
    result = cursor.fetchone()
    connection.close()
    
    return jsonify(result or {"payment_status": "not_found"})
