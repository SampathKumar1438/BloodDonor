# Blood Donor Application

A full-stack application to register blood donors and search for donors by blood group, District, or location.

## Project Structure

- `backend/`: Flask API backend
- `frontend/`: React frontend

## Deployment Guide

### Option 1: Deploy with Render Blueprint (Recommended)

1. Push your code to a GitHub repository
2. Sign up for [Render](https://render.com)
3. Click "New Blueprint Instance" on Render dashboard
4. Connect your GitHub repository
5. Render will automatically deploy both backend and frontend using the `render.yaml` configuration

### Option 2: Manual Deployment

#### Backend Deployment (Render Web Service)

1. Sign up for [Render](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Use the following settings:
   - **Environment**: Python 3.9
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && gunicorn app:app`
5. Add environment variables:
   - `DATABASE_URL`: For development, this can be your SQLite URI or you can upgrade to PostgreSQL
   - `FLASK_ENV`: Set to `production`
   - `PYTHON_VERSION`: Set to `3.9.0`

#### Frontend Deployment (Render Static Site)

1. In Render dashboard, create a new Static Site
2. Connect your GitHub repository
3. Use the following settings:
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`
4. Add environment variables:
   - `REACT_APP_API_URL`: Set to your backend API URL (e.g., `https://your-backend.onrender.com/api`)

### Option 3: Deploy Frontend on Netlify

1. Sign up for [Netlify](https://www.netlify.com/)
2. Create a new site from Git
3. Connect your GitHub repository
4. Use the following settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
5. Add environment variables:
   - `REACT_APP_API_URL`: Set to your backend API URL (e.g., `https://your-backend.onrender.com/api`)

## Running Locally

### Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## CI/CD Workflow

- **Backend**: Render automatically deploys when changes are pushed to the main branch
- **Frontend**: Render or Netlify automatically deploys when changes are pushed to the main branch

## Additional Notes

- For production, consider using a proper database instead of SQLite
- Add proper environment variable management for sensitive data
- Set up proper CORS configuration for security
