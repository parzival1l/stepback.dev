"""
Abstract base class for authentication providers.

This defines the interface that all auth providers must implement,
allowing easy swapping between hash-based auth, OAuth, etc.
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any


class AbstractAuthProvider(ABC):
    """
    Abstract base class for authentication providers.

    Implementations:
    - HashAuthProvider: Simple 16-digit hash code authentication
    - OAuthAuthProvider: Future OAuth implementation (Google, Microsoft)
    """

    @abstractmethod
    async def validate_token(self, token: str) -> bool:
        """
        Validate an authentication token.

        Args:
            token: The authentication token to validate

        Returns:
            True if the token is valid, False otherwise
        """
        pass

    @abstractmethod
    async def get_user_info(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Get user information from a valid token.

        Args:
            token: The authentication token

        Returns:
            Dictionary with user info if valid, None otherwise
        """
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        """
        Get the name of this auth provider.

        Returns:
            Provider name string (e.g., "hash", "google", "microsoft")
        """
        pass

