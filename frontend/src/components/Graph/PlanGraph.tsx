import { useEffect } from "react";
import ReactFlow, { Background, Controls, useNodesState, useEdgesState, BackgroundVariant } from "reactflow";
import "reactflow/dist/style.css";
import PlanNode from "./PlanNode";

const nodeTypes = {
  custom: PlanNode,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PlanGraph = ({ nodes: initialNodes, edges: initialEdges }: any) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges || []);

  useEffect(() => {
    setNodes(initialNodes || []);
    setEdges(initialEdges || []);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Lines} gap={24} size={1} color="#ffffff10" />
        <Controls className="!bg-surface-low !border-surface-bright/10 !fill-white [&>button]:!border-surface-bright/10 [&>button]:!bg-surface-low hover:[&>button]:!bg-primary/20" />
      </ReactFlow>
    </div>
  );
};

export default PlanGraph;
