from flask import Blueprint, request, jsonify, current_app
from database.db import get_db_connection
from flask_jwt_extended import jwt_required
from middleware.role_required import role_required
import uuid
import os

farmer_routes = Blueprint("farmer_routes", __name__)

# farmer profile creation

@farmer_routes.route("/create-profile", methods=["POST"])
def create_farmer_profile():

    data = request.json

    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
    INSERT INTO farmers (user_id, district_id, bio)
    VALUES (%s, %s, %s)
    """

    cursor.execute(query, (
        data["user_id"],
        data.get("district_id"),
        data.get("bio")
    ))

    connection.commit()
    connection.close()

    return jsonify({"message": "Farmer profile created"})

# getting farmer profile

@farmer_routes.route("/profile/<int:user_id>",methods=["GET"])
@jwt_required()
@role_required("farmer")
def get_farmer_profile(user_id):

    connection = get_db_connection()
    cursor = connection.cursor()
    query = """
    SELECT f.*, u.full_name, u.phone_number, d.district_name
    FROM farmers f
    JOIN users u ON f.user_id = u.user_id
    LEFT JOIN districts d ON f.district_id = d.district_id
    WHERE f.user_id = %s
    """

    cursor.execute(query, (user_id,))
    farmer = cursor.fetchone()

    connection.close()

    return jsonify(farmer)

# update farmer profile

@farmer_routes.route("/profile/<int:user_id>", methods=["PUT"])
@jwt_required()
@role_required("farmer")
def update_farmer_profile(user_id):

    data = request.json or {}

    connection = get_db_connection()
    cursor = connection.cursor()

    # Update users table with full name and phone
    user_fields = []
    user_values = []
    if "full_name" in data:
        user_fields.append("full_name=%s")
        user_values.append(data["full_name"])
    if "phone_number" in data:
        user_fields.append("phone_number=%s")
        user_values.append(data["phone_number"])
    if user_fields:
        query = f"UPDATE users SET {', '.join(user_fields)} WHERE user_id = %s"
        cursor.execute(query, (*user_values, user_id))

    # Update farmers table with district and bio
    farmer_fields = []
    farmer_values = []

    # Accept either district_id or district name from frontend
    district_input = None
    if "district_id" in data and data.get("district_id"):
        district_input = data.get("district_id")
    elif "district" in data and data.get("district"):
        district_input = data.get("district")

    if district_input:
        # If district_input is a name, attempt to resolve it (or create it)
        if not str(district_input).isdigit():
            cursor.execute(
                "SELECT district_id FROM districts WHERE district_name = %s",
                (district_input,),
            )
            row = cursor.fetchone()
            if row:
                district_input = row["district_id"]
            else:
                cursor.execute(
                    "INSERT INTO districts (district_name) VALUES (%s)",
                    (district_input,),
                )
                district_input = cursor.lastrowid

        farmer_fields.append("district_id=%s")
        farmer_values.append(district_input)

    if "bio" in data:
        farmer_fields.append("bio=%s")
        farmer_values.append(data.get("bio"))

    if farmer_fields:
        query = f"UPDATE farmers SET {', '.join(farmer_fields)} WHERE user_id = %s"
        cursor.execute(query, (*farmer_values, user_id))

    connection.commit()
    connection.close()

    return jsonify({"message": "Profile updated"})

# farmer dsahboard stats

@farmer_routes.route("/dashboard/<int:farmer_id>", methods=["GET"])
@jwt_required()
@role_required("farmer")
def farmer_dashboard(farmer_id):

    connection = get_db_connection()
    cursor = connection.cursor()

    dashboard_query = """
    SELECT
        COUNT(DISTINCT p.product_id) AS total_products,
        IFNULL(SUM(od.quantity),0) AS total_sales,
        IFNULL(SUM(od.price * od.quantity),0) AS total_earnings
    FROM products p
    LEFT JOIN order_details od
        ON p.product_id = od.product_id
    WHERE p.farmer_id = %s
    """

    cursor.execute(dashboard_query, (farmer_id,))
    stats = cursor.fetchone()

    connection.close()

    return jsonify(stats)

# API to upload product

@farmer_routes.route("/upload", methods=["POST"])
@jwt_required()
@role_required("farmer")
def upload_product():

    data = request.form.to_dict()
    farmer_id = data.get("farmer_id")

    # Accept either a district_id or district name from the frontend
    district_input = data.get("district_id") or data.get("district")
    district_id = None
    if district_input:
        if str(district_input).isdigit():
            district_id = int(district_input)
        else:
            # Resolve district name to ID, create it if missing
            connection = get_db_connection()
            cursor = connection.cursor()
            cursor.execute(
                "SELECT district_id FROM districts WHERE district_name = %s",
                (district_input,),
            )
            row = cursor.fetchone()
            if row:
                district_id = row["district_id"]
            else:
                cursor.execute(
                    "INSERT INTO districts (district_name) VALUES (%s)",
                    (district_input,),
                )
                district_id = cursor.lastrowid
            connection.commit()
            connection.close()

    product_name = data.get("product_name")
    category = data.get("category")
    harvest_date = data.get("harvest_date") or None
    expiration_date = data.get("expiration_date") or None
    price = data.get("price")
    unit = data.get("unit")
    quantity = data.get("quantity")
    description = data.get("description")

    # Validate required fields
    missing = []
    if not farmer_id:
        missing.append('farmer_id')
    if not district_id:
        missing.append('district_id')
    if not product_name:
        missing.append('product_name')
    if not category:
        missing.append('category')
    if not price:
        missing.append('price')
    if not unit:
        missing.append('unit')
    if not quantity:
        missing.append('quantity')

    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    image = request.files.get("image")
    image_path = None

    if image:
        filename = str(uuid.uuid4()) + "_" + image.filename
        filepath = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
        image.save(filepath)

        image_path = f"/uploads/crop_images/{filename}"

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Validate farmer_id exists
        cursor.execute("SELECT COUNT(*) as count FROM farmers WHERE farmer_id = %s", (farmer_id,))
        farmer_count = cursor.fetchone()['count']
        if farmer_count == 0:
            connection.close()
            return jsonify({"error": "Invalid farmer_id: Farmer not found"}), 400

        # Validate district_id exists
        cursor.execute("SELECT COUNT(*) as count FROM districts WHERE district_id = %s", (district_id,))
        district_count = cursor.fetchone()['count']
        if district_count == 0:
            connection.close()
            return jsonify({"error": "Invalid district_id: District not found"}), 400

        query = """
        INSERT INTO products
        (farmer_id, district_id, product_name, product_category,
         harvest_date, expiration_date, status, price_per_unit,
         unit, quantity_available, description, image_url, created_at)
        VALUES (%s,%s,%s,%s,%s,%s,'available',%s,%s,%s,%s,%s,NOW())
        """

        cursor.execute(query, (
            farmer_id,
            district_id,
            product_name,
            category,
            harvest_date,
            expiration_date,
            float(price) if price else 0,
            unit,
            int(quantity) if quantity else 0,
            description,
            image_path
        ))

        connection.commit()
        product_id = cursor.lastrowid
        connection.close()

        return jsonify({
            "message": "Product uploaded successfully",
            "product_id": product_id
        })

    except Exception as e:
        if 'connection' in locals():
            connection.rollback()
            connection.close()
        return jsonify({"error": f"Failed to upload product: {str(e)}"}), 500

    return jsonify({
        "message": "Product uploaded successfully",
        "product_id": product_id
    })

# allowing farmer to view their product

@farmer_routes.route("/farmer/<int:farmer_id>", methods=["GET"])
@jwt_required()
@role_required("farmer")
def get_farmer_products(farmer_id):

    connection = get_db_connection()
    cursor = connection.cursor()

    # Include district name so frontend can show user-friendly location info
    # Coerce dates to yyyy-mm-dd string format to avoid JSON serialization mismatch
    query = """
    SELECT 
        p.product_id,
        p.farmer_id,
        p.district_id,
        p.product_name,
        p.product_category,
        DATE_FORMAT(p.harvest_date, '%%Y-%%m-%%d') AS harvest_date,
        DATE_FORMAT(p.expiration_date, '%%Y-%%m-%%d') AS expiration_date,
        p.status,
        p.price_per_unit,
        p.unit,
        p.quantity_available,
        p.description,
        p.image_url,
        p.created_at,
        p.updated_at,
        d.district_name
    FROM products p
    LEFT JOIN districts d ON p.district_id = d.district_id
    WHERE p.farmer_id = %s AND p.status = 'available' AND p.quantity_available > 0
    ORDER BY p.created_at DESC
    """

    cursor.execute(query, (farmer_id,))
    products = cursor.fetchall()

    connection.close()

    return jsonify(products)

# farmer can view orders that include their products
@farmer_routes.route("/orders/<int:farmer_id>", methods=["GET"])
@jwt_required()
@role_required("farmer")
def get_farmer_orders(farmer_id):

    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
    SELECT
        o.order_id,
        o.status AS order_status,
        o.payment_status,
        o.total_payment,
        o.created_at AS order_date,
        u.full_name AS buyer_name,
        d.pickup_location,
        d.dropoff_location,
        p.product_id,
        p.product_name,
        od.quantity,
        od.price
    FROM orders o
    JOIN buyers b ON o.buyer_id = b.buyer_id
    JOIN users u ON b.user_id = u.user_id
    JOIN order_details od ON o.order_id = od.order_id
    JOIN products p ON od.product_id = p.product_id
    LEFT JOIN deliveries d ON o.order_id = d.order_id
    WHERE p.farmer_id = %s
    ORDER BY o.created_at DESC
    """

    cursor.execute(query, (farmer_id,))
    rows = cursor.fetchall()

    connection.close()

    # Aggregate rows into orders with nested items
    orders = []
    order_map = {}
    for row in rows:
        oid = row["order_id"]
        if oid not in order_map:
            order_map[oid] = {
                "order_id": oid,
                "order_status": row.get("order_status"),
                "payment_status": row.get("payment_status"),
                "total_payment": row.get("total_payment"),
                "order_date": row.get("order_date"),
                "buyer_name": row.get("buyer_name"),
                "pickup_location": row.get("pickup_location"),
                "dropoff_location": row.get("dropoff_location"),
                "items": [],
            }
            orders.append(order_map[oid])

        order_map[oid]["items"].append({
            "product_id": row.get("product_id"),
            "product_name": row.get("product_name"),
            "quantity": row.get("quantity"),
            "price": row.get("price"),
        })

    return jsonify(orders)

# allow farmer to mark order as paid
@farmer_routes.route("/orders/<int:order_id>/mark-paid", methods=["PUT"])
@jwt_required()
@role_required("farmer")
def mark_order_paid(order_id):
    connection = get_db_connection()
    cursor = connection.cursor()

    # Ensure the order is associated with this farmer via any order detail
    farmer_id = request.args.get("farmer_id")
    if not farmer_id:
        return jsonify({"error": "Missing farmer_id"}), 400

    cursor.execute(
        """
        SELECT 1
        FROM order_details od
        JOIN products p ON od.product_id = p.product_id
        WHERE od.order_id = %s AND p.farmer_id = %s
        LIMIT 1
        """,
        (order_id, farmer_id),
    )
    found = cursor.fetchone()
    if not found:
        connection.close()
        return jsonify({"error": "Order not found or not associated with farmer"}), 404

    cursor.execute(
        "UPDATE orders SET payment_status = 'paid', status = 'completed' WHERE order_id = %s",
        (order_id,),
    )
    connection.commit()
    connection.close()

    return jsonify({"message": "Order marked as paid"})

# allowing farmer to update product

@farmer_routes.route("/update/<int:product_id>", methods=["PUT"])
@jwt_required()
@role_required("farmer")
def update_product(product_id):

    # Check if it's form data (for image uploads) or JSON
    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form.to_dict()
        image = request.files.get("image")
    else:
        data = request.get_json(force=True) or {}
        image = None

    connection = get_db_connection()
    cursor = connection.cursor()

    # Build update query dynamically
    update_fields = []
    update_values = []

    if "price" in data and data["price"] is not None:
        update_fields.append("price_per_unit=%s")
        update_values.append(float(data["price"]))
    if "quantity" in data and data["quantity"] is not None:
        update_fields.append("quantity_available=%s")
        update_values.append(int(data["quantity"]))
    if "description" in data:
        update_fields.append("description=%s")
        update_values.append(data["description"])
    if "harvest_date" in data:
        update_fields.append("harvest_date=%s")
        update_values.append(data["harvest_date"] or None)
    if "expiration_date" in data:
        update_fields.append("expiration_date=%s")
        update_values.append(data["expiration_date"] or None)

    # Handle image upload
    if image:
        filename = str(uuid.uuid4()) + "_" + image.filename
        filepath = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
        image.save(filepath)
        image_path = f"/uploads/crop_images/{filename}"
        update_fields.append("image_url=%s")
        update_values.append(image_path)

    if not update_fields:
        connection.close()
        return jsonify({"error": "No fields to update"}), 400

    query = f"""
    UPDATE products
    SET {', '.join(update_fields)}, updated_at=NOW()
    WHERE product_id=%s
    """

    update_values.append(product_id)

    cursor.execute(query, update_values)
    connection.commit()

    # Return updated record so frontend can re-render correctly
    cursor.execute(
        """
        SELECT 
            p.product_id,
            p.farmer_id,
            p.district_id,
            p.product_name,
            p.product_category,
            DATE_FORMAT(p.harvest_date, '%Y-%m-%d') AS harvest_date,
            DATE_FORMAT(p.expiration_date, '%Y-%m-%d') AS expiration_date,
            p.status,
            p.price_per_unit,
            p.unit,
            p.quantity_available,
            p.description,
            p.image_url,
            p.created_at,
            p.updated_at
        FROM products p
        WHERE p.product_id = %s
        """,
        (product_id,),
    )
    updated_product = cursor.fetchone()

    connection.close()

    return jsonify({"message": "Product updated", "product": updated_product})

# allowing farmer to delete their product

@farmer_routes.route("/delete/<int:product_id>", methods=["DELETE"])
@jwt_required()
@role_required("farmer")
def delete_product(product_id):

    connection = get_db_connection()
    cursor = connection.cursor()

    query = "DELETE FROM products WHERE product_id=%s"

    cursor.execute(query, (product_id,))

    connection.commit()
    connection.close()

    return jsonify({"message": "Product deleted"})

# farmer earnings

@farmer_routes.route("/earnings", methods=["GET"])
@jwt_required()
@role_required("farmer")
def get_farmer_earnings():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id parameter required"}), 400

    connection = get_db_connection()
    cursor = connection.cursor()

    # Get farmer_id from user_id
    cursor.execute("SELECT farmer_id FROM farmers WHERE user_id = %s", (user_id,))
    farmer_row = cursor.fetchone()
    if not farmer_row:
        connection.close()
        return jsonify({"error": "Farmer profile not found"}), 404

    farmer_id = farmer_row["farmer_id"]

    # Get earnings summary
    cursor.execute("""
        SELECT
            SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_earned,
            SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_earnings,
            COUNT(*) as total_orders
        FROM farmer_earnings
        WHERE farmer_id = %s
    """, (farmer_id,))
    summary = cursor.fetchone()

    # Get earnings history
    cursor.execute("""
        SELECT
            fe.earning_id,
            fe.amount,
            fe.status,
            fe.created_at,
            o.order_id,
            o.total_payment
        FROM farmer_earnings fe
        JOIN orders o ON fe.order_id = o.order_id
        WHERE fe.farmer_id = %s
        ORDER BY fe.created_at DESC
        LIMIT 50
    """, (farmer_id,))
    earnings_history = cursor.fetchall()

    connection.close()

    return jsonify({
        "summary": {
            "total_earned": summary["total_earned"] or 0,
            "pending_earnings": summary["pending_earnings"] or 0,
            "total_orders": summary["total_orders"] or 0
        },
        "earnings_history": earnings_history
    })