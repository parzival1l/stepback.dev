"""
Hash-based authentication provider.

Simple authentication using a 16-digit hash code stored in environment variables.
This is designed to be replaced with OAuth in production.
"""

import os
from typing import Optional, Dict, Any
from fastapi import Header, HTTPException, Depends
from backend.auth.base import AbstractAuthProvider


class HashAuthProvider(AbstractAuthProvider):
    """
    Hash-based authentication provider.

    Validates tokens against an AUTH_CODE environment variable.
    Token format: 16-digit alphanumeric string
    """

    def __init__(self):
        self._auth_code = os.getenv("AUTH_CODE") or os.getenv("STEPBACK_AUTH_CODE")

    async def validate_token(self, token: str) -> bool:
        """
        Validate a token against the configured auth code.

        Args:
            token: The token to validate

        Returns:
            True if token matches AUTH_CODE, False otherwise
        """
        if not self._auth_code:
            # If no auth code is configured, deny all access
            return False
        return token == self._auth_code

    async def get_user_info(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Get user info for a valid token.

        For hash auth, we just return a basic authenticated user object.

        Args:
            token: The authentication token

        Returns:
            User info dict if valid, None otherwise
        """
        if await self.validate_token(token):
            return {
                "authenticated": True,
                "provider": "hash",
                "user_id": "default_user"
            }
        return None

    def get_provider_name(self) -> str:
        """Get the provider name."""
        return "hash"


# Singleton instance
_auth_provider: Optional[HashAuthProvider] = None


def get_auth_provider() -> HashAuthProvider:
    """Get or create the auth provider singleton."""
    global _auth_provider
    if _auth_provider is None:
        _auth_provider = HashAuthProvider()
    return _auth_provider


async def verify_auth_header(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    FastAPI dependency to verify the Authorization header.

    Expected format: "Bearer <16-digit-code>"

    Args:
        authorization: The Authorization header value

    Returns:
        User info dict if authenticated

    Raises:
        HTTPException: 401 if authentication fails
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header required",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization format. Use: Bearer <code>",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = authorization[7:]  # Remove "Bearer " prefix

    provider = get_auth_provider()
    user_info = await provider.get_user_info(token)

    if not user_info:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication code",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return user_info


# Dependency for protected routes
def get_auth_dependency():
    """
    Get the authentication dependency for protected routes.

    Usage in FastAPI:
        @app.get("/protected", dependencies=[Depends(get_auth_dependency())])
        async def protected_route():
            ...
    """
    return Depends(verify_auth_header)

