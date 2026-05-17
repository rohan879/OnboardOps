'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRightLeft,
  EyeOff,
  Layers3,
  Minus,
  Move,
  Plus,
  Radar,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

type GraphRole = 'orchestrator' | 'bridge' | 'shared' | 'leaf';
type GraphArea = 'Backend' | 'Frontend' | 'Infrastructure' | 'Tools';

export interface GraphNode {
  id: string;
  name: string;
  group?: number;
  val?: number;
  x?: number;
  y?: number;
  fanIn?: number;
  fanOut?: number;
  role?: GraphRole;
}

export interface GraphEdge {
  source: string;
  target: string;
  value?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  cycles?: string[];
}

interface DependencyGraphProps {
  data: GraphData;
  width?: number;
  height?: number;
}

interface DerivedNode extends GraphNode {
  fanIn: number;
  fanOut: number;
  totalDegree: number;
  importance: number;
  role: GraphRole;
  area: GraphArea;
}

interface PositionedNode extends DerivedNode {
  xPx: number;
  yPx: number;
}

interface SurfaceSize {
  width: number;
  height: number;
}

interface VisibleGraph {
  visibleNodes: PositionedNode[];
  visibleLinks: GraphEdge[];
  hiddenNodes: DerivedNode[];
  hiddenClusterCount: number;
  topOrchestrator: DerivedNode | null;
  topShared: DerivedNode | null;
  topBridge: DerivedNode | null;
  cycles: string[];
}

const roleStyles: Record<
  GraphRole,
  {
    dot: string;
    card: string;
    border: string;
    text: string;
    label: string;
  }
> = {
  orchestrator: {
    dot: '#0F62FE',
    card: 'bg-[linear-gradient(180deg,#ffffff,rgba(15,98,254,0.05))]',
    border: 'border-ibm-blue-60/25',
    text: 'text-ibm-blue-60',
    label: 'Orchestrator',
  },
  bridge: {
    dot: '#FF832B',
    card: 'bg-[linear-gradient(180deg,#ffffff,rgba(255,131,43,0.07))]',
    border: 'border-ibm-orange-40/30',
    text: 'text-ibm-orange-40',
    label: 'Bridge',
  },
  shared: {
    dot: '#08BDBA',
    card: 'bg-[linear-gradient(180deg,#ffffff,rgba(8,189,186,0.06))]',
    border: 'border-ibm-teal-50/30',
    text: 'text-ibm-teal-50',
    label: 'Shared dependency',
  },
  leaf: {
    dot: '#8D8D8D',
    card: 'bg-[linear-gradient(180deg,#ffffff,rgba(141,141,141,0.05))]',
    border: 'border-ibm-gray-30',
    text: 'text-ibm-gray-70',
    label: 'Leaf',
  },
};

const roleOrder: GraphRole[] = ['orchestrator', 'bridge', 'shared', 'leaf'];
const roleXPercent: Record<GraphRole, number> = {
  orchestrator: 0.16,
  bridge: 0.41,
  shared: 0.66,
  leaf: 0.88,
};

function deriveRole(fanIn: number, fanOut: number): GraphRole {
  if (fanOut >= fanIn + 2 || fanOut >= 4) return 'orchestrator';
  if (fanIn > 0 && fanOut > 0) return 'bridge';
  if (fanIn >= 3) return 'shared';
  return 'leaf';
}

function deriveArea(name: string): GraphArea {
  const normalized = name.replace(/\\/g, '/').toLowerCase();

  if (normalized.includes('frontend/')) return 'Frontend';
  if (normalized.includes('tools/')) return 'Tools';
  if (
    normalized.includes('session_') ||
    normalized.includes('cache_') ||
    normalized.includes('observability') ||
    normalized.includes('allowlist') ||
    normalized.includes('ws/')
  ) {
    return 'Infrastructure';
  }

  return 'Backend';
}

function formatNodeName(name: string) {
  return name.replace(/\\/g, '/').split('/').pop() || name;
}

function buildComponents(
  nodes: DerivedNode[],
  neighborMap: Map<string, Set<string>>
) {
  const visited = new Set<string>();
  const components: string[][] = [];

  for (const node of nodes) {
    if (visited.has(node.id)) continue;

    const queue = [node.id];
    const component: string[] = [];
    visited.add(node.id);

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;
      component.push(current);

      for (const neighbor of neighborMap.get(current) || []) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }

    components.push(component);
  }

  return components;
}

function sumBy<T>(items: T[], accessor: (item: T) => number) {
  return items.reduce((total, item) => total + accessor(item), 0);
}

function clippedItems(values: string[], max = 3) {
  return values.slice(0, max).join(', ');
}

function makeVisibleGraph(data: GraphData, height: number): VisibleGraph {
  const nodesById = new Map<string, GraphNode>();
  const inboundCounts = new Map<string, number>();
  const outboundCounts = new Map<string, number>();
  const neighborMap = new Map<string, Set<string>>();

  data.nodes.forEach((node) => {
    nodesById.set(node.id, node);
    inboundCounts.set(node.id, node.fanIn || 0);
    outboundCounts.set(node.id, node.fanOut || 0);
    neighborMap.set(node.id, new Set());
  });

  const normalizedLinks = data.edges
    .filter((edge) => edge.source && edge.target)
    .map((edge) => {
      const source = String(edge.source);
      const target = String(edge.target);

      if (!nodesById.has(source)) nodesById.set(source, { id: source, name: source });
      if (!nodesById.has(target)) nodesById.set(target, { id: target, name: target });

      neighborMap.set(source, neighborMap.get(source) || new Set());
      neighborMap.set(target, neighborMap.get(target) || new Set());
      neighborMap.get(source)?.add(target);
      neighborMap.get(target)?.add(source);

      inboundCounts.set(target, (inboundCounts.get(target) || 0) + 1);
      outboundCounts.set(source, (outboundCounts.get(source) || 0) + 1);

      return { source, target, value: edge.value || 1 };
    });

  const derivedNodes = Array.from(nodesById.values()).map((node) => {
    const fanIn = Math.max(node.fanIn || 0, inboundCounts.get(node.id) || 0);
    const fanOut = Math.max(node.fanOut || 0, outboundCounts.get(node.id) || 0);
    const totalDegree = fanIn + fanOut;

    return {
      ...node,
      fanIn,
      fanOut,
      totalDegree,
      importance: fanOut * 2 + fanIn,
      role: node.role || deriveRole(fanIn, fanOut),
      area: deriveArea(node.name),
    } satisfies DerivedNode;
  });

  const components = buildComponents(derivedNodes, neighborMap);
  const primaryComponent = [...components].sort((left, right) => {
    const leftNodes = derivedNodes.filter((node) => left.includes(node.id));
    const rightNodes = derivedNodes.filter((node) => right.includes(node.id));
    const leftScore = left.length * 10 + sumBy(leftNodes, (node) => node.importance);
    const rightScore =
      right.length * 10 + sumBy(rightNodes, (node) => node.importance);
    return rightScore - leftScore;
  })[0] || [];

  const primaryNodeSet = new Set(primaryComponent);
  const primaryNodes = derivedNodes.filter((node) => primaryNodeSet.has(node.id));
  const sortedByImportance = [...primaryNodes].sort(
    (left, right) => right.importance - left.importance
  );
  const topOrchestrator =
    [...primaryNodes]
      .filter((node) => node.role === 'orchestrator')
      .sort((left, right) => right.fanOut - left.fanOut)[0] || null;
  const topShared =
    [...primaryNodes]
      .filter((node) => node.role === 'shared')
      .sort((left, right) => right.fanIn - left.fanIn)[0] || null;
  const topBridge =
    [...primaryNodes]
      .filter((node) => node.role === 'bridge')
      .sort((left, right) => right.totalDegree - left.totalDegree)[0] || null;

  const cycleNodeIds = new Set(
    (data.cycles || [])
      .flatMap((cycle) => cycle.split('->').map((segment) => segment.trim()))
      .filter(Boolean)
  );

  const visibleNodeIds = new Set<string>();
  const maxVisibleNodes = 10;

  [
    topOrchestrator?.id,
    topShared?.id,
    topBridge?.id,
    ...sortedByImportance.slice(0, 4).map((node) => node.id),
  ]
    .filter((nodeId): nodeId is string => Boolean(nodeId))
    .forEach((nodeId) => visibleNodeIds.add(nodeId));

  for (const nodeId of cycleNodeIds) {
    if (primaryNodeSet.has(nodeId)) visibleNodeIds.add(nodeId);
  }

  const expansionSeeds = [...visibleNodeIds];
  for (const seedId of expansionSeeds) {
    const neighbors = [...(neighborMap.get(seedId) || [])]
      .filter((neighborId) => primaryNodeSet.has(neighborId))
      .sort((left, right) => {
        const leftNode = primaryNodes.find((node) => node.id === left);
        const rightNode = primaryNodes.find((node) => node.id === right);
        return (rightNode?.importance || 0) - (leftNode?.importance || 0);
      });

    for (const neighborId of neighbors) {
      if (visibleNodeIds.size >= maxVisibleNodes) break;
      visibleNodeIds.add(neighborId);
    }
  }

  for (const node of sortedByImportance) {
    if (visibleNodeIds.size >= maxVisibleNodes) break;
    visibleNodeIds.add(node.id);
  }

  const visibleNodesBase = primaryNodes.filter((node) => visibleNodeIds.has(node.id));
  const visibleLinks = normalizedLinks.filter(
    (link) => visibleNodeIds.has(link.source) && visibleNodeIds.has(link.target)
  );
  const hiddenNodes = derivedNodes.filter((node) => !visibleNodeIds.has(node.id));
  const hiddenClusterCount = Math.max(0, components.length - 1);

  const buckets = new Map<GraphRole, DerivedNode[]>();
  for (const role of roleOrder) buckets.set(role, []);

  [...visibleNodesBase]
    .sort((left, right) => {
      if (left.role !== right.role) {
        return roleOrder.indexOf(left.role) - roleOrder.indexOf(right.role);
      }
      return right.importance - left.importance;
    })
    .forEach((node) => {
      buckets.get(node.role)?.push(node);
    });

  const positionedNodes: PositionedNode[] = [];
  for (const role of roleOrder) {
    const bucket = buckets.get(role) || [];
    const topPadding = 96;
    const bottomPadding = 56;
    const usableHeight = Math.max(120, height - topPadding - bottomPadding);
    const step = bucket.length <= 1 ? 0 : usableHeight / (bucket.length - 1);

    bucket.forEach((node, index) => {
      positionedNodes.push({
        ...node,
        xPx: roleXPercent[role] * 100,
        yPx:
          bucket.length <= 1
            ? topPadding + usableHeight / 2
            : topPadding + step * index,
      });
    });
  }

  return {
    visibleNodes: positionedNodes,
    visibleLinks,
    hiddenNodes,
    hiddenClusterCount,
    topOrchestrator,
    topShared,
    topBridge,
    cycles: data.cycles || [],
  };
}

function rectangleEdgePoint(
  from: { x: number; y: number },
  to: { x: number; y: number },
  halfWidth: number,
  halfHeight: number
) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (dx === 0 && dy === 0) {
    return from;
  }

  const horizontalScale = dx === 0 ? Number.POSITIVE_INFINITY : halfWidth / Math.abs(dx);
  const verticalScale = dy === 0 ? Number.POSITIVE_INFINITY : halfHeight / Math.abs(dy);
  const scale = Math.min(horizontalScale, verticalScale);

  return {
    x: from.x + dx * scale,
    y: from.y + dy * scale,
  };
}

function edgePathBetweenCards(
  source: PositionedNode,
  target: PositionedNode,
  surfaceWidth: number
) {
  const cardWidth = Math.max(7.6, (164 / Math.max(surfaceWidth, 320)) * 100);
  const cardHeight = 38;
  const start = rectangleEdgePoint(
    { x: source.xPx, y: source.yPx },
    { x: target.xPx, y: target.yPx },
    cardWidth / 2,
    cardHeight
  );
  const end = rectangleEdgePoint(
    { x: target.xPx, y: target.yPx },
    { x: source.xPx, y: source.yPx },
    cardWidth / 2,
    cardHeight
  );
  const backoffX = start.x === end.x ? 0 : ((end.x - start.x) / Math.abs(end.x - start.x)) * 1.15;
  const backoffY = end.y === start.y ? 0 : ((end.y - start.y) / Math.abs(end.y - start.y)) * 4;
  const arrowEnd = {
    x: end.x - backoffX,
    y: end.y - backoffY,
  };
  const bend = Math.max(10, Math.abs(arrowEnd.x - start.x) * 0.35);
  const control1X = start.x + bend;
  const control2X = arrowEnd.x - bend;

  return `M ${start.x} ${start.y} C ${control1X} ${start.y}, ${control2X} ${arrowEnd.y}, ${arrowEnd.x} ${arrowEnd.y}`;
}

const DEFAULT_VIEWPORT = {
  x: 0,
  y: 0,
  scale: 1,
};

export function DependencyGraph({
  data,
  height = 440,
}: DependencyGraphProps) {
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [viewport, setViewport] = useState(DEFAULT_VIEWPORT);
  const [isDragging, setIsDragging] = useState(false);
  const [nodePositions, setNodePositions] = useState<Record<
    string,
    { xPx: number; yPx: number }
  >>({});
  const [surfaceSize, setSurfaceSize] = useState<SurfaceSize>({
    width: 1280,
    height,
  });
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const nodeDragStateRef = useRef<{
    pointerId: number;
    nodeId: string;
    startClientX: number;
    startClientY: number;
    startNodeX: number;
    startNodeY: number;
    didMove: boolean;
  } | null>(null);
  const suppressedClickNodeRef = useRef<string | null>(null);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const markerBaseId = useId().replace(/:/g, '');
  const stageHeight = Math.max(440, height);
  const layoutHeight = Math.max(360, stageHeight - 48);

  const graph = useMemo(
    () => makeVisibleGraph(data, layoutHeight),
    [data, layoutHeight]
  );
  const displayNodes = useMemo(
    () =>
      graph.visibleNodes.map((node) => ({
        ...node,
        ...(nodePositions[node.id] || {}),
      })),
    [graph.visibleNodes, nodePositions]
  );
  const displayNodeMap = useMemo(
    () => new Map(displayNodes.map((node) => [node.id, node])),
    [displayNodes]
  );
  const focusedNode =
    (focusedNodeId ? displayNodeMap.get(focusedNodeId) : null) ||
    graph.topOrchestrator ||
    displayNodes[0] ||
    null;

  const connectedNodeIds = useMemo(() => {
    if (!focusedNode) return new Set<string>();

    const ids = new Set<string>([focusedNode.id]);
    graph.visibleLinks.forEach((link) => {
      if (link.source === focusedNode.id) ids.add(link.target);
      if (link.target === focusedNode.id) ids.add(link.source);
    });
    return ids;
  }, [focusedNode, graph.visibleLinks]);

  const hiddenAreaSummary = useMemo(() => {
    if (graph.hiddenNodes.length === 0) return 'No modules hidden in this focused view.';

    const counts = new Map<GraphArea, number>();
    graph.hiddenNodes.forEach((node) => {
      counts.set(node.area, (counts.get(node.area) || 0) + 1);
    });

    const sortedAreas = [...counts.entries()].sort((left, right) => right[1] - left[1]);
    return `${graph.hiddenNodes.length} lower-signal modules hidden, mostly from ${clippedItems(
      sortedAreas.map(([area, count]) => `${area} (${count})`)
    )}.`;
  }, [graph.hiddenNodes]);

  const insights = useMemo(() => {
    const messages: Array<{ title: string; detail: string; tone: string }> = [];

    if (graph.topOrchestrator) {
      messages.push({
        title: 'Main orchestrator',
        detail: `${formatNodeName(graph.topOrchestrator.name)} fans out to ${graph.topOrchestrator.fanOut} modules, so it is the best place to understand request coordination first.`,
        tone: 'text-ibm-blue-60',
      });
    }

    if (graph.topShared) {
      messages.push({
        title: 'Shared dependency',
        detail: `${formatNodeName(graph.topShared.name)} has the strongest inbound pull in the visible graph, which makes it a likely cross-cutting dependency.`,
        tone: 'text-ibm-teal-50',
      });
    } else if (graph.topBridge) {
      messages.push({
        title: 'Bridge module',
        detail: `${formatNodeName(graph.topBridge.name)} sits between active areas of the codebase, which makes it a useful integration checkpoint.`,
        tone: 'text-ibm-orange-40',
      });
    }

    if (graph.cycles.length > 0) {
      messages.push({
        title: 'Cycle watch',
        detail: `The graph still shows a dependency loop: ${graph.cycles[0]}.`,
        tone: 'text-ibm-orange-40',
      });
    } else {
      messages.push({
        title: 'Noise reduced',
        detail: hiddenAreaSummary,
        tone: 'text-ibm-gray-70',
      });
    }

    return messages.slice(0, 3);
  }, [graph.topOrchestrator, graph.topShared, graph.topBridge, graph.cycles, hiddenAreaSummary]);

  const clampScale = useCallback((value: number) => {
    return Math.min(1.9, Math.max(0.8, Number(value.toFixed(2))));
  }, []);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;

    const updateSurfaceSize = () => {
      setSurfaceSize({
        width: surface.clientWidth || 1280,
        height: surface.clientHeight || layoutHeight,
      });
    };

    updateSurfaceSize();

    const observer = new ResizeObserver(updateSurfaceSize);
    observer.observe(surface);

    return () => {
      observer.disconnect();
    };
  }, [layoutHeight]);

  const adjustZoom = useCallback(
    (delta: number, origin?: { x: number; y: number }) => {
      setViewport((current) => {
        const nextScale = clampScale(current.scale + delta);
        if (nextScale === current.scale) return current;

        if (!origin) {
          return {
            ...current,
            scale: nextScale,
          };
        }

        const ratio = nextScale / current.scale;
        return {
          scale: nextScale,
          x: origin.x - (origin.x - current.x) * ratio,
          y: origin.y - (origin.y - current.y) * ratio,
        };
      });
    },
    [clampScale]
  );

  const resetViewport = useCallback(() => {
    dragStateRef.current = null;
    setIsDragging(false);
    setViewport(DEFAULT_VIEWPORT);
  }, []);

  const zoomFromCenter = useCallback(
    (delta: number) => {
      const width = surfaceRef.current?.clientWidth || 0;
      const heightValue = surfaceRef.current?.clientHeight || 0;
      adjustZoom(delta, {
        x: width / 2,
        y: heightValue / 2,
      });
    },
    [adjustZoom]
  );

  const handleCanvasWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      adjustZoom(event.deltaY < 0 ? 0.14 : -0.14, {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    },
    [adjustZoom]
  );

  const endDrag = useCallback((event?: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (
      event &&
      dragState &&
      dragState.pointerId === event.pointerId &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragStateRef.current = null;
    setIsDragging(false);
  }, []);

  const endNodeDrag = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>, nodeId: string) => {
      const dragState = nodeDragStateRef.current;
      if (
        dragState &&
        dragState.pointerId === event.pointerId &&
        event.currentTarget.hasPointerCapture(event.pointerId)
      ) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (dragState?.didMove) {
        suppressedClickNodeRef.current = nodeId;
      }

      nodeDragStateRef.current = null;
    },
    []
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      if (
        target.closest('[data-graph-node="true"]') ||
        target.closest('[data-graph-control="true"]')
      ) {
        return;
      }

      dragStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: viewport.x,
        originY: viewport.y,
      };
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [viewport.x, viewport.y]
  );

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    setViewport((current) => ({
      ...current,
      x: dragState.originX + deltaX,
      y: dragState.originY + deltaY,
    }));
  }, []);

  const handleNodePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>, node: PositionedNode) => {
      event.stopPropagation();

      const position = nodePositions[node.id] || { xPx: node.xPx, yPx: node.yPx };

      nodeDragStateRef.current = {
        pointerId: event.pointerId,
        nodeId: node.id,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startNodeX: position.xPx,
        startNodeY: position.yPx,
        didMove: false,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [nodePositions]
  );

  const handleNodePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const dragState = nodeDragStateRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) return;

      const deltaX = (event.clientX - dragState.startClientX) / viewport.scale;
      const deltaY = (event.clientY - dragState.startClientY) / viewport.scale;

      if (!dragState.didMove && (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2)) {
        dragState.didMove = true;
      }

      const nextX = Math.min(
        95,
        Math.max(5, dragState.startNodeX + (deltaX / Math.max(surfaceSize.width, 320)) * 100)
      );
      const nextY = Math.min(
        layoutHeight - 30,
        Math.max(40, dragState.startNodeY + deltaY)
      );

      setNodePositions((current) => ({
        ...current,
        [dragState.nodeId]: {
          xPx: nextX,
          yPx: nextY,
        },
      }));
    },
    [layoutHeight, surfaceSize.width, viewport.scale]
  );

  const handleNodeClick = useCallback((nodeId: string) => {
    if (suppressedClickNodeRef.current === nodeId) {
      suppressedClickNodeRef.current = null;
      return;
    }

    setFocusedNodeId(nodeId);
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 xl:grid-cols-3">
        {insights.map((insight) => (
          <div
            key={insight.title}
            className="rounded-[22px] border border-ibm-gray-20 bg-[linear-gradient(180deg,#ffffff,rgba(247,249,251,0.92))] p-4 shadow-[0_10px_22px_rgba(22,22,22,0.04)]"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-ibm-gray-100">
              <Radar className="h-4 w-4 text-ibm-blue-60" />
              <span className={insight.tone}>{insight.title}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ibm-gray-70">
              {insight.detail}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-[24px] border border-ibm-gray-20 bg-[linear-gradient(180deg,#ffffff,#f7f9fb)] shadow-[0_18px_40px_rgba(22,22,22,0.05)]">
        <div className="border-b border-ibm-gray-10 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-ibm-gray-100">
                Architecture Focus View
              </div>
              <p className="mt-1 text-sm text-ibm-gray-70">
                Showing the highest-signal modules from the main dependency cluster.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full bg-ibm-blue-60/8 px-3 py-1 text-xs font-semibold text-ibm-blue-60">
                {graph.visibleNodes.length} of {data.nodes.length} modules shown
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ibm-gray-70 shadow-[0_4px_12px_rgba(22,22,22,0.04)]">
                Click a module to focus its relationships
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ibm-gray-70 shadow-[0_4px_12px_rgba(22,22,22,0.04)]">
                Drag to pan, wheel to zoom
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-5">
          <div
            className="relative overflow-hidden rounded-[24px] border border-ibm-gray-20 bg-[radial-gradient(circle_at_top_left,rgba(15,98,254,0.10),rgba(255,255,255,0)_35%),radial-gradient(circle_at_bottom_right,rgba(36,161,72,0.08),rgba(255,255,255,0)_28%),linear-gradient(180deg,#ffffff,#fbfcff)]"
            style={{ minHeight: stageHeight }}
          >
            <div className="grid grid-cols-4 gap-2 border-b border-ibm-gray-10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ibm-gray-50">
              <span>Orchestrators</span>
              <span>Bridges</span>
              <span>Shared</span>
              <span>Leaves</span>
            </div>

            <div className="relative" style={{ height: layoutHeight }}>
              <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
                <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ibm-gray-70 shadow-[0_8px_18px_rgba(22,22,22,0.08)]">
                  {Math.round(viewport.scale * 100)}%
                </div>
                <button
                  type="button"
                  data-graph-control="true"
                  onClick={() => zoomFromCenter(0.14)}
                  className="rounded-full border border-ibm-gray-20 bg-white p-2 text-ibm-gray-70 shadow-[0_8px_18px_rgba(22,22,22,0.08)] transition hover:border-ibm-blue-60 hover:text-ibm-blue-60"
                  aria-label="Zoom in"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  data-graph-control="true"
                  onClick={() => zoomFromCenter(-0.14)}
                  className="rounded-full border border-ibm-gray-20 bg-white p-2 text-ibm-gray-70 shadow-[0_8px_18px_rgba(22,22,22,0.08)] transition hover:border-ibm-blue-60 hover:text-ibm-blue-60"
                  aria-label="Zoom out"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  data-graph-control="true"
                  onClick={resetViewport}
                  className="rounded-full border border-ibm-gray-20 bg-white p-2 text-ibm-gray-70 shadow-[0_8px_18px_rgba(22,22,22,0.08)] transition hover:border-ibm-blue-60 hover:text-ibm-blue-60"
                  aria-label="Reset graph viewport"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              <div
                ref={surfaceRef}
                onWheel={handleCanvasWheel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className={`relative h-full overflow-hidden ${
                  isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
                style={{ touchAction: 'none' }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
                    transformOrigin: '0 0',
                  }}
                >
                  <svg
                    viewBox={`0 0 100 ${layoutHeight}`}
                    preserveAspectRatio="none"
                    className="absolute inset-0 h-full w-full"
                  >
                    <defs>
                      <marker
                        id={`${markerBaseId}-edge-muted`}
                        viewBox="0 0 10 10"
                        markerWidth="8"
                        markerHeight="8"
                        refX="8.2"
                        refY="5"
                        orient="auto"
                        markerUnits="strokeWidth"
                      >
                        <path
                          d="M 0 0 L 10 5 L 0 10 z"
                          fill="#8d8d8d"
                        />
                      </marker>
                      <marker
                        id={`${markerBaseId}-edge-active`}
                        viewBox="0 0 10 10"
                        markerWidth="8"
                        markerHeight="8"
                        refX="8.2"
                        refY="5"
                        orient="auto"
                        markerUnits="strokeWidth"
                      >
                        <path
                          d="M 0 0 L 10 5 L 0 10 z"
                          fill="#0F62FE"
                        />
                      </marker>
                    </defs>

                    {graph.visibleLinks.map((link) => {
                      const source = displayNodeMap.get(link.source);
                      const target = displayNodeMap.get(link.target);
                      if (!source || !target) return null;

                      const isHighlighted =
                        connectedNodeIds.has(source.id) && connectedNodeIds.has(target.id);

                      return (
                        <path
                          key={`${link.source}-${link.target}`}
                          d={edgePathBetweenCards(source, target, surfaceSize.width)}
                          fill="none"
                          stroke={isHighlighted ? 'rgba(15, 98, 254, 0.26)' : 'rgba(82, 82, 82, 0.12)'}
                          strokeWidth={isHighlighted ? 0.98 : 0.68}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          markerEnd={`url(#${markerBaseId}-${isHighlighted ? 'edge-active' : 'edge-muted'})`}
                        />
                      );
                    })}
                  </svg>

                  <div className="relative h-full" style={{ minHeight: layoutHeight }}>
                    {displayNodes.map((node) => {
                      const style = roleStyles[node.role];
                      const isActive = focusedNode?.id === node.id;
                      const isConnected = connectedNodeIds.has(node.id);

                      return (
                        <motion.button
                          key={node.id}
                          type="button"
                          data-graph-node="true"
                          whileHover={{ y: -2 }}
                          onPointerDown={(event) => handleNodePointerDown(event, node)}
                          onPointerMove={handleNodePointerMove}
                          onPointerUp={(event) => endNodeDrag(event, node.id)}
                          onPointerCancel={(event) => endNodeDrag(event, node.id)}
                          onClick={() => handleNodeClick(node.id)}
                          className={`absolute w-[164px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] border px-4 py-3 text-left shadow-sm transition ${
                            style.card
                          } ${style.border} ${
                            isActive
                              ? 'ring-2 ring-ibm-blue-60/25 shadow-[0_18px_32px_rgba(15,98,254,0.12)]'
                              : isConnected
                                ? 'shadow-[0_12px_24px_rgba(22,22,22,0.06)]'
                                : 'opacity-90'
                          }`}
                          style={{
                            left: `${node.xPx}%`,
                            top: `${node.yPx}px`,
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div
                              className="mt-1 h-3 w-3 rounded-full"
                              style={{ backgroundColor: style.dot }}
                            />
                            <span className={`text-[11px] font-semibold ${style.text}`}>
                              {style.label}
                            </span>
                          </div>
                          <div className="mt-3 truncate text-sm font-semibold text-ibm-gray-100">
                            {formatNodeName(node.name)}
                          </div>
                          <div className="mt-1 flex items-center justify-between text-xs text-ibm-gray-70">
                            <span>fan-out {node.fanOut}</span>
                            <span>fan-in {node.fanIn}</span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-white/92 px-3 py-1.5 text-xs font-medium text-ibm-gray-70 shadow-[0_8px_18px_rgba(22,22,22,0.08)]">
                  <span className="inline-flex items-center gap-2">
                    <Move className="h-3.5 w-3.5 text-ibm-blue-60" />
                    Drag canvas to pan. Drag modules to rearrange. Scroll to zoom.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-[24px] border border-ibm-gray-20 bg-white p-5 shadow-[0_18px_40px_rgba(22,22,22,0.04)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-ibm-gray-100">
            <Layers3 className="h-4 w-4 text-ibm-blue-60" />
            Focused Module
          </div>
          {focusedNode ? (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xl font-semibold text-ibm-gray-100">
                    {formatNodeName(focusedNode.name)}
                  </div>
                  <div className="mt-1 text-sm text-ibm-gray-70">
                    {roleStyles[focusedNode.role].label} in {focusedNode.area}
                  </div>
                </div>
                <div className="rounded-full bg-ibm-blue-60/8 px-3 py-1 text-xs font-semibold text-ibm-blue-60">
                  {connectedNodeIds.size - 1} direct connection
                  {connectedNodeIds.size - 1 === 1 ? '' : 's'} highlighted
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-ibm-gray-10/60 p-4">
                  <div className="text-xs uppercase tracking-wide text-ibm-gray-50">
                    Fan Out
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-ibm-gray-100">
                    {focusedNode.fanOut}
                  </div>
                </div>
                <div className="rounded-2xl bg-ibm-gray-10/60 p-4">
                  <div className="text-xs uppercase tracking-wide text-ibm-gray-50">
                    Fan In
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-ibm-gray-100">
                    {focusedNode.fanIn}
                  </div>
                </div>
                <div className="rounded-2xl bg-ibm-gray-10/60 p-4">
                  <div className="text-xs uppercase tracking-wide text-ibm-gray-50">
                    Read This For
                  </div>
                  <div className="mt-1 text-sm leading-relaxed text-ibm-gray-70">
                    {focusedNode.role === 'orchestrator'
                      ? 'Request flow and coordination logic'
                      : focusedNode.role === 'bridge'
                        ? 'Integration boundaries between modules'
                        : focusedNode.role === 'shared'
                          ? 'Cross-cutting dependencies reused elsewhere'
                          : 'Leaf behavior and edge-case logic'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-ibm-gray-70">
              Select a module to inspect its role in the architecture.
            </p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] border border-ibm-gray-20 bg-white p-4 shadow-[0_18px_40px_rgba(22,22,22,0.04)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-ibm-gray-100">
              <EyeOff className="h-4 w-4 text-ibm-gray-70" />
              Hidden Noise
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ibm-gray-70">
              {hiddenAreaSummary}
            </p>
            {graph.hiddenClusterCount > 0 && (
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-ibm-gray-50">
                {graph.hiddenClusterCount} secondary cluster
                {graph.hiddenClusterCount === 1 ? '' : 's'} omitted
              </p>
            )}
          </div>

          <div className="rounded-[24px] border border-ibm-gray-20 bg-white p-4 shadow-[0_18px_40px_rgba(22,22,22,0.04)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-ibm-gray-100">
              <ArrowRightLeft className="h-4 w-4 text-ibm-orange-40" />
              Cycles
            </div>
            {graph.cycles.length > 0 ? (
              <div className="mt-3 space-y-2">
                {graph.cycles.slice(0, 2).map((cycle) => (
                  <div
                    key={cycle}
                    className="rounded-2xl bg-ibm-orange-40/10 px-3 py-2 text-sm text-ibm-gray-70"
                  >
                    {cycle}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-2xl bg-ibm-gray-10/50 px-3 py-3 text-sm text-ibm-gray-70">
                No circular dependencies surfaced in the focused architecture view.
              </div>
            )}
          </div>

          <div className="rounded-[24px] border border-ibm-gray-20 bg-white p-4 shadow-[0_18px_40px_rgba(22,22,22,0.04)] md:col-span-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-ibm-gray-100">
              <Sparkles className="h-4 w-4 text-ibm-green-50" />
              Reading Order
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ibm-gray-70">
              Start with the leftmost orchestrator, follow the bridges through the
              center, and only then inspect the shared dependencies on the right.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
