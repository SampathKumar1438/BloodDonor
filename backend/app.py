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

# Initialize DB
db = SQLAlchemy(app)

# Models
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False, unique=True)
    phone = db.Column(db.String(20), nullable=False)
    blood_group = db.Column(db.String(10), nullable=False)
    District = db.Column(db.String(100), nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    def __init__(self, name, email, phone, blood_group, District, latitude=None, longitude=None):
        self.name = name
        self.email = email
        self.phone = phone
        self.blood_group = blood_group
        self.District = District
        self.latitude = latitude
        self.longitude = longitude

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'blood_group': self.blood_group,
            'District': self.District,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# Ensure tables are created
with app.app_context():
    db.create_all()

    # Insert seed data if empty
    if User.query.count() == 0:
        seed_users = [
            User("John Doe", "john@example.com", "123-456-7890", "A+", "New York", 40.7128, -74.0060),
            User("Jane Smith", "jane@example.com", "987-654-3210", "O-", "Los Angeles", 34.0522, -118.2437),
            User("Mike Johnson", "mike@example.com", "555-123-4567", "B+", "Chicago", 41.8781, -87.6298),
            User("Sarah Wilson", "sarah@example.com", "555-987-6543", "AB+", "New York", 40.7308, -73.9975),
            User("David Brown", "david@example.com", "555-789-0123", "A+", "Chicago", 41.8840, -87.6532),
        ]
        db.session.bulk_save_objects(seed_users)
        db.session.commit()
        print("Sample users added.")

# Routes

@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.get_json()
    print(f"[REGISTER] Received: {data}")
    
    required = ['name', 'email', 'phone', 'bloodGroup', 'District', 'latitude', 'longitude']
    for field in required:
        if field in ['latitude', 'longitude']:
            if field not in data or data.get(field) is None:
                return jsonify({'error': f"Location coordinates are required. Please use the 'Get My Location' button."}), 400
        elif field == 'District':
            # District is sent from frontend but might be empty if detection failed
            if field not in data:
                return jsonify({'error': f"Missing required field: {field}"}), 400
            # If District is empty, we'll use a default value
            if not data.get(field):
                data['District'] = "Unknown"
        elif not data.get(field):
            return jsonify({'error': f"Missing required field: {field}"}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': "Email already registered"}), 409

    user = User(
        name=data['name'],
        email=data['email'],
        phone=data['phone'],
        blood_group=data['bloodGroup'],
        District=data['District'],
        latitude=data.get('latitude'),
        longitude=data.get('longitude')
    )

    try:
        db.session.add(user)
        db.session.commit()
        return jsonify({'message': "User registered", 'user': user.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Registration failed: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/donors', methods=['GET'])
def get_donors():
    blood_group = request.args.get('bloodGroup')
    District = request.args.get('District')

    query = User.query
    if blood_group:
        query = query.filter(User.blood_group == blood_group)
    if District:
        query = query.filter(User.District.ilike(District))  # Case-insensitive match

    donors = query.all()
    return jsonify([user.to_dict() for user in donors]), 200

@app.route('/api/donors/nearby', methods=['GET'])
def get_nearby_donors():
    blood_group = request.args.get('bloodGroup')
    latitude = request.args.get('latitude', type=float)
    longitude = request.args.get('longitude', type=float)
    radius = request.args.get('radius', type=float, default=10)

    if latitude is None or longitude is None:
        return jsonify({'error': 'Latitude and longitude are required'}), 400

    query = User.query
    if blood_group:
        query = query.filter(User.blood_group == blood_group)

    nearby = []
    for user in query.all():
        if user.latitude is not None and user.longitude is not None:
            dist = calculate_distance(latitude, longitude, user.latitude, user.longitude)
            if dist <= radius:
                data = user.to_dict()
                data['distance'] = round(dist, 2)
                nearby.append(data)

    return jsonify(nearby), 200

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = (math.sin(dLat/2)**2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dLon/2)**2)
    return R * (2 * math.atan2(math.sqrt(a), math.sqrt(1-a)))

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'}), 200

@app.route('/', methods=['GET'])
def root():
    return jsonify({'message': 'Blood Donor API Root'}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV', 'development') == 'development'
    print(f"Server running on http://localhost:{port}")
    app.run(debug=debug, host='0.0.0.0', port=port)
