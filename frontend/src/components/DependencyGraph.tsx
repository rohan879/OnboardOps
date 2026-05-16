'use client';

import { useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-ibm-gray-70">Loading graph...</div>
    </div>
  ),
});

export interface GraphNode {
  id: string;
  name: string;
  group?: number;
  val?: number;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  value?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface DependencyGraphProps {
  data: GraphData;
  width?: number;
  height?: number;
}

export function DependencyGraph({ data, width = 800, height = 600 }: DependencyGraphProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);
  
  // Use useMemo to avoid setState in effect
  const graphData = useMemo(() => ({
    nodes: data.nodes.map(node => ({
      ...node,
      val: node.val || 10,
    })),
    links: data.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      value: edge.value || 1,
    })),
  }), [data]);

  useEffect(() => {
    // Center the graph after initial render
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 50);
    }
  }, [graphData]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-full bg-white rounded-lg overflow-hidden"
      style={{ minHeight: height }}
    >
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={width}
        height={height}
        nodeLabel="name"
        nodeAutoColorBy="group"
        nodeCanvasObject={(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          node: any,
          ctx: CanvasRenderingContext2D,
          globalScale: number
        ) => {
          const label = node.name as string;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px IBM Plex Sans, sans-serif`;
          
          const x = node.x ?? 0;
          const y = node.y ?? 0;
          const val = node.val || 5;
          
          // Draw node circle
          ctx.beginPath();
          ctx.arc(x, y, val, 0, 2 * Math.PI, false);
          ctx.fillStyle = '#0F62FE'; // IBM Blue 60
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2 / globalScale;
          ctx.stroke();

          // Draw label
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#161616'; // IBM Gray 100
          ctx.fillText(label, x, y + val + fontSize + 2);
        }}
        linkColor={() => '#525252'} // IBM Gray 70
        linkWidth={2}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.005}
        backgroundColor="#FFFFFF"
        cooldownTicks={100}
        onEngineStop={() => {
          if (graphRef.current) {
            graphRef.current.zoomToFit(400, 50);
          }
        }}
      />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-ibm-gray-10 shadow-sm">
        <div className="text-xs font-semibold text-ibm-gray-100 mb-2">Legend</div>
        <div className="flex items-center gap-2 text-xs text-ibm-gray-70">
          <div className="w-3 h-3 rounded-full bg-ibm-blue-60"></div>
          <span>Module</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-ibm-gray-70 mt-1">
          <div className="w-8 h-0.5 bg-ibm-gray-70"></div>
          <span>Import</span>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-ibm-gray-10 shadow-sm">
        <div className="text-xs font-semibold text-ibm-gray-100 mb-2">Graph Stats</div>
        <div className="text-xs text-ibm-gray-70">
          <div>Nodes: {data.nodes.length}</div>
          <div>Edges: {data.edges.length}</div>
        </div>
      </div>
    </motion.div>
  );
}

// Made with Bob
