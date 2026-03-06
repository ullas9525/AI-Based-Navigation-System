from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import os

from app.api.auth import auth_bp
from app.api.blueprints import blueprints_bp
from app.api.navigation import navigation_bp

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    # Configuration
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(blueprints_bp, url_prefix='/api/blueprints')
    app.register_blueprint(navigation_bp, url_prefix='/api/navigation')

    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "healthy", "service": "AI Navigation Backend"}), 200

    @app.route('/uploads/<filename>')
    def serve_upload(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
