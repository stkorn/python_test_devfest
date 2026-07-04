users_db = {
    "admin": {"password": "password", "is_admin": True},
    "user1": {"password": "password", "is_admin": False},
    "user2": {"password": "password", "is_admin": False},
    "user3": {"password": "password", "is_admin": False},
}

bookings_db = {} #schema: { booking_id: {"id": booking_id, "username": username, "start_time": start_time, "end_time": end_time} }
sessions_db = {} #schema: { token: username }
