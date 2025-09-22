#!/usr/bin/env python3
"""
Test Garmin Connect authentication
"""

import sys
import json
from garminconnect import Garmin
from datetime import datetime, timedelta

def test_garmin_connection(email, password):
    """Test Garmin connection and fetch recent activities"""

    print(f"Testing connection for: {email}")

    try:
        # Initialize Garmin client
        print("Initializing Garmin client...")
        garmin = Garmin(email, password)

        # Try to login
        print("Attempting login...")
        garmin.login()

        print("[SUCCESS] Login successful!")

        # Get user profile to verify connection
        print("Fetching user profile...")
        profile = garmin.get_user_profile()
        print(f"[SUCCESS] Connected as: {profile.get('displayName', 'Unknown')}")

        # Try to get recent activities
        print("Fetching recent activities...")
        activities = garmin.get_activities(0, 5)  # Get last 5 activities

        print(f"[SUCCESS] Found {len(activities)} recent activities:")
        for i, activity in enumerate(activities, 1):
            activity_name = activity.get('activityName', 'Unnamed')
            activity_type = activity.get('activityType', {}).get('typeKey', 'Unknown')
            start_time = activity.get('startTimeLocal', 'Unknown time')
            print(f"  {i}. {activity_name} ({activity_type}) - {start_time}")

        return True

    except Exception as e:
        print(f"[ERROR] Error: {str(e)}")
        print(f"Error type: {type(e).__name__}")

        # Provide helpful troubleshooting
        if "401" in str(e) or "Unauthorized" in str(e):
            print("\nTroubleshooting tips:")
            print("1. Verify your email and password are correct")
            print("2. Try logging in at https://connect.garmin.com to ensure your account is active")
            print("3. Check if you have 2FA enabled - you may need to use an app password")
            print("4. Your account might be temporarily locked due to too many attempts")
        elif "429" in str(e) or "Too Many Requests" in str(e):
            print("\nToo many requests. Please wait a few minutes and try again.")
        elif "CloudFlare" in str(e) or "cloudflare" in str(e).lower():
            print("\nCloudflare protection detected. The library should handle this automatically.")
            print("If it persists, try again in a few minutes.")

        return False

if __name__ == "__main__":
    # Get credentials from command line or environment
    if len(sys.argv) == 3:
        email = sys.argv[1]
        password = sys.argv[2]
    else:
        print("Usage: python test_garmin.py <email> <password>")
        print("Or set GARMIN_EMAIL and GARMIN_PASSWORD environment variables")

        import os
        email = os.getenv('GARMIN_EMAIL')
        password = os.getenv('GARMIN_PASSWORD')

        if not email or not password:
            print("No credentials provided")
            sys.exit(1)

    # Test the connection
    success = test_garmin_connection(email, password)
    sys.exit(0 if success else 1)