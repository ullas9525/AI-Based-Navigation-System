import math


def pixel_to_latlong(x_pixel, y_pixel, building_lat, building_lng,
                     blueprint_scale_meters=100):
    """
    Converts blueprint pixel coordinates (0–1000 scale) into real-world
    geographic coordinates (Latitude, Longitude).

    The building's Lat/Long is treated as the top-left anchor of the blueprint.

    Algorithm (step-by-step):
        1. Normalise pixel coords from 0–1000 to 0.0–1.0 (fractional position)
        2. Multiply by blueprint_scale_meters to get metric offsets from the anchor
        3. Convert metre offsets to degree offsets:
               Δlat = offset_y_m  / 111_320
               Δlng = offset_x_m  / (111_320 × cos(lat_rad))
        4. Add offsets to the anchor coordinate
           (x goes East  → +lng, y goes South → +lat for top-left anchor)

    Args:
        x_pixel (int|float): Horizontal pixel coordinate, 0 (left) → 1000 (right)
        y_pixel (int|float): Vertical pixel coordinate,   0 (top)  → 1000 (bottom)
        building_lat (float): Latitude of the building anchor (top-left corner)
        building_lng (float): Longitude of the building anchor (top-left corner)
        blueprint_scale_meters (float): Real-world distance the full blueprint
                                        width/height represents, in metres.
                                        Default = 100 m (a typical single-floor span).

    Returns:
        tuple: (latitude, longitude) as floats
    """
    if not building_lat or not building_lng:
        return building_lat or 0.0, building_lng or 0.0

    # Step 1 – normalise to 0.0–1.0 fraction
    x_frac = x_pixel / 1000.0
    y_frac = y_pixel / 1000.0

    # Step 2 – convert to metric offsets from the top-left anchor
    offset_x_m = x_frac * blueprint_scale_meters   # eastward  (+)
    offset_y_m = y_frac * blueprint_scale_meters    # southward (+)

    # Step 3 – convert metres to degree offsets
    lat_rad = math.radians(building_lat)
    delta_lat = offset_y_m / 111_320.0
    delta_lng = offset_x_m / (111_320.0 * math.cos(lat_rad))

    # Step 4 – apply to anchor
    result_lat = building_lat + delta_lat
    result_lng = building_lng + delta_lng

    return round(result_lat, 7), round(result_lng, 7)


def latlong_to_pixel(lat, lng, building_lat, building_lng,
                     blueprint_scale_meters=100):
    """
    Inverse of pixel_to_latlong.
    Converts a real-world Lat/Long back into blueprint pixel coordinates (0–1000).

    Useful for plotting a GPS position onto the blueprint map.

    Returns:
        tuple: (x_pixel, y_pixel) integers in 0–1000 range
    """
    if not building_lat or not building_lng:
        return 500, 500

    lat_rad = math.radians(building_lat)

    delta_lat = lat - building_lat
    delta_lng = lng - building_lng

    offset_y_m = delta_lat * 111_320.0
    offset_x_m = delta_lng * (111_320.0 * math.cos(lat_rad))

    x_frac = offset_x_m / blueprint_scale_meters
    y_frac = offset_y_m / blueprint_scale_meters

    x_pixel = int(max(0, min(1000, x_frac * 1000)))
    y_pixel = int(max(0, min(1000, y_frac * 1000)))

    return x_pixel, y_pixel
