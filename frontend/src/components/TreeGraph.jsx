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
                ? 'ring-2 ring-blue-500 ring-offset-2 border-blue-400 shadow-xl shadow-blue-500/20 scale-105'
                : 'border-slate-200/80 bg-white/90 shadow-lg shadow-slate-100/50 hover:shadow-xl hover:scale-[1.02] hover:border-slate-300'
            }`}
        >
            {/* User Part (Top) */}
            <div className={`p-3 border-b truncate font-medium
                ${data.active
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 text-blue-800'
                    : 'bg-slate-50/80 border-slate-100 text-slate-700'
                }`}>
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${data.active ? 'bg-blue-500' : 'bg-slate-400'}`}></div>
                    <span className="truncate">{data.userContent || "(No input)"}</span>
                </div>
            </div>

            {/* AI Part (Bottom) */}
            <div className={`p-3 truncate bg-white/80
                ${!data.aiContent ? 'italic text-slate-400' : 'text-slate-600'}
            `}>
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${data.aiContent ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`}></div>
                    <span className="truncate">{data.aiContent || "(Thinking...)"}</span>
                </div>
            </div>

            <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2.5 !h-2.5 !border-2 !border-white" />
            <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-2.5 !h-2.5 !border-2 !border-white" />
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
                            markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
                            animated: false,
                            style: { stroke: '#cbd5e1', strokeWidth: 2 }
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
            className="bg-gradient-to-br from-slate-50 to-slate-100"
        >
            <Background color="#e2e8f0" gap={20} size={1} />
            <Controls className="!bg-white/90 !border-slate-200 !shadow-lg !rounded-xl overflow-hidden" />
        </ReactFlow>
    );
};

// Wrapper Component
const TreeGraph = () => (
    <div className="h-full w-full bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <ReactFlowProvider>
            <TreeGraphContent />
        </ReactFlowProvider>
    </div>
);

export default TreeGraph;
