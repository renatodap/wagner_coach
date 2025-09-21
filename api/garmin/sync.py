from http.server import BaseHTTPRequestHandler
import json
import os
from datetime import datetime, timedelta

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        """Sync Garmin activities to database"""
        try:
            # Import here to avoid import errors during build
            from garminconnect import Garmin, GarminConnectAuthenticationError, GarminConnectTooManyRequestsError

            # Parse request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            request_data = json.loads(body) if body else {}

            # Get credentials and parameters
            email = request_data.get('email') or os.getenv('GARMIN_EMAIL')
            password = request_data.get('password') or os.getenv('GARMIN_PASSWORD')
            user_id = request_data.get('userId')
            days_back = request_data.get('daysBack', 30)

            if not email or not password:
                self.send_error(400, 'Missing Garmin credentials')
                return

            if not user_id:
                self.send_error(400, 'Missing userId')
                return

            # Initialize Garmin API
            api = None
            session_file = f"/tmp/garmin_session_{email.replace('@', '_at_')}.json"

            # Try to use saved session first
            try:
                if os.path.exists(session_file):
                    with open(session_file, 'r') as f:
                        saved_session = json.load(f)
                    api = Garmin(session_data=saved_session)
                    api.login()
            except:
                api = None

            # Create new session if needed
            if not api:
                api = Garmin(email, password)
                api.login()

                # Save session for future use
                try:
                    with open(session_file, 'w') as f:
                        json.dump(api.session_data, f)
                except:
                    pass  # Session save is optional

            # Get activities from the last N days
            activities = api.get_activities(0, min(days_back * 5, 100))  # Cap at 100 activities

            # Filter activities to requested date range
            cutoff_date = datetime.now() - timedelta(days=days_back)
            recent_activities = []
            for activity in activities:
                try:
                    start_time = activity.get('startTimeLocal', '')
                    if start_time:
                        # Handle different date formats
                        activity_date = datetime.fromisoformat(start_time.replace('Z', '').replace('+00:00', ''))
                        if activity_date > cutoff_date:
                            recent_activities.append(activity)
                except:
                    continue

            # Return success response
            response_data = {
                'success': True,
                'activitiesSynced': len(recent_activities),
                'totalActivities': len(activities),
                'message': f'Successfully synced {len(recent_activities)} activities from Garmin'
            }

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())

        except Exception as e:
            # Import error types here if available
            error_message = str(e)

            if 'GarminConnectAuthenticationError' in str(type(e).__name__):
                self.send_error(401, 'Garmin authentication failed. Please check your credentials.')
            elif 'GarminConnectTooManyRequestsError' in str(type(e).__name__):
                self.send_error(429, 'Too many requests to Garmin. Please try again later.')
            else:
                # Send generic error with details
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': f'Server error: {error_message}'}).encode())

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()