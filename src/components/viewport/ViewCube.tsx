/**
 * ViewCube - Fusion 360 style navigation cube
 * Syncs with camera rotation and allows quick view changes
 * Supports drag-to-orbit and smooth view transitions
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { ViewportManager } from '../../viewport/ViewportManager';
import { HomeIcon } from '../icons/Icons';
import './ViewCube.css';

interface ViewCubeProps {
  onViewChange?: (view: string) => void;
}

type CameraView = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'home' | 'iso';

interface CubeRotation {
  x: number;
  y: number;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
}

export function ViewCube({ onViewChange }: ViewCubeProps) {
  const [rotation, setRotation] = useState<CubeRotation>({ x: -25, y: -35 });
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const animationRef = useRef<number | null>(null);
  const dragStateRef = useRef<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
  });
  const cubeRef = useRef<HTMLDivElement>(null);

  // Get viewport manager
  const getViewport = useCallback((): ViewportManager | null => {
    return (window as unknown as { viewport: ViewportManager }).viewport || null;
  }, []);

  // Sync cube rotation with camera
  useEffect(() => {
    const updateRotation = () => {
      // Don't update rotation while dragging (we'll compute it from drag)
      if (!dragStateRef.current.isDragging) {
        const viewport = getViewport();
        if (viewport) {
          const camera = viewport.getCamera();
          const target = viewport.getControls().target;

          // Calculate rotation from camera position relative to target
          const pos = camera.position.clone().sub(target).normalize();

          // Convert camera position to rotation angles
          const rotY = Math.atan2(pos.x, pos.z) * (180 / Math.PI);
          const rotX = Math.asin(-pos.y) * (180 / Math.PI);

          setRotation({ x: rotX, y: rotY });
        }
      }
      animationRef.current = requestAnimationFrame(updateRotation);
    };

    animationRef.current = requestAnimationFrame(updateRotation);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [getViewport]);

  // Handle mouse down on cube - start drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Prevent if clicking directly on a face label (let click handler work)
    if ((e.target as HTMLElement).closest('.viewcube-face span')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const viewport = getViewport();
    if (viewport) {
      viewport.setControlsEnabled(false);
    }

    dragStateRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
    };

    setIsDragging(true);

    // Add global mouse listeners for drag
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [getViewport]);

  // Handle mouse move during drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStateRef.current.isDragging) return;

    const deltaX = e.clientX - dragStateRef.current.lastX;
    const deltaY = e.clientY - dragStateRef.current.lastY;

    dragStateRef.current.lastX = e.clientX;
    dragStateRef.current.lastY = e.clientY;

    // Convert pixel delta to rotation angles
    // Sensitivity factor - adjust for desired rotation speed
    const sensitivity = 0.01;

    const viewport = getViewport();
    if (viewport) {
      // Orbit the camera based on drag
      viewport.orbitCamera(deltaX * sensitivity, deltaY * sensitivity);
    }
  }, [getViewport]);

  // Handle mouse up - end drag
  const handleMouseUp = useCallback(() => {
    dragStateRef.current.isDragging = false;
    setIsDragging(false);

    const viewport = getViewport();
    if (viewport) {
      viewport.setControlsEnabled(true);
    }

    // Remove global mouse listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [getViewport, handleMouseMove]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Set view with smooth animation
  const setView = useCallback((view: CameraView) => {
    const viewport = getViewport();
    if (!viewport) return;

    const camera = viewport.getCamera();
    const target = viewport.getControls().target;
    const distance = camera.position.clone().sub(target).length();

    // Calculate target position relative to target point
    const targetPosition = new THREE.Vector3();

    switch (view) {
      case 'front':
        targetPosition.set(0, 0, distance);
        break;
      case 'back':
        targetPosition.set(0, 0, -distance);
        break;
      case 'left':
        targetPosition.set(-distance, 0, 0);
        break;
      case 'right':
        targetPosition.set(distance, 0, 0);
        break;
      case 'top':
        targetPosition.set(0, distance, 0.001); // Small offset to avoid gimbal lock
        break;
      case 'bottom':
        targetPosition.set(0, -distance, 0.001);
        break;
      case 'home':
      case 'iso':
        const d = distance / Math.sqrt(3);
        targetPosition.set(d, d, d);
        break;
    }

    // Add target offset
    targetPosition.add(target);

    // Animate to new position
    viewport.animateCameraTo(targetPosition, 400, () => {
      onViewChange?.(view);
    });
  }, [getViewport, onViewChange]);

  // Handle face click (only if not dragging)
  const handleFaceClick = useCallback((view: CameraView, e: React.MouseEvent) => {
    e.stopPropagation();

    // Only trigger view change if not dragging
    const drag = dragStateRef.current;
    const dragDistance = Math.sqrt(
      Math.pow(e.clientX - drag.startX, 2) + Math.pow(e.clientY - drag.startY, 2)
    );

    // If drag distance is small, treat as click
    if (dragDistance < 5) {
      setView(view);
    }
  }, [setView]);

  return (
    <div
      className={`viewcube-container ${isDragging ? 'dragging' : ''} ${isHovering ? 'hovering' : ''}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Home button */}
      <button className="viewcube-home" onClick={() => setView('home')} title="Home View">
        <HomeIcon size={14} />
      </button>

      {/* Main cube */}
      <div
        ref={cubeRef}
        className={`viewcube-wrapper ${isDragging ? 'is-dragging' : ''}`}
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="viewcube">
          <div className="viewcube-face front" onClick={(e) => handleFaceClick('front', e)}>
            <span>FRONT</span>
          </div>
          <div className="viewcube-face back" onClick={(e) => handleFaceClick('back', e)}>
            <span>BACK</span>
          </div>
          <div className="viewcube-face left" onClick={(e) => handleFaceClick('left', e)}>
            <span>LEFT</span>
          </div>
          <div className="viewcube-face right" onClick={(e) => handleFaceClick('right', e)}>
            <span>RIGHT</span>
          </div>
          <div className="viewcube-face top" onClick={(e) => handleFaceClick('top', e)}>
            <span>TOP</span>
          </div>
          <div className="viewcube-face bottom" onClick={(e) => handleFaceClick('bottom', e)}>
            <span>BOTTOM</span>
          </div>

          {/* Corner regions for isometric views */}
          <div className="viewcube-corner corner-front-top-right" onClick={(e) => handleFaceClick('iso', e)} title="Isometric View" />
          <div className="viewcube-corner corner-front-top-left" onClick={(e) => handleFaceClick('iso', e)} title="Isometric View" />
          <div className="viewcube-corner corner-front-bottom-right" onClick={(e) => handleFaceClick('iso', e)} title="Isometric View" />
          <div className="viewcube-corner corner-front-bottom-left" onClick={(e) => handleFaceClick('iso', e)} title="Isometric View" />
          <div className="viewcube-corner corner-back-top-right" onClick={(e) => handleFaceClick('iso', e)} title="Isometric View" />
          <div className="viewcube-corner corner-back-top-left" onClick={(e) => handleFaceClick('iso', e)} title="Isometric View" />
          <div className="viewcube-corner corner-back-bottom-right" onClick={(e) => handleFaceClick('iso', e)} title="Isometric View" />
          <div className="viewcube-corner corner-back-bottom-left" onClick={(e) => handleFaceClick('iso', e)} title="Isometric View" />

          {/* Edge regions for edge views */}
          <div className="viewcube-edge edge-front-top" onClick={(e) => handleFaceClick('iso', e)} />
          <div className="viewcube-edge edge-front-right" onClick={(e) => handleFaceClick('iso', e)} />
          <div className="viewcube-edge edge-front-bottom" onClick={(e) => handleFaceClick('iso', e)} />
          <div className="viewcube-edge edge-front-left" onClick={(e) => handleFaceClick('iso', e)} />
          <div className="viewcube-edge edge-back-top" onClick={(e) => handleFaceClick('iso', e)} />
          <div className="viewcube-edge edge-back-right" onClick={(e) => handleFaceClick('iso', e)} />
          <div className="viewcube-edge edge-top-right" onClick={(e) => handleFaceClick('iso', e)} />
          <div className="viewcube-edge edge-top-left" onClick={(e) => handleFaceClick('iso', e)} />
        </div>
      </div>

      {/* Compass ring */}
      <div className="viewcube-compass">
        <span className="compass-label north" onClick={() => setView('front')}>N</span>
        <span className="compass-label east" onClick={() => setView('right')}>E</span>
        <span className="compass-label south" onClick={() => setView('back')}>S</span>
        <span className="compass-label west" onClick={() => setView('left')}>W</span>
        <div
          className="compass-ring"
          style={{ transform: `rotate(${-rotation.y}deg)` }}
        >
          <div className="compass-needle" />
        </div>
      </div>

      {/* Drag hint overlay */}
      {isDragging && <div className="viewcube-drag-overlay" />}
    </div>
  );
}
