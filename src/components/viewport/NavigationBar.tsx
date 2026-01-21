/**
 * NavigationBar - Fusion 360 style navigation controls
 * Bottom toolbar with orbit, pan, zoom, and view controls
 */

import { useCallback } from 'react';
import { OrbitIcon, PanIcon, ZoomIcon, FitViewIcon, HomeIcon } from '../icons/Icons';
import { ViewportManager } from '../../viewport/ViewportManager';
import './NavigationBar.css';

type NavigationMode = 'orbit' | 'pan' | 'zoom' | 'none';

interface NavigationBarProps {
  activeMode?: NavigationMode;
  onModeChange?: (mode: NavigationMode) => void;
}

export function NavigationBar({ activeMode = 'none', onModeChange }: NavigationBarProps) {
  const getViewport = useCallback((): ViewportManager | null => {
    return (window as unknown as { viewport: ViewportManager }).viewport || null;
  }, []);

  const handleFitView = useCallback(() => {
    const viewport = getViewport();
    if (viewport) {
      // Reset camera to fit all objects in view
      const camera = viewport.getCamera();
      camera.position.set(80, 80, 80);
      camera.lookAt(0, 0, 0);
    }
  }, [getViewport]);

  const handleHomeView = useCallback(() => {
    const viewport = getViewport();
    if (viewport) {
      const camera = viewport.getCamera();
      camera.position.set(60, 60, 60);
      camera.lookAt(0, 0, 0);
    }
  }, [getViewport]);

  const handleZoomIn = useCallback(() => {
    const viewport = getViewport();
    if (viewport) {
      const camera = viewport.getCamera();
      const direction = camera.position.clone().normalize();
      camera.position.sub(direction.multiplyScalar(10));
    }
  }, [getViewport]);

  const handleZoomOut = useCallback(() => {
    const viewport = getViewport();
    if (viewport) {
      const camera = viewport.getCamera();
      const direction = camera.position.clone().normalize();
      camera.position.add(direction.multiplyScalar(10));
    }
  }, [getViewport]);

  // Explicit icon color for proper rendering
  const iconColor = '#666666';
  const activeIconColor = '#0696d7';

  return (
    <div className="navigation-bar">
      <div className="nav-group nav-modes">
        <button
          className={`nav-btn ${activeMode === 'orbit' ? 'active' : ''}`}
          onClick={() => onModeChange?.(activeMode === 'orbit' ? 'none' : 'orbit')}
          title="Orbit (Middle Mouse)"
        >
          <OrbitIcon size={16} color={activeMode === 'orbit' ? activeIconColor : iconColor} />
          <span className="nav-label">Orbit</span>
        </button>
        <button
          className={`nav-btn ${activeMode === 'pan' ? 'active' : ''}`}
          onClick={() => onModeChange?.(activeMode === 'pan' ? 'none' : 'pan')}
          title="Pan (Shift + Middle Mouse)"
        >
          <PanIcon size={16} color={activeMode === 'pan' ? activeIconColor : iconColor} />
          <span className="nav-label">Pan</span>
        </button>
        <button
          className={`nav-btn ${activeMode === 'zoom' ? 'active' : ''}`}
          onClick={() => onModeChange?.(activeMode === 'zoom' ? 'none' : 'zoom')}
          title="Zoom (Scroll)"
        >
          <ZoomIcon size={16} color={activeMode === 'zoom' ? activeIconColor : iconColor} />
          <span className="nav-label">Zoom</span>
        </button>
      </div>

      <div className="nav-divider" />

      <div className="nav-group nav-actions">
        <button
          className="nav-btn"
          onClick={handleFitView}
          title="Fit All (F)"
        >
          <FitViewIcon size={16} color={iconColor} />
        </button>
        <button
          className="nav-btn"
          onClick={handleHomeView}
          title="Home View"
        >
          <HomeIcon size={16} color={iconColor} />
        </button>
      </div>

      <div className="nav-divider" />

      <div className="nav-group nav-zoom-controls">
        <button
          className="nav-btn zoom-btn"
          onClick={handleZoomIn}
          title="Zoom In"
        >
          +
        </button>
        <button
          className="nav-btn zoom-btn"
          onClick={handleZoomOut}
          title="Zoom Out"
        >
          −
        </button>
      </div>

      <div className="nav-spacer" />

      <div className="nav-group nav-info">
        <span className="nav-hint">Orbit: Middle Mouse | Pan: Shift+Middle | Zoom: Scroll</span>
      </div>
    </div>
  );
}
