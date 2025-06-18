import logging
import sys
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger('request_logger')

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

@app.route('/api/register', methods=['POST'])
def monitor_register():
    logger.info("Registration request received")
    
    # Log request details
    logger.info(f"Content-Type: {request.headers.get('Content-Type')}")
    
    try:
        data = request.get_json()
        logger.info(f"Registration data: {json.dumps(data, indent=2)}")
        
        # Log what fields are present in the request
        logger.info(f"Fields in request: {list(data.keys())}")
        
        # Return proper response
        return jsonify({
            "message": "User registered successfully", 
            "user": data
        }), 201
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Request Logger is running"})

if __name__ == '__main__':
    port = 5002
    logger.info(f"Starting request logger on port {port}...")
    app.run(debug=True, port=port)
