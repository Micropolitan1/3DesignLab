/**
 * ProfileDetector - Find closed loops from sketch entities
 *
 * Builds a graph from connected entities and finds cycles
 * that form closed profiles suitable for extrusion.
 */

import type {
  SketchEntity,
  LineEntity,
  RectangleEntity,
  CircleEntity,
  ArcEntity,
  Profile,
  Point2D,
} from '../types/sketch';
import { generateProfileId } from '../utils/idGenerator';

// Tolerance for point comparison - increased for sketch coordinate system
const TOLERANCE = 1.0;

interface Edge {
  entityId: string;
  start: Point2D;
  end: Point2D;
}

interface GraphNode {
  point: Point2D;
  edges: { edgeIndex: number; otherNodeIndex: number }[];
}

/**
 * Detect closed profiles from sketch entities
 */
export function detectProfiles(entities: SketchEntity[]): Profile[] {
  // Filter out construction geometry
  const nonConstruction = entities.filter(e => !e.construction);

  // Handle circles as single-entity profiles
  const profiles: Profile[] = [];

  const circles = nonConstruction.filter(e => e.type === 'circle') as CircleEntity[];
  for (const circle of circles) {
    profiles.push(createCircleProfile(circle));
  }

  // Handle rectangles as single-entity profiles
  const rectangles = nonConstruction.filter(e => e.type === 'rectangle') as RectangleEntity[];
  for (const rect of rectangles) {
    profiles.push(createRectangleProfile(rect));
  }

  // Build edge list from lines and arcs
  const edges = buildEdgeList(nonConstruction);

  if (edges.length === 0) {
    return profiles;
  }

  // Build graph from edges
  const { nodes, adjacency } = buildGraph(edges);

  // Find all closed loops
  const loops = findClosedLoops(nodes, adjacency, edges);

  // Convert loops to profiles
  for (const loop of loops) {
    const points = loopToPoints(loop, edges);
    if (points.length >= 3) {
      profiles.push(createProfileFromPoints(points));
    }
  }

  return profiles;
}

/**
 * Build edge list from sketch entities (lines and arcs)
 */
function buildEdgeList(entities: SketchEntity[]): Edge[] {
  const edges: Edge[] = [];

  for (const entity of entities) {
    switch (entity.type) {
      case 'line': {
        const line = entity as LineEntity;
        edges.push({
          entityId: line.id,
          start: { ...line.start },
          end: { ...line.end },
        });
        break;
      }
      case 'arc': {
        const arc = entity as ArcEntity;
        // Convert arc to start/end points
        const startX = arc.center.x + arc.radius * Math.cos(arc.startAngle);
        const startY = arc.center.y + arc.radius * Math.sin(arc.startAngle);
        const endX = arc.center.x + arc.radius * Math.cos(arc.endAngle);
        const endY = arc.center.y + arc.radius * Math.sin(arc.endAngle);
        edges.push({
          entityId: arc.id,
          start: { x: startX, y: startY },
          end: { x: endX, y: endY },
        });
        break;
      }
    }
  }

  return edges;
}

/**
 * Build adjacency graph from edges
 */
function buildGraph(edges: Edge[]): { nodes: GraphNode[]; adjacency: Map<number, number[]> } {
  const pointMap = new Map<string, number>(); // point key -> node index
  const nodes: GraphNode[] = [];
  const adjacency = new Map<number, number[]>();

  function getNodeIndex(p: Point2D): number {
    const key = pointKey(p);
    if (pointMap.has(key)) {
      return pointMap.get(key)!;
    }
    const index = nodes.length;
    nodes.push({ point: { ...p }, edges: [] });
    pointMap.set(key, index);
    adjacency.set(index, []);
    return index;
  }

  for (let edgeIndex = 0; edgeIndex < edges.length; edgeIndex++) {
    const edge = edges[edgeIndex];

    // Find or create nodes for start and end
    const startNode = getNodeIndex(edge.start);
    const endNode = getNodeIndex(edge.end);

    // Add edge references to nodes
    nodes[startNode].edges.push({ edgeIndex, otherNodeIndex: endNode });
    nodes[endNode].edges.push({ edgeIndex, otherNodeIndex: startNode });

    // Update adjacency
    adjacency.get(startNode)!.push(endNode);
    adjacency.get(endNode)!.push(startNode);
  }

  return { nodes, adjacency };
}

/**
 * Find all closed loops in the graph using DFS
 */
function findClosedLoops(
  nodes: GraphNode[],
  adjacency: Map<number, number[]>,
  _edges: Edge[]
): number[][] {
  const loops: number[][] = [];
  const visited = new Set<string>(); // Track visited edge combinations

  // Try to find loops starting from each node
  for (let startNode = 0; startNode < nodes.length; startNode++) {
    const neighbors = adjacency.get(startNode) || [];
    if (neighbors.length < 2) continue; // Need at least 2 edges to form a loop

    // DFS to find cycles
    const path: number[] = [startNode];
    const edgesUsed: number[] = [];
    const visitedInPath = new Set<number>([startNode]);

    function dfs(current: number, depth: number): void {
      if (depth > 100) return; // Prevent infinite loops

      const currentEdges = nodes[current].edges;

      for (const { edgeIndex, otherNodeIndex } of currentEdges) {
        // Don't use the same edge we just used
        if (edgesUsed.length > 0 && edgesUsed[edgesUsed.length - 1] === edgeIndex) {
          continue;
        }

        if (otherNodeIndex === startNode && depth >= 2) {
          // Found a cycle back to start
          const loopKey = [...edgesUsed, edgeIndex].sort().join(',');
          if (!visited.has(loopKey)) {
            visited.add(loopKey);
            loops.push([...edgesUsed, edgeIndex]);
          }
        } else if (!visitedInPath.has(otherNodeIndex)) {
          // Continue DFS
          path.push(otherNodeIndex);
          edgesUsed.push(edgeIndex);
          visitedInPath.add(otherNodeIndex);

          dfs(otherNodeIndex, depth + 1);

          path.pop();
          edgesUsed.pop();
          visitedInPath.delete(otherNodeIndex);
        }
      }
    }

    dfs(startNode, 0);
  }

  // Filter to keep only simple cycles (no overlapping edges)
  return filterSimpleCycles(loops);
}

/**
 * Filter to keep only simple (non-overlapping) cycles
 */
function filterSimpleCycles(loops: number[][]): number[][] {
  // Sort by length (prefer smaller loops)
  loops.sort((a, b) => a.length - b.length);

  const result: number[][] = [];
  const usedEdges = new Set<number>();

  for (const loop of loops) {
    // Check if this loop shares any edges with already found loops
    const hasOverlap = loop.some(e => usedEdges.has(e));
    if (!hasOverlap) {
      result.push(loop);
      loop.forEach(e => usedEdges.add(e));
    }
  }

  return result;
}

/**
 * Convert a loop (sequence of edge indices) to a sequence of points
 */
function loopToPoints(loop: number[], edges: Edge[]): Point2D[] {
  if (loop.length === 0) return [];

  const points: Point2D[] = [];
  let currentPoint = edges[loop[0]].start;
  points.push({ ...currentPoint });

  for (const edgeIndex of loop) {
    const edge = edges[edgeIndex];

    if (pointsEqual(currentPoint, edge.start)) {
      points.push({ ...edge.end });
      currentPoint = edge.end;
    } else if (pointsEqual(currentPoint, edge.end)) {
      points.push({ ...edge.start });
      currentPoint = edge.start;
    }
  }

  // Remove duplicate final point (same as start)
  if (points.length > 1 && pointsEqual(points[0], points[points.length - 1])) {
    points.pop();
  }

  return points;
}

/**
 * Create a profile from a set of points
 */
function createProfileFromPoints(points: Point2D[]): Profile {
  // Ensure counter-clockwise winding for positive area
  const signedArea = calculateSignedArea(points);
  if (signedArea < 0) {
    points.reverse();
  }

  const boundingBox = calculateBoundingBox(points);

  return {
    id: generateProfileId(),
    outerLoop: points,
    innerLoops: [],
    area: Math.abs(signedArea),
    boundingBox,
  };
}

/**
 * Create a profile from a circle entity
 */
function createCircleProfile(circle: CircleEntity): Profile {
  const segments = 32;
  const points: Point2D[] = [];

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push({
      x: circle.center.x + circle.radius * Math.cos(angle),
      y: circle.center.y + circle.radius * Math.sin(angle),
    });
  }

  const area = Math.PI * circle.radius * circle.radius;
  const boundingBox = {
    min: { x: circle.center.x - circle.radius, y: circle.center.y - circle.radius },
    max: { x: circle.center.x + circle.radius, y: circle.center.y + circle.radius },
  };

  return {
    id: generateProfileId(),
    outerLoop: points,
    innerLoops: [],
    area,
    boundingBox,
  };
}

/**
 * Create a profile from a rectangle entity
 */
function createRectangleProfile(rect: RectangleEntity): Profile {
  const minX = Math.min(rect.corner1.x, rect.corner2.x);
  const maxX = Math.max(rect.corner1.x, rect.corner2.x);
  const minY = Math.min(rect.corner1.y, rect.corner2.y);
  const maxY = Math.max(rect.corner1.y, rect.corner2.y);

  // Counter-clockwise points
  const points: Point2D[] = [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ];

  const width = maxX - minX;
  const height = maxY - minY;
  const area = width * height;

  return {
    id: generateProfileId(),
    outerLoop: points,
    innerLoops: [],
    area,
    boundingBox: {
      min: { x: minX, y: minY },
      max: { x: maxX, y: maxY },
    },
  };
}

/**
 * Calculate signed area of a polygon (positive for CCW)
 */
function calculateSignedArea(points: Point2D[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return area / 2;
}

/**
 * Calculate bounding box of points
 */
function calculateBoundingBox(points: Point2D[]): { min: Point2D; max: Point2D } {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  return {
    min: { x: minX, y: minY },
    max: { x: maxX, y: maxY },
  };
}

/**
 * Create a unique key for a point (for graph construction)
 */
function pointKey(p: Point2D): string {
  const roundedX = Math.round(p.x / TOLERANCE) * TOLERANCE;
  const roundedY = Math.round(p.y / TOLERANCE) * TOLERANCE;
  return `${roundedX.toFixed(3)},${roundedY.toFixed(3)}`;
}

/**
 * Check if two points are equal within tolerance
 */
function pointsEqual(a: Point2D, b: Point2D): boolean {
  return Math.abs(a.x - b.x) < TOLERANCE && Math.abs(a.y - b.y) < TOLERANCE;
}
