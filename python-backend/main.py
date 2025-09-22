"""
Garmin Sync Backend Service
FastAPI backend for handling Garmin Connect integration
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from garminconnect import Garmin
from datetime import datetime, timedelta
import os
import json
from typing import List, Dict, Any, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Wagner Coach Garmin Backend")

# Configure CORS - Update with your actual frontend URL
origins = [
    "http://localhost:3000",
    "https://sharpened.me",
    "https://www.sharpened.me",
    "https://*.vercel.app",  # Allow Vercel preview deployments
    os.getenv("FRONTEND_URL", "https://sharpened.me")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GarminCredentials(BaseModel):
    email: str
    password: str

class SyncRequest(BaseModel):
    email: str
    password: str
    days_back: int = 30

class Activity(BaseModel):
    activityId: str
    activityName: str
    activityType: Dict[str, Any]
    startTimeLocal: str
    duration: float
    distance: Optional[float]
    averageSpeed: Optional[float]
    averageHR: Optional[int]
    calories: Optional[int]

@app.get("/")
async def root():
    return {"status": "healthy", "service": "Wagner Coach Garmin Backend"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/garmin/test")
async def test_connection(credentials: GarminCredentials):
    """Test Garmin Connect credentials"""
    try:
        logger.info(f"Testing connection for {credentials.email}")

        # Initialize and login
        garmin = Garmin(credentials.email, credentials.password)
        garmin.login()

        # Get user profile to verify connection
        profile = garmin.get_user_profile()

        return {
            "success": True,
            "message": "Successfully connected to Garmin Connect",
            "profile": {
                "displayName": profile.get("displayName", "Unknown"),
                "email": credentials.email
            }
        }
    except Exception as e:
        logger.error(f"Connection test failed: {str(e)}")

        if "401" in str(e) or "Unauthorized" in str(e):
            raise HTTPException(status_code=401, detail="Invalid Garmin credentials")
        elif "429" in str(e):
            raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
        else:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/garmin/sync")
async def sync_activities(request: SyncRequest):
    """Sync activities from Garmin Connect"""
    try:
        logger.info(f"Starting sync for {request.email}")

        # Login to Garmin
        garmin = Garmin(request.email, request.password)
        garmin.login()

        # Calculate date range
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=request.days_back)

        logger.info(f"Fetching activities from {start_date} to {end_date}")

        # Get activities
        activities = garmin.get_activities_by_date(
            start_date.isoformat(),
            end_date.isoformat()
        )

        # Process activities
        processed_activities = []
        for activity in activities:
            try:
                processed = {
                    'activityId': str(activity.get('activityId', '')),
                    'activityName': activity.get('activityName', 'Unnamed Activity'),
                    'activityType': activity.get('activityType', {}),
                    'eventType': activity.get('eventType', {}),
                    'startTimeLocal': activity.get('startTimeLocal'),
                    'startTimeGMT': activity.get('startTimeGMT'),
                    'duration': activity.get('duration', 0),
                    'elapsedDuration': activity.get('elapsedDuration', 0),
                    'movingDuration': activity.get('movingDuration', 0),
                    'distance': activity.get('distance', 0),
                    'averageSpeed': activity.get('averageSpeed', 0),
                    'maxSpeed': activity.get('maxSpeed', 0),
                    'averageHR': activity.get('averageHR'),
                    'maxHR': activity.get('maxHR'),
                    'calories': activity.get('calories'),
                    'elevationGain': activity.get('elevationGain'),
                    'elevationLoss': activity.get('elevationLoss'),
                    'averagePower': activity.get('averagePower'),
                    'maxPower': activity.get('maxPower'),
                    'averageCadence': activity.get('averageRunningCadenceInStepsPerMinute') or activity.get('averageBikingCadenceInRevPerMinute'),
                    'deviceName': activity.get('deviceName')
                }
                processed_activities.append(processed)
            except Exception as e:
                logger.error(f"Error processing activity: {e}")
                continue

        logger.info(f"Successfully fetched {len(processed_activities)} activities")

        return {
            "success": True,
            "activities": processed_activities,
            "count": len(processed_activities),
            "dateRange": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            }
        }

    except Exception as e:
        logger.error(f"Sync failed: {str(e)}")

        if "401" in str(e) or "Unauthorized" in str(e):
            raise HTTPException(status_code=401, detail="Invalid Garmin credentials")
        elif "429" in str(e):
            raise HTTPException(status_code=429, detail="Rate limited. Please try again later.")
        else:
            raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")

@app.post("/api/garmin/activity/{activity_id}")
async def get_activity_details(activity_id: str, credentials: GarminCredentials):
    """Get detailed information for a specific activity"""
    try:
        logger.info(f"Fetching details for activity {activity_id}")

        # Login to Garmin
        garmin = Garmin(credentials.email, credentials.password)
        garmin.login()

        # Get activity details
        activity = garmin.get_activity_evaluation(activity_id)

        # Get splits if available
        splits = None
        try:
            splits = garmin.get_activity_splits(activity_id)
        except:
            pass

        return {
            "success": True,
            "activity": activity,
            "splits": splits
        }

    except Exception as e:
        logger.error(f"Failed to get activity details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)