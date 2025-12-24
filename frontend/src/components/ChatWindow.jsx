import React, { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../store';
import { Send, ChevronLeft, ChevronRight, GitMerge, GitBranch, ChevronDown, ListTree } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import ModelSelector from './ModelSelector';

const API_URL = "http://localhost:8000";

const ChatWindow = () => {
    const { tree, activeNodeId, setActiveNode, getLineage, getChildren, currentSessionId, loadHistory, fetchSessions, createSession, selectedModel, setSelectedModel } = useChatStore();
    const lineage = getLineage();
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sendMode, setSendMode] = useState('reply'); // 'reply' (child) or 'branch' (sibling)
    const [showDropdown, setShowDropdown] = useState(false);
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
        setShowDropdown(false);
        setIsLoading(true);

        // precise optimistic rendering
        setOptimisticMessage({
            id: 'temp-optimistic',
            role: 'user',
            content: messageContent,
            parent_id: parentId
        });

        try {
            const res = await fetch(`${API_URL}/chat/message`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionId,
                    parent_id: parentId,
                    content: messageContent,
                    role: "user",
                    model: selectedModel || "gemini-2.5-flash"
                })
            });
            const data = await res.json();

            if (data.assistant_node) {
                const historyRes = await fetch(`${API_URL}/chat/history/${data.assistant_node._id || data.assistant_node.id}`);
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
            const res = await fetch(`${API_URL}/chat/squash`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: currentSessionId,
                    node_id: activeNodeId
                })
            });
            const summaryNode = await res.json();

            const historyRes = await fetch(`${API_URL}/chat/history/${summaryNode._id || summaryNode.id}`);
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
        <div className="flex flex-col h-full max-w-4xl mx-auto px-6 py-4">
            {/* Toolbar */}
            <div className="flex justify-between items-center pb-3">
                {/* Model indicator */}
                {selectedModel && (
                    <div className="flex items-center gap-2 text-xs text-claude-secondary px-3 py-1.5 bg-claude-white rounded-lg border border-claude-secondary/30">
                        <span className="font-medium text-claude-text">Model:</span>
                        <span className="font-mono text-claude-text">{selectedModel}</span>
                    </div>
                )}
                <div className="flex justify-end">
                    <button
                        onClick={handleSquash}
                        disabled={isLoading || !activeNodeId}
                        className="text-xs flex items-center gap-1.5 bg-claude-white
                            text-claude-text px-4 py-2 rounded-lg border border-claude-secondary/30
                            hover:bg-claude-light hover:border-claude-primary/40 hover:shadow-sm
                            transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
                            font-medium"
                        title="Summarize current branch into a single node"
                    >
                        <GitMerge size={14} />
                        Squash / Summarize
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-6 pb-4 scroll-smooth pr-2">
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
                        <div className="glass rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-3 shadow-lg shadow-claude-secondary/10 border border-claude-secondary/30">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-claude-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 bg-claude-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-claude-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                            <span className="text-sm font-medium text-claude-secondary">Thinking...</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-claude-secondary/30 pt-4 mt-2">
                <div className="flex flex-col gap-2.5">
                    {/* Branch Context Info */}
                    {activeNodeId && (
                        <div className="flex items-center gap-2 text-xs text-claude-secondary px-1">
                            <GitBranch size={12} />
                            <span>
                                {sendMode === 'reply' ? 'Extending' : 'Branching off parent of'}:
                                <span className="font-mono bg-claude-light px-1.5 py-0.5 rounded text-claude-primary ml-1">
                                    {String(activeNodeId).slice(-6)}
                                </span>
                            </span>
                        </div>
                    )}

                    <div className="flex gap-3 items-end">
                        {/* Input */}
                        <div className="flex-1 relative">
                            <textarea
                                className="w-full border border-claude-secondary/40 rounded-xl px-4 py-3
                                    focus:outline-none focus:ring-2 focus:ring-claude-primary/40 focus:border-claude-primary/60
                                    disabled:bg-claude-light disabled:text-claude-secondary
                                    resize-none shadow-sm bg-claude-white/80 backdrop-blur-sm
                                    placeholder:text-claude-secondary text-claude-text
                                    transition-all duration-200"
                                rows={1}
                                style={{ minHeight: '48px' }}
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
                            <div className="flex items-center shadow-lg shadow-claude-primary/20 rounded-xl overflow-hidden">
                                <button
                                    onClick={sendMessage}
                                    className="gradient-primary text-white px-4 py-3
                                        hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed
                                        flex items-center justify-center transition-all duration-200
                                        active:scale-95"
                                    disabled={!input.trim() || isLoading}
                                    title={sendMode === 'reply' ? "Send Message" : "Create New Branch"}
                                >
                                    {sendMode === 'reply' ? <Send size={18} /> : <GitBranch size={18} />}
                                </button>
                                <div className="w-px h-6 bg-white/30"></div>
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="gradient-primary text-white px-2 py-3
                                        hover:brightness-110 disabled:opacity-50
                                        flex items-center justify-center transition-all duration-200"
                                    disabled={isLoading}
                                >
                                    <ChevronDown size={16} className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                                </button>
                            </div>

                            {/* Dropdown Menu */}
                            {showDropdown && (
                                <div className="absolute bottom-14 right-0 bg-claude-white/95 backdrop-blur-xl shadow-2xl shadow-claude-secondary/20
                                    border border-claude-secondary/30 rounded-xl p-1.5 min-w-[220px] z-20 animate-slide-in-from-bottom">
                                    <button
                                        className={`w-full text-left px-3 py-2.5 text-sm rounded-lg flex items-center gap-3 transition-all duration-150
                                            ${sendMode === 'reply'
                                                ? 'bg-claude-primary/10 text-claude-text ring-1 ring-claude-primary/30'
                                                : 'hover:bg-claude-light text-claude-text'}`}
                                        onClick={() => { setSendMode('reply'); setShowDropdown(false); }}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                                            ${sendMode === 'reply' ? 'bg-claude-primary/20' : 'bg-claude-light'}`}>
                                            <Send size={14} />
                                        </div>
                                        <div>
                                            <div className="font-semibold">Reply</div>
                                            <div className="text-xs text-claude-secondary">Continue this conversation</div>
                                        </div>
                                    </button>
                                    <button
                                        className={`w-full text-left px-3 py-2.5 text-sm rounded-lg flex items-center gap-3 transition-all duration-150 mt-1
                                            ${sendMode === 'branch'
                                                ? 'bg-claude-primary/10 text-claude-text ring-1 ring-claude-primary/30'
                                                : 'hover:bg-claude-light text-claude-text'}`}
                                        onClick={() => { setSendMode('branch'); setShowDropdown(false); }}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                                            ${sendMode === 'branch' ? 'bg-claude-primary/20' : 'bg-claude-light'}`}>
                                            <GitBranch size={14} />
                                        </div>
                                        <div>
                                            <div className="font-semibold">New Branch</div>
                                            <div className="text-xs text-claude-secondary">Split from previous node</div>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
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

    return (
        <div
            className={`group flex flex-col ${isUser ? 'items-end' : 'items-start'} ${isOptimistic ? 'opacity-60' : ''} animate-slide-up`}
            style={{ animationDelay: `${animationDelay}ms` }}
        >
            <div className={`
                max-w-[85%] rounded-2xl px-5 py-3.5 relative
                transition-all duration-200
                ${isUser
                    ? 'bg-claude-white text-claude-text rounded-br-sm shadow-lg shadow-claude-secondary/10 border border-claude-secondary/20'
                    : 'bg-claude-primary text-white rounded-bl-sm shadow-lg shadow-claude-secondary/20'
                }
            `}>
                <div className={`markdown-content ${isUser ? '' : 'prose-invert'}`}>
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
                                        className="rounded-lg text-sm my-2 !bg-claude-primary/90"
                                        {...props}
                                    >
                                        {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                ) : (
                                    <code className={`${className} bg-claude-primary/20 text-claude-text px-1.5 py-0.5 rounded text-sm font-mono`} {...props}>
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
                        <button
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            className="p-1.5 rounded-lg bg-claude-white border border-claude-secondary/30 shadow-sm
                                hover:bg-claude-light hover:border-claude-primary/40 disabled:opacity-30
                                transition-all duration-150 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={12} className="text-claude-text" />
                        </button>
                        <span className="bg-claude-white border border-claude-secondary/30 px-2.5 py-1 rounded-lg text-xs font-medium text-claude-text shadow-sm">
                            {currentIndex + 1} / {children.length}
                        </span>
                        <button
                            onClick={handleNext}
                            disabled={currentIndex === children.length - 1}
                            className="p-1.5 rounded-lg bg-claude-white border border-claude-secondary/30 shadow-sm
                                hover:bg-claude-light hover:border-claude-primary/40 disabled:opacity-30
                                transition-all duration-150 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={12} className="text-claude-text" />
                        </button>
                    </div>
                )}
            </div>
            {isOptimistic && <div className="text-xs text-claude-secondary mt-1.5 mr-2 font-medium">Sending...</div>}
        </div>
    );
};

export default ChatWindow;
