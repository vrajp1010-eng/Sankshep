import os
import secrets
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from dotenv import load_dotenv

from database import get_db
from models import User

load_dotenv()

logger = logging.getLogger("sankshep.auth")

# ── Configuration ────────────────────────────────────────────────────────────

JWT_SECRET = os.getenv("JWT_SECRET", "")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587

OTP_EXPIRY_MINUTES = 5
OTP_LENGTH = 6

# ── Password Hashing ────────────────────────────────────────────────────────

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ── OTP Generation & Hashing ────────────────────────────────────────────────

def generate_otp() -> str:
    """Generate a cryptographically secure 6-digit OTP."""
    return "".join([str(secrets.randbelow(10)) for _ in range(OTP_LENGTH)])


def hash_otp(otp: str) -> str:
    """Hash an OTP code using bcrypt."""
    return pwd_context.hash(otp)


def verify_otp(plain_otp: str, hashed_otp: str) -> bool:
    """Verify a plain OTP against its bcrypt hash."""
    return pwd_context.verify(plain_otp, hashed_otp)


# ── JWT Token Management ────────────────────────────────────────────────────

def create_access_token(user_id: str, email: str) -> str:
    """Create a JWT access token."""
    if not JWT_SECRET:
        raise RuntimeError("JWT_SECRET is not configured. Set it in your .env file.")
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": expire,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT access token."""
    if not JWT_SECRET:
        raise RuntimeError("JWT_SECRET is not configured.")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
        )


# ── Email OTP Sending ───────────────────────────────────────────────────────

def send_otp_email(recipient_email: str, otp_code: str, purpose: str = "verification"):
    """Send a 6-digit OTP to the user's email via Gmail SMTP."""
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.error("SMTP credentials not configured. Cannot send OTP email.")
        raise HTTPException(
            status_code=503,
            detail="Email service is not configured. Please contact the administrator.",
        )

    subject = f"Sankshep.ai — Your verification code is {otp_code}"
    if purpose == "login":
        subject = f"Sankshep.ai — Your login code is {otp_code}"

    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #0F172A; font-size: 22px; margin: 0;">Sankshep.ai</h2>
        </div>
        <div style="background: #F8FAFC; border-radius: 12px; padding: 28px; text-align: center;">
            <p style="color: #334155; font-size: 15px; margin: 0 0 16px;">
                {"Enter this code to verify your email and complete registration:" if purpose == "signup" else "Enter this code to complete your login:"}
            </p>
            <div style="background: #FFFFFF; border: 2px solid #027DFF; border-radius: 8px; padding: 16px; margin: 0 auto; max-width: 200px;">
                <span style="font-family: 'JetBrains Mono', monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0F172A;">
                    {otp_code}
                </span>
            </div>
            <p style="color: #94A3B8; font-size: 13px; margin: 16px 0 0;">
                This code expires in {OTP_EXPIRY_MINUTES} minutes.
            </p>
        </div>
        <p style="color: #94A3B8; font-size: 12px; text-align: center; margin-top: 20px;">
            If you didn't request this code, you can safely ignore this email.
        </p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"Sankshep.ai <{SMTP_USER}>"
    msg["To"] = recipient_email
    msg.attach(MIMEText(f"Your Sankshep.ai verification code is: {otp_code}\nThis code expires in {OTP_EXPIRY_MINUTES} minutes.", "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, recipient_email, msg.as_string())
        logger.info(f"OTP email sent to {recipient_email[:3]}***")
    except smtplib.SMTPAuthenticationError:
        logger.error("SMTP authentication failed. Check SMTP_USER and SMTP_PASSWORD.")
        raise HTTPException(
            status_code=503,
            detail="Email service authentication failed. Please contact the administrator.",
        )
    except Exception as e:
        logger.error(f"Failed to send OTP email: {e}")
        raise HTTPException(
            status_code=503,
            detail="Failed to send verification email. Please try again later.",
        )


# ── Google ID Token Verification ─────────────────────────────────────────────

def verify_google_id_token(id_token: str) -> dict:
    """
    Verify a Google ID token and return the user info payload.
    Returns dict with: sub (Google user ID), email, name, picture.
    """
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=503,
            detail="Google Sign-In is not configured on the server.",
        )

    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests

        idinfo = google_id_token.verify_oauth2_token(
            id_token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )

        if idinfo.get("iss") not in ["accounts.google.com", "https://accounts.google.com"]:
            raise ValueError("Invalid token issuer.")

        return {
            "google_id": idinfo["sub"],
            "email": idinfo["email"],
            "name": idinfo.get("name", idinfo.get("email", "").split("@")[0]),
            "picture": idinfo.get("picture", ""),
        }
    except ValueError as e:
        logger.warning(f"Google token verification failed: {e}")
        raise HTTPException(
            status_code=401,
            detail="Invalid Google authentication token.",
        )
    except Exception as e:
        logger.error(f"Google token verification error: {e}")
        raise HTTPException(
            status_code=401,
            detail="Google authentication failed. Please try again.",
        )


# ── FastAPI Auth Dependency ──────────────────────────────────────────────────

security = HTTPBearer(auto_error=False)


async def get_current_user(
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    FastAPI dependency: Bypassed for guest access.
    Always returns a default guest user.
    """
    guest_email = "guest@sankshep.ai"
    result = await db.execute(select(User).where(User.email == guest_email))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            email=guest_email,
            password_hash="dummy",
            name="Guest User",
            is_verified=True,
            auth_provider="email"
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return user
