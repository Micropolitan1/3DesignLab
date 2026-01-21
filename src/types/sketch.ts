/**
 * Sketch system type definitions
 */

// ============ GEOMETRY PRIMITIVES ============

export interface Point2D {
  x: number;
  y: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

// ============ SKETCH ENTITIES ============

export type SketchEntityType = 'point' | 'line' | 'rectangle' | 'circle' | 'arc';

export interface BaseSketchEntity {
  id: string;
  type: SketchEntityType;
  construction: boolean; // Construction geometry doesn't form profiles
}

export interface PointEntity extends BaseSketchEntity {
  type: 'point';
  position: Point2D;
}

export interface LineEntity extends BaseSketchEntity {
  type: 'line';
  start: Point2D;
  end: Point2D;
}

export interface RectangleEntity extends BaseSketchEntity {
  type: 'rectangle';
  corner1: Point2D;
  corner2: Point2D;
}

export interface CircleEntity extends BaseSketchEntity {
  type: 'circle';
  center: Point2D;
  radius: number;
}

export interface ArcEntity extends BaseSketchEntity {
  type: 'arc';
  center: Point2D;
  radius: number;
  startAngle: number; // radians
  endAngle: number;   // radians
}

export type SketchEntity = PointEntity | LineEntity | RectangleEntity | CircleEntity | ArcEntity;

// ============ CONSTRAINTS ============

export type ConstraintType =
  | 'horizontal'
  | 'vertical'
  | 'coincident'
  | 'parallel'
  | 'perpendicular'
  | 'equal'
  | 'tangent'
  | 'concentric'
  | 'fixed'
  | 'distance'
  | 'angle';

// Position hints for constraint display
export interface ConstraintDisplayInfo {
  constraint: Constraint;
  position: Point2D;  // Where to show the indicator
  angle?: number;     // For dimension display orientation
}

export interface BaseConstraint {
  id: string;
  type: ConstraintType;
}

export interface UnaryConstraint extends BaseConstraint {
  type: 'horizontal' | 'vertical' | 'fixed';
  entityId: string;
  pointIndex?: number; // For constraining specific points
}

export interface BinaryConstraint extends BaseConstraint {
  type: 'coincident' | 'parallel' | 'perpendicular' | 'equal' | 'tangent' | 'concentric';
  entityId1: string;
  entityId2: string;
  pointIndex1?: number;
  pointIndex2?: number;
}

export interface DimensionConstraint extends BaseConstraint {
  type: 'distance' | 'angle';
  entityId1: string;
  entityId2?: string;
  pointIndex1?: number;
  pointIndex2?: number;
  value: number;
}

export type Constraint = UnaryConstraint | BinaryConstraint | DimensionConstraint;

// ============ PROFILES ============

export interface Profile {
  id: string;
  outerLoop: Point2D[];     // CCW winding for positive area
  innerLoops: Point2D[][];  // CW winding for holes
  area: number;
  boundingBox: {
    min: Point2D;
    max: Point2D;
  };
}

// ============ SKETCH DATA ============

export interface SketchData {
  entities: SketchEntity[];
  constraints: Constraint[];
  profiles: Profile[];
  gridSize: number;
  snapEnabled: boolean;
}

// ============ SKETCH PLANE ============

export type SketchPlaneType = 'XY' | 'XZ' | 'YZ' | 'face';

export interface SketchPlane {
  type: SketchPlaneType;
  origin: { x: number; y: number; z: number };
  normal: { x: number; y: number; z: number };
  xAxis: { x: number; y: number; z: number };
  yAxis: { x: number; y: number; z: number };
  offset: number;
}

// ============ SNAP TYPES ============

export type SnapType = 'endpoint' | 'midpoint' | 'center' | 'quadrant' | 'grid' | 'origin' | 'intersection';

export interface SnapResult {
  point: Point2D;
  entityId: string | null;
  type: SnapType;
}

// ============ SKETCH TOOL STATE ============

export type SketchTool = 'select' | 'line' | 'rectangle' | 'circle' | 'arc' | 'point' | 'trim' | 'offset' | 'dimension';

export interface SketchToolState {
  activeTool: SketchTool;
  isDrawing: boolean;
  startPoint: Point2D | null;
  previewPoints: Point2D[];
  snapPoint: Point2D | null;
  snapEntityId: string | null;
  snapType: SnapType | null;
  // For multi-point tools like arc (3-point arc: start, end, midpoint)
  arcPoints: Point2D[];
  arcStep: number; // 0: waiting for start, 1: waiting for end, 2: waiting for midpoint
  // For offset tool
  offsetEntityId: string | null;
  offsetDistance: number;
}

// ============ FACTORY HELPERS ============

export function createSketchData(): SketchData {
  return {
    entities: [],
    constraints: [],
    profiles: [],
    gridSize: 10,
    snapEnabled: true,
  };
}

export function createLineEntity(id: string, start: Point2D, end: Point2D): LineEntity {
  return {
    id,
    type: 'line',
    construction: false,
    start,
    end,
  };
}

export function createRectangleEntity(id: string, corner1: Point2D, corner2: Point2D): RectangleEntity {
  return {
    id,
    type: 'rectangle',
    construction: false,
    corner1,
    corner2,
  };
}

export function createCircleEntity(id: string, center: Point2D, radius: number): CircleEntity {
  return {
    id,
    type: 'circle',
    construction: false,
    center,
    radius,
  };
}
