import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
    tree: {},      // Record<string, ChatNode>
    activeNodeId: null,
    rootId: null,
    currentSessionId: null,
    sessions: [],
    selectedModel: null,  // Selected model ID

    setSession: (sessionId) => set({ currentSessionId: sessionId }),
    setSelectedModel: (modelId) => set({ selectedModel: modelId }),

    // Load a full history list (linear path)
    loadHistory: (nodes, activeTipId) => {
        const tree = {};
        let root = null;

        // Convert array to map
        nodes.forEach(node => {
            const id = node._id || node.id;
            tree[id] = node;
            if (!node.parent_id) root = id;
        });

        set({
            tree,
            rootId: root,
            activeNodeId: activeTipId
        });
    },

    setActiveNode: (id) => set({ activeNodeId: id }),

    // Actions
    fetchSessions: async () => {
        try {
            const res = await fetch('http://localhost:8000/sessions');
            const data = await res.json();
            // Backend already returns newest first, but ensure it's sorted
            const sorted = [...data].sort((a, b) => {
                const dateA = new Date(a.created_at);
                const dateB = new Date(b.created_at);
                return dateB - dateA; // Descending (newest first)
            });
            set({ sessions: sorted });
        } catch (err) {
            console.error("Failed to fetch sessions", err);
        }
    },

    createSession: async () => {
        try {
            const res = await fetch('http://localhost:8000/sessions', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: "New Chat" })
            });
            const newSession = await res.json();
            set(state => ({
                sessions: [newSession, ...state.sessions],
                currentSessionId: newSession._id || newSession.id,
                activeNodeId: null,
                rootId: null,
                tree: {}
            }));
            return newSession._id || newSession.id;
        } catch (err) {
            console.error("Failed to create session", err);
            return null;
        }
    },

    addNode: (node) => set((state) => ({
        tree: { ...state.tree, [node._id || node.id]: node },
        activeNodeId: node._id || node.id // Auto-switch to new node
    })),

    // Helper to get lineage
    getLineage: () => {
        const { tree, activeNodeId } = get();
        if (!activeNodeId) return [];

        const lineage = [];
        let currentId = activeNodeId;
        // Walk up the tree
        while (currentId && tree[currentId]) {
            lineage.unshift(tree[currentId]);
            currentId = tree[currentId].parent_id;
        }
        return lineage;
    },

    // Helper to get children of a node
    getChildren: (nodeId) => {
        const { tree } = get();
        return Object.values(tree).filter(n => n.parent_id === nodeId);
    }
}));
