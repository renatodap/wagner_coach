#!/usr/bin/env python3
"""
Garmin Connect stats API endpoint using python-garminconnect
"""
from http.server import BaseHTTPRequestHandler
import json
import os
from datetime import date, timedelta
from garminconnect import Garmin, GarminConnectAuthenticationError, GarminConnectTooManyRequestsError

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        """Get daily Garmin stats for authenticated user"""
        try:
            # Parse request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            request_data = json.loads(body) if body else {}

            # Get credentials from request or environment
            email = request_data.get('email') or os.getenv('GARMIN_EMAIL')
            password = request_data.get('password') or os.getenv('GARMIN_PASSWORD')
            target_date = request_data.get('date', date.today().isoformat())

            if not email or not password:
                self.send_error(400, 'Missing Garmin credentials')
                return

            # Try to use saved session first
            api = None
            session_file = f"/tmp/garmin_session_{email.replace('@', '_at_')}.json"

            try:
                if os.path.exists(session_file):
                    with open(session_file, 'r') as f:
                        saved_session = json.load(f)
                    api = Garmin(session_data=saved_session)
                    api.login()
            except (GarminConnectAuthenticationError, Exception):
                # Session expired or invalid
                api = None

            # Create new session if needed
            if not api:
                api = Garmin(email, password)
                api.login()

                # Save session for future use
                with open(session_file, 'w') as f:
                    json.dump(api.session_data, f)

            # Get daily stats
            stats = api.get_stats(target_date)

            # Get additional data
            heart_rates = {}
            sleep_data = {}
            try:
                heart_rates = api.get_heart_rates(target_date)
            except:
                pass  # Heart rate data might not be available

            try:
                sleep_data = api.get_sleep_data(target_date)
            except:
                pass  # Sleep data might not be available

            # Format response
            response_data = {
                'date': target_date,
                'steps': stats.get('totalSteps', 0),
                'distance': stats.get('totalDistance', 0),
                'calories': stats.get('totalKilocalories', 0),
                'activeCalories': stats.get('activeKilocalories', 0),
                'floors': stats.get('floorsAscended', 0),
                'intensityMinutes': stats.get('intensityMinutesGoal', 0),
                'heartRate': {
                    'resting': heart_rates.get('restingHeartRate') if heart_rates else None,
                    'max': heart_rates.get('maxHeartRate') if heart_rates else None,
                    'average': heart_rates.get('averageHeartRate') if heart_rates else None
                },
                'sleep': {
                    'totalSleepTime': sleep_data.get('dailySleepDTO', {}).get('sleepTimeSeconds', 0) if sleep_data else 0,
                    'deepSleep': sleep_data.get('dailySleepDTO', {}).get('deepSleepSeconds', 0) if sleep_data else 0,
                    'lightSleep': sleep_data.get('dailySleepDTO', {}).get('lightSleepSeconds', 0) if sleep_data else 0,
                    'remSleep': sleep_data.get('dailySleepDTO', {}).get('remSleepSeconds', 0) if sleep_data else 0
                }
            }

            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())

        except GarminConnectAuthenticationError:
            self.send_error(401, 'Garmin authentication failed')
        except GarminConnectTooManyRequestsError:
            self.send_error(429, 'Too many requests to Garmin')
        except Exception as e:
            self.send_error(500, f'Server error: {str(e)}')

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()