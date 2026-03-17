from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
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
        p.price_per_unit,
        p.quantity_available,
        p.image_url,
        d.district_name
    FROM products p
    JOIN districts d
        ON p.district_id = d.district_id
    WHERE p.status = 'available'
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

    buyer_id = get_jwt_identity()
    items = data.get("items", [])

    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        order_query = "INSERT INTO orders (buyer_id, status, total_payment, created_at) VALUES (%s, 'pending', %s, NOW())"
        cursor.execute(order_query, (buyer_id, data["total"]))
        order_id = cursor.lastrowid

        for item in items:
            detail_query = "INSERT INTO order_details (order_id, product_id, price, quantity) VALUES (%s, %s, %s, %s)"
            cursor.execute(detail_query, (order_id, item["product_id"], item["price"], item["quantity"]))

        delivery_query = "INSERT INTO deliveries (order_id, pickup_district_id, delivery_district_id) VALUES (%s, %s, %s)"
        cursor.execute(delivery_query, (order_id, data["pickup_district"], data["delivery_district"]))

        connection.commit()
        return jsonify({"message": "Order placed successfully", "order_id": order_id}), 201

    except Exception as e:
        connection.rollback() # Undo changes if anything fails
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
    cursor = connection.cursor(dictionary=True)

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