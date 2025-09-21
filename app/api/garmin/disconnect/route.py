import os
import json
from http.server import BaseHTTPRequestHandler
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

        # Delete connection from database
        try:
            data, count = supabase.from_('garmin_connections').delete().eq('user_id', user.id).execute()

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'message': 'Garmin account disconnected successfully'}).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Database error', 'details': str(e)}).encode())
            return
        return
