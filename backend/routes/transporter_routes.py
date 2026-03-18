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

    try:
        # Get delivery fee before updating
        cursor.execute("SELECT delivery_fee, order_id FROM deliveries WHERE delivery_id=%s", (data["delivery_id"],))
        delivery_data = cursor.fetchone()

        if not delivery_data:
            return jsonify({"error": "Delivery not found"}), 404

        delivery_fee = delivery_data['delivery_fee']
        order_id = delivery_data['order_id']

        # Update delivery with transporter
        query = """
        UPDATE deliveries
        SET transporter_id=%s,
            status='in_transit'
        WHERE delivery_id=%s
        """
        cursor.execute(query, (transporter_id, data["delivery_id"]))

        # Update order status to 'shipped'
        cursor.execute("UPDATE orders SET status='shipped' WHERE order_id=%s", (order_id,))

        # Record transporter earning
        cursor.execute("""
            INSERT INTO transporter_earnings (transporter_id, delivery_id, order_id, amount, status)
            VALUES (%s, %s, %s, %s, 'pending')
        """, (transporter_id, data["delivery_id"], order_id, delivery_fee))

        connection.commit()
        return jsonify({"message": "Delivery accepted"})

    except Exception as e:
        connection.rollback()
        return jsonify({"error": "Failed to accept delivery", "details": str(e)}), 500
    finally:
        connection.close()

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
    SET status=%s
    WHERE delivery_id=%s
    """

    cursor.execute(query, (status, data["delivery_id"]))

    # if delivered, also mark order delivered and transporter earning as paid
    if status == "delivered":
        cursor.execute(
            "UPDATE orders SET status='delivered' WHERE order_id=(SELECT order_id FROM deliveries WHERE delivery_id=%s)",
            (data["delivery_id"],),
        )

        # Mark transporter earning as paid
        cursor.execute(
            "UPDATE transporter_earnings SET status='paid' WHERE delivery_id=%s",
            (data["delivery_id"],),
        )

    connection.commit()
    connection.close()

    return jsonify({"message": "Status updated"})

# transporter earnings

@transporter_routes.route("/earnings", methods=["GET"])
@jwt_required()
@role_required("transporter")
def get_transporter_earnings():
    user_id = get_jwt_identity()
    transporter_id = _get_transporter_id_from_user(user_id)
    if not transporter_id:
        return jsonify({"error": "Transporter profile not found"}), 404

    connection = get_db_connection()
    cursor = connection.cursor()

    # Get earnings summary
    cursor.execute("""
        SELECT
            SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_earned,
            SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_earnings,
            COUNT(*) as total_deliveries
        FROM transporter_earnings
        WHERE transporter_id = %s
    """, (transporter_id,))
    summary = cursor.fetchone()

    # Get earnings history
    cursor.execute("""
        SELECT
            te.earning_id,
            te.amount,
            te.status,
            te.created_at,
            te.delivery_id,
            o.order_id,
            o.total_payment
        FROM transporter_earnings te
        JOIN orders o ON te.order_id = o.order_id
        WHERE te.transporter_id = %s
        ORDER BY te.created_at DESC
        LIMIT 50
    """, (transporter_id,))
    earnings_history = cursor.fetchall()

    connection.close()

    return jsonify({
        "summary": {
            "total_earned": summary["total_earned"] or 0,
            "pending_earnings": summary["pending_earnings"] or 0,
            "total_deliveries": summary["total_deliveries"] or 0
        },
        "earnings_history": earnings_history
    })

