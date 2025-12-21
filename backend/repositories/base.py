from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import datetime


class SessionRepository(ABC):
    """Abstract base class for session data access"""

    @abstractmethod
    async def create(self, title: str) -> dict:
        """Create a new session"""
        pass

    @abstractmethod
    async def get(self, session_id: str) -> Optional[dict]:
        """Get a session by ID"""
        pass

    @abstractmethod
    async def list_all(self) -> List[dict]:
        """List all sessions"""
        pass

    @abstractmethod
    async def update(self, session_id: str, updates: dict) -> Optional[dict]:
        """Update a session"""
        pass

    @abstractmethod
    async def delete(self, session_id: str) -> bool:
        """Delete a session"""
        pass


class ChatNodeRepository(ABC):
    """Abstract base class for chat node data access"""

    @abstractmethod
    async def create(
        self,
        session_id: str,
        role: str,
        content: str,
        parent_id: Optional[str] = None,
        path: Optional[List[str]] = None,
        model: Optional[str] = "gpt-4",
        is_merge_summary: bool = False,
        merge_source_branch_id: Optional[str] = None
    ) -> dict:
        """Create a new chat node"""
        pass

    @abstractmethod
    async def get(self, node_id: str) -> Optional[dict]:
        """Get a chat node by ID"""
        pass

    @abstractmethod
    async def find_by_session(self, session_id: str) -> List[dict]:
        """Find all nodes for a session"""
        pass

    @abstractmethod
    async def find_by_ids(self, node_ids: List[str]) -> List[dict]:
        """Find multiple nodes by their IDs"""
        pass

    @abstractmethod
    async def delete(self, node_id: str) -> bool:
        """Delete a chat node"""
        pass


class DatabaseRepository(ABC):
    """Abstract base class for database initialization and cleanup"""

    @abstractmethod
    async def initialize(self):
        """Initialize database connection"""
        pass

    @abstractmethod
    async def close(self):
        """Close database connection"""
        pass

    @abstractmethod
    def get_session_repository(self) -> SessionRepository:
        """Get session repository instance"""
        pass

    @abstractmethod
    def get_chat_node_repository(self) -> ChatNodeRepository:
        """Get chat node repository instance"""
        pass
