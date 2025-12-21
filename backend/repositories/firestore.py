from typing import List, Optional
from backend.repositories.base import SessionRepository, ChatNodeRepository, DatabaseRepository


class FirestoreSessionRepository(SessionRepository):
    """Firestore implementation of SessionRepository - TODO: Implement"""

    async def create(self, title: str) -> dict:
        raise NotImplementedError("Firestore session repository not yet implemented")

    async def get(self, session_id: str) -> Optional[dict]:
        raise NotImplementedError("Firestore session repository not yet implemented")

    async def list_all(self) -> List[dict]:
        raise NotImplementedError("Firestore session repository not yet implemented")

    async def update(self, session_id: str, updates: dict) -> Optional[dict]:
        raise NotImplementedError("Firestore session repository not yet implemented")

    async def delete(self, session_id: str) -> bool:
        raise NotImplementedError("Firestore session repository not yet implemented")


class FirestoreChatNodeRepository(ChatNodeRepository):
    """Firestore implementation of ChatNodeRepository - TODO: Implement"""

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
        raise NotImplementedError("Firestore chat node repository not yet implemented")

    async def get(self, node_id: str) -> Optional[dict]:
        raise NotImplementedError("Firestore chat node repository not yet implemented")

    async def find_by_session(self, session_id: str) -> List[dict]:
        raise NotImplementedError("Firestore chat node repository not yet implemented")

    async def find_by_ids(self, node_ids: List[str]) -> List[dict]:
        raise NotImplementedError("Firestore chat node repository not yet implemented")

    async def delete(self, node_id: str) -> bool:
        raise NotImplementedError("Firestore chat node repository not yet implemented")


class FirestoreDatabase(DatabaseRepository):
    """
    Firestore database implementation - TODO: Implement

    When implementing, you'll need to:
    1. Install: pip install firebase-admin
    2. Initialize Firebase Admin SDK with credentials
    3. Use Firestore client for data operations
    4. Map the repository methods to Firestore operations

    Example initialization:
        import firebase_admin
        from firebase_admin import credentials, firestore

        cred = credentials.Certificate("path/to/serviceAccount.json")
        firebase_admin.initialize_app(cred)
        self.db = firestore.client()
    """

    def __init__(self):
        self._session_repo = FirestoreSessionRepository()
        self._chat_node_repo = FirestoreChatNodeRepository()

    async def initialize(self):
        """Initialize Firestore connection"""
        raise NotImplementedError(
            "Firestore database not yet implemented. "
            "See class docstring for implementation guidance."
        )

    async def close(self):
        """Close Firestore connection"""
        pass

    def get_session_repository(self) -> SessionRepository:
        """Get session repository instance"""
        return self._session_repo

    def get_chat_node_repository(self) -> ChatNodeRepository:
        """Get chat node repository instance"""
        return self._chat_node_repo
