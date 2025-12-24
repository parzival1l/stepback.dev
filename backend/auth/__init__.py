"""
Authentication module for stepback.dev

This module provides a modular authentication system that can be easily
swapped between different implementations (hash-based, OAuth, etc.)
"""

from backend.auth.base import AbstractAuthProvider
from backend.auth.hash_auth import HashAuthProvider, get_auth_dependency

__all__ = [
    "AbstractAuthProvider",
    "HashAuthProvider",
    "get_auth_dependency",
]

