from flask import Blueprint, request, jsonify
import os
from werkzeug.utils import secure_filename
from app.database import get_db_connection

media_bp = Blueprint('media', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'mp4', 'webm'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@media_bp.route('/node/<int:building_id>/<node_key>', methods=['POST'])
def upload_node_media(building_id, node_key):
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        ext = filename.rsplit('.', 1)[1].lower()
        media_type = "video" if ext in ['mp4', 'webm'] else "photo"

        # Save to uploads directory
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        uploads_dir = os.path.join(base_dir, 'uploads', 'media')
        os.makedirs(uploads_dir, exist_ok=True)

        # Save file with unique name
        save_name = f"building_{building_id}_node_{node_key}.{ext}"
        filepath = os.path.join(uploads_dir, save_name)
        file.save(filepath)

        media_url = f"/uploads/media/{save_name}"

        # Update database
        conn = get_db_connection()

        # Check if node exists
        node = conn.execute('SELECT id FROM nodes WHERE building_id = %s AND node_key = %s', (building_id, node_key)).fetchone()
        if not node:
            conn.close()
            # Clean up the file if node doesn't exist
            os.remove(filepath)
            return jsonify({"error": "Node not found for this building"}), 404

        conn.execute(
            'UPDATE nodes SET media_path = %s, media_type = %s WHERE building_id = %s AND node_key = %s',
            (media_url, media_type, building_id, node_key)
        )
        conn.commit()
        conn.close()

        return jsonify({
            "message": "Media uploaded successfully",
            "media_path": media_url,
            "media_type": media_type
        }), 200

    return jsonify({"error": "Invalid file type. Allowed types are png, jpg, jpeg, mp4, webm"}), 400
