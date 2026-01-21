/**
 * HorizontalTimeline - Fusion 360 style bottom timeline
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { useDocumentStore } from '../../store/documentStore';
import type { Feature } from '../../types/features';
import {
  BoxIcon,
  CylinderIcon,
  SphereIcon,
  SketchIcon,
  ExtrudeIcon,
  BooleanUnionIcon,
  OriginIcon,
  StepBackIcon,
  StepForwardIcon,
  PlayIcon,
  EyeOffIcon,
} from '../icons/Icons';
import './HorizontalTimeline.css';

interface HorizontalTimelineProps {
  onEditFeature: (featureId: string) => void;
}

export function HorizontalTimeline({ onEditFeature }: HorizontalTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [rollbackIndex, setRollbackIndex] = useState<number | null>(null);

  const document = useDocumentStore(state => state.document);
  const selectedFeatureId = useDocumentStore(state => state.selectedFeatureId);
  const selectFeature = useDocumentStore(state => state.selectFeature);
  const suppressFeature = useDocumentStore(state => state.suppressFeature);
  const deleteFeature = useDocumentStore(state => state.deleteFeature);
  const isRebuilding = useDocumentStore(state => state.isRebuilding);

  // Auto-scroll to end when new features are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [document.features.length]);

  const handleFeatureClick = useCallback((id: string, e: React.MouseEvent) => {
    if (e.detail === 2) {
      // Double-click to edit
      onEditFeature(id);
    } else {
      selectFeature(id);
    }
  }, [selectFeature, onEditFeature]);

  const handleContextMenu = useCallback((e: React.MouseEvent, feature: Feature) => {
    e.preventDefault();
    // Simple context menu actions - could be enhanced with a proper menu
    const action = window.prompt(
      `${feature.name}\n\nActions:\n1. Edit\n2. ${feature.suppressed ? 'Unsuppress' : 'Suppress'}\n3. Delete\n\nEnter number:`,
      '1'
    );

    if (action === '1') {
      onEditFeature(feature.id);
    } else if (action === '2') {
      suppressFeature(feature.id, !feature.suppressed);
    } else if (action === '3') {
      if (confirm(`Delete "${feature.name}"?`)) {
        deleteFeature(feature.id);
      }
    }
  }, [onEditFeature, suppressFeature, deleteFeature]);

  // Feature type colors - match Fusion 360 style
  const getFeatureColor = (type: Feature['type']): string => {
    switch (type) {
      case 'primitive': return '#4fc3f7';
      case 'sketch': return '#81c784';
      case 'extrude': return '#ffb74d';
      case 'boolean': return '#ce93d8';
      default: return '#90a4ae';
    }
  };

  // Get icon component based on feature - uses explicit colors for visibility
  const getFeatureIcon = (feature: Feature, isRolledBack: boolean = false): React.ReactNode => {
    const iconColor = isRolledBack ? '#999999' : '#555555';
    const props = { size: 16, color: iconColor };

    if (feature.type === 'primitive') {
      const shape = feature.parameters.shape?.value;
      if (shape === 'box') return <BoxIcon {...props} />;
      if (shape === 'cylinder') return <CylinderIcon {...props} />;
      if (shape === 'sphere') return <SphereIcon {...props} />;
      return <BoxIcon {...props} />;
    }

    switch (feature.type) {
      case 'sketch': return <SketchIcon {...props} />;
      case 'extrude': return <ExtrudeIcon {...props} />;
      case 'boolean': return <BooleanUnionIcon {...props} />;
      default: return <BoxIcon {...props} />;
    }
  };

  // Rollback handlers
  const handleRollbackToStart = useCallback(() => {
    setRollbackIndex(0);
  }, []);

  const handleStepBack = useCallback(() => {
    const currentIdx = rollbackIndex ?? document.features.length;
    if (currentIdx > 0) {
      setRollbackIndex(currentIdx - 1);
    }
  }, [rollbackIndex, document.features.length]);

  const handleStepForward = useCallback(() => {
    if (rollbackIndex !== null && rollbackIndex < document.features.length) {
      const newIdx = rollbackIndex + 1;
      setRollbackIndex(newIdx >= document.features.length ? null : newIdx);
    }
  }, [rollbackIndex, document.features.length]);

  const handleRollToEnd = useCallback(() => {
    setRollbackIndex(null);
  }, []);

  const isRolledBack = rollbackIndex !== null;
  const effectiveFeatureCount = rollbackIndex ?? document.features.length;

  return (
    <div className="horizontal-timeline">
      <div className="timeline-header">
        <span className="timeline-title">TIMELINE</span>
        {isRebuilding && <span className="rebuilding-badge">Rebuilding...</span>}
        {isRolledBack && <span className="rollback-badge">Rolled back</span>}
        <span className="feature-count">{document.features.length} features</span>
      </div>

      <div className="timeline-track" ref={scrollRef}>
        {/* Origin marker */}
        <div className="timeline-origin">
          <div className="origin-marker">
            <OriginIcon size={14} color="#666666" />
          </div>
          <span className="origin-label">Origin</span>
        </div>

        {/* Feature nodes */}
        {document.features.map((feature, index) => {
          const isAfterRollback = isRolledBack && index >= rollbackIndex;
          const isRollbackPoint = isRolledBack && index === rollbackIndex;

          return (
            <div
              key={feature.id}
              className={`timeline-node ${selectedFeatureId === feature.id ? 'selected' : ''} ${feature.suppressed ? 'suppressed' : ''} ${feature._dirty ? 'dirty' : ''} ${isAfterRollback ? 'rolled-back' : ''}`}
              onClick={(e) => handleFeatureClick(feature.id, e)}
              onContextMenu={(e) => handleContextMenu(e, feature)}
              title={`${feature.name}${feature.suppressed ? ' (Suppressed)' : ''}\nDouble-click to edit\nRight-click for options`}
            >
              {/* Connection line */}
              {index > 0 && <div className={`node-connector ${isAfterRollback ? 'rolled-back' : ''}`} />}

              {/* Rollback marker */}
              {isRollbackPoint && (
                <div className="rollback-marker" title="Rollback point">
                  <div className="rollback-line" />
                </div>
              )}

              {/* Feature marker */}
              <div
                className="node-marker"
                style={{ borderColor: isAfterRollback ? '#666' : getFeatureColor(feature.type) }}
              >
                <span className="node-icon">{getFeatureIcon(feature, isAfterRollback)}</span>
              </div>

              {/* Feature label */}
              <span className="node-label">{feature.name}</span>

              {/* Status indicators */}
              {feature.suppressed && (
                <span className="node-status suppressed-icon">
                  <EyeOffIcon size={10} color="#eb5555" />
                </span>
              )}
              {feature._dirty && !feature.suppressed && <span className="node-status dirty-icon">●</span>}
            </div>
          );
        })}

        {/* End marker */}
        <div className="timeline-end">
          <div className="end-marker">
            <PlayIcon size={12} color="#888888" />
          </div>
        </div>
      </div>

      {/* Playback controls */}
      <div className="timeline-controls">
        <button
          className="timeline-control-btn"
          title="Roll back to start"
          onClick={handleRollbackToStart}
          disabled={document.features.length === 0}
        >
          <StepBackIcon size={12} color="#666666" />
          <StepBackIcon size={12} color="#666666" />
        </button>
        <button
          className="timeline-control-btn"
          title="Step back"
          onClick={handleStepBack}
          disabled={effectiveFeatureCount === 0}
        >
          <StepBackIcon size={12} color="#666666" />
        </button>
        <button
          className="timeline-control-btn"
          title="Step forward"
          onClick={handleStepForward}
          disabled={!isRolledBack}
        >
          <StepForwardIcon size={12} color="#666666" />
        </button>
        <button
          className="timeline-control-btn"
          title="Roll to end"
          onClick={handleRollToEnd}
          disabled={!isRolledBack}
        >
          <StepForwardIcon size={12} color="#666666" />
          <StepForwardIcon size={12} color="#666666" />
        </button>
      </div>
    </div>
  );
}
