import os
import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs
from garmy import AuthClient
from cryptography.fernet import Fernet
from supabase import create_client, Client

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)

        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Email and password are required'}).encode())
            return

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

        # Test Garmin connection
        try:
            auth_client = AuthClient()
            auth_client.login(email, password)
        except Exception as e:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Garmin connection failed', 'details': str(e)}).encode())
            return

        # Encrypt password
        encryption_key = os.environ.get("GARMIN_ENCRYPTION_KEY")
        if not encryption_key:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Encryption key not configured'}).encode())
            return

        f = Fernet(encryption_key.encode())
        encrypted_password = f.encrypt(password.encode()).decode()

        # Store connection in database
        try:
            data, count = supabase.from_('garmin_connections').upsert({
                'user_id': user.id,
                'garmin_email': email,
                'encrypted_garmin_password': encrypted_password,
                'connection_status': 'connected'
            }).execute()

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'message': 'Garmin account connected successfully'}).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Database error', 'details': str(e)}).encode())
            return
        return
