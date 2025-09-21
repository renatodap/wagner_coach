#!/usr/bin/env python3
"""
Sync Garmin activities with the database
"""
from http.server import BaseHTTPRequestHandler
import json
import os
from datetime import datetime, timedelta
from garminconnect import Garmin, GarminConnectAuthenticationError
import psycopg2
from psycopg2.extras import Json

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        """Sync Garmin activities to database"""
        try:
            # Parse request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            request_data = json.loads(body) if body else {}

            # Get credentials and parameters
            email = request_data.get('email') or os.getenv('GARMIN_EMAIL')
            password = request_data.get('password') or os.getenv('GARMIN_PASSWORD')
            user_id = request_data.get('userId')
            days_back = request_data.get('daysBack', 30)

            if not email or not password or not user_id:
                self.send_error(400, 'Missing required parameters')
                return

            # Initialize Garmin API
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

            # Get activities from the last N days
            activities = api.get_activities(0, days_back * 5)  # Estimate max 5 activities per day

            # Filter activities to requested date range
            cutoff_date = datetime.now() - timedelta(days=days_back)
            recent_activities = [
                a for a in activities
                if datetime.fromisoformat(a.get('startTimeLocal', '').replace('Z', '+00:00')) > cutoff_date
            ]

            # Connect to database
            database_url = os.getenv('DATABASE_URL')
            if not database_url:
                self.send_error(500, 'Database configuration missing')
                return

            conn = psycopg2.connect(database_url)
            cursor = conn.cursor()

            # Store Garmin connection info
            cursor.execute("""
                INSERT INTO garmin_connections (user_id, garmin_user_id, is_active, last_sync)
                VALUES (%s, %s, true, NOW())
                ON CONFLICT (user_id) DO UPDATE
                SET is_active = true, last_sync = NOW()
            """, (user_id, email))

            # Sync activities
            synced_count = 0
            for activity in recent_activities:
                activity_id = str(activity.get('activityId'))

                # Convert activity data to match strava_activities schema
                activity_data = {
                    'id': activity_id,
                    'user_id': user_id,
                    'name': activity.get('activityName'),
                    'activity_type': activity.get('activityType', {}).get('typeKey'),
                    'sport_type': activity.get('sportTypeDTO', {}).get('sportTypeKey'),
                    'start_date': activity.get('startTimeGMT'),
                    'start_date_local': activity.get('startTimeLocal'),
                    'duration_seconds': int(activity.get('duration', 0)),
                    'distance_meters': activity.get('distance', 0),
                    'elevation_gain': activity.get('elevationGain', 0),
                    'average_speed': activity.get('averageSpeed', 0),
                    'max_speed': activity.get('maxSpeed', 0),
                    'average_heartrate': activity.get('averageHR'),
                    'max_heartrate': activity.get('maxHR'),
                    'calories': activity.get('calories'),
                    'description': activity.get('description'),
                    'raw_data': Json(activity),
                    'source': 'garmin'
                }

                # Insert or update activity
                cursor.execute("""
                    INSERT INTO strava_activities (
                        id, user_id, name, activity_type, sport_type,
                        start_date, start_date_local, duration_seconds,
                        distance_meters, elevation_gain, average_speed,
                        max_speed, average_heartrate, max_heartrate,
                        calories, description, raw_data
                    ) VALUES (
                        %(id)s, %(user_id)s, %(name)s, %(activity_type)s, %(sport_type)s,
                        %(start_date)s, %(start_date_local)s, %(duration_seconds)s,
                        %(distance_meters)s, %(elevation_gain)s, %(average_speed)s,
                        %(max_speed)s, %(average_heartrate)s, %(max_heartrate)s,
                        %(calories)s, %(description)s, %(raw_data)s
                    )
                    ON CONFLICT (id) DO UPDATE
                    SET name = EXCLUDED.name,
                        raw_data = EXCLUDED.raw_data,
                        synced_at = NOW()
                """, activity_data)

                synced_count += 1

            conn.commit()
            cursor.close()
            conn.close()

            # Send response
            response_data = {
                'success': True,
                'activitiesSynced': synced_count,
                'totalActivities': len(recent_activities),
                'message': f'Successfully synced {synced_count} activities from Garmin'
            }

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())

        except GarminConnectAuthenticationError:
            self.send_error(401, 'Garmin authentication failed')
        except Exception as e:
            self.send_error(500, f'Server error: {str(e)}')

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()