# Blood Donor Finder App

A full-stack application to connect blood donors with recipients. Built with React, Flask, and SQLite.

## Features

- User Registration with blood group and location
- Geolocation support to find nearby donors
- Search donors by blood group and city
- Search nearby donors based on geolocation
- Contact donors directly via phone or email

## Tech Stack

### Frontend
- React
- React Router for navigation
- Axios for API requests
- React Bootstrap for UI components
- Geolocation API

### Backend
- Python Flask
- SQLAlchemy ORM
- SQLite database
- Flask-CORS for cross-origin requests

## Project Structure

```
blooddonor/
│
├── backend/             # Flask backend
│   ├── app.py           # Main Flask application
│   ├── models.py        # Database models
│   ├── seed.py          # Database seeding script
│   └── requirements.txt # Python dependencies
│
└── frontend/            # React frontend
    ├── public/          # Static assets
    └── src/             # React source code
        ├── components/  # React components
        │   ├── Footer.js
        │   ├── Home.js
        │   ├── Navbar.js
        │   ├── Register.js
        │   └── Search.js
        ├── App.js
        └── index.js
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```
cd backend
```

2. Install dependencies:
```
pip install flask flask-cors flask-sqlalchemy sqlalchemy python-dotenv requests
```

3. Run the Flask server with fixed app:
```
python app_fixed.py
```

The server will start at http://localhost:5001 and automatically create and seed the database.

The backend server will start at http://localhost:5000

### Frontend Setup

1. Navigate to the frontend directory:
```
cd frontend
```

2. Install dependencies:
```
npm install
```

3. Start the development server:
```
npm start
```

The frontend will start at http://localhost:3000

## API Endpoints

### Register a new donor
- URL: `/api/register`
- Method: `POST`
- Body: 
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "123-456-7890",
  "bloodGroup": "A+",
  "city": "New York",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

### Search donors by blood group and city
- URL: `/api/donors`
- Method: `GET`
- Query Parameters:
  - `bloodGroup` (optional): Filter by blood group
  - `city` (optional): Filter by city

### Search nearby donors
- URL: `/api/donors/nearby`
- Method: `GET`
- Query Parameters:
  - `bloodGroup` (optional): Filter by blood group
  - `latitude` (required): User's latitude
  - `longitude` (required): User's longitude
  - `radius` (optional, default: 10): Search radius in kilometers

## License

This project is licensed under the MIT License.
