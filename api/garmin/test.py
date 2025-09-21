from http.server import BaseHTTPRequestHandler
import json
import os

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Test endpoint to verify API is working"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        response = {
            'status': 'ok',
            'message': 'Garmin API endpoint is working',
            'environment': {
                'has_garmin_email': bool(os.getenv('GARMIN_EMAIL')),
                'has_garmin_password': bool(os.getenv('GARMIN_PASSWORD')),
                'python_version': os.sys.version
            }
        }

        # Check if dependencies are installed
        try:
            import garminconnect
            response['dependencies'] = {
                'garminconnect': garminconnect.__version__ if hasattr(garminconnect, '__version__') else 'installed'
            }
        except ImportError:
            response['dependencies'] = {'garminconnect': 'not installed'}

        try:
            import cloudscraper
            response['dependencies']['cloudscraper'] = 'installed'
        except ImportError:
            response['dependencies']['cloudscraper'] = 'not installed'

        self.wfile.write(json.dumps(response).encode())

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()