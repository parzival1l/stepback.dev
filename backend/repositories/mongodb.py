from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from bson import ObjectId
import os

from backend.models import ChatNode, Session
from backend.repositories.base import SessionRepository, ChatNodeRepository, DatabaseRepository


class MongoSessionRepository(SessionRepository):
    """MongoDB implementation of SessionRepository"""

    async def create(self, title: str) -> dict:
        """Create a new session"""
        session = Session(title=title)
        await session.insert()
        return self._to_dict(session)

    async def get(self, session_id: str) -> Optional[dict]:
        """Get a session by ID"""
        session = await Session.get(session_id)
        return self._to_dict(session) if session else None

    async def list_all(self) -> List[dict]:
        """List all sessions"""
        sessions = await Session.find_all().to_list()
        return [self._to_dict(s) for s in sessions]

    async def update(self, session_id: str, updates: dict) -> Optional[dict]:
        """Update a session"""
        session = await Session.get(session_id)
        if not session:
            return None

        for key, value in updates.items():
            if hasattr(session, key):
                setattr(session, key, value)

        await session.save()
        return self._to_dict(session)

    async def delete(self, session_id: str) -> bool:
        """Delete a session"""
        session = await Session.get(session_id)
        if not session:
            return False
        await session.delete()
        return True

    def _to_dict(self, session: Session) -> dict:
        """Convert Session document to dict"""
        if not session:
            return None
        return {
            "id": str(session.id),
            "title": session.title,
            "created_at": session.created_at,
            "last_active_node_id": session.last_active_node_id
        }


class MongoChatNodeRepository(ChatNodeRepository):
    """MongoDB implementation of ChatNodeRepository"""

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
        node = ChatNode(
            session_id=session_id,
            parent_id=parent_id,
            role=role,
            content=content,
            path=path or [],
            model=model,
            is_merge_summary=is_merge_summary,
            merge_source_branch_id=merge_source_branch_id
        )
        await node.insert()
        return self._to_dict(node)

    async def get(self, node_id: str) -> Optional[dict]:
        """Get a chat node by ID"""
        node = await ChatNode.get(node_id)
        return self._to_dict(node) if node else None

    async def find_by_session(self, session_id: str) -> List[dict]:
        """Find all nodes for a session"""
        nodes = await ChatNode.find(ChatNode.session_id == session_id).to_list()
        return [self._to_dict(n) for n in nodes]

    async def find_by_ids(self, node_ids: List[str]) -> List[dict]:
        """Find multiple nodes by their IDs"""
        object_ids = [ObjectId(nid) for nid in node_ids]
        nodes_query = {"_id": {"$in": object_ids}}
        nodes = await ChatNode.find(nodes_query).to_list()
        return [self._to_dict(n) for n in nodes]

    async def delete(self, node_id: str) -> bool:
        """Delete a chat node"""
        node = await ChatNode.get(node_id)
        if not node:
            return False
        await node.delete()
        return True

    def _to_dict(self, node: ChatNode) -> dict:
        """Convert ChatNode document to dict"""
        if not node:
            return None
        return {
            "id": str(node.id),
            "session_id": node.session_id,
            "parent_id": node.parent_id,
            "role": node.role,
            "content": node.content,
            "path": node.path,
            "model": node.model,
            "created_at": node.created_at,
            "is_merge_summary": node.is_merge_summary,
            "merge_source_branch_id": node.merge_source_branch_id
        }


class MongoDatabase(DatabaseRepository):
    """MongoDB database implementation"""

    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self._session_repo = MongoSessionRepository()
        self._chat_node_repo = MongoChatNodeRepository()

    async def initialize(self):
        """Initialize MongoDB connection"""
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
        self.client = AsyncIOMotorClient(mongo_uri)
        db_name = os.getenv("DB_NAME", "treechat")
        await init_beanie(
            database=self.client[db_name],
            document_models=[ChatNode, Session]
        )

    async def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()

    def get_session_repository(self) -> SessionRepository:
        """Get session repository instance"""
        return self._session_repo

    def get_chat_node_repository(self) -> ChatNodeRepository:
        """Get chat node repository instance"""
        return self._chat_node_repo
