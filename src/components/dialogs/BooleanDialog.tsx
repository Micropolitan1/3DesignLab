/**
 * BooleanDialog - Dialog for creating boolean features
 */

import { useState, useCallback, useMemo } from 'react';
import { useDocumentStore, createBooleanFeature } from '../../store/documentStore';
import type { Feature } from '../../types/features';
import './DialogStyles.css';

interface BooleanDialogProps {
  onClose: () => void;
  editFeatureId?: string | null; // For future edit mode support
}

export function BooleanDialog({ onClose, editFeatureId: _editFeatureId }: BooleanDialogProps) {
  const document = useDocumentStore(state => state.document);
  const addFeature = useDocumentStore(state => state.addFeature);

  // Find features that have bodies
  const bodyFeatures = useMemo(() => {
    const features: Feature[] = [];
    for (const feature of document.features) {
      if (feature.suppressed) continue;
      if (feature.type === 'primitive' || feature.type === 'extrude' || feature.type === 'boolean') {
        features.push(feature);
      }
    }
    return features;
  }, [document.features]);

  const [operation, setOperation] = useState<'union' | 'difference' | 'intersect'>('union');
  const [targetId, setTargetId] = useState<string>(bodyFeatures[0]?.id || '');
  const [toolId, setToolId] = useState<string>(bodyFeatures[1]?.id || bodyFeatures[0]?.id || '');

  const handleCreate = useCallback(() => {
    if (!targetId || !toolId || targetId === toolId) return;

    const feature = createBooleanFeature(targetId, toolId, operation);
    addFeature(feature);
    onClose();
  }, [targetId, toolId, operation, addFeature, onClose]);

  if (bodyFeatures.length < 2) {
    return (
      <div className="dialog-overlay">
        <div className="dialog">
          <div className="dialog-header">
            <h2>Boolean Operation</h2>
            <button className="dialog-close" onClick={onClose}>×</button>
          </div>
          <div className="dialog-body">
            <div className="dialog-message">
              Boolean operations require at least 2 bodies.<br />
              Create more primitives or extrusions first.
            </div>
          </div>
          <div className="dialog-footer">
            <button className="dialog-btn secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <div className="dialog-header">
          <h2>Boolean Operation</h2>
          <button className="dialog-close" onClick={onClose}>×</button>
        </div>

        <div className="dialog-body">
          <div className="dialog-field">
            <label>Operation</label>
            <div className="operation-buttons">
              <button
                className={`operation-btn ${operation === 'union' ? 'active' : ''}`}
                onClick={() => setOperation('union')}
              >
                🔗 Union
              </button>
              <button
                className={`operation-btn ${operation === 'difference' ? 'active' : ''}`}
                onClick={() => setOperation('difference')}
              >
                ➖ Difference
              </button>
              <button
                className={`operation-btn ${operation === 'intersect' ? 'active' : ''}`}
                onClick={() => setOperation('intersect')}
              >
                ⊗ Intersect
              </button>
            </div>
          </div>

          <div className="dialog-field">
            <label>Target Body (keeps material)</label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
            >
              {bodyFeatures.map(feature => (
                <option
                  key={feature.id}
                  value={feature.id}
                  disabled={feature.id === toolId}
                >
                  {feature.name}
                </option>
              ))}
            </select>
          </div>

          <div className="dialog-field">
            <label>
              Tool Body ({operation === 'union' ? 'added' : operation === 'difference' ? 'subtracted' : 'intersected'})
            </label>
            <select
              value={toolId}
              onChange={(e) => setToolId(e.target.value)}
            >
              {bodyFeatures.map(feature => (
                <option
                  key={feature.id}
                  value={feature.id}
                  disabled={feature.id === targetId}
                >
                  {feature.name}
                </option>
              ))}
            </select>
          </div>

          <div className="operation-preview">
            <div className="preview-description">
              {operation === 'union' && (
                <>Combines both bodies into a single solid.</>
              )}
              {operation === 'difference' && (
                <>Removes the tool body from the target body.</>
              )}
              {operation === 'intersect' && (
                <>Keeps only the overlapping region of both bodies.</>
              )}
            </div>
          </div>
        </div>

        <div className="dialog-footer">
          <button className="dialog-btn secondary" onClick={onClose}>Cancel</button>
          <button
            className="dialog-btn primary"
            onClick={handleCreate}
            disabled={!targetId || !toolId || targetId === toolId}
          >
            Create Boolean
          </button>
        </div>
      </div>
    </div>
  );
}
