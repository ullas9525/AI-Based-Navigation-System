from flask import Blueprint, request, jsonify

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    # Mock authentication
    if email == 'admin@navsystem.com' and password == 'admin':
        return jsonify({
            "success": True,
            "token": "mock-jwt-token-7389",
            "user": {
                "name": "Admin User",
                "email": email
            }
        }), 200

    return jsonify({"success": False, "message": "Invalid credentials"}), 401
