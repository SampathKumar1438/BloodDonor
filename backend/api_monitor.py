from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import logging

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('api_monitor')
handler = logging.FileHandler('api_requests.log')
handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

@app.route('/api/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
        
    logger.info(f"Received register request with headers: {dict(request.headers)}")
    
    try:
        data = request.get_json()
        logger.info(f"Request body: {json.dumps(data, indent=2)}")
        
        # Validate required fields
        required_fields = ['name', 'email', 'phone', 'bloodGroup', 'city']
        for field in required_fields:
            if field not in data:
                logger.error(f"Missing required field: {field}")
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Simulate successful registration
        logger.info("Registration successful")
        return jsonify({
            "message": "User registered successfully",
            "user": {
                "id": 999,
                "name": data["name"],
                "email": data["email"],
                "phone": data["phone"],
                "blood_group": data["bloodGroup"],
                "city": data["city"],
                "latitude": data.get("latitude"),
                "longitude": data.get("longitude")
            }
        }), 201
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/donors', methods=['GET'])
def get_donors():
    logger.info(f"Received donors request: {dict(request.args)}")
    
    # Simulate successful response
    return jsonify([
        {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "123-456-7890",
            "blood_group": "A+",
            "city": "New York",
            "latitude": 40.7128,
            "longitude": -74.0060
        }
    ])

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "API Monitor is running"})

def _build_cors_preflight_response():
    response = jsonify({})
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response

if __name__ == '__main__':
    port = 5002
    print(f"Starting API monitor on port {port}...")
    app.run(debug=True, port=port)
