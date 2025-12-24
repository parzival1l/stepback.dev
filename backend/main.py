from fastapi import FastAPI, HTTPException, Depends
from contextlib import asynccontextmanager
from backend.database import init_db, close_db
from backend.repositories.factory import DatabaseFactory
from backend.llm import LLMService
from backend.auth.hash_auth import verify_auth_header
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Initialize Service
llm_service = LLMService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()

app = FastAPI(title="stepback.dev API", lifespan=lifespan)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Public Endpoints (No Auth Required) ---

@app.get("/")
async def root():
    return {"message": "stepback.dev Backend is Running"}

@app.get("/models")
async def get_models():
    """Get available models from configuration"""
    import json
    from pathlib import Path
    models_path = Path(__file__).parent / "models.json"
    with open(models_path, 'r', encoding='utf-8') as f:
        return json.load(f)

@app.post("/auth/validate")
async def validate_auth(user: Dict[str, Any] = Depends(verify_auth_header)):
    """
    Validate an authentication code.

    Returns 200 OK if valid, 401 Unauthorized if invalid.
    """
    return {"valid": True, "user": user}

# --- Pydantic Models for Requests ---
class CreateSessionRequest(BaseModel):
    title: Optional[str] = "New Chat"

class MessageRequest(BaseModel):
    session_id: str
    parent_id: Optional[str] = None
    content: str
    role: str = "user" # primarily user, but maybe system
    model: str = "gemini-2.5-flash"

# --- Pydantic Models for Responses ---
class SessionResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    last_active_node_id: Optional[str] = None

class ChatNodeResponse(BaseModel):
    id: str
    session_id: str
    parent_id: Optional[str] = None
    role: str
    content: str
    path: List[str]
    model: Optional[str]
    created_at: datetime
    is_merge_summary: bool = False
    merge_source_branch_id: Optional[str] = None

class ChatResponse(BaseModel):
    user_node: ChatNodeResponse
    assistant_node: Optional[ChatNodeResponse] = None

# --- Helper Functions ---
def get_repositories():
    """Get database repositories"""
    db = DatabaseFactory.get_database()
    return db.get_session_repository(), db.get_chat_node_repository()

# --- Protected Endpoints (Auth Required) ---

@app.post("/sessions", response_model=SessionResponse)
async def create_session(
    request: CreateSessionRequest,
    user: Dict[str, Any] = Depends(verify_auth_header)
):
    session_repo, _ = get_repositories()
    session = await session_repo.create(title=request.title)
    return SessionResponse(**session)

@app.get("/sessions", response_model=List[SessionResponse])
async def list_sessions(user: Dict[str, Any] = Depends(verify_auth_header)):
    session_repo, _ = get_repositories()
    sessions = await session_repo.list_all()
    return [SessionResponse(**s) for s in sessions]

@app.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    user: Dict[str, Any] = Depends(verify_auth_header)
):
    session_repo, node_repo = get_repositories()

    # Check if session exists
    session = await session_repo.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Delete all chat nodes associated with this session
    nodes = await node_repo.find_by_session(session_id)
    for node in nodes:
        node_id = node.get("id") or node.get("_id")
        if node_id:
            await node_repo.delete(node_id)

    # Delete the session
    success = await session_repo.delete(session_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete session")

    return {"message": "Session deleted successfully"}

@app.post("/chat/message", response_model=ChatResponse)
async def send_message(
    request: MessageRequest,
    user: Dict[str, Any] = Depends(verify_auth_header)
):
    session_repo, node_repo = get_repositories()

    # 1. Fetch parent path if parent_id exists
    path = []
    if request.parent_id:
        parent = await node_repo.get(request.parent_id)
        if not parent:
            raise HTTPException(status_code=404, detail="Parent node not found")
        path = parent["path"] + [parent["id"]]

    # 2. Create User Node
    user_node = await node_repo.create(
        session_id=request.session_id,
        parent_id=request.parent_id,
        role=request.role,
        content=request.content,
        path=path,
        model=request.model
    )

    # Update session last active
    session = await session_repo.get(request.session_id)
    if session:
        await session_repo.update(request.session_id, {"last_active_node_id": user_node["id"]})

    # 3. AI Response
    assistant_path = path + [user_node["id"]]

    # Fetch history for context
    # Fetch ancestors
    all_node_ids = user_node["path"] + [user_node["id"]]
    history_nodes_list = await node_repo.find_by_ids(all_node_ids)

    # Sort by created_at
    history_nodes_list.sort(key=lambda x: x["created_at"])

    # Call LLM
    # 3. Log LLM Call (System Node)
    system_path = path + [user_node["id"]]
    # Create a summary of the call
    model_name = request.model
    call_log = f"Invoking Model: {model_name}\nContext Length: {len(history_nodes_list)} messages"

    system_node = await node_repo.create(
        session_id=request.session_id,
        parent_id=user_node["id"],
        role="system",
        content=call_log,
        path=system_path,
        model="system"
    )

    # Update session title if it's the first real message (or title is default)
    if session and session["title"] == "New Chat":
        # Generate a title from the user content (truncate to 40 chars)
        new_title = request.content[:40] + ("..." if len(request.content) > 40 else "")
        await session_repo.update(request.session_id, {"title": new_title})

    # Update path for assistant to be child of system node
    assistant_path = system_path + [system_node["id"]]

    llm_response_text = await llm_service.generate_response(history_nodes_list, request.content, request.model)

    assistant_node = await node_repo.create(
        session_id=request.session_id,
        parent_id=system_node["id"],
        role="assistant",
        content=llm_response_text,
        path=assistant_path,
        model=request.model
    )

    # Update session again to point to assistant
    if session:
        await session_repo.update(request.session_id, {"last_active_node_id": assistant_node["id"]})

    return ChatResponse(
        user_node=ChatNodeResponse(**user_node),
        assistant_node=ChatNodeResponse(**assistant_node)
    )

@app.get("/chat/history/{node_id}", response_model=List[ChatNodeResponse])
async def get_history(
    node_id: str,
    user: Dict[str, Any] = Depends(verify_auth_header)
):
    _, node_repo = get_repositories()

    node = await node_repo.get(node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    # Fetch all ancestors
    ancestor_ids = node["path"]

    # We also include the current node in the history
    all_ids = ancestor_ids + [node["id"]]

    try:
        history = await node_repo.find_by_ids(all_ids)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format in path")

    # Sort by creation time to ensure linear order
    history.sort(key=lambda x: x["created_at"])

    return [ChatNodeResponse(**h) for h in history]

@app.get("/session/{session_id}/tree", response_model=List[ChatNodeResponse])
async def get_session_tree(
    session_id: str,
    user: Dict[str, Any] = Depends(verify_auth_header)
):
    _, node_repo = get_repositories()
    nodes = await node_repo.find_by_session(session_id)
    return [ChatNodeResponse(**n) for n in nodes]
