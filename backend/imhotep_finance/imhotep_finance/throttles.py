#AI generated code
from rest_framework.throttling import SimpleRateThrottle, UserRateThrottle, AnonRateThrottle
from rest_framework.response import Response
from rest_framework import status

class CustomUserRateThrottle(UserRateThrottle):
    """Rate throttle for authenticated users."""
    scope = 'user'
    rate = '1000/hour'  # Authenticated users: 1000 requests per hour
    
    def throttle_success(self):
        """Called when request is within rate limit."""
        return super().throttle_success()
    
    def throttle_failure(self):
        """Called when request exceeds rate limit."""
        return super().throttle_failure()


class CustomAnonRateThrottle(AnonRateThrottle):
    """Rate throttle for anonymous users."""
    scope = 'anon'
    rate = '100/hour'  # Anonymous users: 100 requests per hour


class StrictUserRateThrottle(UserRateThrottle):
    """Strict rate throttle for sensitive operations."""
    scope = 'strict_user'
    rate = '50/hour'  # 50 requests per hour for sensitive endpoints


class AuthenticationRateThrottle(AnonRateThrottle):
    """Rate throttle for authentication endpoints."""
    scope = 'auth'
    rate = '5/minute'  # 5 attempts per minute


class LoginRateThrottle(AnonRateThrottle):
    """Strict rate throttle for login endpoint."""
    scope = 'login'
    rate = '5/minute'  # 5 login attempts per minute


class RegistrationRateThrottle(AnonRateThrottle):
    """Rate throttle for registration endpoint."""
    scope = 'register'
    rate = '3/hour'  # 3 registration attempts per hour


class PasswordResetRateThrottle(AnonRateThrottle):
    """Rate throttle for password reset endpoint."""
    scope = 'password_reset'
    rate = '3/hour'  # 3 password reset requests per hour


class TransactionImportRateThrottle(UserRateThrottle):
    """Rate throttle for CSV import endpoint."""
    scope = 'transaction_import'
    rate = '10/hour'  # 10 imports per hour per user


class BulkOperationRateThrottle(UserRateThrottle):
    """Rate throttle for bulk operations."""
    scope = 'bulk_operations'
    rate = '20/hour'  # 20 bulk operations per hour


class ReportGenerationRateThrottle(UserRateThrottle):
    """Rate throttle for report generation."""
    scope = 'report_generation'
    rate = '30/hour'  # 30 report requests per hour