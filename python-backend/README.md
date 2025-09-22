# Wagner Coach Garmin Backend

Python backend service for handling Garmin Connect integration for the Wagner Coach fitness app.

## Features

- Secure Garmin Connect authentication
- Activity syncing from Garmin
- CORS support for frontend integration
- RESTful API endpoints

## Local Development

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## Deployment Options

### Option 1: Railway (Recommended)

1. Create account at [railway.app](https://railway.app)
2. Install Railway CLI: `npm i -g @railway/cli`
3. Deploy:
```bash
railway login
railway link
railway up
```

### Option 2: Render

1. Create account at [render.com](https://render.com)
2. Connect your GitHub repository
3. Create a new Web Service
4. Select this `python-backend` directory
5. Render will auto-detect the configuration

### Option 3: Fly.io

1. Install Fly CLI: https://fly.io/docs/getting-started/installing-flyctl/
2. Deploy:
```bash
fly launch
fly deploy
```

### Option 4: Heroku

1. Create a `Procfile`:
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

2. Deploy:
```bash
heroku create wagner-coach-garmin
git push heroku main
```

## Environment Variables

Set these in your deployment platform:

- `FRONTEND_URL`: Your frontend URL (e.g., https://sharpened.me)
- `PORT`: Port to run on (usually auto-set by platform)

## API Endpoints

- `GET /` - Health check
- `POST /api/garmin/test` - Test Garmin credentials
- `POST /api/garmin/sync` - Sync activities from Garmin
- `POST /api/garmin/activity/{id}` - Get specific activity details

## Frontend Integration

Update your frontend to use the deployed backend URL:

```javascript
const GARMIN_BACKEND_URL = process.env.NEXT_PUBLIC_GARMIN_BACKEND_URL || 'http://localhost:8000';

// Example: Test connection
const response = await fetch(`${GARMIN_BACKEND_URL}/api/garmin/test`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
```

## Security Notes

- Never store Garmin credentials permanently
- Use HTTPS in production
- Implement rate limiting for production use
- Consider adding authentication between frontend and backend