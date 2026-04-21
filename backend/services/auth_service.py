from models import SessionLocal
from models.user import User


def log_user_in(credentials: dict, session: dict):
    """Placeholder logic to log a user in and update the session."""
    db = SessionLocal() 
    try:
        if credentials.get('password') == "test_password":
            user_info = {'user_id': 1, 'email': credentials['email']}
            session['user'] = user_info
            return {"success": True, "message": "Login successful."}
        return {"success": False, "message": "Invalid credentials."}
    finally:
        db.close()

def log_user_out(session: dict):
    """Logs a user out by clearing their session data."""
    if 'user' in session:
        session.pop('user', None)
        return {"success": True, "message": "Logout successful."}
    return {"success": False, "message": "No active session."}

