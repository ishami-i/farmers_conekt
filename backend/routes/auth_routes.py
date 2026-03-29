from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
import bcrypt

from database.db import get_db_connection

auth_routes = Blueprint("auth_routes", __name__)

# registering user

@auth_routes.route("/register", methods=["POST"])
def register():

    data = request.json
    print("Received data:", data)  # Debug

    password = data["password"].encode("utf-8")
    hashed = bcrypt.hashpw(password, bcrypt.gensalt())

    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
    INSERT INTO users (full_name, email, password, role, phone_number)
    VALUES (%s,%s,%s,%s,%s)
    """

    # Ensure all fields are correct types
    name = data["name"]
    email = data["email"]
    role = data["role"]
    phone = data.get("phone")

    if not isinstance(name, str):
        name = str(name)
    if email is not None and not isinstance(email, str):
        email = str(email)
    if not isinstance(role, str):
        role = str(role)
    if phone is not None and not isinstance(phone, str):
        phone = str(phone)

    cursor.execute(query, (
        name,
        email,
        hashed,
        role,
        phone
    ))

    user_id = cursor.lastrowid

    # Create role-specific profile record
    role = data.get("role")
    district_id = data.get("district_id")

    if role == "farmer":
        profile_query = """
        INSERT INTO farmers (user_id, bio, district_id)
        VALUES (%s, %s, %s)
        """
        cursor.execute(profile_query, (user_id, data.get("bio", ""), district_id))
        farmer_id = cursor.lastrowid
    elif role == "buyer":
        profile_query = """
        INSERT INTO buyers (user_id, district_id)
        VALUES (%s, %s)
        """
        cursor.execute(profile_query, (user_id, district_id))
        buyer_id = cursor.lastrowid
    elif role == "transporter":
        profile_query = """
        INSERT INTO transporters (user_id, plate_number, capacity_kg)
        VALUES (%s, %s, %s)
        """
        cursor.execute(profile_query, (user_id, data.get("vehicle_type", ""), data.get("capacity", 0)))
        transporter_id = cursor.lastrowid

    connection.commit()
    connection.close()

    token = create_access_token(
        identity=str(user_id),
        additional_claims={
            "role": role
        }
    )

    return jsonify({
        "token": token,
        "message": "User registered",
        "user_id": user_id,
        "role": role,
        "farmer_id": locals().get("farmer_id"),
        "buyer_id": locals().get("buyer_id"),
        "transporter_id": locals().get("transporter_id"),
        "district_id": district_id,
    })

# login API

@auth_routes.route("/login", methods=["POST"])
def login():

    data = request.json

    connection = get_db_connection()
    cursor = connection.cursor()

    # Allow login via email or phone
    identifier = data.get("email") or data.get("phone")
    cursor.execute(
        "SELECT * FROM users WHERE email=%s OR phone_number=%s",
        (identifier, identifier)
    )

    user = cursor.fetchone()

    if not user:
        return jsonify({"error": "User not found"}), 401

    if not bcrypt.checkpw(
        data["password"].encode("utf-8"),
        user["password"].encode("utf-8")
    ):
        return jsonify({"error": "Invalid password"}), 401

    token = create_access_token(
        identity=str(user["user_id"]),
        additional_claims={
            "role": user["role"]
        }
    )

    # Include role-specific identifiers (farmer_id/buyer_id/transporter_id) and district_id
    farmer_id = None
    buyer_id = None
    transporter_id = None
    district_id = None

    if user["role"] == "farmer":
        cursor.execute("SELECT farmer_id, district_id FROM farmers WHERE user_id=%s", (user["user_id"],))
        farmer = cursor.fetchone()
        if farmer:
            farmer_id = farmer.get("farmer_id")
            district_id = farmer.get("district_id")

    if user["role"] == "buyer":
        cursor.execute("SELECT buyer_id, district_id FROM buyers WHERE user_id=%s", (user["user_id"],))
        buyer = cursor.fetchone()
        if buyer:
            buyer_id = buyer.get("buyer_id")
            district_id = buyer.get("district_id")

    if user["role"] == "transporter":
        cursor.execute("SELECT transporter_id FROM transporters WHERE user_id=%s", (user["user_id"],))
        transporter = cursor.fetchone()
        if transporter:
            transporter_id = transporter.get("transporter_id")

    return jsonify({
        "token": token,
        "role": user["role"],
        "user_id": user["user_id"],
        "farmer_id": farmer_id,
        "buyer_id": buyer_id,
        "transporter_id": transporter_id,
        "district_id": district_id,
    })

