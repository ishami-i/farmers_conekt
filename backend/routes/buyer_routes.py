from flask import Blueprint, request, jsonify
from database.db import get_db_connection

buyer_routes = Blueprint("buyer_routes", __name__)

# creation of buyers profile

@buyer_routes.route("/create-profile", methods=["POST"])
def create_buyer_profile():

    data = request.json

    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
    INSERT INTO buyers (user_id)
    VALUES (%s)
    """

    cursor.execute(query, (data["user_id"],))

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
def place_order():

    data = request.json

    buyer_id = data["buyer_id"]
    items = data["items"]

    connection = get_db_connection()
    cursor = connection.cursor()

    order_query = """
    INSERT INTO orders (buyer_id, status, total_payment, created_at)
    VALUES (%s,'pending',%s,NOW())
    """

    cursor.execute(order_query, (
        buyer_id,
        data["total"]
    ))

    order_id = cursor.lastrowid

    for item in items:

        detail_query = """
        INSERT INTO order_details
        (order_id, product_id, price, quantity)
        VALUES (%s,%s,%s,%s)
        """

        cursor.execute(detail_query, (
            order_id,
            item["product_id"],
            item["price"],
            item["quantity"]
        ))

    connection.commit()
    connection.close()

    return jsonify({
        "message": "Order placed successfully",
        "order_id": order_id
    })

# order history

@buyer_routes.route("/orders/<int:buyer_id>", methods=["GET"])
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

# buyer leave a review

@buyer_routes.route("/review", methods=["POST"])
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