import React, { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../store';
import { MessageSquare, Plus, Trash2, ChevronRight, ChevronLeft, MoreVertical } from 'lucide-react';
import { api } from '../utils/apiClient';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const SessionSidebar = ({ isCollapsed, onToggleCollapse }) => {
    const { sessions, currentSessionId, setSession, loadHistory, fetchSessions, createSession, deleteSession } = useChatStore();

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
                api.get(`/chat/history/${session.last_active_node_id}`)
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

    const handleCreateSession = async () => {
        await createSession();
    };

    const selectSession = async (session) => {
        setSession(session._id || session.id);

        if (session.last_active_node_id) {
            try {
                const res = await api.get(`/chat/history/${session.last_active_node_id}`);
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
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this chat thread?")) {
            try {
                await deleteSession(sessionId);
            } catch (err) {
                console.error("Failed to delete session", err);
                alert("Failed to delete session. Please try again.");
            }
        }
    };

    return (
        <div className="h-full flex flex-col bg-sidebar border-r border-sidebar-border relative">
            {/* Collapse Button */}
            <Button
                variant="outline"
                size="icon"
                onClick={onToggleCollapse}
                className="absolute top-4 -right-3 z-10 h-6 w-6 rounded-full shadow-md"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                <ChevronLeft
                    size={14}
                    className={cn(
                        "transition-transform duration-200",
                        isCollapsed && "rotate-180"
                    )}
                />
            </Button>

            {/* New Chat Button */}
            <div className="p-4">
                <Button
                    onClick={handleCreateSession}
                    className="w-full gap-2 rounded-xl shadow-lg"
                >
                    <Plus size={18} strokeWidth={2.5} />
                    <span>New Chat</span>
                </Button>
            </div>

            {/* Sessions List */}
            <ScrollArea className="flex-1 px-3 pb-3">
                {/* Chats Heading */}
                <div className="px-2 py-2 mb-1">
                    <h2 className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">Chats</h2>
                </div>
                <div className="space-y-1">
                    {sessions.map(session => {
                        const sessionId = session._id || session.id;
                        const isActive = sessionId === currentSessionId;
                        return (
                            <div
                                key={sessionId}
                                className="relative group/item"
                            >
                                <button
                                    onClick={() => selectSession(session)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all duration-200 group",
                                        isActive
                                            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-md ring-1 ring-sidebar-border"
                                            : "hover:bg-sidebar-accent/50 text-sidebar-foreground hover:text-sidebar-accent-foreground"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-md"
                                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-foreground"
                                    )}>
                                        <MessageSquare size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={cn(
                                            "truncate text-sm font-medium",
                                            isActive && "text-sidebar-accent-foreground"
                                        )}>
                                            {session.title || "Untitled Chat"}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={cn(
                                                        "h-7 w-7 opacity-0 group-hover/item:opacity-100 transition-opacity",
                                                        "data-[state=open]:opacity-100"
                                                    )}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MoreVertical size={14} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuItem
                                                    onClick={(e) => handleDeleteSession(sessionId, e)}
                                                    className="text-destructive focus:text-destructive cursor-pointer"
                                                >
                                                    <Trash2 size={14} className="mr-2" />
                                                    <span>Delete</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        {isActive && (
                                            <ChevronRight size={14} className="text-sidebar-foreground/50 shrink-0" />
                                        )}
                                    </div>
                                </button>
                            </div>
                        );
                    })}

                    {sessions.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            No conversations yet
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};

export default SessionSidebar;
