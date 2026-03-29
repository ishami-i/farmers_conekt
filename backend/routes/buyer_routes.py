from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from middleware.role_required import role_required
from database.db import get_db_connection

buyer_routes = Blueprint("buyer_routes", __name__)

# creation of buyers profile

@buyer_routes.route("/create-profile", methods=["POST"])
def create_buyer_profile():

    data = request.json

    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
    INSERT INTO buyers (user_id, district_id)
    VALUES (%s, %s)
    """

    cursor.execute(query, (data["user_id"], data.get("district_id")))

    connection.commit()
    connection.close()

    return jsonify({"message": "Buyer profile created"})

# buyers search engine

@buyer_routes.route("/marketplace", methods=["GET"])
def browse_marketplace():

    district_id = request.args.get("district_id")
    product_name = request.args.get("product_name")

    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
    SELECT
        p.product_id,
        p.product_name,
        p.product_category,
        p.price_per_unit,
        p.unit,
        p.quantity_available,
        p.image_url,
        p.harvest_date,
        p.expiration_date,
        d.district_name,
        u.full_name AS farmer_name
    FROM products p
    JOIN districts d ON p.district_id = d.district_id
    JOIN farmers f ON p.farmer_id = f.farmer_id
    JOIN users u ON f.user_id = u.user_id
    WHERE p.status = 'available' AND p.quantity_available > 0
    """

    filters = []
    values = []

    if district_id:
        filters.append("p.district_id = %s")
        values.append(district_id)

    if product_name:
        filters.append("p.product_name LIKE %s")
        values.append(f"%{product_name}%")

    if filters:
        query += " AND " + " AND ".join(filters)

    query += " ORDER BY p.created_at DESC"

    cursor.execute(query, values)

    products = cursor.fetchall()

    connection.close()

    return jsonify(products)

# buyer view product

@buyer_routes.route("/product/<int:product_id>", methods=["GET"])
def product_details(product_id):

    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
    SELECT
        p.*,
        f.farmer_id,
        u.full_name AS farmer_name
    FROM products p
    JOIN farmers f ON p.farmer_id = f.farmer_id
    JOIN users u ON f.user_id = u.user_id
    WHERE p.product_id = %s
    """

    cursor.execute(query, (product_id,))

    product = cursor.fetchone()

    connection.close()

    return jsonify(product)

# buyers making order

@buyer_routes.route("/place-order", methods=["POST"])
@jwt_required()
@role_required("buyer")
def place_order():

    data = request.json
    items = data.get("items", [])
    pickup_location = data.get("pickup_location") or data.get("pickup_district") or ""
    dropoff_location = data.get("delivery_location") or data.get("delivery_district") or ""

    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        # Determine buyer_id from the logged-in user
        user_id = get_jwt_identity()
        cursor.execute("SELECT buyer_id FROM buyers WHERE user_id = %s", (user_id,))
        buyer_row = cursor.fetchone()
        if not buyer_row:
            return jsonify({"error": "Buyer profile not found"}), 404
        buyer_id = buyer_row["buyer_id"]

        # Calculate product subtotal
        product_subtotal = 0
        for item in items:
            product_subtotal += item["price"] * item["quantity"]

        # Calculate delivery fee (fixed fee of 5.00 for now, can be made dynamic later)
        delivery_fee = 5.00

        # Total payment = products + delivery
        total_payment = product_subtotal + delivery_fee

        # Create order with breakdown
        order_query = """
        INSERT INTO orders (buyer_id, status, total_payment, payment_status, created_at)
        VALUES (%s, 'pending', %s, 'pending', NOW())
        """
        cursor.execute(order_query, (buyer_id, total_payment))
        order_id = cursor.lastrowid

        # Insert order details (without decrementing quantity yet)
        for item in items:
            detail_query = """
            INSERT INTO order_details (order_id, product_id, price, quantity)
            VALUES (%s, %s, %s, %s)
            """
            cursor.execute(detail_query, (order_id, item["product_id"], item["price"], item["quantity"]))

        # Create delivery record with fee
        delivery_query = """
        INSERT INTO deliveries (order_id, pickup_location, dropoff_location, delivery_fee, status)
        VALUES (%s, %s, %s, %s, 'pending')
        """
        cursor.execute(delivery_query, (order_id, pickup_location, dropoff_location, delivery_fee))

        connection.commit()
        return jsonify({
            "message": "Order placed successfully",
            "order_id": order_id,
            "breakdown": {
                "product_subtotal": product_subtotal,
                "delivery_fee": delivery_fee,
                "total": total_payment
            }
        }), 201

    except Exception as e:
        connection.rollback()
        return jsonify({"error": "Failed to place order", "details": str(e)}), 500
    finally:
        connection.close()

# order history

@buyer_routes.route("/orders/<int:buyer_id>", methods=["GET"])
@jwt_required()
@role_required("buyer")
def get_buyer_orders(buyer_id):

    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
    SELECT *
    FROM orders
    WHERE buyer_id = %s
    ORDER BY created_at DESC
    """

    cursor.execute(query, (buyer_id,))

    orders = cursor.fetchall()

    connection.close()

    return jsonify(orders)

# allowing buyer to track delivery

@buyer_routes.route("/delivery-status/<int:order_id>", methods=["GET"])
@jwt_required()
@role_required("buyer")
def delivery_status(order_id):

    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
    SELECT
        delivery_status
    FROM deliveries
    WHERE order_id=%s
    """

    cursor.execute(query, (order_id,))

    delivery = cursor.fetchone()

    connection.close()

    return jsonify(delivery)

# buyer leave a review

@buyer_routes.route("/review", methods=["POST"])
@jwt_required()
@role_required("buyer")
def leave_review():

    data = request.json

    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
    INSERT INTO reviews
    (farmer_id, buyer_id, comment, rating, created_at)
    VALUES (%s,%s,%s,%s,NOW())
    """

    cursor.execute(query, (
        data["farmer_id"],
        data["buyer_id"],
        data["comment"],
        data["rating"]
    ))

    connection.commit()
    connection.close()

    return jsonify({"message": "Review submitted"})