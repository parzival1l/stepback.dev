import React, { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../store';
import { MessageSquare, Plus, Trash2, ChevronRight, ChevronLeft, MoreVertical } from 'lucide-react';

const API_URL = "http://localhost:8000";

const SessionSidebar = ({ isCollapsed, onToggleCollapse }) => {
    const { sessions, currentSessionId, setSession, loadHistory, fetchSessions, createSession, deleteSession } = useChatStore();
    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRefs = useRef({});

    useEffect(() => {
        fetchSessions();
    }, []);

    // Load history when currentSessionId changes (e.g., after deletion)
    useEffect(() => {
        if (!currentSessionId) {
            loadHistory([], null);
            return;
        }

        const session = sessions.find(s => (s._id || s.id) === currentSessionId);
        if (session) {
            if (session.last_active_node_id) {
                fetch(`${API_URL}/chat/history/${session.last_active_node_id}`)
                    .then(res => res.json())
                    .then(nodes => loadHistory(nodes, session.last_active_node_id))
                    .catch(e => {
                        console.error("Failed to load history", e);
                        loadHistory([], null);
                    });
            } else {
                loadHistory([], null);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentSessionId]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openMenuId) {
                const menuRef = menuRefs.current[openMenuId];
                if (menuRef && !menuRef.contains(event.target)) {
                    setOpenMenuId(null);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenuId]);

    const handleCreateSession = async () => {
        await createSession();
    };

    const selectSession = async (session) => {
        setOpenMenuId(null); // Close menu when selecting a session
        setSession(session._id || session.id);

        if (session.last_active_node_id) {
            try {
                const res = await fetch(`${API_URL}/chat/history/${session.last_active_node_id}`);
                const nodes = await res.json();
                loadHistory(nodes, session.last_active_node_id);
            } catch (e) {
                console.error("Failed to load history", e);
            }
        } else {
            loadHistory([], null);
        }
    };

    const handleDeleteSession = async (sessionId, e) => {
        e.stopPropagation(); // Prevent session selection
        if (window.confirm("Are you sure you want to delete this chat thread?")) {
            try {
                await deleteSession(sessionId);
                setOpenMenuId(null);
            } catch (err) {
                console.error("Failed to delete session", err);
                alert("Failed to delete session. Please try again.");
            }
        }
    };

    const toggleMenu = (sessionId, e) => {
        e.stopPropagation(); // Prevent session selection
        setOpenMenuId(openMenuId === sessionId ? null : sessionId);
    };

    return (
        <div className="h-full flex flex-col bg-gradient-to-b from-claude-light to-claude-light/80 border-r border-claude-secondary/30 relative">
            {/* Collapse Button */}
            <button
                onClick={onToggleCollapse}
                className="absolute top-4 -right-3 z-10 w-6 h-6 rounded-full bg-claude-white border border-claude-secondary/40
                    shadow-md hover:shadow-lg flex items-center justify-center
                    hover:bg-claude-light transition-all duration-200
                    text-claude-secondary hover:text-claude-primary"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                <ChevronLeft
                    size={14}
                    className={`transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
                />
            </button>

            {/* New Chat Button */}
            <div className="p-4">
                <button
                    onClick={handleCreateSession}
                    className="w-full flex items-center justify-center gap-2.5 gradient-primary text-claude-white py-2.5 px-4 rounded-xl
                        font-semibold text-sm shadow-lg shadow-claude-primary/25
                        hover:shadow-xl hover:shadow-claude-primary/30 hover:scale-[1.02]
                        active:scale-[0.98] transition-all duration-200"
                >
                    <Plus size={18} strokeWidth={2.5} />
                    <span>New Chat</span>
                </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto px-3 pb-3">
                {/* Chats Heading */}
                <div className="px-2 py-2 mb-1">
                    <h2 className="text-xs font-semibold text-claude-secondary uppercase tracking-wider">Chats</h2>
                </div>
                <div className="space-y-1">
                {sessions.map(session => {
                    const sessionId = session._id || session.id;
                    const isActive = sessionId === currentSessionId;
                    const isMenuOpen = openMenuId === sessionId;
                    return (
                        <div
                            key={sessionId}
                            className="relative group/item"
                        >
                            <button
                                onClick={() => selectSession(session)}
                                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all duration-200 group
                                    ${isActive
                                        ? 'bg-claude-white shadow-md shadow-claude-secondary/20 ring-1 ring-claude-secondary/30'
                                        : 'hover:bg-claude-white/70 hover:shadow-sm text-claude-secondary hover:text-claude-primary'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200
                                    ${isActive
                                        ? 'bg-gradient-to-br from-claude-primary to-claude-primary/90 text-claude-white shadow-md shadow-claude-primary/20'
                                        : 'bg-claude-light text-claude-secondary group-hover:bg-claude-primary/10 group-hover:text-claude-primary'
                                    }`}>
                                    <MessageSquare size={14} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`truncate text-sm font-medium ${isActive ? 'text-claude-primary' : ''}`}>
                                        {session.title || "Untitled Chat"}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={(e) => toggleMenu(sessionId, e)}
                                        className={`p-1.5 rounded-lg transition-all duration-200
                                            ${isMenuOpen
                                                ? 'bg-claude-secondary/20 text-claude-primary'
                                                : 'opacity-0 group-hover/item:opacity-100 text-claude-secondary hover:bg-claude-light hover:text-claude-primary'
                                            }`}
                                        title="More options"
                                    >
                                        <MoreVertical size={14} />
                                    </button>
                                    {isActive && !isMenuOpen && (
                                        <ChevronRight size={14} className="text-claude-secondary shrink-0" />
                                    )}
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                                <div
                                    ref={el => menuRefs.current[sessionId] = el}
                                    className="absolute right-0 top-full mt-1 z-50 w-48 bg-claude-white rounded-lg shadow-lg border border-claude-secondary/30 py-1"
                                >
                                    <button
                                        onClick={(e) => handleDeleteSession(sessionId, e)}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 flex items-center gap-2"
                                    >
                                        <Trash2 size={14} />
                                        <span>Delete</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}

                {sessions.length === 0 && (
                    <div className="text-center py-8 text-claude-secondary text-sm">
                        No conversations yet
                    </div>
                )}
                </div>
            </div>
        </div>
    );
};

export default SessionSidebar;
