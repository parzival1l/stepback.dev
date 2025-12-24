import React, { useEffect, useMemo, useCallback } from 'react';
import ReactFlow, {
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    Handle,
    Position,
    MarkerType,
    useReactFlow,
    ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useChatStore } from '../store';
import dagre from 'dagre';

const nodeWidth = 220;
const nodeHeight = 90;

// Custom Node for Atomic Display (User + AI)
const CustomNode = ({ data }) => {
    return (
        <div className={`flex flex-col rounded-xl border text-xs w-[220px] overflow-hidden cursor-pointer
            transition-all duration-200 backdrop-blur-sm
            ${data.active
                ? 'ring-2 ring-claude-primary ring-offset-2 ring-offset-background border-claude-primary shadow-xl shadow-claude-primary/20 scale-105'
                : 'border-border bg-card shadow-lg shadow-muted/50 hover:shadow-xl hover:scale-[1.02] hover:border-muted-foreground/50'
            }`}
        >
            {/* User Part (Top) */}
            <div className={`p-3 border-b truncate font-medium
                ${data.active
                    ? 'bg-claude-primary/10 border-claude-primary/30 text-claude-text'
                    : 'bg-muted/50 border-border text-claude-text'
                }`}>
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${data.active ? 'bg-claude-primary' : 'bg-muted-foreground'}`}></div>
                    <span className="truncate">{data.userContent || "(No input)"}</span>
                </div>
            </div>

            {/* AI Part (Bottom) */}
            <div className={`p-3 truncate bg-card
                ${!data.aiContent ? 'italic text-muted-foreground' : 'text-claude-text'}
            `}>
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${data.aiContent ? 'bg-claude-primary' : 'bg-chart-5 animate-pulse'}`}></div>
                    <span className="truncate">{data.aiContent || "(Thinking...)"}</span>
                </div>
            </div>

            <Handle type="target" position={Position.Top} className="!bg-muted-foreground !w-2.5 !h-2.5 !border-2 !border-card" />
            <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground !w-2.5 !h-2.5 !border-2 !border-card" />
        </div>
    );
};

const nodeTypes = { custom: CustomNode };

const getLayoutedElements = (nodes, edges) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80 }); // Increased spacing

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };
    });

    return { nodes, edges };
};

const TreeGraphContent = () => {
    const { tree, currentSessionId, activeNodeId, loadHistory } = useChatStore();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { fitView } = useReactFlow();

    useEffect(() => {
        if (!currentSessionId) return;

        const fetchTree = async () => {
            try {
                const res = await fetch(`http://localhost:8000/session/${currentSessionId}/tree`);
                const data = await res.json();

                // --- ATOMIC TRANSFORMATION LOGIC ---
                const nodeMap = {};
                const childrenMap = {};
                data.forEach(n => {
                    const id = n._id || n.id;
                    nodeMap[id] = n;
                    if (n.parent_id) {
                        if (!childrenMap[n.parent_id]) childrenMap[n.parent_id] = [];
                        childrenMap[n.parent_id].push(id);
                    }
                });

                const atomicNodes = [];
                const atomicEdges = [];

                const findUserParent = (startNodeId) => {
                    let curr = nodeMap[startNodeId];
                    while (curr && curr.role !== 'user' && curr.parent_id) {
                        curr = nodeMap[curr.parent_id];
                    }
                    return curr && curr.role === 'user' ? curr : null;
                };

                const findVisualParentId = (userNode) => {
                    if (!userNode || !userNode.parent_id) return null;
                    return userNode.parent_id;
                };

                const processedUserIds = new Set();

                // STRATEGY: Iterate Assistant Nodes (Completed Turns)
                data.filter(n => n.role === 'assistant').forEach(assistantNode => {
                    const userNode = findUserParent(assistantNode.parent_id);
                    if (!userNode) return;

                    const assistantId = assistantNode._id || assistantNode.id;
                    const userId = userNode._id || userNode.id;

                    processedUserIds.add(userId);

                    atomicNodes.push({
                        id: assistantId,
                        type: 'custom',
                        data: {
                            userContent: userNode.content,
                            aiContent: assistantNode.content,
                            tailId: assistantId
                        },
                        position: { x: 0, y: 0 },
                        tempParentId: findVisualParentId(userNode)
                    });
                });

                // STRATEGY: Find Unanswered User Nodes (Incomplete Turns)
                data.filter(n => n.role === 'user').forEach(userNode => {
                    const userId = userNode._id || userNode.id;
                    if (processedUserIds.has(userId)) return;

                    atomicNodes.push({
                        id: userId,
                        type: 'custom',
                        data: {
                            userContent: userNode.content,
                            aiContent: null,
                            tailId: userId
                        },
                        position: { x: 0, y: 0 },
                        tempParentId: findVisualParentId(userNode)
                    });
                });

                // Build Edges
                const atomicNodeIds = new Set(atomicNodes.map(n => n.id));

                atomicNodes.forEach(node => {
                    let targetId = node.tempParentId;

                    while (targetId && !atomicNodeIds.has(targetId)) {
                        const targetNode = nodeMap[targetId];
                        if (!targetNode) {
                            targetId = null;
                            break;
                        }
                        targetId = targetNode.parent_id;
                    }

                    if (targetId && atomicNodeIds.has(targetId)) {
                        atomicEdges.push({
                            id: `e${targetId}-${node.id}`,
                            source: targetId,
                            target: node.id,
                            type: 'smoothstep',
                            markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--muted-foreground)' },
                            animated: false,
                            style: { stroke: 'var(--border)', strokeWidth: 2 }
                        });
                    }
                });

                const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                    atomicNodes,
                    atomicEdges
                );

                setNodes(layoutedNodes);
                setEdges(layoutedEdges);

                setTimeout(() => {
                    fitView({ duration: 800, padding: 0.3 });
                }, 100);

            } catch (err) {
                console.error("Failed to fetch/transform tree", err);
            }
        };

        fetchTree();
        const handleRefresh = () => fetchTree();
        window.addEventListener('session-updated', handleRefresh);
        return () => window.removeEventListener('session-updated', handleRefresh);

    }, [currentSessionId, setNodes, setEdges, fitView]);

    // Effect 2: Update Active Highlight (Fast, No Refetch)
    useEffect(() => {
        setNodes((nds) =>
            nds.map((node) => {
                const isActive = (node.data.tailId === activeNodeId) ||
                    (node.data.tailId === activeNodeId);

                return {
                    ...node,
                    data: {
                        ...node.data,
                        active: isActive,
                    },
                };
            })
        );
    }, [activeNodeId, setNodes]);


    const onNodeClick = useCallback(async (event, node) => {
        const targetId = node.data.tailId;
        const res = await fetch(`http://localhost:8000/chat/history/${targetId}`);
        const history = await res.json();
        const { loadHistory } = useChatStore.getState();
        loadHistory(history, targetId);
    }, []);

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            attributionPosition="bottom-right"
            minZoom={0.1}
            className="bg-background"
        >
            <Background color="var(--border)" gap={20} size={1} />
            <Controls className="!bg-card/90 !border-border !shadow-lg !rounded-xl overflow-hidden [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-claude-text [&>button:hover]:!bg-muted" />
        </ReactFlow>
    );
};

// Wrapper Component
const TreeGraph = () => (
    <div className="h-full w-full bg-background">
        <ReactFlowProvider>
            <TreeGraphContent />
        </ReactFlowProvider>
    </div>
);

export default TreeGraph;
