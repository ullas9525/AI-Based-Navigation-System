from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import os

from app.api.auth import auth_bp
from app.api.blueprints import blueprints_bp
from app.api.navigation import navigation_bp
from app.api.media import media_bp

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    # Configuration
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Initialize Database
    from app.database import init_db
    init_db()
    
    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(blueprints_bp, url_prefix='/api/blueprints')
    app.register_blueprint(navigation_bp, url_prefix='/api/navigation')
    app.register_blueprint(media_bp, url_prefix='/api/media')

    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "healthy", "service": "AI Navigation Backend"}), 200

    @app.route('/uploads/<filename>')
    def serve_upload(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    @app.route('/uploads/media/<filename>')
    def serve_media_upload(filename):
        media_folder = os.path.join(app.config['UPLOAD_FOLDER'], 'media')
        return send_from_directory(media_folder, filename)

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
