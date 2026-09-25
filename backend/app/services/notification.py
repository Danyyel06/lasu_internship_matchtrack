import os
import random
import hashlib
from abc import ABC, abstractmethod

class NotificationSender(ABC):
    @abstractmethod
    def send_otp(self, recipient: str, otp: str, purpose: str) -> None:
        pass

class ConsoleNotificationSender(NotificationSender):
    """Dev/local sender. Logs OTP to console. Used when ENV=development or no provider keys set."""
    def send_otp(self, recipient: str, otp: str, purpose: str) -> None:
        print(f"[DEV OTP] {purpose} → {recipient}: {otp}")

class EmailNotificationSender(NotificationSender):
    """Production email sender. Wire in via SMTP_HOST env var."""
    def send_otp(self, recipient: str, otp: str, purpose: str) -> None:
        # TODO: implement with SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
        raise NotImplementedError("Email provider not configured")

class SmsNotificationSender(NotificationSender):
    """Production SMS sender. Wire in via SMS_API_KEY env var."""
    def send_otp(self, recipient: str, otp: str, purpose: str) -> None:
        # TODO: implement with SMS_API_KEY, SMS_SENDER_ID
        raise NotImplementedError("SMS provider not configured")

def get_notification_sender() -> NotificationSender:
    env = os.getenv("ENV", "development")
    if env == "development" or not os.getenv("SMTP_HOST"):
        return ConsoleNotificationSender()
    return EmailNotificationSender()

def generate_otp() -> str:
    """Generate a 6-digit OTP."""
    return str(random.randint(100000, 999999))

def hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()
