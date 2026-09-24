import re
import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User, OTPCode
from auth import (
    hash_password,
    verify_password,
    generate_otp,
    hash_otp,
    verify_otp,
    create_access_token,
    send_otp_email,
    verify_google_id_token,
    get_current_user,
    OTP_EXPIRY_MINUTES,
)

logger = logging.getLogger("sankshep.auth_routes")

router = APIRouter(prefix="/auth", tags=["Authentication"])

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")
MIN_PASSWORD_LENGTH = 8


# ── Request / Response Models ────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=MIN_PASSWORD_LENGTH)
    confirm_password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class OTPVerifyRequest(BaseModel):
    email: str
    code: str = Field(..., min_length=6, max_length=6)
    purpose: str  # "signup" or "login"


class ResendOTPRequest(BaseModel):
    email: str
    purpose: str  # "signup" or "login"


class GoogleAuthRequest(BaseModel):
    id_token: str


class AuthResponse(BaseModel):
    token: str
    user: dict


class MessageResponse(BaseModel):
    message: str
    email: str


# ── Helper ───────────────────────────────────────────────────────────────────

def _mask_email(email: str) -> str:
    """Mask email for display: u***r@gmail.com"""
    parts = email.split("@")
    if len(parts) != 2:
        return "***"
    local = parts[0]
    if len(local) <= 2:
        masked = local[0] + "***"
    else:
        masked = local[0] + "***" + local[-1]
    return f"{masked}@{parts[1]}"


def _validate_email(email: str):
    if not EMAIL_REGEX.match(email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")


async def _create_and_send_otp(user: User, purpose: str, db: AsyncSession):
    """Generate OTP, hash it, store in DB, and send email."""
    # Invalidate any existing unused OTPs for this user and purpose
    await db.execute(
        update(OTPCode)
        .where(OTPCode.user_id == user.id, OTPCode.purpose == purpose, OTPCode.used == False)
        .values(used=True)
    )

    otp_code = generate_otp()
    otp_record = OTPCode(
        user_id=user.id,
        code_hash=hash_otp(otp_code),
        purpose=purpose,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES),
    )
    db.add(otp_record)
    await db.commit()

    # Send email (runs synchronously — acceptable for SMTP)
    send_otp_email(user.email, otp_code, purpose=purpose)

    return _mask_email(user.email)


# ── POST /auth/register ─────────────────────────────────────────────────────

@router.post("/register", response_model=MessageResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account. Sends OTP for email verification."""
    _validate_email(req.email)

    email_lower = req.email.strip().lower()

    if req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    if len(req.password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Password must be at least {MIN_PASSWORD_LENGTH} characters.",
        )

    # Check for existing user
    result = await db.execute(select(User).where(User.email == email_lower))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        if existing_user.is_verified:
            raise HTTPException(
                status_code=409,
                detail="An account with this email already exists. Please log in instead.",
            )
        else:
            # Unverified user exists — update their info and resend OTP
            existing_user.name = req.name.strip()
            existing_user.password_hash = hash_password(req.password)
            await db.commit()
            masked = await _create_and_send_otp(existing_user, "signup", db)
            return {"message": f"Verification code sent to {masked}", "email": email_lower}

    # Create new unverified user
    new_user = User(
        name=req.name.strip(),
        email=email_lower,
        password_hash=hash_password(req.password),
        auth_provider="email",
        is_verified=False,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    masked = await _create_and_send_otp(new_user, "signup", db)
    return {"message": f"Verification code sent to {masked}", "email": email_lower}


# ── POST /auth/login ────────────────────────────────────────────────────────

@router.post("/login", response_model=MessageResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Validate credentials and send OTP for login verification."""
    _validate_email(req.email)

    email_lower = req.email.strip().lower()

    result = await db.execute(select(User).where(User.email == email_lower))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Your email is not verified. Please register again.",
        )

    if not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    masked = await _create_and_send_otp(user, "login", db)
    return {"message": f"Verification code sent to {masked}", "email": email_lower}


# ── POST /auth/verify-otp ───────────────────────────────────────────────────

@router.post("/verify-otp", response_model=AuthResponse)
async def verify_otp_endpoint(req: OTPVerifyRequest, db: AsyncSession = Depends(get_db)):
    """Verify OTP code and issue JWT token."""
    email_lower = req.email.strip().lower()

    result = await db.execute(select(User).where(User.email == email_lower))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid verification request.")

    # Get the latest unused OTP for this user and purpose
    otp_result = await db.execute(
        select(OTPCode)
        .where(
            OTPCode.user_id == user.id,
            OTPCode.purpose == req.purpose,
            OTPCode.used == False,
        )
        .order_by(OTPCode.created_at.desc())
        .limit(1)
    )
    otp_record = otp_result.scalar_one_or_none()

    if not otp_record:
        raise HTTPException(status_code=400, detail="No pending verification code found. Please request a new one.")

    # Check expiry
    now = datetime.now(timezone.utc)
    if otp_record.expires_at.replace(tzinfo=timezone.utc) < now:
        otp_record.used = True
        await db.commit()
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new one.")

    # Verify the code
    if not verify_otp(req.code, otp_record.code_hash):
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    # Mark OTP as used
    otp_record.used = True

    # If signup, mark user as verified
    if req.purpose == "signup":
        user.is_verified = True

    await db.commit()

    # Issue JWT
    token = create_access_token(str(user.id), user.email)

    return {
        "token": token,
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "auth_provider": user.auth_provider,
        },
    }


# ── POST /auth/resend-otp ───────────────────────────────────────────────────

@router.post("/resend-otp", response_model=MessageResponse)
async def resend_otp(req: ResendOTPRequest, db: AsyncSession = Depends(get_db)):
    """Resend a new OTP code (invalidates previous ones)."""
    email_lower = req.email.strip().lower()

    result = await db.execute(select(User).where(User.email == email_lower))
    user = result.scalar_one_or_none()

    if not user:
        # Don't reveal whether the email exists
        return {"message": "If an account exists, a new code has been sent.", "email": email_lower}

    masked = await _create_and_send_otp(user, req.purpose, db)
    return {"message": f"New verification code sent to {masked}", "email": email_lower}


# ── POST /auth/google ───────────────────────────────────────────────────────

@router.post("/google", response_model=AuthResponse)
async def google_auth(req: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate via Google Sign-In. No OTP required."""
    google_info = verify_google_id_token(req.id_token)

    google_id = google_info["google_id"]
    email = google_info["email"].lower()
    name = google_info["name"]

    # Check if user exists by google_id or email
    result = await db.execute(
        select(User).where((User.google_id == google_id) | (User.email == email))
    )
    user = result.scalar_one_or_none()

    if user:
        # Update Google ID if not set (email user linking to Google)
        if not user.google_id:
            user.google_id = google_id
        if not user.is_verified:
            user.is_verified = True
        # Update auth_provider if they signed in with Google
        if user.auth_provider == "email":
            user.auth_provider = "email"  # Keep as email, they just also have Google
        await db.commit()
    else:
        # Create new user (auto-verified via Google)
        user = User(
            name=name,
            email=email,
            auth_provider="google",
            is_verified=True,
            google_id=google_id,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = create_access_token(str(user.id), user.email)

    return {
        "token": token,
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "auth_provider": user.auth_provider,
        },
    }


# ── GET /auth/me ─────────────────────────────────────────────────────────────

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Return the current authenticated user's profile."""
    return {
        "id": str(current_user.id),
        "name": current_user.name,
        "email": current_user.email,
        "auth_provider": current_user.auth_provider,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }
