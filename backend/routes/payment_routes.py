from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.db import get_db_connection

payment_routes = Blueprint("payment_routes", __name__)

@payment_routes.route("/process", methods=["POST"])
@jwt_required()
def process_payment():
    data = request.json
    # Placeholder for payment processing (integrate MoMo API or similar)
    order_id = data.get("order_id")
    amount = data.get("amount")
    
    connection = get_db_connection()
    cursor = connection.cursor()
    
    cursor.execute("UPDATE orders SET payment_status = %s WHERE order_id = %s", ("paid", order_id))
    connection.commit()
    connection.close()
    
    return jsonify({"message": "Payment processed successfully", "order_id": order_id})

@payment_routes.route("/status/<int:order_id>", methods=["GET"])
@jwt_required()
def payment_status(order_id):
    connection = get_db_connection()
    cursor = connection.cursor()
    
    cursor.execute("SELECT payment_status FROM orders WHERE order_id = %s", (order_id,))
    result = cursor.fetchone()
    connection.close()
    
    return jsonify(result or {"payment_status": "not_found"})
