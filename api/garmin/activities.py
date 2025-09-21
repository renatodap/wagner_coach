#!/usr/bin/env python3
"""
Garmin Connect activities API endpoint
"""
from http.server import BaseHTTPRequestHandler
import json
import os
from datetime import datetime
from garminconnect import Garmin, GarminConnectAuthenticationError, GarminConnectTooManyRequestsError

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        """Get recent Garmin activities"""
        try:
            # Parse request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            request_data = json.loads(body) if body else {}

            # Get credentials and parameters
            email = request_data.get('email') or os.getenv('GARMIN_EMAIL')
            password = request_data.get('password') or os.getenv('GARMIN_PASSWORD')
            limit = request_data.get('limit', 20)
            offset = request_data.get('offset', 0)

            if not email or not password:
                self.send_error(400, 'Missing Garmin credentials')
                return

            # Initialize Garmin API with session management
            api = None
            session_file = f"/tmp/garmin_session_{email.replace('@', '_at_')}.json"

            try:
                if os.path.exists(session_file):
                    with open(session_file, 'r') as f:
                        saved_session = json.load(f)
                    api = Garmin(session_data=saved_session)
                    api.login()
            except:
                api = None

            if not api:
                api = Garmin(email, password)
                api.login()
                with open(session_file, 'w') as f:
                    json.dump(api.session_data, f)

            # Get activities
            activities = api.get_activities(offset, limit)

            # Format activities for response
            formatted_activities = []
            for activity in activities:
                formatted_activity = {
                    'id': activity.get('activityId'),
                    'name': activity.get('activityName'),
                    'type': activity.get('activityType', {}).get('typeKey'),
                    'sport': activity.get('sportTypeDTO', {}).get('sportTypeKey'),
                    'startTime': activity.get('startTimeLocal'),
                    'duration': activity.get('duration', 0),
                    'distance': activity.get('distance', 0),
                    'calories': activity.get('calories', 0),
                    'averageHeartRate': activity.get('averageHR'),
                    'maxHeartRate': activity.get('maxHR'),
                    'elevationGain': activity.get('elevationGain', 0),
                    'averageSpeed': activity.get('averageSpeed', 0),
                    'maxSpeed': activity.get('maxSpeed', 0),
                    'steps': activity.get('steps', 0),
                    'aerobicTrainingEffect': activity.get('aerobicTrainingEffect'),
                    'anaerobicTrainingEffect': activity.get('anaerobicTrainingEffect')
                }
                formatted_activities.append(formatted_activity)

            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            self.wfile.write(json.dumps({'activities': formatted_activities}).encode())

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