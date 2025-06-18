import os
import math
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)
CORS(app)

# Database configuration
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(basedir, "blooddonor.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Create db instance
db = SQLAlchemy(app)

# Define the User model
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False, unique=True)
    phone = db.Column(db.String(20), nullable=False)
    blood_group = db.Column(db.String(10), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    
    def __init__(self, name, email, phone, blood_group, city, latitude=None, longitude=None):
        self.name = name
        self.email = email
        self.phone = phone
        self.blood_group = blood_group
        self.city = city
        self.latitude = latitude
        self.longitude = longitude
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'blood_group': self.blood_group,
            'city': self.city,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'created_at': str(self.created_at) if self.created_at else None
        }

# Create tables
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
