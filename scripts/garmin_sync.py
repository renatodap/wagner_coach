#!/usr/bin/env python3
"""
Garmin Connect sync script
Uses garminconnect Python library to fetch activities
"""

import json
import sys
import os
from datetime import datetime, timedelta
from garminconnect import Garmin, GarminConnectConnectionError, GarminConnectTooManyRequestsError, GarminConnectAuthenticationError
import argparse

def sync_garmin_activities(email, password, days_back=30):
    """
    Sync activities from Garmin Connect

    Args:
        email: Garmin Connect email
        password: Garmin Connect password
        days_back: Number of days to sync back

    Returns:
        Dict with synced activities and status
    """
    results = {
        "success": False,
        "activities": [],
        "error": None,
        "count": 0
    }

    try:
        # Initialize Garmin client
        garmin = Garmin(email, password)
        garmin.login()

        # Get activities from the specified date range
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days_back)

        # Fetch activities
        activities = garmin.get_activities_by_date(
            start_date.isoformat(),
            end_date.isoformat()
        )

        # Process each activity
        processed_activities = []
        for activity in activities:
            # Get detailed activity data
            activity_id = activity['activityId']

            try:
                # Get additional details if available
                detailed_activity = garmin.get_activity_evaluation(activity_id)
                activity.update(detailed_activity)
            except:
                pass  # Use basic activity data if details fail

            # Extract relevant fields for our database
            processed_activity = {
                'activityId': str(activity_id),
                'activityName': activity.get('activityName', ''),
                'activityType': activity.get('activityType', {}),
                'eventType': activity.get('eventType', {}),
                'startTimeLocal': activity.get('startTimeLocal'),
                'startTimeGMT': activity.get('startTimeGMT'),
                'duration': activity.get('duration', 0),
                'movingDuration': activity.get('movingDuration', 0),
                'elapsedDuration': activity.get('elapsedDuration', 0),
                'distance': activity.get('distance', 0),
                'averageSpeed': activity.get('averageSpeed', 0),
                'maxSpeed': activity.get('maxSpeed', 0),
                'averageHR': activity.get('averageHR'),
                'maxHR': activity.get('maxHR'),
                'minHR': activity.get('minHR'),
                'calories': activity.get('calories'),
                'elevationGain': activity.get('elevationGain'),
                'elevationLoss': activity.get('elevationLoss'),
                'maxElevation': activity.get('maxElevation'),
                'minElevation': activity.get('minElevation'),
                'averagePower': activity.get('averagePower'),
                'maxPower': activity.get('maxPower'),
                'normPower': activity.get('normPower'),
                'intensityFactor': activity.get('intensityFactor'),
                'trainingStressScore': activity.get('trainingStressScore'),
                'averageCadence': activity.get('averageRunningCadenceInStepsPerMinute') or activity.get('averageBikingCadenceInRevPerMinute'),
                'maxCadence': activity.get('maxRunningCadenceInStepsPerMinute') or activity.get('maxBikingCadenceInRevPerMinute'),
                'avgStrideLength': activity.get('avgStrideLength'),
                'avgVerticalOscillation': activity.get('avgVerticalOscillation'),
                'avgGroundContactTime': activity.get('avgGroundContactTime'),
                'avgGroundContactBalance': activity.get('avgGroundContactBalance'),
                'avgVerticalRatio': activity.get('avgVerticalRatio'),
                'trainingLoad': activity.get('trainingEffectLabel'),
                'aerobicTrainingEffect': activity.get('aerobicTrainingEffect'),
                'anaerobicTrainingEffect': activity.get('anaerobicTrainingEffect'),
                'vO2MaxValue': activity.get('vO2MaxValue'),
                'deviceName': activity.get('deviceName'),
                'location': {
                    'lat': activity.get('startLatitude'),
                    'lon': activity.get('startLongitude')
                },
                'weather': activity.get('weather'),
                'raw_data': activity  # Store complete data
            }

            processed_activities.append(processed_activity)

        results['success'] = True
        results['activities'] = processed_activities
        results['count'] = len(processed_activities)

    except GarminConnectAuthenticationError as e:
        results['error'] = f"Authentication failed: {str(e)}"
    except GarminConnectTooManyRequestsError as e:
        results['error'] = f"Too many requests: {str(e)}"
    except GarminConnectConnectionError as e:
        results['error'] = f"Connection error: {str(e)}"
    except Exception as e:
        results['error'] = f"Unexpected error: {str(e)}"

    return results

def main():
    parser = argparse.ArgumentParser(description='Sync activities from Garmin Connect')
    parser.add_argument('--email', required=True, help='Garmin Connect email')
    parser.add_argument('--password', required=True, help='Garmin Connect password')
    parser.add_argument('--days', type=int, default=30, help='Number of days to sync back')

    args = parser.parse_args()

    # Sync activities
    results = sync_garmin_activities(args.email, args.password, args.days)

    # Output as JSON
    print(json.dumps(results))

    # Exit with appropriate code
    sys.exit(0 if results['success'] else 1)

if __name__ == '__main__':
    main()