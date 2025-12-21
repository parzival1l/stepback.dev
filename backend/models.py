from beanie import Document
from pydantic import Field
from typing import List, Optional, Literal
from datetime import datetime
import uuid

class ChatNode(Document):
    session_id: str
    parent_id: Optional[str] = None
    role: Literal["user", "assistant", "system"]
    content: str
    path: List[str] = Field(default_factory=list) # Ordered list of ancestor IDs including self? No, ancestors.
    model: Optional[str] = "gpt-4"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Future merge logic
    is_merge_summary: bool = False
    merge_source_branch_id: Optional[str] = None

    class Settings:
        name = "chat_nodes"

class Session(Document):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    title: str = "New Chat"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_active_node_id: Optional[str] = None

    class Settings:
        name = "sessions"
