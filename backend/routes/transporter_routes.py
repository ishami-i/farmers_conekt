from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from middleware.role_required import role_required
from database.db import get_db_connection
from flask_jwt_extended import get_jwt_identity

transporter_routes = Blueprint("transporter_routes", __name__)

# allowing transporter to view available deliveries

@transporter_routes.route("/available-deliveries", methods=["GET"])
@jwt_required()
@role_required("transporter")
def available_deliveries():

    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
    SELECT
        d.delivery_id,
        o.order_id,
        o.total_payment,
        o.payment_status,
        o.status AS order_status,
        u.full_name AS buyer_name,
        d.pickup_location,
        d.dropoff_location,
        d.status AS delivery_status
    FROM deliveries d
    JOIN orders o ON d.order_id = o.order_id
    JOIN buyers b ON o.buyer_id = b.buyer_id
    JOIN users u ON b.user_id = u.user_id
    WHERE d.transporter_id IS NULL
    """

    cursor.execute(query)

    deliveries = cursor.fetchall()

    connection.close()

    return jsonify(deliveries)


@transporter_routes.route("/my-deliveries", methods=["GET"])
@jwt_required()
@role_required("transporter")
def my_deliveries():
    user_id = get_jwt_identity()
    transporter_id = _get_transporter_id_from_user(user_id)
    if not transporter_id:
        return jsonify({"error": "Transporter profile not found"}), 404

    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
    SELECT
        d.delivery_id,
        o.order_id,
        o.total_payment,
        o.payment_status,
        o.status AS order_status,
        u.full_name AS buyer_name,
        d.pickup_location,
        d.dropoff_location,
        d.status AS delivery_status
    FROM deliveries d
    JOIN orders o ON d.order_id = o.order_id
    JOIN buyers b ON o.buyer_id = b.buyer_id
    JOIN users u ON b.user_id = u.user_id
    WHERE d.transporter_id = %s
    """

    cursor.execute(query, (transporter_id,))

    deliveries = cursor.fetchall()

    connection.close()

    return jsonify(deliveries)

# allowing transporters to accept delivery

def _get_transporter_id_from_user(user_id):
    """Return the transporter_id for the current user (if any)."""
    connection = get_db_connection()
    cursor = connection.cursor()
    cursor.execute(
        "SELECT transporter_id FROM transporters WHERE user_id = %s",
        (user_id,),
    )
    row = cursor.fetchone()
    connection.close()
    return row["transporter_id"] if row else None


@transporter_routes.route("/accept-delivery", methods=["POST"])
@jwt_required()
@role_required("transporter")
def accept_delivery():

    data = request.json
    user_id = get_jwt_identity()
    transporter_id = _get_transporter_id_from_user(user_id)
    if not transporter_id:
        return jsonify({"error": "Transporter profile not found"}), 404

    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
    UPDATE deliveries
    SET transporter_id=%s,
        status='in_transit'
    WHERE delivery_id=%s
    """

    cursor.execute(query, (
        transporter_id,
        data["delivery_id"]
    ))

    # also update order status to 'shipped'
    cursor.execute(
        "UPDATE orders SET status='shipped' WHERE order_id = (SELECT order_id FROM deliveries WHERE delivery_id=%s)",
        (data["delivery_id"],),
    )

    connection.commit()
    connection.close()

    return jsonify({"message": "Delivery accepted"})

# allowing transporters to update delivery status

@transporter_routes.route("/update-status", methods=["POST"])
@jwt_required()
@role_required("transporter")
def update_delivery_status():

    data = request.json

    user_id = get_jwt_identity()
    transporter_id = _get_transporter_id_from_user(user_id)
    if not transporter_id:
        return jsonify({"error": "Transporter profile not found"}), 404

    status = data.get("status")
    if status not in ["pending", "in_transit", "delivered", "returned"]:
        return jsonify({"error": "Invalid status"}), 400

    connection = get_db_connection()
    cursor = connection.cursor()

    # Ensure the transporter owns this delivery
    cursor.execute(
        "SELECT 1 FROM deliveries WHERE delivery_id=%s AND transporter_id=%s",
        (data["delivery_id"], transporter_id),
    )
    if not cursor.fetchone():
        connection.close()
        return jsonify({"error": "Delivery not found or not assigned to you"}), 404

    query = """
    UPDATE deliveries
    SET delivery_status=%s
    WHERE delivery_id=%s
    """

    cursor.execute(query, (status, data["delivery_id"]))

    # if delivered, also mark order delivered & paid
    if status == "delivered":
        cursor.execute(
            "UPDATE orders SET status='delivered', payment_status='paid' WHERE order_id=(SELECT order_id FROM deliveries WHERE delivery_id=%s)",
            (data["delivery_id"],),
        )

    connection.commit()
    connection.close()

    return jsonify({"message": "Status updated"})

