/**
 * TimelinePanel - Feature list UI with add/edit/delete controls
 */

import { useState, useCallback } from 'react';
import { useDocumentStore, createPrimitiveFeature, createSketchFeature } from '../../store/documentStore';
import { FeatureItem } from './FeatureItem';
import './TimelinePanel.css';

interface TimelinePanelProps {
  onEditFeature?: (featureId: string) => void;
  onStartSketch?: () => void;
  onOpenExtrudeDialog?: () => void;
  onOpenBooleanDialog?: () => void;
}

export function TimelinePanel({
  onEditFeature,
  onStartSketch,
  onOpenExtrudeDialog,
  onOpenBooleanDialog,
}: TimelinePanelProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const document = useDocumentStore(state => state.document);
  const selectedFeatureId = useDocumentStore(state => state.selectedFeatureId);
  const selectFeature = useDocumentStore(state => state.selectFeature);
  const addFeature = useDocumentStore(state => state.addFeature);
  const isRebuilding = useDocumentStore(state => state.isRebuilding);
  const rebuildError = useDocumentStore(state => state.rebuildError);

  const handleAddPrimitive = useCallback((shape: 'box' | 'cylinder' | 'sphere') => {
    const feature = createPrimitiveFeature(shape);
    addFeature(feature);
    setShowAddMenu(false);
  }, [addFeature]);

  const handleAddSketch = useCallback(() => {
    const feature = createSketchFeature('XY', 0);
    addFeature(feature);
    setShowAddMenu(false);
    onStartSketch?.();
  }, [addFeature, onStartSketch]);

  const handleOpenExtrude = useCallback(() => {
    setShowAddMenu(false);
    onOpenExtrudeDialog?.();
  }, [onOpenExtrudeDialog]);

  const handleOpenBoolean = useCallback(() => {
    setShowAddMenu(false);
    onOpenBooleanDialog?.();
  }, [onOpenBooleanDialog]);

  const handleFeatureSelect = useCallback((id: string) => {
    selectFeature(selectedFeatureId === id ? null : id);
  }, [selectedFeatureId, selectFeature]);

  const handleFeatureEdit = useCallback((id: string) => {
    selectFeature(id);
    onEditFeature?.(id);
  }, [selectFeature, onEditFeature]);

  // Check if we have sketches with profiles for extrude
  const hasSketchesWithProfiles = document.features.some(
    f => f.type === 'sketch' && !f.suppressed && f.sketchData?.profiles?.length
  );

  // Check if we have at least 2 bodies for boolean
  const bodyCount = document.features.filter(
    f => !f.suppressed && (f.type === 'primitive' || f.type === 'extrude' || f.type === 'boolean')
  ).length;

  return (
    <div className="timeline-panel">
      <div className="timeline-header">
        <h3>Features</h3>
        <div className="timeline-status">
          {isRebuilding && <span className="rebuilding-indicator">🔄</span>}
          {rebuildError && <span className="error-indicator" title={rebuildError}>⚠️</span>}
        </div>
      </div>

      <div className="timeline-toolbar">
        <div className="add-menu-container">
          <button
            className="add-feature-btn"
            onClick={() => setShowAddMenu(!showAddMenu)}
          >
            + Add Feature
          </button>

          {showAddMenu && (
            <div className="add-menu">
              <div className="add-menu-section">
                <div className="add-menu-title">Primitives</div>
                <button onClick={() => handleAddPrimitive('box')}>📦 Box</button>
                <button onClick={() => handleAddPrimitive('cylinder')}>🛢️ Cylinder</button>
                <button onClick={() => handleAddPrimitive('sphere')}>🔮 Sphere</button>
              </div>
              <div className="add-menu-divider" />
              <div className="add-menu-section">
                <div className="add-menu-title">Sketch</div>
                <button onClick={handleAddSketch}>✏️ New Sketch</button>
              </div>
              <div className="add-menu-divider" />
              <div className="add-menu-section">
                <div className="add-menu-title">Operations</div>
                <button
                  onClick={handleOpenExtrude}
                  disabled={!hasSketchesWithProfiles}
                  className={!hasSketchesWithProfiles ? 'disabled' : ''}
                  title={!hasSketchesWithProfiles ? 'Create a sketch with closed shapes first' : ''}
                >
                  ⬆️ Extrude
                </button>
                <button
                  onClick={handleOpenBoolean}
                  disabled={bodyCount < 2}
                  className={bodyCount < 2 ? 'disabled' : ''}
                  title={bodyCount < 2 ? 'Need at least 2 bodies' : ''}
                >
                  🔗 Boolean
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="timeline-list">
        {document.features.length === 0 ? (
          <div className="timeline-empty">
            No features yet.<br />
            Click "Add Feature" to begin.
          </div>
        ) : (
          document.features.map((feature) => (
            <FeatureItem
              key={feature.id}
              feature={feature}
              isSelected={feature.id === selectedFeatureId}
              onSelect={() => handleFeatureSelect(feature.id)}
              onEdit={() => handleFeatureEdit(feature.id)}
            />
          ))
        )}
      </div>

      <div className="timeline-footer">
        <span className="feature-count">
          {document.features.length} feature{document.features.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
