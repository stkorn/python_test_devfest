from pydantic import BaseModel

class LoginRequest(BaseModel):
    username: str
    password: str

class BookingCreate(BaseModel):
    start_time: str
    end_time: str

class BookingResponse(BaseModel):
    id: str
    username: str
    start_time: str
    end_time: str

class TokenResponse(BaseModel):
    token: str
    is_admin: bool
