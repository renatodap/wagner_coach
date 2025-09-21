from http.server import BaseHTTPRequestHandler
import json
import os
import sys
from datetime import datetime, timedelta

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

            if not email or not password:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Missing Garmin credentials'}).encode())
                return

            if not user_id:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Missing userId'}).encode())
                return

            # Try to import and use garminconnect
            try:
                from garminconnect import Garmin
                import cloudscraper

                # Initialize Garmin API with cloudscraper to bypass Cloudflare
                api = None
                session_file = f"/tmp/garmin_session_{email.replace('@', '_at_')}.json"

                # Try to use saved session first (disabled for now due to auth issues)
                # Session reuse might be causing the 401 errors
                use_saved_session = False

                if use_saved_session and os.path.exists(session_file):
                    try:
                        with open(session_file, 'r') as f:
                            saved_session = json.load(f)
                        # Create new API instance with cloudscraper
                        scraper = cloudscraper.create_scraper()
                        api = Garmin(email, password, session_data=saved_session, session=scraper)
                        # Test if session is still valid
                        api.get_user_profile()
                    except Exception as e:
                        print(f"Saved session failed: {e}")
                        api = None
                        # Remove invalid session file
                        if os.path.exists(session_file):
                            os.remove(session_file)

                # Create new session if needed
                if not api:
                    # Use cloudscraper to handle Cloudflare protection
                    scraper = cloudscraper.create_scraper()
                    api = Garmin(email, password, session=scraper)
                    api.login()

                    # Save session for future use (disabled for now)
                    # Session saving might be causing issues
                    if use_saved_session:
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
                            activity_date = datetime.fromisoformat(start_time.split('.')[0])
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

            except ImportError as ie:
                # garminconnect not installed
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                error_msg = {
                    'error': 'Garmin Connect library not available. Please ensure dependencies are installed.',
                    'details': str(ie)
                }
                self.wfile.write(json.dumps(error_msg).encode())

            except Exception as ge:
                # Garmin-specific error
                error_name = type(ge).__name__
                error_msg = str(ge)

                # Log the full error for debugging
                print(f"Garmin error: {error_name}: {error_msg}")

                if 'GarthHTTPError' in error_name:
                    # This is a specific Garmin HTTP error
                    if '401' in error_msg or 'Unauthorized' in error_msg:
                        self.send_response(401)
                        self.send_header('Content-type', 'application/json')
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.end_headers()
                        self.wfile.write(json.dumps({
                            'error': 'Garmin authentication failed. This could be due to:',
                            'details': 'Invalid credentials, account locked, or Garmin requiring CAPTCHA. Try logging in to Garmin Connect website first.',
                            'raw_error': error_msg
                        }).encode())
                    elif '429' in error_msg or 'Too Many Requests' in error_msg:
                        self.send_response(429)
                        self.send_header('Content-type', 'application/json')
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.end_headers()
                        self.wfile.write(json.dumps({
                            'error': 'Too many requests to Garmin. Please try again in a few minutes.',
                            'details': error_msg
                        }).encode())
                    else:
                        # Other HTTP errors
                        self.send_response(400)
                        self.send_header('Content-type', 'application/json')
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.end_headers()
                        self.wfile.write(json.dumps({
                            'error': 'Garmin API error',
                            'details': error_msg,
                            'type': error_name
                        }).encode())
                elif 'Authentication' in error_name or 'authentication' in error_msg.lower():
                    self.send_response(401)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        'error': 'Garmin authentication failed. Please check your credentials.',
                        'details': error_msg
                    }).encode())
                elif 'TooManyRequests' in error_name or 'rate' in error_msg.lower():
                    self.send_response(429)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        'error': 'Too many requests to Garmin. Please try again later.',
                        'details': error_msg
                    }).encode())
                else:
                    raise  # Re-raise to outer exception handler

        except Exception as e:
            # Generic error handler with detailed message
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            error_response = {
                'error': f'Server error: {str(e)}',
                'type': type(e).__name__,
                'details': str(e)
            }

            # Add Python version info for debugging
            error_response['python_version'] = sys.version

            self.wfile.write(json.dumps(error_response).encode())

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()