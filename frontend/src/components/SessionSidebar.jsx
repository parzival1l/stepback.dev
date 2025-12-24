import React, { useEffect } from 'react';
import { useChatStore } from '../store';
import { api } from '../utils/apiClient';
import { Button } from '@/components/ui/button';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuAction,
    useSidebar,
} from '@/components/ui/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { PlusIcon, MessageIcon, TrashIcon, MoreIcon, SidebarLeftIcon } from '@/components/ui/icons';

// Sidebar Toggle Component
export const SidebarToggle = ({ className }) => {
    const { toggleSidebar } = useSidebar();

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    className={cn("h-8 w-8", className)}
                    onClick={toggleSidebar}
                    variant="outline"
                    size="icon"
                >
                    <SidebarLeftIcon size={16} />
                </Button>
            </TooltipTrigger>
            <TooltipContent align="start" side="right">
                Toggle Sidebar
            </TooltipContent>
        </Tooltip>
    );
};

const SessionSidebar = () => {
    const { sessions, currentSessionId, setSession, loadHistory, fetchSessions, createSession, deleteSession } = useChatStore();

    useEffect(() => {
        fetchSessions();
    }, []);

    // Load history when currentSessionId changes
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
        e.preventDefault();
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
        <Sidebar>
            <SidebarHeader className="p-3">
                <Button
                    onClick={handleCreateSession}
                    className="w-full gap-2 justify-start h-10"
                    variant="outline"
                >
                    <PlusIcon size={16} />
                    <span>New Chat</span>
                </Button>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Chats</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {sessions.map(session => {
                                const sessionId = session._id || session.id;
                                const isActive = sessionId === currentSessionId;
                                return (
                                    <SidebarMenuItem key={sessionId}>
                                        <SidebarMenuButton
                                            isActive={isActive}
                                            onClick={() => selectSession(session)}
                                            tooltip={session.title || "Untitled Chat"}
                                        >
                                            <MessageIcon size={16} />
                                            <span className="truncate">
                                                {session.title || "Untitled Chat"}
                                            </span>
                                        </SidebarMenuButton>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <SidebarMenuAction
                                                    showOnHover
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MoreIcon size={14} />
                                                    <span className="sr-only">More</span>
                                                </SidebarMenuAction>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent side="right" align="start" className="w-48">
                                                <DropdownMenuItem
                                                    onClick={(e) => handleDeleteSession(sessionId, e)}
                                                    className="text-destructive focus:text-destructive cursor-pointer"
                                                >
                                                    <TrashIcon size={14} />
                                                    <span>Delete</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </SidebarMenuItem>
                                );
                            })}

                            {sessions.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground text-sm px-4">
                                    No conversations yet
                                </div>
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
};

export default SessionSidebar;
