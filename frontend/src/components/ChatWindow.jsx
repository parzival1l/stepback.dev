import React, { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../store';
import { Send, ChevronLeft, ChevronRight, GitMerge, GitBranch, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import ModelSelector from './ModelSelector';
import { api } from '../utils/apiClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const ChatWindow = () => {
    const { tree, activeNodeId, setActiveNode, getLineage, getChildren, currentSessionId, loadHistory, fetchSessions, createSession, selectedModel, setSelectedModel } = useChatStore();
    const lineage = getLineage();
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sendMode, setSendMode] = useState('reply'); // 'reply' (child) or 'branch' (sibling)
    const [showModelSelector, setShowModelSelector] = useState(false);

    // Optimistic UI state
    const [optimisticMessage, setOptimisticMessage] = useState(null);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [lineage, isLoading, optimisticMessage]);

    // Show model selector if no session or no model selected
    useEffect(() => {
        if (!currentSessionId || !selectedModel) {
            setShowModelSelector(true);
        } else {
            setShowModelSelector(false);
        }
    }, [currentSessionId, selectedModel]);

    const activeNode = tree[activeNodeId];

    const handleModelSelect = (modelId) => {
        setSelectedModel(modelId);
    };

    const handleStartChatting = async () => {
        if (!selectedModel) return;
        // Create a session if one doesn't exist
        if (!currentSessionId) {
            const sessionId = await createSession();
            if (sessionId) {
                setShowModelSelector(false);
            }
        } else {
            setShowModelSelector(false);
        }
    };

    // Handle Sending Message
    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        let sessionId = currentSessionId;
        if (!sessionId) {
            sessionId = await createSession();
            if (!sessionId) return; // Failed to create
        }

        const messageContent = input;
        const mode = sendMode;

        // Determine parent_id based on mode
        let parentId = activeNodeId;
        if (mode === 'branch' && activeNode && activeNode.parent_id) {
            parentId = activeNode.parent_id;
        }

        setInput(""); // Clear input
        setIsLoading(true);

        // precise optimistic rendering
        setOptimisticMessage({
            id: 'temp-optimistic',
            role: 'user',
            content: messageContent,
            parent_id: parentId
        });

        try {
            const res = await api.post('/chat/message', {
                session_id: sessionId,
                parent_id: parentId,
                content: messageContent,
                role: "user",
                model: selectedModel || "gemini-2.5-flash"
            });
            const data = await res.json();

            if (data.assistant_node) {
                const historyRes = await api.get(`/chat/history/${data.assistant_node._id || data.assistant_node.id}`);
                const historyNodes = await historyRes.json();
                loadHistory(historyNodes, data.assistant_node._id || data.assistant_node.id);

                // Refresh sessions to catch any title updates
                if (useChatStore.getState().fetchSessions) {
                    useChatStore.getState().fetchSessions();
                }
                // Always signal graph refresh
                window.dispatchEvent(new Event('session-updated'));
            }

        } catch (err) {
            console.error(err);
            setInput(messageContent); // Restore on error
        } finally {
            setIsLoading(false);
            setOptimisticMessage(null);
        }
    };

    const handleSquash = async () => {
        if (!activeNodeId || isLoading) return;
        if (!confirm("Summarize this conversation branch?")) return;

        setIsLoading(true);
        try {
            const res = await api.post('/chat/squash', {
                session_id: currentSessionId,
                node_id: activeNodeId
            });
            const summaryNode = await res.json();

            const historyRes = await api.get(`/chat/history/${summaryNode._id || summaryNode.id}`);
            const historyNodes = await historyRes.json();
            loadHistory(historyNodes, summaryNode._id || summaryNode.id);

        } catch (e) {
            console.error("Squash failed", e);
        } finally {
            setIsLoading(false);
        }
    };

    // Show model selector if needed
    if (showModelSelector) {
        return (
            <div className="flex flex-col h-full max-w-4xl mx-auto">
                <ModelSelector
                    selectedModel={selectedModel}
                    onModelSelect={handleModelSelect}
                    onStart={handleStartChatting}
                />
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="flex flex-col h-full max-w-4xl mx-auto px-6 py-4">
                {/* Toolbar */}
                <div className="flex justify-between items-center pb-3">
                    {/* Model indicator */}
                    {selectedModel && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-1.5 bg-card rounded-lg border border-border">
                            <span className="font-medium text-foreground">Model:</span>
                            <span className="font-mono text-foreground">{selectedModel}</span>
                        </div>
                    )}
                    <div className="flex justify-end">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSquash}
                                    disabled={isLoading || !activeNodeId}
                                    className="gap-1.5"
                                >
                                    <GitMerge size={14} />
                                    Squash / Summarize
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Summarize current branch into a single node</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 pb-4 pr-2">
                    <div className="space-y-6">
                        {lineage.map((node, index) => (
                            <MessageItem key={node._id || node.id} node={node} animationDelay={index * 50} />
                        ))}

                        {/* Optimistic Message Display */}
                        {optimisticMessage && (
                            <MessageItem key="optimistic" node={optimisticMessage} isOptimistic={true} />
                        )}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="flex justify-start animate-slide-up">
                                <div className="glass rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-3 shadow-lg border border-border">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground">Thinking...</span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="border-t border-border pt-4 mt-2">
                    <div className="flex flex-col gap-2.5">
                        {/* Branch Context Info */}
                        {activeNodeId && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                                <GitBranch size={12} />
                                <span>
                                    {sendMode === 'reply' ? 'Extending' : 'Branching off parent of'}:
                                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-primary ml-1">
                                        {String(activeNodeId).slice(-6)}
                                    </span>
                                </span>
                            </div>
                        )}

                        <div className="flex gap-3 items-end">
                            {/* Input */}
                            <div className="flex-1 relative">
                                <Textarea
                                    className="min-h-[48px] resize-none rounded-xl shadow-sm"
                                    rows={1}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            sendMessage();
                                        }
                                    }}
                                    placeholder={sendMode === 'reply' ? "Type a message..." : "Type to start new branch..."}
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Split Button for Send/Branch */}
                            <div className="relative flex flex-col items-end">
                                <div className="flex items-center shadow-lg rounded-xl overflow-hidden">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                onClick={sendMessage}
                                                disabled={!input.trim() || isLoading}
                                                className="rounded-r-none px-4 py-3 h-auto"
                                            >
                                                {sendMode === 'reply' ? <Send size={18} /> : <GitBranch size={18} />}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{sendMode === 'reply' ? "Send Message" : "Create New Branch"}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <div className="w-px h-6 bg-primary-foreground/30"></div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                disabled={isLoading}
                                                className="rounded-l-none px-2 py-3 h-auto"
                                            >
                                                <ChevronDown size={16} />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-[220px]">
                                            <DropdownMenuItem
                                                onClick={() => setSendMode('reply')}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 cursor-pointer",
                                                    sendMode === 'reply' && "bg-accent"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center",
                                                    sendMode === 'reply' ? "bg-primary/20" : "bg-muted"
                                                )}>
                                                    <Send size={14} />
                                                </div>
                                                <div>
                                                    <div className="font-semibold">Reply</div>
                                                    <div className="text-xs text-muted-foreground">Continue this conversation</div>
                                                </div>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => setSendMode('branch')}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 cursor-pointer",
                                                    sendMode === 'branch' && "bg-accent"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center",
                                                    sendMode === 'branch' ? "bg-primary/20" : "bg-muted"
                                                )}>
                                                    <GitBranch size={14} />
                                                </div>
                                                <div>
                                                    <div className="font-semibold">New Branch</div>
                                                    <div className="text-xs text-muted-foreground">Split from previous node</div>
                                                </div>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
};

// Sub-component for individual message
const MessageItem = ({ node, isOptimistic = false, animationDelay = 0 }) => {
    const { setActiveNode, getChildren } = useChatStore();

    // Safety check for getChildren
    const children = node.parent_id && !isOptimistic ? getChildren(node.parent_id) : [];

    // Find index of current node among siblings
    const currentIndex = children.findIndex(n => (n._id || n.id) === (node._id || node.id));
    const hasSiblings = children.length > 1 && !isOptimistic;

    const handlePrev = () => {
        if (currentIndex > 0) setActiveNode(children[currentIndex - 1]._id || children[currentIndex - 1].id);
    };

    const handleNext = () => {
        if (currentIndex < children.length - 1) setActiveNode(children[currentIndex + 1]._id || children[currentIndex + 1].id);
    };

    const isUser = node.role === 'user';
    const isSystem = node.role === 'system';

    if (isSystem) return null;

    const bubbleClass = isUser ? 'user-bubble' : 'assistant-bubble';

    return (
        <div
            className={cn(
                "group flex flex-col animate-slide-up",
                isUser ? "items-end" : "items-start",
                isOptimistic && "opacity-60"
            )}
            style={{ animationDelay: `${animationDelay}ms` }}
        >
            <div className={cn(
                "max-w-[85%] rounded-2xl px-5 py-3.5 relative transition-all duration-200",
                isUser
                    ? "bg-card text-foreground rounded-br-sm shadow-lg border border-border"
                    : "bg-primary text-primary-foreground rounded-bl-sm shadow-lg",
                bubbleClass
            )}>
                <div className={cn("markdown-content", isUser ? "user-message" : "assistant-message")}>
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            code({ node, inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '')
                                return !inline && match ? (
                                    <SyntaxHighlighter
                                        style={vscDarkPlus}
                                        language={match[1]}
                                        PreTag="div"
                                        className="rounded-lg text-sm my-2"
                                        {...props}
                                    >
                                        {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                ) : (
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                )
                            }
                        }}
                    >
                        {node.content}
                    </ReactMarkdown>
                </div>

                {/* Branch Navigation Overlay */}
                {hasSiblings && (
                    <div className="absolute -bottom-7 left-0 right-0 flex justify-center gap-1 items-center">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            className="h-6 w-6 rounded-lg"
                        >
                            <ChevronLeft size={12} />
                        </Button>
                        <span className="bg-card border border-border px-2.5 py-1 rounded-lg text-xs font-medium text-foreground shadow-sm">
                            {currentIndex + 1} / {children.length}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleNext}
                            disabled={currentIndex === children.length - 1}
                            className="h-6 w-6 rounded-lg"
                        >
                            <ChevronRight size={12} />
                        </Button>
                    </div>
                )}
            </div>
            {isOptimistic && <div className="text-xs text-muted-foreground mt-1.5 mr-2 font-medium">Sending...</div>}
        </div>
    );
};

export default ChatWindow;
