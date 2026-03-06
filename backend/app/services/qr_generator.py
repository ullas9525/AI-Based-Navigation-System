import qrcode
import os
from flask import current_app

def generate_qr(building_name, building_id):
    """
    Generates a QR code linking to the visitor navigation interface for the given building.
    Saves it to the uploads folder.
    """
    # The URL visitors will hit to start navigating
    url = f"http://localhost:5173/visitor/navigate/{building_id}"
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    filename = f"qr_{building_name.replace(' ', '_').lower()}.png"
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    img.save(filepath)
    
    print(f"QR code generated at: {filepath}")
    return filepath
