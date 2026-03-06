def log_user_in(credentials: dict, session: dict):
    """Placeholder logic to log a user in and update the session."""
    # Here, you would check the username and password against the database.
    if credentials['password'] == "test_password":
        # On successful login, store user info in the session.
        user_info = {'user_id': 1, 'email': credentials['email']}
        session['user'] = user_info
        return {"success": True, "message": "Login successful."}
    else:
        return {"success": False, "message": "Invalid credentials."}

def log_user_out(session: dict):
    """Logs a user out by clearing their session data."""
    if 'user' in session:
        session.pop('user', None)
        return {"success": True, "message": "Logout successful."}
    return {"success": False, "message": "No active session."}
