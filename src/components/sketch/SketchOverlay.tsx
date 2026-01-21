/**
 * SketchOverlay - 2D sketch canvas overlay on the viewport
 */

import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useSketchStore } from '../../store/sketchStore';
import { SketchToolbar } from './SketchToolbar';
import { SketchPalette } from './SketchPalette';
import { SketchRenderer } from '../../viewport/SketchRenderer';
import { SketchEngine } from '../../engine/SketchEngine';
import { ViewportManager } from '../../viewport/ViewportManager';
import type { Point2D, SketchPlane } from '../../types/sketch';
import './SketchOverlay.css';

interface SketchOverlayProps {
  featureId: string;
  plane: SketchPlane;
  initialSketchData?: import('../../types/sketch').SketchData; // Existing sketch data when editing
  onFinish: (data: import('../../types/sketch').SketchData | null) => void;
  onCancel: () => void;
  onFinishAndExtrude?: () => void; // Called when E key is pressed to finish and open Extrude dialog
}

export function SketchOverlay({ featureId, plane, initialSketchData, onFinish, onCancel, onFinishAndExtrude }: SketchOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<SketchRenderer | null>(null);

  const sketchData = useSketchStore(state => state.sketchData);
  const toolState = useSketchStore(state => state.toolState);
  const displaySettings = useSketchStore(state => state.displaySettings);
  const selectedEntityIds = useSketchStore(state => state.selectedEntityIds);
  const hoveredEntityId = useSketchStore(state => state.hoveredEntityId);
  const previewEntity = useSketchStore(state => state.previewEntity);

  const enterSketchMode = useSketchStore(state => state.enterSketchMode);
  const exitSketchMode = useSketchStore(state => state.exitSketchMode);
  const startDrawing = useSketchStore(state => state.startDrawing);
  const updateDrawing = useSketchStore(state => state.updateDrawing);
  const finishDrawing = useSketchStore(state => state.finishDrawing);
  const cancelDrawing = useSketchStore(state => state.cancelDrawing);
  const clearSelection = useSketchStore(state => state.clearSelection);
  const setSnapPoint = useSketchStore(state => state.setSnapPoint);
  const deleteSelectedEntities = useSketchStore(state => state.deleteSelectedEntities);
  const toggleConstruction = useSketchStore(state => state.toggleConstruction);
  const trimAtPoint = useSketchStore(state => state.trimAtPoint);
  const selectEntityForOffset = useSketchStore(state => state.selectEntityForOffset);
  const applyOffset = useSketchStore(state => state.applyOffset);

  // Initialize sketch mode
  useEffect(() => {
    // Pass existing sketch data when editing
    enterSketchMode(featureId, plane, initialSketchData);

    // Create renderer and orient camera
    const viewport = (window as unknown as { viewport: ViewportManager }).viewport;
    if (viewport) {
      const scene = viewport.getScene();
      rendererRef.current = new SketchRenderer(scene);
      rendererRef.current.setPlane(plane);

      // Orient camera to look perpendicular to the sketch plane (like Fusion 360)
      viewport.setViewForSketchPlane(
        plane.type,
        plane.origin,
        plane.type === 'face' ? plane.normal : undefined,
        true // animate
      );
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, [featureId, plane, initialSketchData, enterSketchMode]);

  // Update renderer when sketch data changes
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.render(sketchData, selectedEntityIds, hoveredEntityId, previewEntity);
    }
  }, [sketchData, selectedEntityIds, hoveredEntityId, previewEntity]);

  // Update snap point display
  useEffect(() => {
    if (rendererRef.current && toolState.snapPoint) {
      rendererRef.current.showSnapPoint(toolState.snapPoint.x, toolState.snapPoint.y, toolState.snapType || undefined);
    } else if (rendererRef.current) {
      rendererRef.current.hideSnapPoint();
    }
  }, [toolState.snapPoint, toolState.snapType]);

  // Convert screen coordinates to sketch plane coordinates using proper raycasting
  const screenToSketch = useCallback((clientX: number, clientY: number): Point2D | null => {
    const viewport = (window as unknown as { viewport: ViewportManager }).viewport;
    if (!viewport || !containerRef.current) return null;

    const rect = containerRef.current.getBoundingClientRect();

    // Convert to normalized device coordinates (-1 to +1)
    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;

    const camera = viewport.getCamera();

    // Create raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

    // Create the sketch plane based on plane type
    let planeNormal: THREE.Vector3;
    let planePoint: THREE.Vector3;

    switch (plane.type) {
      case 'XY':
        planeNormal = new THREE.Vector3(0, 0, 1);
        planePoint = new THREE.Vector3(plane.origin.x, plane.origin.y, plane.origin.z + plane.offset);
        break;
      case 'XZ':
        planeNormal = new THREE.Vector3(0, 1, 0);
        planePoint = new THREE.Vector3(plane.origin.x, plane.origin.y + plane.offset, plane.origin.z);
        break;
      case 'YZ':
        planeNormal = new THREE.Vector3(1, 0, 0);
        planePoint = new THREE.Vector3(plane.origin.x + plane.offset, plane.origin.y, plane.origin.z);
        break;
      default:
        planeNormal = new THREE.Vector3(plane.normal.x, plane.normal.y, plane.normal.z);
        planePoint = new THREE.Vector3(plane.origin.x, plane.origin.y, plane.origin.z);
    }

    // Create Three.js Plane
    const threePlane = new THREE.Plane();
    threePlane.setFromNormalAndCoplanarPoint(planeNormal, planePoint);

    // Find intersection with plane
    const intersection = new THREE.Vector3();
    const ray = raycaster.ray;

    if (ray.intersectPlane(threePlane, intersection) === null) {
      // Ray doesn't intersect plane (parallel) - fallback
      return null;
    }

    // Convert 3D intersection point to 2D sketch coordinates
    // The sketch coordinate system is based on the plane's local axes
    let sketchX: number;
    let sketchY: number;

    switch (plane.type) {
      case 'XY':
        sketchX = intersection.x - plane.origin.x;
        sketchY = intersection.y - plane.origin.y;
        break;
      case 'XZ':
        sketchX = intersection.x - plane.origin.x;
        sketchY = -(intersection.z - plane.origin.z); // Z becomes -Y in sketch
        break;
      case 'YZ':
        sketchX = intersection.z - plane.origin.z;
        sketchY = intersection.y - plane.origin.y;
        break;
      default:
        // For custom planes, project onto plane's local coordinate system
        const localPoint = intersection.clone().sub(planePoint);
        const xAxis = new THREE.Vector3(plane.xAxis.x, plane.xAxis.y, plane.xAxis.z);
        const yAxis = new THREE.Vector3(plane.yAxis.x, plane.yAxis.y, plane.yAxis.z);
        sketchX = localPoint.dot(xAxis);
        sketchY = localPoint.dot(yAxis);
    }

    return { x: sketchX, y: sketchY };
  }, [plane]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click

    const point = screenToSketch(e.clientX, e.clientY);
    if (!point) return;

    // Apply snap if available and snap is enabled
    const snapResult = displaySettings.snapEnabled ? SketchEngine.findSnapPoint(point) : null;
    const finalPoint = snapResult ? snapResult.point : point;

    if (toolState.activeTool === 'select') {
      // Selection mode - would need hit testing
      clearSelection();
    } else if (toolState.activeTool === 'trim') {
      // Trim mode - click to trim line at intersection
      trimAtPoint(finalPoint);
    } else if (toolState.activeTool === 'offset') {
      // Offset mode - first click selects entity, second click applies offset
      if (toolState.offsetEntityId) {
        applyOffset(finalPoint);
      } else {
        selectEntityForOffset(finalPoint);
      }
    } else if (toolState.activeTool === 'line') {
      // For line tool, double-click finishes the chain
      if (e.detail === 2) {
        cancelDrawing(); // This will finish the line chain
        return;
      }
      // Single click starts or continues drawing
      startDrawing(finalPoint);
    } else {
      // Drawing mode for other tools
      startDrawing(finalPoint);
    }
  }, [screenToSketch, toolState.activeTool, toolState.offsetEntityId, displaySettings.snapEnabled, startDrawing, clearSelection, cancelDrawing, trimAtPoint, selectEntityForOffset, applyOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const point = screenToSketch(e.clientX, e.clientY);
    if (!point) return;

    // Find snap point if snap is enabled
    const snapResult = displaySettings.snapEnabled ? SketchEngine.findSnapPoint(point) : null;
    if (snapResult) {
      setSnapPoint(snapResult.point, snapResult.entityId, snapResult.type);
    } else {
      setSnapPoint(null, null, null);
    }

    const finalPoint = snapResult ? snapResult.point : point;

    if (toolState.isDrawing) {
      updateDrawing(finalPoint);
    }
  }, [screenToSketch, toolState.isDrawing, displaySettings.snapEnabled, updateDrawing, setSnapPoint]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;

    const point = screenToSketch(e.clientX, e.clientY);
    if (!point) return;

    const snapResult = displaySettings.snapEnabled ? SketchEngine.findSnapPoint(point) : null;
    const finalPoint = snapResult ? snapResult.point : point;

    if (toolState.isDrawing) {
      finishDrawing(finalPoint);
    }
  }, [screenToSketch, toolState.isDrawing, displaySettings.snapEnabled, finishDrawing]);

  // Get setActiveTool from the store
  const setActiveTool = useSketchStore(state => state.setActiveTool);

  // Handle wheel events for zooming - use native listener to allow preventDefault
  // React's wheel events are passive by default, so we can't preventDefault on them
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); // Prevent page scroll - works because passive: false
      const viewport = (window as unknown as { viewport: ViewportManager }).viewport;
      if (viewport) {
        // Convert wheel delta to zoom direction
        // deltaY > 0 means scroll down (zoom out), deltaY < 0 means scroll up (zoom in)
        const delta = -e.deltaY * 0.01;
        viewport.zoom(delta);
      }
    };

    // Add with passive: false to allow preventDefault
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Handle right-click drag for panning (pass through to OrbitControls)
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    // Allow context menu / right-click to work for OrbitControls panning
    e.preventDefault();
  }, []);

  // Handle finish/cancel - defined before handleKeyDown so they can be referenced
  const handleFinish = useCallback(() => {
    const data = exitSketchMode(true);
    onFinish(data);
  }, [exitSketchMode, onFinish]);

  const handleCancel = useCallback(() => {
    exitSketchMode(false);
    onCancel();
  }, [exitSketchMode, onCancel]);

  // Keyboard event handlers
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't handle if typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    if (e.key === 'Escape') {
      if (toolState.isDrawing) {
        cancelDrawing();
      } else {
        clearSelection();
      }
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      deleteSelectedEntities();
    }
    // Tool shortcuts
    else if (e.key === 's' || e.key === 'S') {
      setActiveTool('select');
    } else if (e.key === 'l' || e.key === 'L') {
      setActiveTool('line');
    } else if (e.key === 'r' || e.key === 'R') {
      setActiveTool('rectangle');
    } else if (e.key === 'c' || e.key === 'C') {
      setActiveTool('circle');
    } else if (e.key === 'a' || e.key === 'A') {
      setActiveTool('arc');
    } else if (e.key === 'p' || e.key === 'P') {
      setActiveTool('point');
    } else if (e.key === 't' || e.key === 'T') {
      setActiveTool('trim');
    } else if (e.key === 'o' || e.key === 'O') {
      setActiveTool('offset');
    } else if (e.key === 'x' || e.key === 'X') {
      // Toggle construction mode for selected entities
      for (const id of selectedEntityIds) {
        toggleConstruction(id);
      }
    } else if (e.key === 'd' || e.key === 'D') {
      // Dimension tool (like Fusion 360)
      setActiveTool('dimension');
    } else if (e.key === 'e' || e.key === 'E') {
      // E key: Finish sketch and open Extrude dialog (like Fusion 360)
      if (onFinishAndExtrude) {
        handleFinish();
        onFinishAndExtrude();
      } else {
        handleFinish();
      }
    }
  }, [toolState.isDrawing, cancelDrawing, clearSelection, deleteSelectedEntities, setActiveTool, selectedEntityIds, toggleConstruction, handleFinish, onFinishAndExtrude]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div
      ref={containerRef}
      className="sketch-overlay"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
    >
      <SketchToolbar onFinish={handleFinish} onCancel={handleCancel} />
      <SketchPalette onFinish={handleFinish} />

      <div className="sketch-status-bar">
        <span className="sketch-tool-indicator">
          Tool: {toolState.activeTool}
          {toolState.activeTool === 'line' && toolState.isDrawing && ' (click to add points, double-click or Esc to finish)'}
          {toolState.activeTool === 'line' && !toolState.isDrawing && ' (click to start drawing)'}
          {toolState.activeTool === 'arc' && toolState.arcStep === 0 && ' (click start point)'}
          {toolState.activeTool === 'arc' && toolState.arcStep === 1 && ' (click end point)'}
          {toolState.activeTool === 'arc' && toolState.arcStep === 2 && ' (click point on arc)'}
          {toolState.activeTool === 'trim' && ' (click on line segment to trim)'}
          {toolState.activeTool === 'offset' && !toolState.offsetEntityId && ' (click on entity to offset)'}
          {toolState.activeTool === 'offset' && toolState.offsetEntityId && ` (click to set offset direction, distance: ${toolState.offsetDistance})`}
          {toolState.activeTool === 'dimension' && ' (click entity to add dimension)'}
        </span>
        {toolState.isDrawing && toolState.startPoint && previewEntity && (
          <span className="sketch-dimension-indicator">
            {previewEntity.type === 'line' && (() => {
              const dx = (previewEntity as import('../../types/sketch').LineEntity).end.x - (previewEntity as import('../../types/sketch').LineEntity).start.x;
              const dy = (previewEntity as import('../../types/sketch').LineEntity).end.y - (previewEntity as import('../../types/sketch').LineEntity).start.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              return `Length: ${length.toFixed(1)}`;
            })()}
            {previewEntity.type === 'circle' && `Radius: ${(previewEntity as import('../../types/sketch').CircleEntity).radius.toFixed(1)}`}
            {previewEntity.type === 'rectangle' && (() => {
              const rect = previewEntity as import('../../types/sketch').RectangleEntity;
              const w = Math.abs(rect.corner2.x - rect.corner1.x);
              const h = Math.abs(rect.corner2.y - rect.corner1.y);
              return `${w.toFixed(1)} x ${h.toFixed(1)}`;
            })()}
            {previewEntity.type === 'arc' && `Radius: ${(previewEntity as import('../../types/sketch').ArcEntity).radius.toFixed(1)}`}
          </span>
        )}
        {toolState.snapPoint && (
          <span className={`sketch-snap-indicator snap-${toolState.snapType || 'grid'}`}>
            {toolState.snapType === 'endpoint' && '⬥ Endpoint'}
            {toolState.snapType === 'midpoint' && '△ Midpoint'}
            {toolState.snapType === 'center' && '⊙ Center'}
            {toolState.snapType === 'quadrant' && '◇ Quadrant'}
            {toolState.snapType === 'grid' && '# Grid'}
            {toolState.snapType === 'origin' && '✛ Origin'}
            {toolState.snapType === 'intersection' && '✕ Intersection'}
            : ({toolState.snapPoint.x.toFixed(1)}, {toolState.snapPoint.y.toFixed(1)})
          </span>
        )}
        {sketchData && (
          <span className="sketch-info">
            {sketchData.entities.length} entities | {sketchData.profiles.length} profiles
          </span>
        )}
      </div>
    </div>
  );
}
