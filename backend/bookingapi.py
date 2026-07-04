import uuid
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.staticfiles import StaticFiles
from database.db import users_db, bookings_db, sessions_db
from database.models import LoginRequest, BookingCreate, BookingResponse, TokenResponse

app = FastAPI()

def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.split(" ")[1]
    username = sessions_db.get(token)
    
    if not username:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
        
    return username

def checkAvailable(start_time: str, end_time: str, booking_id: Optional[str] = None):
    if start_time >= end_time:
        raise HTTPException(status_code=400, detail="Start time must be before end time")

    for b in bookings_db.values():
        if booking_id and b["id"] == booking_id:
            continue
        if start_time < b["end_time"] and b["start_time"] < end_time:
            raise HTTPException(status_code=400, detail="Not available")

#LOGIN
@app.post("/api/login", response_model=TokenResponse)
def login(req: LoginRequest):
    user = users_db.get(req.username)
    if not user or user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    token = str(uuid.uuid4())
    sessions_db[token] = req.username
    return {"token": token, "is_admin": user["is_admin"]}

#GET
@app.get("/api/bookings", response_model=List[BookingResponse])
def get_bookings(username: str = Depends(get_current_user)):
    user_info = users_db[username]
    if user_info["is_admin"]:
        return list(bookings_db.values())
    else:
        return [b for b in bookings_db.values() if b["username"] == username]

#POST
@app.post("/api/bookings", response_model=BookingResponse)
def create_booking(req: BookingCreate, username: str = Depends(get_current_user)):
    checkAvailable(req.start_time, req.end_time)
            
    booking_id = str(uuid.uuid4())
    booking = {
        "id": booking_id,
        "username": username,
        "start_time": req.start_time,
        "end_time": req.end_time
    }
    bookings_db[booking_id] = booking
    return booking

#PUT
@app.put("/api/bookings/{booking_id}", response_model=BookingResponse)
def update_booking(booking_id: str, req: BookingCreate, username: str = Depends(get_current_user)):
    booking = bookings_db.get(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    user_info = users_db[username]
    if booking["username"] != username and not user_info["is_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit this booking")

    checkAvailable(req.start_time, req.end_time, booking_id)
                
    booking["start_time"] = req.start_time
    booking["end_time"] = req.end_time
    return booking

#DELETE
@app.delete("/api/bookings/{booking_id}")
def delete_booking(booking_id: str, username: str = Depends(get_current_user)):
    booking = bookings_db.get(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    user_info = users_db[username]
    if booking["username"] != username and not user_info["is_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this booking")
        
    del bookings_db[booking_id]
    return {"message": "Booking deleted"}

app.mount("/", StaticFiles(directory="static", html=True), name="static")
