/**
 * SketchEngine - Entity creation and sketch management
 *
 * Handles creating sketch entities, snapping, and constraint solving.
 */

import type {
  SketchData,
  SketchEntity,
  LineEntity,
  RectangleEntity,
  CircleEntity,
  PointEntity,
  ArcEntity,
  Constraint,
  Point2D,
  SketchPlane,
  SnapType,
  SnapResult,
} from '../types/sketch';
import { createSketchData } from '../types/sketch';
import { detectProfiles } from './ProfileDetector';
import { generateId } from '../utils/idGenerator';

// Snap distance threshold (increased for better UX)
const SNAP_DISTANCE = 10;

/**
 * Deep copy a sketch entity including all nested Point2D objects
 */
function deepCopyEntity(entity: SketchEntity): SketchEntity {
  switch (entity.type) {
    case 'point':
      return {
        ...entity,
        position: { ...entity.position },
      };
    case 'line':
      return {
        ...entity,
        start: { ...entity.start },
        end: { ...entity.end },
      };
    case 'rectangle':
      return {
        ...entity,
        corner1: { ...entity.corner1 },
        corner2: { ...entity.corner2 },
      };
    case 'circle':
      return {
        ...entity,
        center: { ...entity.center },
      };
    case 'arc':
      return {
        ...entity,
        center: { ...entity.center },
      };
  }
}

// ============ SKETCH ENGINE CLASS ============

export class SketchEngineClass {
  private activeSketch: SketchData | null = null;
  private plane: SketchPlane | null = null;

  /**
   * Start a new sketch on the given plane
   */
  startSketch(plane: SketchPlane): SketchData {
    this.activeSketch = createSketchData();
    this.plane = plane;
    return this.activeSketch;
  }

  /**
   * Load an existing sketch for editing
   */
  loadSketch(data: SketchData, plane: SketchPlane): void {
    // Deep copy the sketch data to avoid mutating the original
    this.activeSketch = {
      ...data,
      entities: data.entities.map(e => deepCopyEntity(e)),
      constraints: data.constraints.map(c => ({ ...c })),
      profiles: data.profiles.map(p => ({
        ...p,
        outerLoop: p.outerLoop.map(pt => ({ ...pt })),
        innerLoops: p.innerLoops.map(loop => loop.map(pt => ({ ...pt }))),
        boundingBox: {
          min: { ...p.boundingBox.min },
          max: { ...p.boundingBox.max },
        },
      })),
    };
    this.plane = plane;
  }

  /**
   * Get the current sketch data
   */
  getSketch(): SketchData | null {
    return this.activeSketch;
  }

  /**
   * Get the current sketch plane
   */
  getPlane(): SketchPlane | null {
    return this.plane;
  }

  /**
   * End sketch editing and detect profiles
   */
  finishSketch(): SketchData | null {
    if (!this.activeSketch) return null;

    // Detect profiles from entities
    this.activeSketch.profiles = detectProfiles(this.activeSketch.entities);

    const result = this.activeSketch;
    this.activeSketch = null;
    this.plane = null;

    return result;
  }

  /**
   * Cancel sketch editing without saving
   */
  cancelSketch(): void {
    this.activeSketch = null;
    this.plane = null;
  }

  // ============ ENTITY CREATION ============

  /**
   * Add a line entity
   */
  addLine(start: Point2D, end: Point2D): LineEntity {
    if (!this.activeSketch) throw new Error('No active sketch');

    const line: LineEntity = {
      id: generateId(),
      type: 'line',
      construction: false,
      start: { ...start },
      end: { ...end },
    };

    this.activeSketch.entities.push(line);
    return line;
  }

  /**
   * Add a rectangle entity
   */
  addRectangle(corner1: Point2D, corner2: Point2D): RectangleEntity {
    if (!this.activeSketch) throw new Error('No active sketch');

    const rect: RectangleEntity = {
      id: generateId(),
      type: 'rectangle',
      construction: false,
      corner1: { ...corner1 },
      corner2: { ...corner2 },
    };

    this.activeSketch.entities.push(rect);
    return rect;
  }

  /**
   * Add a circle entity
   */
  addCircle(center: Point2D, radius: number): CircleEntity {
    if (!this.activeSketch) throw new Error('No active sketch');

    const circle: CircleEntity = {
      id: generateId(),
      type: 'circle',
      construction: false,
      center: { ...center },
      radius,
    };

    this.activeSketch.entities.push(circle);
    return circle;
  }

  /**
   * Add a point entity
   */
  addPoint(position: Point2D): PointEntity {
    if (!this.activeSketch) throw new Error('No active sketch');

    const point: PointEntity = {
      id: generateId(),
      type: 'point',
      construction: false,
      position: { ...position },
    };

    this.activeSketch.entities.push(point);
    return point;
  }

  /**
   * Add an arc entity
   */
  addArc(center: Point2D, radius: number, startAngle: number, endAngle: number): ArcEntity {
    if (!this.activeSketch) throw new Error('No active sketch');

    const arc: ArcEntity = {
      id: generateId(),
      type: 'arc',
      construction: false,
      center: { ...center },
      radius,
      startAngle,
      endAngle,
    };

    this.activeSketch.entities.push(arc);
    return arc;
  }

  // ============ ENTITY MODIFICATION ============

  /**
   * Update an entity
   */
  updateEntity(id: string, updates: Partial<SketchEntity>): void {
    if (!this.activeSketch) throw new Error('No active sketch');

    const index = this.activeSketch.entities.findIndex(e => e.id === id);
    if (index !== -1) {
      this.activeSketch.entities[index] = {
        ...this.activeSketch.entities[index],
        ...updates,
      } as SketchEntity;
    }
  }

  /**
   * Delete an entity
   */
  deleteEntity(id: string): void {
    if (!this.activeSketch) throw new Error('No active sketch');

    this.activeSketch.entities = this.activeSketch.entities.filter(e => e.id !== id);

    // Remove constraints referencing this entity
    this.activeSketch.constraints = this.activeSketch.constraints.filter(c => {
      if ('entityId' in c && c.entityId === id) return false;
      if ('entityId1' in c && (c.entityId1 === id || c.entityId2 === id)) return false;
      return true;
    });
  }

  /**
   * Toggle construction mode for an entity
   */
  toggleConstruction(id: string): void {
    if (!this.activeSketch) throw new Error('No active sketch');

    const entity = this.activeSketch.entities.find(e => e.id === id);
    if (entity) {
      entity.construction = !entity.construction;
    }
  }

  // ============ CONSTRAINTS ============

  /**
   * Add a constraint
   */
  addConstraint(constraint: Omit<Constraint, 'id'>): Constraint {
    if (!this.activeSketch) throw new Error('No active sketch');

    const newConstraint = {
      ...constraint,
      id: generateId(),
    } as Constraint;

    this.activeSketch.constraints.push(newConstraint);
    return newConstraint;
  }

  /**
   * Remove a constraint
   */
  removeConstraint(id: string): void {
    if (!this.activeSketch) throw new Error('No active sketch');
    this.activeSketch.constraints = this.activeSketch.constraints.filter(c => c.id !== id);
  }

  // ============ SNAPPING ============

  /**
   * Find the nearest snap point to a given position
   */
  findSnapPoint(position: Point2D, excludeEntityId?: string): SnapResult | null {
    if (!this.activeSketch) return null;

    let nearestPoint: Point2D | null = null;
    let nearestEntityId: string | null = null;
    let nearestType: SnapType = 'grid';
    let nearestDistance = SNAP_DISTANCE;

    for (const entity of this.activeSketch.entities) {
      if (entity.id === excludeEntityId) continue;

      const snapPoints = getEntitySnapPoints(entity);
      for (const sp of snapPoints) {
        const dist = distance(position, sp.point);
        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearestPoint = sp.point;
          nearestEntityId = entity.id;
          nearestType = sp.type;
        }
      }
    }

    // Also snap to grid
    if (this.activeSketch.snapEnabled) {
      const gridSize = this.activeSketch.gridSize;
      const gridPoint = {
        x: Math.round(position.x / gridSize) * gridSize,
        y: Math.round(position.y / gridSize) * gridSize,
      };
      const gridDist = distance(position, gridPoint);
      if (gridDist < nearestDistance) {
        nearestPoint = gridPoint;
        nearestEntityId = null;
        nearestType = 'grid';
        nearestDistance = gridDist;
      }
    }

    // Snap to origin (with higher priority)
    const originDist = distance(position, { x: 0, y: 0 });
    if (originDist < nearestDistance) {
      return { point: { x: 0, y: 0 }, entityId: 'origin', type: 'origin' };
    }

    if (nearestPoint) {
      return { point: nearestPoint, entityId: nearestEntityId, type: nearestType };
    }

    return null;
  }

  /**
   * Snap to horizontal/vertical from a reference point
   */
  constrainToAxisFromPoint(position: Point2D, reference: Point2D): Point2D {
    const dx = Math.abs(position.x - reference.x);
    const dy = Math.abs(position.y - reference.y);

    // If close to horizontal or vertical, snap to it
    if (dx < 5 && dy > 5) {
      return { x: reference.x, y: position.y };
    }
    if (dy < 5 && dx > 5) {
      return { x: position.x, y: reference.y };
    }

    return position;
  }

  // ============ PROFILE DETECTION ============

  /**
   * Detect profiles without finishing the sketch
   */
  detectProfiles(): void {
    if (!this.activeSketch) return;
    this.activeSketch.profiles = detectProfiles(this.activeSketch.entities);
  }

  // ============ TRIM TOOL ============

  /**
   * Find the nearest line entity to a point (for trim tool)
   */
  findNearestLineEntity(point: Point2D, maxDistance: number = 15): { entity: LineEntity; distance: number; t: number } | null {
    if (!this.activeSketch) return null;

    let nearest: { entity: LineEntity; distance: number; t: number } | null = null;

    for (const entity of this.activeSketch.entities) {
      if (entity.type !== 'line') continue;

      const line = entity as LineEntity;
      const result = pointToLineDistance(point, line.start, line.end);

      if (result.distance < maxDistance && (!nearest || result.distance < nearest.distance)) {
        nearest = { entity: line, distance: result.distance, t: result.t };
      }
    }

    return nearest;
  }

  /**
   * Find all intersections between a line and other entities
   */
  findLineIntersections(lineId: string): { point: Point2D; t: number; otherEntityId: string }[] {
    if (!this.activeSketch) return [];

    const line = this.activeSketch.entities.find(e => e.id === lineId) as LineEntity | undefined;
    if (!line || line.type !== 'line') return [];

    const intersections: { point: Point2D; t: number; otherEntityId: string }[] = [];

    for (const entity of this.activeSketch.entities) {
      if (entity.id === lineId) continue;

      if (entity.type === 'line') {
        const other = entity as LineEntity;
        const intersection = lineLineIntersection(line.start, line.end, other.start, other.end);
        if (intersection) {
          intersections.push({ point: intersection.point, t: intersection.t1, otherEntityId: entity.id });
        }
      } else if (entity.type === 'circle') {
        const circle = entity as CircleEntity;
        const circleIntersections = lineCircleIntersection(line.start, line.end, circle.center, circle.radius);
        for (const ci of circleIntersections) {
          intersections.push({ point: ci.point, t: ci.t, otherEntityId: entity.id });
        }
      } else if (entity.type === 'rectangle') {
        const rect = entity as RectangleEntity;
        // Check all 4 edges of the rectangle
        const corners = [
          rect.corner1,
          { x: rect.corner2.x, y: rect.corner1.y },
          rect.corner2,
          { x: rect.corner1.x, y: rect.corner2.y },
        ];
        for (let i = 0; i < 4; i++) {
          const p1 = corners[i];
          const p2 = corners[(i + 1) % 4];
          const intersection = lineLineIntersection(line.start, line.end, p1, p2);
          if (intersection) {
            intersections.push({ point: intersection.point, t: intersection.t1, otherEntityId: entity.id });
          }
        }
      }
    }

    // Sort by t parameter
    intersections.sort((a, b) => a.t - b.t);
    return intersections;
  }

  /**
   * Trim a line at a clicked point
   * Returns true if trim was successful
   */
  trimLineAt(lineId: string, clickPoint: Point2D): boolean {
    if (!this.activeSketch) return false;

    const lineIndex = this.activeSketch.entities.findIndex(e => e.id === lineId);
    if (lineIndex === -1) return false;

    const line = this.activeSketch.entities[lineIndex] as LineEntity;
    if (line.type !== 'line') return false;

    // Find intersections
    const intersections = this.findLineIntersections(lineId);
    if (intersections.length === 0) return false;

    // Find where the click is on the line (t parameter)
    const clickResult = pointToLineDistance(clickPoint, line.start, line.end);
    const clickT = clickResult.t;

    // Find the intersections bracketing the click point
    let leftT = 0;
    let rightT = 1;

    for (const inter of intersections) {
      if (inter.t < clickT && inter.t > leftT) {
        leftT = inter.t;
      }
      if (inter.t > clickT && inter.t < rightT) {
        rightT = inter.t;
      }
    }

    // Remove the original line
    this.activeSketch.entities.splice(lineIndex, 1);

    // Create new line segments for the remaining parts
    if (leftT > 0.001) {
      const leftEnd = {
        x: line.start.x + leftT * (line.end.x - line.start.x),
        y: line.start.y + leftT * (line.end.y - line.start.y),
      };
      this.addLine(line.start, leftEnd);
    }

    if (rightT < 0.999) {
      const rightStart = {
        x: line.start.x + rightT * (line.end.x - line.start.x),
        y: line.start.y + rightT * (line.end.y - line.start.y),
      };
      this.addLine(rightStart, line.end);
    }

    return true;
  }

  // ============ OFFSET TOOL ============

  /**
   * Offset a line entity by a given distance
   * Creates a parallel line on the side closest to the reference point
   */
  offsetLine(lineId: string, offsetDistance: number, referencePoint: Point2D): LineEntity | null {
    if (!this.activeSketch) return null;

    const line = this.activeSketch.entities.find(e => e.id === lineId) as LineEntity | undefined;
    if (!line || line.type !== 'line') return null;

    // Calculate line direction and perpendicular
    const dx = line.end.x - line.start.x;
    const dy = line.end.y - line.start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length < 0.001) return null;

    // Perpendicular direction (normalized)
    const perpX = -dy / length;
    const perpY = dx / length;

    // Determine which side of the line the reference point is on
    const midPoint = { x: (line.start.x + line.end.x) / 2, y: (line.start.y + line.end.y) / 2 };
    const toRef = { x: referencePoint.x - midPoint.x, y: referencePoint.y - midPoint.y };
    const dot = toRef.x * perpX + toRef.y * perpY;
    const side = dot > 0 ? 1 : -1;

    // Calculate offset points
    const offset = offsetDistance * side;
    const newStart = { x: line.start.x + perpX * offset, y: line.start.y + perpY * offset };
    const newEnd = { x: line.end.x + perpX * offset, y: line.end.y + perpY * offset };

    return this.addLine(newStart, newEnd);
  }

  /**
   * Offset a circle entity by a given distance
   * Creates a concentric circle (larger if reference point is outside, smaller if inside)
   */
  offsetCircle(circleId: string, offsetDistance: number, referencePoint: Point2D): CircleEntity | null {
    if (!this.activeSketch) return null;

    const circle = this.activeSketch.entities.find(e => e.id === circleId) as CircleEntity | undefined;
    if (!circle || circle.type !== 'circle') return null;

    // Determine if reference point is inside or outside the circle
    const distToCenter = Math.sqrt(
      (referencePoint.x - circle.center.x) ** 2 +
      (referencePoint.y - circle.center.y) ** 2
    );
    const isOutside = distToCenter > circle.radius;

    // Calculate new radius
    const newRadius = isOutside
      ? circle.radius + offsetDistance
      : circle.radius - offsetDistance;

    if (newRadius < 0.1) return null; // Too small

    return this.addCircle(circle.center, newRadius);
  }

  /**
   * Offset a rectangle entity by a given distance
   * Creates a parallel rectangle (larger if reference point is outside, smaller if inside)
   */
  offsetRectangle(rectId: string, offsetDistance: number, referencePoint: Point2D): RectangleEntity | null {
    if (!this.activeSketch) return null;

    const rect = this.activeSketch.entities.find(e => e.id === rectId) as RectangleEntity | undefined;
    if (!rect || rect.type !== 'rectangle') return null;

    // Determine rectangle bounds
    const minX = Math.min(rect.corner1.x, rect.corner2.x);
    const maxX = Math.max(rect.corner1.x, rect.corner2.x);
    const minY = Math.min(rect.corner1.y, rect.corner2.y);
    const maxY = Math.max(rect.corner1.y, rect.corner2.y);

    // Check if reference point is inside
    const isInside = referencePoint.x > minX && referencePoint.x < maxX &&
                     referencePoint.y > minY && referencePoint.y < maxY;

    const offset = isInside ? -offsetDistance : offsetDistance;

    const newCorner1 = { x: minX - offset, y: minY - offset };
    const newCorner2 = { x: maxX + offset, y: maxY + offset };

    // Ensure the rectangle doesn't collapse
    if (newCorner2.x - newCorner1.x < 0.1 || newCorner2.y - newCorner1.y < 0.1) return null;

    return this.addRectangle(newCorner1, newCorner2);
  }

  /**
   * Find nearest entity for offset tool (lines, circles, rectangles)
   */
  findNearestOffsetableEntity(point: Point2D, maxDistance: number = 15): { entity: SketchEntity; distance: number } | null {
    if (!this.activeSketch) return null;

    let nearest: { entity: SketchEntity; distance: number } | null = null;

    for (const entity of this.activeSketch.entities) {
      let dist = Infinity;

      if (entity.type === 'line') {
        const line = entity as LineEntity;
        const result = pointToLineDistance(point, line.start, line.end);
        dist = result.distance;
      } else if (entity.type === 'circle') {
        const circle = entity as CircleEntity;
        const distToCenter = Math.sqrt(
          (point.x - circle.center.x) ** 2 + (point.y - circle.center.y) ** 2
        );
        dist = Math.abs(distToCenter - circle.radius);
      } else if (entity.type === 'rectangle') {
        const rect = entity as RectangleEntity;
        // Distance to nearest edge
        const minX = Math.min(rect.corner1.x, rect.corner2.x);
        const maxX = Math.max(rect.corner1.x, rect.corner2.x);
        const minY = Math.min(rect.corner1.y, rect.corner2.y);
        const maxY = Math.max(rect.corner1.y, rect.corner2.y);

        const edges = [
          { start: { x: minX, y: minY }, end: { x: maxX, y: minY } },
          { start: { x: maxX, y: minY }, end: { x: maxX, y: maxY } },
          { start: { x: maxX, y: maxY }, end: { x: minX, y: maxY } },
          { start: { x: minX, y: maxY }, end: { x: minX, y: minY } },
        ];

        for (const edge of edges) {
          const result = pointToLineDistance(point, edge.start, edge.end);
          if (result.distance < dist) dist = result.distance;
        }
      }

      if (dist < maxDistance && (!nearest || dist < nearest.distance)) {
        nearest = { entity, distance: dist };
      }
    }

    return nearest;
  }
}

// ============ HELPER FUNCTIONS ============

interface SnapPointWithType {
  point: Point2D;
  type: SnapType;
}

/**
 * Get snap points for an entity with their types
 */
function getEntitySnapPoints(entity: SketchEntity): SnapPointWithType[] {
  switch (entity.type) {
    case 'point':
      return [{ point: entity.position, type: 'endpoint' }];
    case 'line':
      return [
        { point: entity.start, type: 'endpoint' },
        { point: entity.end, type: 'endpoint' },
        { point: midpoint(entity.start, entity.end), type: 'midpoint' },
      ];
    case 'rectangle': {
      const { corner1, corner2 } = entity;
      return [
        { point: corner1, type: 'endpoint' },
        { point: corner2, type: 'endpoint' },
        { point: { x: corner1.x, y: corner2.y }, type: 'endpoint' },
        { point: { x: corner2.x, y: corner1.y }, type: 'endpoint' },
        { point: midpoint(corner1, corner2), type: 'center' },
        // Midpoints of edges
        { point: { x: (corner1.x + corner2.x) / 2, y: corner1.y }, type: 'midpoint' },
        { point: { x: (corner1.x + corner2.x) / 2, y: corner2.y }, type: 'midpoint' },
        { point: { x: corner1.x, y: (corner1.y + corner2.y) / 2 }, type: 'midpoint' },
        { point: { x: corner2.x, y: (corner1.y + corner2.y) / 2 }, type: 'midpoint' },
      ];
    }
    case 'circle':
      return [
        { point: entity.center, type: 'center' },
        { point: { x: entity.center.x + entity.radius, y: entity.center.y }, type: 'quadrant' },
        { point: { x: entity.center.x - entity.radius, y: entity.center.y }, type: 'quadrant' },
        { point: { x: entity.center.x, y: entity.center.y + entity.radius }, type: 'quadrant' },
        { point: { x: entity.center.x, y: entity.center.y - entity.radius }, type: 'quadrant' },
      ];
    case 'arc': {
      const startX = entity.center.x + entity.radius * Math.cos(entity.startAngle);
      const startY = entity.center.y + entity.radius * Math.sin(entity.startAngle);
      const endX = entity.center.x + entity.radius * Math.cos(entity.endAngle);
      const endY = entity.center.y + entity.radius * Math.sin(entity.endAngle);
      const midAngle = (entity.startAngle + entity.endAngle) / 2;
      const midX = entity.center.x + entity.radius * Math.cos(midAngle);
      const midY = entity.center.y + entity.radius * Math.sin(midAngle);
      return [
        { point: entity.center, type: 'center' },
        { point: { x: startX, y: startY }, type: 'endpoint' },
        { point: { x: endX, y: endY }, type: 'endpoint' },
        { point: { x: midX, y: midY }, type: 'midpoint' },
      ];
    }
    default:
      return [];
  }
}

/**
 * Calculate distance between two points
 */
function distance(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate midpoint between two points
 */
function midpoint(a: Point2D, b: Point2D): Point2D {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

/**
 * Calculate the distance from a point to a line segment
 * Returns distance and t parameter (0-1) along the line
 */
function pointToLineDistance(point: Point2D, lineStart: Point2D, lineEnd: Point2D): { distance: number; t: number } {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return { distance: distance(point, lineStart), t: 0 };
  }

  // Calculate t parameter (projection onto line)
  let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));

  // Find closest point on line
  const closestPoint = {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
  };

  return { distance: distance(point, closestPoint), t };
}

/**
 * Find intersection between two line segments
 * Returns null if no intersection
 */
function lineLineIntersection(
  p1: Point2D, p2: Point2D,
  p3: Point2D, p4: Point2D
): { point: Point2D; t1: number; t2: number } | null {
  const d1x = p2.x - p1.x;
  const d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x;
  const d2y = p4.y - p3.y;

  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) < 0.0001) return null; // Parallel lines

  const dx = p3.x - p1.x;
  const dy = p3.y - p1.y;

  const t1 = (dx * d2y - dy * d2x) / cross;
  const t2 = (dx * d1y - dy * d1x) / cross;

  // Check if intersection is within both line segments
  if (t1 >= 0.001 && t1 <= 0.999 && t2 >= 0.001 && t2 <= 0.999) {
    return {
      point: { x: p1.x + t1 * d1x, y: p1.y + t1 * d1y },
      t1,
      t2,
    };
  }

  return null;
}

/**
 * Find intersections between a line segment and a circle
 */
function lineCircleIntersection(
  lineStart: Point2D, lineEnd: Point2D,
  center: Point2D, radius: number
): { point: Point2D; t: number }[] {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const fx = lineStart.x - center.x;
  const fy = lineStart.y - center.y;

  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - radius * radius;

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return [];

  const intersections: { point: Point2D; t: number }[] = [];
  const sqrtDisc = Math.sqrt(discriminant);

  const t1 = (-b - sqrtDisc) / (2 * a);
  const t2 = (-b + sqrtDisc) / (2 * a);

  if (t1 >= 0.001 && t1 <= 0.999) {
    intersections.push({
      point: { x: lineStart.x + t1 * dx, y: lineStart.y + t1 * dy },
      t: t1,
    });
  }

  if (t2 >= 0.001 && t2 <= 0.999 && Math.abs(t2 - t1) > 0.001) {
    intersections.push({
      point: { x: lineStart.x + t2 * dx, y: lineStart.y + t2 * dy },
      t: t2,
    });
  }

  return intersections;
}

// Export singleton instance
export const SketchEngine = new SketchEngineClass();
