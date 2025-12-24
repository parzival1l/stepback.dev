"""
OAuth authentication provider (placeholder for future implementation).

This module will implement OAuth authentication for Google and Microsoft
when the application moves to production.
"""

from typing import Optional, Dict, Any
from backend.auth.base import AbstractAuthProvider


class OAuthAuthProvider(AbstractAuthProvider):
    """
    OAuth authentication provider (placeholder).

    TODO: Implement when moving to production with:
    - Google OAuth 2.0
    - Microsoft Azure AD
    - JWT token validation
    - User session management
    """

    def __init__(self, provider: str = "google"):
        """
        Initialize OAuth provider.

        Args:
            provider: The OAuth provider ("google" or "microsoft")
        """
        self._provider = provider
        # TODO: Initialize OAuth client credentials
        # self._client_id = os.getenv(f"{provider.upper()}_CLIENT_ID")
        # self._client_secret = os.getenv(f"{provider.upper()}_CLIENT_SECRET")

    async def validate_token(self, token: str) -> bool:
        """
        Validate an OAuth access token.

        TODO: Implement token validation with OAuth provider.

        Args:
            token: The OAuth access token

        Returns:
            True if valid, False otherwise
        """
        # TODO: Validate JWT token
        # TODO: Check token expiration
        # TODO: Verify with OAuth provider
        raise NotImplementedError("OAuth authentication not yet implemented")

    async def get_user_info(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Get user info from OAuth provider.

        TODO: Implement user info retrieval.

        Args:
            token: The OAuth access token

        Returns:
            User info dict if valid
        """
        # TODO: Decode JWT claims
        # TODO: Fetch user profile from provider
        raise NotImplementedError("OAuth authentication not yet implemented")

    def get_provider_name(self) -> str:
        """Get the provider name."""
        return self._provider


# Future implementation notes:
#
# 1. Google OAuth Setup:
#    - Create project in Google Cloud Console
#    - Enable Google Sign-In API
#    - Configure OAuth consent screen
#    - Create OAuth 2.0 credentials
#    - Add authorized redirect URIs
#
# 2. Microsoft OAuth Setup:
#    - Register app in Azure AD
#    - Configure API permissions
#    - Set redirect URIs
#    - Generate client secret
#
# 3. Implementation Steps:
#    - Add authlib or python-social-auth dependency
#    - Implement OAuth flow endpoints (/auth/login, /auth/callback)
#    - Store user sessions in database
#    - Issue JWT tokens for API authentication
#    - Implement token refresh logic

