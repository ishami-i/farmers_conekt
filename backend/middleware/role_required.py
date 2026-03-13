from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request


def role_required(role):

    def wrapper(fn):

        @wraps(fn)
        def decorator(*args, **kwargs):

            verify_jwt_in_request()

            claims = get_jwt()

            if claims["role"] != role:
                return jsonify({
                    "error": "Unauthorized access"
                }), 403

            return fn(*args, **kwargs)

        return decorator

    return wrapper