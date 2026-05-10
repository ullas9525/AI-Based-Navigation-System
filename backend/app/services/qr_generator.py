import qrcode
import os
from flask import current_app

def generate_qr(building_name, building_id):
    """
    Generates a QR code linking to the visitor navigation interface for the given building.
    The URL includes ?start=Entrance so the frontend pre-populates the start location.
    Saves the QR image to the uploads folder.
    """
    # URL visitors hit when they scan the QR code.
    # 'start=Entrance' pre-fills the start node on the IndoorNavigation page.
    url = f"http://localhost:5173/visitor/navigate/{building_id}?start=Entrance"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    # Use building_id in filename to prevent collisions across buildings
    safe_name = building_name.replace(' ', '_').lower()
    filename = f"qr_{safe_name}_{building_id}.png"
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    img.save(filepath)

    print(f"QR code generated at: {filepath}  →  {url}")
    return filepath
