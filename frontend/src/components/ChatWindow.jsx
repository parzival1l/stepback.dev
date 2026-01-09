import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { useChatStore } from '../store';
import { ChevronLeft, ChevronRight, GitMerge, GitBranch, ChevronDown, Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import ModelSelector from './ModelSelector';
import { api } from '../utils/apiClient';
import { Button } from '@/components/ui/button';
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
import {
    PromptInput,
    PromptInputTextarea,
    PromptInputToolbar,
    PromptInputTools,
    PromptInputSubmit,
    PromptInputActions,
} from '@/components/elements/prompt-input';
import { ArrowUpIcon, SparklesIcon, BotIcon, UserIcon } from '@/components/ui/icons';

const ChatWindow = () => {
    const { tree, activeNodeId, setActiveNode, getLineage, getChildren, currentSessionId, loadHistory, fetchSessions, createSession, selectedModel, setSelectedModel } = useChatStore();
    const lineage = getLineage();
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sendMode, setSendMode] = useState('reply');
    const [showModelSelector, setShowModelSelector] = useState(false);

    // Optimistic UI state
    const [optimisticMessage, setOptimisticMessage] = useState(null);

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

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

    // Auto-focus textarea
    useEffect(() => {
        if (!showModelSelector && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [showModelSelector]);

    const activeNode = tree[activeNodeId];

    const handleModelSelect = (modelId) => {
        setSelectedModel(modelId);
    };

    const handleStartChatting = async () => {
        if (!selectedModel) return;
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
    const sendMessage = useCallback(async () => {
        if (!input.trim() || isLoading) return;

        let sessionId = currentSessionId;
        if (!sessionId) {
            sessionId = await createSession();
            if (!sessionId) return;
        }

        const messageContent = input;
        const mode = sendMode;

        let parentId = activeNodeId;
        if (mode === 'branch' && activeNode && activeNode.parent_id) {
            parentId = activeNode.parent_id;
        }

        setInput("");
        setIsLoading(true);

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

                if (useChatStore.getState().fetchSessions) {
                    useChatStore.getState().fetchSessions();
                }
                window.dispatchEvent(new Event('session-updated'));
            }

        } catch (err) {
            console.error(err);
            setInput(messageContent);
        } finally {
            setIsLoading(false);
            setOptimisticMessage(null);
        }
    }, [input, isLoading, currentSessionId, sendMode, activeNodeId, activeNode, selectedModel, createSession, loadHistory]);

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
            <div className="flex flex-col h-full max-w-4xl mx-auto px-4 md:px-6 py-4">
                {/* Toolbar */}
                <div className="flex justify-between items-center pb-3 gap-3">
                    {/* Model indicator */}
                    {selectedModel && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-1.5 bg-muted/50 rounded-lg border border-border">
                            <SparklesIcon size={12} />
                            <span className="font-medium">{selectedModel}</span>
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
                                    className="gap-1.5 h-8"
                                >
                                    <GitMerge size={14} />
                                    <span className="hidden sm:inline">Squash</span>
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
                                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl rounded-bl-sm bg-muted/50 border border-border shadow-sm">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10">
                                        <BotIcon size={14} className="text-primary" />
                                    </div>
                                    <div className="flex gap-1.5">
                                        <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="pt-4 mt-2">
                    {/* Branch Context Info */}
                    {activeNodeId && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1 mb-2">
                            <GitBranch size={12} />
                            <span>
                                {sendMode === 'reply' ? 'Extending' : 'Branching off parent of'}:
                                <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground ml-1">
                                    {String(activeNodeId).slice(-6)}
                                </span>
                            </span>
                        </div>
                    )}

                    <PromptInput
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!isLoading) {
                                sendMessage();
                            }
                        }}
                    >
                        <PromptInputTextarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={sendMode === 'reply' ? "Send a message..." : "Type to start new branch..."}
                            disabled={isLoading}
                            className="min-h-[52px] text-base"
                        />
                        <PromptInputToolbar>
                            <PromptInputTools>
                                {/* Send Mode Toggle */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                                            disabled={isLoading}
                                        >
                                            {sendMode === 'reply' ? (
                                                <>
                                                    <Send size={14} />
                                                    <span className="text-xs">Reply</span>
                                                </>
                                            ) : (
                                                <>
                                                    <GitBranch size={14} />
                                                    <span className="text-xs">Branch</span>
                                                </>
                                            )}
                                            <ChevronDown size={12} />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-[200px]">
                                        <DropdownMenuItem
                                            onClick={() => setSendMode('reply')}
                                            className={cn(
                                                "flex items-center gap-3 p-2.5 cursor-pointer",
                                                sendMode === 'reply' && "bg-accent"
                                            )}
                                        >
                                            <Send size={14} />
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">Reply</div>
                                                <div className="text-xs text-muted-foreground">Continue conversation</div>
                                            </div>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setSendMode('branch')}
                                            className={cn(
                                                "flex items-center gap-3 p-2.5 cursor-pointer",
                                                sendMode === 'branch' && "bg-accent"
                                            )}
                                        >
                                            <GitBranch size={14} />
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">New Branch</div>
                                                <div className="text-xs text-muted-foreground">Split from previous</div>
                                            </div>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </PromptInputTools>

                            <PromptInputActions>
                                <PromptInputSubmit
                                    disabled={!input.trim() || isLoading}
                                    status={isLoading ? "loading" : "ready"}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
                                >
                                    <ArrowUpIcon size={16} />
                                </PromptInputSubmit>
                            </PromptInputActions>
                        </PromptInputToolbar>
                    </PromptInput>
                </div>
            </div>
        </TooltipProvider>
    );
};

// Sub-component for individual message
const MessageItem = memo(({ node, isOptimistic = false, animationDelay = 0 }) => {
    const { setActiveNode, getChildren } = useChatStore();

    const children = node.parent_id && !isOptimistic ? getChildren(node.parent_id) : [];
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

    return (
        <div
            className={cn(
                "group flex gap-3 animate-slide-up",
                isUser ? "flex-row-reverse" : "flex-row",
                isOptimistic && "opacity-60"
            )}
            style={{ animationDelay: `${animationDelay}ms` }}
        >
            {/* Avatar */}
            <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5",
                isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted border border-border"
            )}>
                {isUser ? <UserIcon size={14} /> : <BotIcon size={14} />}
            </div>

            {/* Message Content */}
            <div className={cn(
                "flex flex-col max-w-[85%] relative",
                isUser ? "items-end" : "items-start"
            )}>
                <div className={cn(
                    "rounded-2xl px-4 py-3 transition-all duration-200",
                    isUser
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted/50 border border-border rounded-bl-sm"
                )}>
                    <div className={cn(
                        "markdown-content prose prose-sm max-w-none break-words",
                        isUser
                            ? "prose-invert"
                            : "prose-neutral dark:prose-invert"
                    )}>
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                code({ node, inline, className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(className || '')
                                    return !inline && match ? (
                                        <div className="overflow-x-auto max-w-full">
                                            <SyntaxHighlighter
                                                style={vscDarkPlus}
                                                language={match[1]}
                                                PreTag="div"
                                                className="rounded-lg text-sm my-2 !bg-[#1e1e1e]"
                                                wrapLongLines={false}
                                                {...props}
                                            >
                                                {String(children).replace(/\n$/, '')}
                                            </SyntaxHighlighter>
                                        </div>
                                    ) : (
                                        <code className={cn("bg-muted/50 px-1.5 py-0.5 rounded text-sm break-all", className)} {...props}>
                                            {children}
                                        </code>
                                    )
                                }
                            }}
                        >
                            {node.content}
                        </ReactMarkdown>
                    </div>
                </div>

                {/* Branch Navigation */}
                {hasSiblings && (
                    <div className="flex items-center gap-1 mt-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            className="h-6 w-6"
                        >
                            <ChevronLeft size={12} />
                        </Button>
                        <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 bg-muted rounded">
                            {currentIndex + 1} / {children.length}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleNext}
                            disabled={currentIndex === children.length - 1}
                            className="h-6 w-6"
                        >
                            <ChevronRight size={12} />
                        </Button>
                    </div>
                )}

                {isOptimistic && (
                    <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Loader2 size={10} className="animate-spin" />
                        Sending...
                    </span>
                )}
            </div>
        </div>
    );
});

MessageItem.displayName = 'MessageItem';

export default ChatWindow;
