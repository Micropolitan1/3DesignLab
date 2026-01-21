/**
 * SketchRenderer - Render 2D sketch entities in 3D viewport
 *
 * Uses Three.js Line objects to render sketch geometry
 * on the active sketch plane.
 */

import * as THREE from 'three';
import type {
  SketchData,
  SketchEntity,
  LineEntity,
  RectangleEntity,
  CircleEntity,
  ArcEntity,
  PointEntity,
  SketchPlane,
  Profile,
  SnapType,
  Constraint,
  Point2D,
} from '../types/sketch';

// ============ COLORS ============

// Fusion 360 color scheme
const COLORS = {
  // Sketch entities
  entity: 0x3e9fff,           // Blue - unconstrained geometry
  entityConstrained: 0x000000, // Black - fully constrained
  entityHover: 0x38abdf,      // Light blue - hover highlight
  entitySelected: 0xff6b00,   // Orange - selected geometry
  construction: 0xff8c00,     // Orange - construction lines
  preview: 0x38abdf,          // Blue - preview while drawing

  // Profiles
  profile: 0x38abdf,
  profileFill: 0x38abdf,      // Semi-transparent blue fill

  // Grid and origin
  grid: 0x808080,             // Gray grid
  gridMinor: 0x606060,        // Lighter grid
  origin: 0xeb5555,           // Red origin point
  originX: 0xeb5555,          // Red X axis
  originY: 0x87b340,          // Green Y axis
  originZ: 0x38abdf,          // Blue Z axis

  // Snap points - Fusion 360 style
  snapPoint: 0x00ff00,        // Default snap
  snapEndpoint: 0x00ff00,     // Green - endpoints
  snapMidpoint: 0xff00ff,     // Magenta - midpoints
  snapCenter: 0xffff00,       // Yellow - centers
  snapQuadrant: 0x00ffff,     // Cyan - quadrants
  snapGrid: 0x888888,         // Gray - grid snap
  snapOrigin: 0xeb5555,       // Red - origin
  snapIntersection: 0xff8800, // Orange - intersections

  // Constraints
  constraintSatisfied: 0x87b340,  // Green - constraint satisfied
  constraintIcon: 0x87b340,       // Green - constraint icons

  // Dimensions
  dimensionLine: 0x0696d7,        // Blue - dimension lines
  dimensionBg: 0x0696d7,          // Blue - dimension box background
  dimensionText: 0xffffff,        // White - dimension text
};

// ============ SKETCH RENDERER CLASS ============

export class SketchRenderer {
  private scene: THREE.Scene;
  private group: THREE.Group;
  private plane: SketchPlane | null = null;

  // Mesh collections
  private entityMeshes: Map<string, THREE.Line | THREE.Points> = new Map();
  private profileMeshes: THREE.Mesh[] = [];
  private constraintMeshes: THREE.Group[] = [];
  private implicitConstraintMeshes: THREE.Group[] = [];
  private gridMesh: THREE.LineSegments | null = null;
  private originMesh: THREE.Group | null = null;
  private previewMesh: THREE.Line | null = null;
  private snapPointMesh: THREE.Points | THREE.Line | THREE.Group | null = null;

  // Materials
  private entityMaterial: THREE.LineBasicMaterial;
  private constructionMaterial: THREE.LineDashedMaterial;
  private hoverMaterial: THREE.LineBasicMaterial;
  private selectedMaterial: THREE.LineBasicMaterial;
  private previewMaterial: THREE.LineDashedMaterial;
  private profileMaterial: THREE.MeshBasicMaterial;
  private pointMaterial: THREE.PointsMaterial;
  private snapPointMaterial: THREE.PointsMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'sketch-renderer';
    scene.add(this.group);

    // Create materials
    this.entityMaterial = new THREE.LineBasicMaterial({ color: COLORS.entity, linewidth: 2 });
    this.constructionMaterial = new THREE.LineDashedMaterial({
      color: COLORS.construction,
      dashSize: 5,
      gapSize: 3,
    });
    this.hoverMaterial = new THREE.LineBasicMaterial({ color: COLORS.entityHover, linewidth: 3 });
    this.selectedMaterial = new THREE.LineBasicMaterial({ color: COLORS.entitySelected, linewidth: 3 });
    this.previewMaterial = new THREE.LineDashedMaterial({
      color: COLORS.preview,
      dashSize: 5,
      gapSize: 3,
    });
    this.profileMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.profileFill,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    });
    this.pointMaterial = new THREE.PointsMaterial({ color: COLORS.entity, size: 8, sizeAttenuation: false });
    this.snapPointMaterial = new THREE.PointsMaterial({
      color: COLORS.snapPoint,
      size: 12,
      sizeAttenuation: false,
    });
  }

  /**
   * Set the sketch plane for rendering
   */
  setPlane(plane: SketchPlane | null): void {
    this.plane = plane;
    this.updateTransform();
  }

  /**
   * Update the group transform based on the plane
   */
  private updateTransform(): void {
    if (!this.plane) {
      this.group.visible = false;
      return;
    }

    this.group.visible = true;
    this.group.position.set(this.plane.origin.x, this.plane.origin.y, this.plane.origin.z);

    // Set rotation based on plane type
    switch (this.plane.type) {
      case 'XY':
        this.group.rotation.set(0, 0, 0);
        break;
      case 'XZ':
        this.group.rotation.set(-Math.PI / 2, 0, 0);
        break;
      case 'YZ':
        this.group.rotation.set(0, Math.PI / 2, 0);
        break;
    }

    // Apply plane offset along normal
    const offset = this.plane.offset;
    const normal = new THREE.Vector3(this.plane.normal.x, this.plane.normal.y, this.plane.normal.z);
    this.group.position.add(normal.multiplyScalar(offset));
  }

  /**
   * Render the sketch data
   */
  render(
    data: SketchData | null,
    selectedIds: string[],
    hoveredId: string | null,
    previewEntity: SketchEntity | null
  ): void {
    // Clear previous entities
    this.clearEntities();

    if (!data) return;

    // Render grid
    this.renderGrid(data.gridSize);

    // Render origin marker
    this.renderOrigin();

    // Render profiles (filled areas)
    this.renderProfiles(data.profiles);

    // Render entities
    for (const entity of data.entities) {
      const isSelected = selectedIds.includes(entity.id);
      const isHovered = entity.id === hoveredId;
      this.renderEntity(entity, isSelected, isHovered);
    }

    // Render explicit constraints
    this.renderConstraints(data.constraints, data.entities);

    // Render implicit constraints (auto-detected)
    this.renderImplicitConstraints(data.entities);

    // Render preview entity
    if (previewEntity) {
      this.renderPreview(previewEntity);
    }
  }

  /**
   * Render a single entity
   */
  private renderEntity(entity: SketchEntity, isSelected: boolean, isHovered: boolean): void {
    let mesh: THREE.Line | THREE.Points | null = null;
    let material = entity.construction
      ? this.constructionMaterial
      : isSelected
        ? this.selectedMaterial
        : isHovered
          ? this.hoverMaterial
          : this.entityMaterial;

    switch (entity.type) {
      case 'line':
        mesh = this.createLineMesh(entity as LineEntity, material);
        break;
      case 'rectangle':
        mesh = this.createRectangleMesh(entity as RectangleEntity, material);
        break;
      case 'circle':
        mesh = this.createCircleMesh(entity as CircleEntity, material);
        break;
      case 'arc':
        mesh = this.createArcMesh(entity as ArcEntity, material);
        break;
      case 'point':
        mesh = this.createPointMesh(entity as PointEntity, isSelected || isHovered);
        break;
    }

    if (mesh) {
      mesh.userData.entityId = entity.id;
      this.group.add(mesh);
      this.entityMeshes.set(entity.id, mesh);
    }
  }

  /**
   * Create mesh for a line entity
   */
  private createLineMesh(line: LineEntity, material: THREE.Material): THREE.Line {
    const geometry = new THREE.BufferGeometry();
    const points = [
      new THREE.Vector3(line.start.x, line.start.y, 0),
      new THREE.Vector3(line.end.x, line.end.y, 0),
    ];
    geometry.setFromPoints(points);

    const mesh = new THREE.Line(geometry, material);
    if (material === this.constructionMaterial) {
      mesh.computeLineDistances();
    }
    return mesh;
  }

  /**
   * Create mesh for a rectangle entity
   */
  private createRectangleMesh(rect: RectangleEntity, material: THREE.Material): THREE.Line {
    const geometry = new THREE.BufferGeometry();
    const { corner1, corner2 } = rect;
    const points = [
      new THREE.Vector3(corner1.x, corner1.y, 0),
      new THREE.Vector3(corner2.x, corner1.y, 0),
      new THREE.Vector3(corner2.x, corner2.y, 0),
      new THREE.Vector3(corner1.x, corner2.y, 0),
      new THREE.Vector3(corner1.x, corner1.y, 0), // Close the loop
    ];
    geometry.setFromPoints(points);

    const mesh = new THREE.Line(geometry, material);
    if (material === this.constructionMaterial) {
      mesh.computeLineDistances();
    }
    return mesh;
  }

  /**
   * Create mesh for a circle entity
   */
  private createCircleMesh(circle: CircleEntity, material: THREE.Material): THREE.Line {
    const geometry = new THREE.BufferGeometry();
    const segments = 64;
    const points: THREE.Vector3[] = [];

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(
        circle.center.x + circle.radius * Math.cos(angle),
        circle.center.y + circle.radius * Math.sin(angle),
        0
      ));
    }

    geometry.setFromPoints(points);

    const mesh = new THREE.Line(geometry, material);
    if (material === this.constructionMaterial) {
      mesh.computeLineDistances();
    }
    return mesh;
  }

  /**
   * Create mesh for an arc entity
   */
  private createArcMesh(arc: ArcEntity, material: THREE.Material): THREE.Line {
    const geometry = new THREE.BufferGeometry();
    const segments = 32;
    const points: THREE.Vector3[] = [];

    let startAngle = arc.startAngle;
    let endAngle = arc.endAngle;
    if (endAngle < startAngle) endAngle += Math.PI * 2;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = startAngle + t * (endAngle - startAngle);
      points.push(new THREE.Vector3(
        arc.center.x + arc.radius * Math.cos(angle),
        arc.center.y + arc.radius * Math.sin(angle),
        0
      ));
    }

    geometry.setFromPoints(points);

    const mesh = new THREE.Line(geometry, material);
    if (material === this.constructionMaterial) {
      mesh.computeLineDistances();
    }
    return mesh;
  }

  /**
   * Create mesh for a point entity
   */
  private createPointMesh(point: PointEntity, highlight: boolean): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(
      [point.position.x, point.position.y, 0],
      3
    ));

    const material = highlight
      ? new THREE.PointsMaterial({ color: COLORS.entitySelected, size: 10, sizeAttenuation: false })
      : this.pointMaterial;

    return new THREE.Points(geometry, material);
  }

  /**
   * Render preview entity
   */
  private renderPreview(entity: SketchEntity): void {
    if (this.previewMesh) {
      this.group.remove(this.previewMesh);
      this.previewMesh.geometry.dispose();
      this.previewMesh = null;
    }

    let geometry: THREE.BufferGeometry | null = null;
    const points: THREE.Vector3[] = [];

    switch (entity.type) {
      case 'line': {
        const line = entity as LineEntity;
        points.push(
          new THREE.Vector3(line.start.x, line.start.y, 0),
          new THREE.Vector3(line.end.x, line.end.y, 0)
        );
        break;
      }
      case 'rectangle': {
        const rect = entity as RectangleEntity;
        points.push(
          new THREE.Vector3(rect.corner1.x, rect.corner1.y, 0),
          new THREE.Vector3(rect.corner2.x, rect.corner1.y, 0),
          new THREE.Vector3(rect.corner2.x, rect.corner2.y, 0),
          new THREE.Vector3(rect.corner1.x, rect.corner2.y, 0),
          new THREE.Vector3(rect.corner1.x, rect.corner1.y, 0)
        );
        break;
      }
      case 'circle': {
        const circle = entity as CircleEntity;
        const segments = 64;
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          points.push(new THREE.Vector3(
            circle.center.x + circle.radius * Math.cos(angle),
            circle.center.y + circle.radius * Math.sin(angle),
            0
          ));
        }
        break;
      }
    }

    if (points.length > 0) {
      geometry = new THREE.BufferGeometry().setFromPoints(points);
      this.previewMesh = new THREE.Line(geometry, this.previewMaterial);
      this.previewMesh.computeLineDistances();
      this.group.add(this.previewMesh);
    }
  }

  /**
   * Render profiles as filled areas
   */
  private renderProfiles(profiles: Profile[]): void {
    // Clear previous profile meshes
    for (const mesh of this.profileMeshes) {
      this.group.remove(mesh);
      mesh.geometry.dispose();
    }
    this.profileMeshes = [];

    for (const profile of profiles) {
      const shape = new THREE.Shape();
      const outer = profile.outerLoop;

      if (outer.length < 3) continue;

      shape.moveTo(outer[0].x, outer[0].y);
      for (let i = 1; i < outer.length; i++) {
        shape.lineTo(outer[i].x, outer[i].y);
      }
      shape.closePath();

      // Add holes
      for (const inner of profile.innerLoops) {
        if (inner.length < 3) continue;
        const hole = new THREE.Path();
        hole.moveTo(inner[0].x, inner[0].y);
        for (let i = 1; i < inner.length; i++) {
          hole.lineTo(inner[i].x, inner[i].y);
        }
        hole.closePath();
        shape.holes.push(hole);
      }

      const geometry = new THREE.ShapeGeometry(shape);
      const mesh = new THREE.Mesh(geometry, this.profileMaterial);
      mesh.position.z = -0.01; // Slightly behind entities
      this.group.add(mesh);
      this.profileMeshes.push(mesh);
    }
  }

  /**
   * Render explicit constraints
   */
  private renderConstraints(constraints: Constraint[], entities: SketchEntity[]): void {
    // Clear previous constraint meshes
    for (const mesh of this.constraintMeshes) {
      this.group.remove(mesh);
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
          child.geometry.dispose();
        }
      });
    }
    this.constraintMeshes = [];

    for (const constraint of constraints) {
      const mesh = this.createConstraintMesh(constraint, entities);
      if (mesh) {
        this.group.add(mesh);
        this.constraintMeshes.push(mesh);
      }
    }
  }

  /**
   * Create visual representation for a constraint
   */
  private createConstraintMesh(constraint: Constraint, entities: SketchEntity[]): THREE.Group | null {
    const group = new THREE.Group();

    if (constraint.type === 'distance' && 'entityId1' in constraint) {
      // Distance constraint - show dimension line
      const entity1 = entities.find(e => e.id === constraint.entityId1);
      if (!entity1) return null;

      const dimConstraint = constraint as import('../types/sketch').DimensionConstraint;
      let p1: Point2D | null = null;
      let p2: Point2D | null = null;

      if (entity1.type === 'line') {
        const line = entity1 as LineEntity;
        if (dimConstraint.pointIndex1 === 0) p1 = line.start;
        else if (dimConstraint.pointIndex1 === 1) p1 = line.end;
        else p1 = line.start;
      }

      if (dimConstraint.entityId2) {
        const entity2 = entities.find(e => e.id === dimConstraint.entityId2);
        if (entity2?.type === 'line') {
          const line2 = entity2 as LineEntity;
          if (dimConstraint.pointIndex2 === 0) p2 = line2.start;
          else if (dimConstraint.pointIndex2 === 1) p2 = line2.end;
          else p2 = line2.start;
        }
      } else if (entity1.type === 'line') {
        // Distance constraint on a single line
        const line = entity1 as LineEntity;
        p1 = line.start;
        p2 = line.end;
      }

      if (p1 && p2) {
        this.addDimensionLine(group, p1, p2, dimConstraint.value);
      }
    }

    return group.children.length > 0 ? group : null;
  }

  /**
   * Add a dimension line between two points
   * Note: The value parameter will be used for text labels when text rendering is added
   */
  private addDimensionLine(group: THREE.Group, p1: Point2D, p2: Point2D, _value: number): void {
    const offset = 8; // Offset from geometry
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length < 0.1) return;

    // Perpendicular direction
    const perpX = -dy / length * offset;
    const perpY = dx / length * offset;

    const offsetP1 = { x: p1.x + perpX, y: p1.y + perpY };
    const offsetP2 = { x: p2.x + perpX, y: p2.y + perpY };

    // Main dimension line
    const lineGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(offsetP1.x, offsetP1.y, 0.02),
      new THREE.Vector3(offsetP2.x, offsetP2.y, 0.02),
    ]);
    const lineMat = new THREE.LineBasicMaterial({ color: COLORS.dimensionLine });
    group.add(new THREE.Line(lineGeom, lineMat));

    // Extension lines
    const ext1Geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(p1.x, p1.y, 0.02),
      new THREE.Vector3(offsetP1.x + perpX * 0.3, offsetP1.y + perpY * 0.3, 0.02),
    ]);
    group.add(new THREE.Line(ext1Geom, lineMat));

    const ext2Geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(p2.x, p2.y, 0.02),
      new THREE.Vector3(offsetP2.x + perpX * 0.3, offsetP2.y + perpY * 0.3, 0.02),
    ]);
    group.add(new THREE.Line(ext2Geom, lineMat));

    // Arrow heads
    const arrowSize = 2;
    const arrowAngle = Math.PI / 6;
    const dirX = dx / length;
    const dirY = dy / length;

    // Arrow at p1
    const arrow1Geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(offsetP1.x, offsetP1.y, 0.02),
      new THREE.Vector3(
        offsetP1.x + arrowSize * (dirX * Math.cos(arrowAngle) + dirY * Math.sin(arrowAngle)),
        offsetP1.y + arrowSize * (dirY * Math.cos(arrowAngle) - dirX * Math.sin(arrowAngle)),
        0.02
      ),
    ]);
    group.add(new THREE.Line(arrow1Geom, lineMat));

    const arrow1bGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(offsetP1.x, offsetP1.y, 0.02),
      new THREE.Vector3(
        offsetP1.x + arrowSize * (dirX * Math.cos(-arrowAngle) + dirY * Math.sin(-arrowAngle)),
        offsetP1.y + arrowSize * (dirY * Math.cos(-arrowAngle) - dirX * Math.sin(-arrowAngle)),
        0.02
      ),
    ]);
    group.add(new THREE.Line(arrow1bGeom, lineMat));

    // Arrow at p2
    const arrow2Geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(offsetP2.x, offsetP2.y, 0.02),
      new THREE.Vector3(
        offsetP2.x - arrowSize * (dirX * Math.cos(arrowAngle) + dirY * Math.sin(arrowAngle)),
        offsetP2.y - arrowSize * (dirY * Math.cos(arrowAngle) - dirX * Math.sin(arrowAngle)),
        0.02
      ),
    ]);
    group.add(new THREE.Line(arrow2Geom, lineMat));

    const arrow2bGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(offsetP2.x, offsetP2.y, 0.02),
      new THREE.Vector3(
        offsetP2.x - arrowSize * (dirX * Math.cos(-arrowAngle) + dirY * Math.sin(-arrowAngle)),
        offsetP2.y - arrowSize * (dirY * Math.cos(-arrowAngle) - dirX * Math.sin(-arrowAngle)),
        0.02
      ),
    ]);
    group.add(new THREE.Line(arrow2bGeom, lineMat));
  }

  /**
   * Render implicit constraints (auto-detected from geometry)
   */
  private renderImplicitConstraints(entities: SketchEntity[]): void {
    // Clear previous implicit constraint meshes
    for (const mesh of this.implicitConstraintMeshes) {
      this.group.remove(mesh);
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
          child.geometry.dispose();
        }
      });
    }
    this.implicitConstraintMeshes = [];

    const tolerance = 0.01; // Tolerance for detecting constraints

    for (const entity of entities) {
      if (entity.type === 'line') {
        const line = entity as LineEntity;
        const dx = line.end.x - line.start.x;
        const dy = line.end.y - line.start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length < 0.1) continue;

        // Check for horizontal line
        if (Math.abs(dy) < tolerance * length) {
          const midpoint = {
            x: (line.start.x + line.end.x) / 2,
            y: (line.start.y + line.end.y) / 2,
          };
          const mesh = this.createConstraintIndicator('horizontal', midpoint);
          if (mesh) {
            this.group.add(mesh);
            this.implicitConstraintMeshes.push(mesh);
          }
        }
        // Check for vertical line
        else if (Math.abs(dx) < tolerance * length) {
          const midpoint = {
            x: (line.start.x + line.end.x) / 2,
            y: (line.start.y + line.end.y) / 2,
          };
          const mesh = this.createConstraintIndicator('vertical', midpoint);
          if (mesh) {
            this.group.add(mesh);
            this.implicitConstraintMeshes.push(mesh);
          }
        }
      } else if (entity.type === 'circle') {
        // Show concentric indicator if circles share a center
        const circle = entity as CircleEntity;
        for (const other of entities) {
          if (other.id === entity.id || other.type !== 'circle') continue;
          const otherCircle = other as CircleEntity;
          const dist = Math.sqrt(
            (circle.center.x - otherCircle.center.x) ** 2 +
            (circle.center.y - otherCircle.center.y) ** 2
          );
          if (dist < tolerance) {
            // Concentric circles
            const mesh = this.createConstraintIndicator('concentric', circle.center);
            if (mesh) {
              this.group.add(mesh);
              this.implicitConstraintMeshes.push(mesh);
            }
            break; // Only show one indicator per circle
          }
        }
      }
    }

    // Check for parallel/perpendicular lines
    const lines = entities.filter(e => e.type === 'line') as LineEntity[];
    for (let i = 0; i < lines.length; i++) {
      const line1 = lines[i];
      const d1x = line1.end.x - line1.start.x;
      const d1y = line1.end.y - line1.start.y;
      const len1 = Math.sqrt(d1x * d1x + d1y * d1y);
      if (len1 < 0.1) continue;

      for (let j = i + 1; j < lines.length; j++) {
        const line2 = lines[j];
        const d2x = line2.end.x - line2.start.x;
        const d2y = line2.end.y - line2.start.y;
        const len2 = Math.sqrt(d2x * d2x + d2y * d2y);
        if (len2 < 0.1) continue;

        // Normalize directions
        const n1x = d1x / len1;
        const n1y = d1y / len1;
        const n2x = d2x / len2;
        const n2y = d2y / len2;

        const dot = Math.abs(n1x * n2x + n1y * n2y);
        const cross = Math.abs(n1x * n2y - n1y * n2x);

        // Check for parallel (dot close to 1)
        if (dot > 0.999 && cross < 0.01) {
          const midpoint = {
            x: (line2.start.x + line2.end.x) / 2,
            y: (line2.start.y + line2.end.y) / 2 + 3, // Offset to avoid overlap
          };
          const mesh = this.createConstraintIndicator('parallel', midpoint);
          if (mesh) {
            this.group.add(mesh);
            this.implicitConstraintMeshes.push(mesh);
          }
        }
        // Check for perpendicular (cross close to 1)
        else if (cross > 0.999 && dot < 0.01) {
          // Find intersection point or use midpoint of second line
          const midpoint = {
            x: (line2.start.x + line2.end.x) / 2,
            y: (line2.start.y + line2.end.y) / 2 + 3,
          };
          const mesh = this.createConstraintIndicator('perpendicular', midpoint);
          if (mesh) {
            this.group.add(mesh);
            this.implicitConstraintMeshes.push(mesh);
          }
        }
      }
    }
  }

  /**
   * Create a constraint indicator icon at a position
   */
  private createConstraintIndicator(type: string, position: Point2D): THREE.Group {
    const group = new THREE.Group();
    const size = 3;
    const color = COLORS.constraintSatisfied;
    const material = new THREE.LineBasicMaterial({ color });

    switch (type) {
      case 'horizontal': {
        // H symbol
        const h1 = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(position.x - size / 2, position.y - size / 2, 0.03),
          new THREE.Vector3(position.x - size / 2, position.y + size / 2, 0.03),
        ]);
        const h2 = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(position.x + size / 2, position.y - size / 2, 0.03),
          new THREE.Vector3(position.x + size / 2, position.y + size / 2, 0.03),
        ]);
        const h3 = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(position.x - size / 2, position.y, 0.03),
          new THREE.Vector3(position.x + size / 2, position.y, 0.03),
        ]);
        group.add(new THREE.Line(h1, material));
        group.add(new THREE.Line(h2, material));
        group.add(new THREE.Line(h3, material));
        break;
      }
      case 'vertical': {
        // V symbol
        const v1 = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(position.x - size / 2, position.y + size / 2, 0.03),
          new THREE.Vector3(position.x, position.y - size / 2, 0.03),
        ]);
        const v2 = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(position.x + size / 2, position.y + size / 2, 0.03),
          new THREE.Vector3(position.x, position.y - size / 2, 0.03),
        ]);
        group.add(new THREE.Line(v1, material));
        group.add(new THREE.Line(v2, material));
        break;
      }
      case 'parallel': {
        // // symbol (two parallel lines)
        const offset = size / 4;
        const p1 = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(position.x - size / 2 - offset, position.y - size / 2, 0.03),
          new THREE.Vector3(position.x + size / 2 - offset, position.y + size / 2, 0.03),
        ]);
        const p2 = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(position.x - size / 2 + offset, position.y - size / 2, 0.03),
          new THREE.Vector3(position.x + size / 2 + offset, position.y + size / 2, 0.03),
        ]);
        group.add(new THREE.Line(p1, material));
        group.add(new THREE.Line(p2, material));
        break;
      }
      case 'perpendicular': {
        // ⊥ symbol
        const perp1 = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(position.x - size / 2, position.y - size / 2, 0.03),
          new THREE.Vector3(position.x + size / 2, position.y - size / 2, 0.03),
        ]);
        const perp2 = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(position.x, position.y - size / 2, 0.03),
          new THREE.Vector3(position.x, position.y + size / 2, 0.03),
        ]);
        group.add(new THREE.Line(perp1, material));
        group.add(new THREE.Line(perp2, material));
        break;
      }
      case 'concentric': {
        // Concentric circles symbol
        const segments = 16;
        const r1 = size / 3;
        const r2 = size / 2;
        const points1: THREE.Vector3[] = [];
        const points2: THREE.Vector3[] = [];
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          points1.push(new THREE.Vector3(
            position.x + r1 * Math.cos(angle),
            position.y + r1 * Math.sin(angle),
            0.03
          ));
          points2.push(new THREE.Vector3(
            position.x + r2 * Math.cos(angle),
            position.y + r2 * Math.sin(angle),
            0.03
          ));
        }
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points1), material));
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points2), material));
        break;
      }
      case 'equal': {
        // = symbol
        const eq1 = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(position.x - size / 2, position.y + size / 4, 0.03),
          new THREE.Vector3(position.x + size / 2, position.y + size / 4, 0.03),
        ]);
        const eq2 = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(position.x - size / 2, position.y - size / 4, 0.03),
          new THREE.Vector3(position.x + size / 2, position.y - size / 4, 0.03),
        ]);
        group.add(new THREE.Line(eq1, material));
        group.add(new THREE.Line(eq2, material));
        break;
      }
      case 'fixed': {
        // Anchor symbol
        const f1 = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(position.x - size / 2, position.y - size / 2, 0.03),
          new THREE.Vector3(position.x + size / 2, position.y - size / 2, 0.03),
        ]);
        const f2 = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(position.x - size / 3, position.y - size / 2, 0.03),
          new THREE.Vector3(position.x - size / 3 - size / 4, position.y - size, 0.03),
        ]);
        const f3 = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(position.x, position.y - size / 2, 0.03),
          new THREE.Vector3(position.x, position.y - size, 0.03),
        ]);
        const f4 = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(position.x + size / 3, position.y - size / 2, 0.03),
          new THREE.Vector3(position.x + size / 3 + size / 4, position.y - size, 0.03),
        ]);
        group.add(new THREE.Line(f1, material));
        group.add(new THREE.Line(f2, material));
        group.add(new THREE.Line(f3, material));
        group.add(new THREE.Line(f4, material));
        break;
      }
    }

    return group;
  }

  /**
   * Render grid
   */
  private renderGrid(gridSize: number): void {
    if (this.gridMesh) {
      this.group.remove(this.gridMesh);
      this.gridMesh.geometry.dispose();
    }

    const size = 200;
    const divisions = Math.floor(size / gridSize);
    const halfSize = size / 2;

    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];

    for (let i = 0; i <= divisions; i++) {
      const pos = -halfSize + i * gridSize;
      // Horizontal lines
      vertices.push(-halfSize, pos, -0.02, halfSize, pos, -0.02);
      // Vertical lines
      vertices.push(pos, -halfSize, -0.02, pos, halfSize, -0.02);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const material = new THREE.LineBasicMaterial({ color: COLORS.grid, transparent: true, opacity: 0.3 });
    this.gridMesh = new THREE.LineSegments(geometry, material);
    this.group.add(this.gridMesh);
  }

  /**
   * Render origin marker - Fusion 360 style with colored axes
   */
  private renderOrigin(): void {
    if (this.originMesh) {
      this.group.remove(this.originMesh);
    }

    this.originMesh = new THREE.Group();

    // X axis (Red)
    const xGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(25, 0, 0),
    ]);
    const xLine = new THREE.Line(xGeom, new THREE.LineBasicMaterial({ color: COLORS.originX }));
    this.originMesh.add(xLine);

    // X arrow head
    const xArrowGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(25, 0, 0),
      new THREE.Vector3(22, 2, 0),
      new THREE.Vector3(25, 0, 0),
      new THREE.Vector3(22, -2, 0),
    ]);
    const xArrow = new THREE.Line(xArrowGeom, new THREE.LineBasicMaterial({ color: COLORS.originX }));
    this.originMesh.add(xArrow);

    // Y axis (Green)
    const yGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 25, 0),
    ]);
    const yLine = new THREE.Line(yGeom, new THREE.LineBasicMaterial({ color: COLORS.originY }));
    this.originMesh.add(yLine);

    // Y arrow head
    const yArrowGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 25, 0),
      new THREE.Vector3(2, 22, 0),
      new THREE.Vector3(0, 25, 0),
      new THREE.Vector3(-2, 22, 0),
    ]);
    const yArrow = new THREE.Line(yArrowGeom, new THREE.LineBasicMaterial({ color: COLORS.originY }));
    this.originMesh.add(yArrow);

    // Origin point (small circle)
    const originPointGeom = new THREE.BufferGeometry();
    const segments = 16;
    const radius = 2;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(radius * Math.cos(angle), radius * Math.sin(angle), 0));
    }
    originPointGeom.setFromPoints(points);
    const originPoint = new THREE.Line(originPointGeom, new THREE.LineBasicMaterial({ color: COLORS.origin }));
    this.originMesh.add(originPoint);

    this.group.add(this.originMesh);
  }

  /**
   * Show snap point indicator with type-specific visual
   */
  showSnapPoint(x: number, y: number, snapType?: SnapType): void {
    if (this.snapPointMesh) {
      this.group.remove(this.snapPointMesh);
      if (this.snapPointMesh instanceof THREE.Points) {
        this.snapPointMesh.geometry.dispose();
      } else if (this.snapPointMesh instanceof THREE.Line || this.snapPointMesh instanceof THREE.Group) {
        this.snapPointMesh.traverse((child) => {
          if (child instanceof THREE.Line || child instanceof THREE.Mesh) {
            child.geometry.dispose();
          }
        });
      }
    }

    // Get color based on snap type
    const color = this.getSnapColor(snapType || 'grid');
    const size = 12;

    // Create different visual indicators based on snap type
    switch (snapType) {
      case 'endpoint': {
        // Square indicator for endpoints
        const geometry = new THREE.BufferGeometry();
        const halfSize = size / 200;
        const points = [
          new THREE.Vector3(x - halfSize, y - halfSize, 0.01),
          new THREE.Vector3(x + halfSize, y - halfSize, 0.01),
          new THREE.Vector3(x + halfSize, y + halfSize, 0.01),
          new THREE.Vector3(x - halfSize, y + halfSize, 0.01),
          new THREE.Vector3(x - halfSize, y - halfSize, 0.01),
        ];
        geometry.setFromPoints(points);
        this.snapPointMesh = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, linewidth: 2 }));
        break;
      }
      case 'midpoint': {
        // Triangle indicator for midpoints
        const geometry = new THREE.BufferGeometry();
        const halfSize = size / 200;
        const points = [
          new THREE.Vector3(x, y + halfSize, 0.01),
          new THREE.Vector3(x - halfSize, y - halfSize, 0.01),
          new THREE.Vector3(x + halfSize, y - halfSize, 0.01),
          new THREE.Vector3(x, y + halfSize, 0.01),
        ];
        geometry.setFromPoints(points);
        this.snapPointMesh = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, linewidth: 2 }));
        break;
      }
      case 'center': {
        // Circle indicator for centers
        const geometry = new THREE.BufferGeometry();
        const segments = 16;
        const radius = size / 200;
        const points: THREE.Vector3[] = [];
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          points.push(new THREE.Vector3(x + radius * Math.cos(angle), y + radius * Math.sin(angle), 0.01));
        }
        geometry.setFromPoints(points);
        this.snapPointMesh = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, linewidth: 2 }));
        break;
      }
      case 'quadrant': {
        // Diamond indicator for quadrants
        const geometry = new THREE.BufferGeometry();
        const halfSize = size / 200;
        const points = [
          new THREE.Vector3(x, y + halfSize, 0.01),
          new THREE.Vector3(x + halfSize, y, 0.01),
          new THREE.Vector3(x, y - halfSize, 0.01),
          new THREE.Vector3(x - halfSize, y, 0.01),
          new THREE.Vector3(x, y + halfSize, 0.01),
        ];
        geometry.setFromPoints(points);
        this.snapPointMesh = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, linewidth: 2 }));
        break;
      }
      case 'origin': {
        // Crosshair indicator for origin
        const group = new THREE.Group();
        const halfSize = size / 150;
        const h1 = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x - halfSize, y, 0.01),
          new THREE.Vector3(x + halfSize, y, 0.01),
        ]);
        const h2 = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, y - halfSize, 0.01),
          new THREE.Vector3(x, y + halfSize, 0.01),
        ]);
        group.add(new THREE.Line(h1, new THREE.LineBasicMaterial({ color, linewidth: 2 })));
        group.add(new THREE.Line(h2, new THREE.LineBasicMaterial({ color, linewidth: 2 })));
        this.snapPointMesh = group;
        break;
      }
      case 'intersection': {
        // X indicator for intersections
        const group = new THREE.Group();
        const halfSize = size / 200;
        const h1 = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x - halfSize, y - halfSize, 0.01),
          new THREE.Vector3(x + halfSize, y + halfSize, 0.01),
        ]);
        const h2 = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x - halfSize, y + halfSize, 0.01),
          new THREE.Vector3(x + halfSize, y - halfSize, 0.01),
        ]);
        group.add(new THREE.Line(h1, new THREE.LineBasicMaterial({ color, linewidth: 2 })));
        group.add(new THREE.Line(h2, new THREE.LineBasicMaterial({ color, linewidth: 2 })));
        this.snapPointMesh = group;
        break;
      }
      default: {
        // Grid: simple point
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute([x, y, 0.01], 3));
        const material = new THREE.PointsMaterial({ color, size: 10, sizeAttenuation: false });
        this.snapPointMesh = new THREE.Points(geometry, material);
        break;
      }
    }

    this.group.add(this.snapPointMesh);
  }

  /**
   * Get snap color based on type
   */
  private getSnapColor(snapType: SnapType): number {
    switch (snapType) {
      case 'endpoint': return COLORS.snapEndpoint;
      case 'midpoint': return COLORS.snapMidpoint;
      case 'center': return COLORS.snapCenter;
      case 'quadrant': return COLORS.snapQuadrant;
      case 'origin': return COLORS.snapOrigin;
      case 'intersection': return COLORS.snapIntersection;
      case 'grid':
      default: return COLORS.snapGrid;
    }
  }

  /**
   * Hide snap point indicator
   */
  hideSnapPoint(): void {
    if (this.snapPointMesh) {
      this.group.remove(this.snapPointMesh);
      if (this.snapPointMesh instanceof THREE.Points || this.snapPointMesh instanceof THREE.Line) {
        this.snapPointMesh.geometry.dispose();
      } else if (this.snapPointMesh instanceof THREE.Group) {
        this.snapPointMesh.traverse((child) => {
          if (child instanceof THREE.Line || child instanceof THREE.Mesh) {
            child.geometry.dispose();
          }
        });
      }
      this.snapPointMesh = null;
    }
  }

  /**
   * Clear all entity meshes
   */
  private clearEntities(): void {
    for (const [, mesh] of this.entityMeshes) {
      this.group.remove(mesh);
      mesh.geometry.dispose();
    }
    this.entityMeshes.clear();

    if (this.previewMesh) {
      this.group.remove(this.previewMesh);
      this.previewMesh.geometry.dispose();
      this.previewMesh = null;
    }
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.clearEntities();

    if (this.gridMesh) {
      this.group.remove(this.gridMesh);
      this.gridMesh.geometry.dispose();
    }

    if (this.originMesh) {
      this.group.remove(this.originMesh);
    }

    for (const mesh of this.profileMeshes) {
      this.group.remove(mesh);
      mesh.geometry.dispose();
    }

    // Dispose constraint meshes
    for (const mesh of this.constraintMeshes) {
      this.group.remove(mesh);
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
          child.geometry.dispose();
        }
      });
    }
    this.constraintMeshes = [];

    // Dispose implicit constraint meshes
    for (const mesh of this.implicitConstraintMeshes) {
      this.group.remove(mesh);
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
          child.geometry.dispose();
        }
      });
    }
    this.implicitConstraintMeshes = [];

    this.hideSnapPoint();

    // Dispose materials
    this.entityMaterial.dispose();
    this.constructionMaterial.dispose();
    this.hoverMaterial.dispose();
    this.selectedMaterial.dispose();
    this.previewMaterial.dispose();
    this.profileMaterial.dispose();
    this.pointMaterial.dispose();
    this.snapPointMaterial.dispose();

    this.scene.remove(this.group);
  }
}
