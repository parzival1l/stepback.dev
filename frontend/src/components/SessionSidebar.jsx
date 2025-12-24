import React, { useEffect, useState } from 'react';
import { useChatStore } from '../store';
import { MessageSquare, Plus, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';

const API_URL = "http://localhost:8000";

const SessionSidebar = ({ isCollapsed, onToggleCollapse }) => {
    const { sessions, currentSessionId, setSession, loadHistory, fetchSessions, createSession } = useChatStore();

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleCreateSession = async () => {
        await createSession();
    };

    const selectSession = async (session) => {
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

    return (
        <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-slate-100/50 border-r border-slate-200/60 relative">
            {/* Collapse Button */}
            <button
                onClick={onToggleCollapse}
                className="absolute top-4 -right-3 z-10 w-6 h-6 rounded-full bg-white border border-slate-200/80
                    shadow-md hover:shadow-lg flex items-center justify-center
                    hover:bg-slate-50 transition-all duration-200
                    text-slate-500 hover:text-slate-700"
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
                    className="w-full flex items-center justify-center gap-2.5 gradient-primary text-white py-2.5 px-4 rounded-xl
                        font-semibold text-sm shadow-lg shadow-blue-500/25
                        hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02]
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
                    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chats</h2>
                </div>
                <div className="space-y-1">
                {sessions.map(session => {
                    const isActive = (session._id || session.id) === currentSessionId;
                    return (
                        <button
                            key={session._id || session.id}
                            onClick={() => selectSession(session)}
                            className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all duration-200 group
                                ${isActive
                                    ? 'bg-white shadow-md shadow-slate-200/50 ring-1 ring-slate-200/80'
                                    : 'hover:bg-white/70 hover:shadow-sm text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200
                                ${isActive
                                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20'
                                    : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'
                                }`}>
                                <MessageSquare size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className={`truncate text-sm font-medium ${isActive ? 'text-slate-800' : ''}`}>
                                    {session.title || "Untitled Chat"}
                                </div>
                            </div>
                            {isActive && (
                                <ChevronRight size={14} className="text-slate-400 shrink-0" />
                            )}
                        </button>
                    );
                })}

                {sessions.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm">
                        No conversations yet
                    </div>
                )}
                </div>
            </div>
        </div>
    );
};

export default SessionSidebar;
