import os
import math
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)
CORS(app)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///blooddonor.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Import db and models after creating app
from db_instance import db
from models import User

# Initialize the database with the app
db.init_app(app)

# Initialize the database
db.init_app(app)

# Create tables if they don't exist
with app.app_context():
    db.create_all()

@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'email', 'phone', 'bloodGroup', 'city']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Check if user already exists
    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user:
        return jsonify({"error": "User with this email already exists"}), 409
    
    # Create new user
    new_user = User(
        name=data['name'],
        email=data['email'],
        phone=data['phone'],
        blood_group=data['bloodGroup'],
        city=data['city'],
        latitude=data.get('latitude'),
        longitude=data.get('longitude')
    )
    
    # Save to database
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"message": "User registered successfully", "user": new_user.to_dict()}), 201

@app.route('/api/donors', methods=['GET'])
def get_donors():
    blood_group = request.args.get('bloodGroup')
    city = request.args.get('city')
    
    # Base query
    query = User.query
    
    # Apply filters if provided
    if blood_group:
        query = query.filter(User.blood_group == blood_group)
    
    if city:
        query = query.filter(User.city == city)
    
    # Get all matching donors
    donors = query.all()
    
    return jsonify([donor.to_dict() for donor in donors])

@app.route('/api/donors/nearby', methods=['GET'])
def get_nearby_donors():
    blood_group = request.args.get('bloodGroup')
    latitude = request.args.get('latitude', type=float)
    longitude = request.args.get('longitude', type=float)
    radius = request.args.get('radius', default=10, type=int)  # Default 10km radius
    
    if not latitude or not longitude:
        return jsonify({"error": "Latitude and longitude are required"}), 400
    
    # Get all users
    query = User.query
    
    # Filter by blood group if provided
    if blood_group:
        query = query.filter(User.blood_group == blood_group)
    
    all_users = query.all()
    
    # Calculate distance for each user and filter by radius
    nearby_donors = []
    for user in all_users:
        if user.latitude and user.longitude:
            # Calculate distance using Haversine formula
            distance = calculate_distance(latitude, longitude, user.latitude, user.longitude)
            if distance <= radius:
                user_dict = user.to_dict()
                user_dict['distance'] = round(distance, 2)
                nearby_donors.append(user_dict)
    
    return jsonify(nearby_donors)

def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two points using Haversine formula
    Returns distance in kilometers
    """
    R = 6371  # Earth radius in km
    
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    
    a = (math.sin(dLat/2) * math.sin(dLat/2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dLon/2) * math.sin(dLon/2))
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance = R * c
    
    return distance

if __name__ == '__main__':
    app.run(debug=True, port=5000)
