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
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# Database configuration
basedir = os.path.abspath(os.path.dirname(__file__))
database_url = os.environ.get('DATABASE_URL', f'sqlite:///{os.path.join(basedir, "blood_donor.db")}')
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
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
    
    # Check if we have sample data
    if User.query.count() == 0:
        # Add sample data
        sample_users = [
            User("John Doe", "john@example.com", "123-456-7890", "A+", "New York", 40.7128, -74.0060),
            User("Jane Smith", "jane@example.com", "987-654-3210", "O-", "Los Angeles", 34.0522, -118.2437),
            User("Mike Johnson", "mike@example.com", "555-123-4567", "B+", "Chicago", 41.8781, -87.6298),
            User("Sarah Wilson", "sarah@example.com", "555-987-6543", "AB+", "New York", 40.7308, -73.9975),
            User("David Brown", "david@example.com", "555-789-0123", "A+", "Chicago", 41.8840, -87.6532),
        ]
        for user in sample_users:
            db.session.add(user)
        db.session.commit()
        print(f"Added {len(sample_users)} sample users")

@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.get_json()
    
    # Print the received data for debugging
    print(f"Received registration data: {data}")
    
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
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "User registered successfully", "user": new_user.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error during registration: {str(e)}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@app.route('/api/donors', methods=['GET'])
def get_donors():
    blood_group = request.args.get('bloodGroup')
    city = request.args.get('city')
    
    print(f"Search params: bloodGroup={blood_group}, city={city}")
    
    # Base query
    query = User.query
    
    # Apply filters if provided
    if blood_group:
        query = query.filter(User.blood_group == blood_group)
    
    if city:
        query = query.filter(User.city == city)
    
    # Get all matching donors
    donors = query.all()
    result = [donor.to_dict() for donor in donors]
    
    print(f"Found {len(result)} donors")
    
    return jsonify(result)

@app.route('/api/donors/nearby', methods=['GET'])
def get_nearby_donors():
    blood_group = request.args.get('bloodGroup')
    latitude = request.args.get('latitude', type=float)
    longitude = request.args.get('longitude', type=float)
    radius = request.args.get('radius', default=10, type=int)  # Default 10km radius
    
    print(f"Nearby search: bloodGroup={blood_group}, lat={latitude}, lon={longitude}, radius={radius}")
    
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
    
    print(f"Found {len(nearby_donors)} nearby donors")
    
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

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Blood Donor API is running"})

# Add a root route for simple health check
@app.route('/', methods=['GET'])
def root():
    return jsonify({"message": "Blood Donor API root. Use /api endpoints for functionality."})

if __name__ == '__main__':
    # Use a different port to avoid conflicts in development
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV', 'development') == 'development'
    print(f"Starting server on port {port}...")
    app.run(debug=debug, host='0.0.0.0', port=port)
