import os
import json
from http.server import BaseHTTPRequestHandler
from datetime import date, timedelta
from garmy import AuthClient, APIClient
from cryptography.fernet import Fernet
from supabase import create_client, Client

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # Initialize Supabase client
        supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        supabase_key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        supabase: Client = create_client(supabase_url, supabase_key)

        # Get user from JWT
        auth_header = self.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            self.send_response(401)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Unauthorized'}).encode())
            return

        jwt = auth_header.split(' ')[1]
        try:
            user_response = supabase.auth.get_user(jwt)
            user = user_response.user
            if not user:
                raise Exception("User not found")
        except Exception as e:
            self.send_response(401)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Invalid token', 'details': str(e)}).encode())
            return

        # Get Garmin connection from database
        try:
            response = supabase.from_('garmin_connections').select('*').eq('user_id', user.id).single().execute()
            if not response.data:
                self.send_response(404)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Garmin connection not found'}).encode())
                return
            connection = response.data
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Database error', 'details': str(e)}).encode())
            return

        # Decrypt password
        encryption_key = os.environ.get("GARMIN_ENCRYPTION_KEY")
        if not encryption_key:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Encryption key not configured'}).encode())
            return

        f = Fernet(encryption_key.encode())
        decrypted_password = f.decrypt(connection['encrypted_garmin_password'].encode()).decode()

        # Sync data
        try:
            auth_client = AuthClient()
            auth_client.login(connection['garmin_email'], decrypted_password)
            api_client = APIClient(auth_client)

            today = date.today()
            yesterday = today - timedelta(days=1)

            # Fetch daily stats for yesterday
            daily_stats = api_client.get_daily_stats(yesterday.isoformat())

            # Store daily stats in a new table `garmin_daily_stats`
            supabase.from_('garmin_daily_stats').upsert({
                'user_id': user.id,
                'date': yesterday.isoformat(),
                'steps': daily_stats.get('dailySteps'),
                'calories': daily_stats.get('calories'),
                'distance_meters': daily_stats.get('distanceInMeters'),
                'sleep_seconds': daily_stats.get('sleepTimeInSeconds'),
                'hrv': daily_stats.get('hrv'), # Assuming garmy provides this
            }).execute()

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'message': 'Sync successful'}).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Sync failed', 'details': str(e)}).encode())
            return
        return
