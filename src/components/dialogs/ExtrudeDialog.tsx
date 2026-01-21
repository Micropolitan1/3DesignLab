/**
 * ExtrudeDialog - Dialog for creating/editing extrude features
 * Supports both create mode (new feature) and edit mode (existing feature)
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useDocumentStore, createExtrudeFeature } from '../../store/documentStore';
import type { SketchFeature, Feature, ExtrudeFeature } from '../../types/features';
import './DialogStyles.css';

interface ExtrudeDialogProps {
  onClose: () => void;
  editFeatureId?: string | null; // If provided, edit existing feature
}

export function ExtrudeDialog({ onClose, editFeatureId }: ExtrudeDialogProps) {
  const document = useDocumentStore(state => state.document);
  const addFeature = useDocumentStore(state => state.addFeature);
  const updateFeature = useDocumentStore(state => state.updateFeature);

  // Check if we're in edit mode
  const isEditMode = !!editFeatureId;
  const editingFeature = isEditMode
    ? document.features.find(f => f.id === editFeatureId) as ExtrudeFeature | undefined
    : undefined;

  // Find available sketches with profiles
  const availableSketches = useMemo(() => {
    return document.features.filter(
      (f): f is SketchFeature =>
        f.type === 'sketch' &&
        !f.suppressed &&
        !!f.sketchData?.profiles?.length
    );
  }, [document.features]);

  // Find available bodies for join/cut
  const availableBodies = useMemo(() => {
    const bodyFeatures: Feature[] = [];
    for (const feature of document.features) {
      if (feature.suppressed) continue;
      if (feature.type === 'primitive' || feature.type === 'extrude' || feature.type === 'boolean') {
        bodyFeatures.push(feature);
      }
    }
    return bodyFeatures;
  }, [document.features]);

  // Initialize state from editing feature or defaults
  const [selectedSketchId, setSelectedSketchId] = useState<string>(
    editingFeature?.sketchRef?.featureId || availableSketches[0]?.id || ''
  );
  const [distance, setDistance] = useState(
    editingFeature?.parameters?.distance?.value ?? 50
  );
  const [direction, setDirection] = useState<'normal' | 'reverse' | 'symmetric'>(
    (editingFeature?.parameters?.direction?.value as 'normal' | 'reverse' | 'symmetric') || 'normal'
  );
  const [mode, setMode] = useState<'new' | 'join' | 'cut'>(
    (editingFeature?.parameters?.mode?.value as 'new' | 'join' | 'cut') || 'new'
  );
  const [targetBodyId, setTargetBodyId] = useState<string>(
    editingFeature?.targetBodyRef?.featureId || availableBodies[0]?.id || ''
  );

  // Update state when editing feature changes
  useEffect(() => {
    if (editingFeature) {
      setSelectedSketchId(editingFeature.sketchRef?.featureId || '');
      setDistance(editingFeature.parameters?.distance?.value ?? 50);
      setDirection((editingFeature.parameters?.direction?.value as 'normal' | 'reverse' | 'symmetric') || 'normal');
      setMode((editingFeature.parameters?.mode?.value as 'new' | 'join' | 'cut') || 'new');
      setTargetBodyId(editingFeature.targetBodyRef?.featureId || '');
    }
  }, [editingFeature]);

  const handleSubmit = useCallback(() => {
    if (!selectedSketchId) return;

    if (isEditMode && editFeatureId) {
      // Update existing feature
      const updates: Partial<ExtrudeFeature> = {
        sketchRef: { featureId: selectedSketchId, type: 'sketch' },
        parameters: {
          distance: { id: 'distance', name: 'Distance', value: distance, type: 'number', min: 0.1, unit: 'mm' },
          direction: {
            id: 'direction',
            name: 'Direction',
            value: direction,
            type: 'enum',
            options: [
              { value: 'normal', label: 'Normal' },
              { value: 'reverse', label: 'Reverse' },
              { value: 'symmetric', label: 'Symmetric' },
            ],
          },
          mode: {
            id: 'mode',
            name: 'Mode',
            value: mode,
            type: 'enum',
            options: [
              { value: 'new', label: 'New Body' },
              { value: 'join', label: 'Join' },
              { value: 'cut', label: 'Cut' },
            ],
          },
        },
        targetBodyRef: (mode === 'join' || mode === 'cut') && targetBodyId
          ? { featureId: targetBodyId, type: 'body' }
          : undefined,
        _dirty: true,
      };
      updateFeature(editFeatureId, updates);
    } else {
      // Create new feature
      const feature = createExtrudeFeature(selectedSketchId, distance, direction, mode);

      // Set target body ref if join/cut
      if ((mode === 'join' || mode === 'cut') && targetBodyId) {
        feature.targetBodyRef = { featureId: targetBodyId, type: 'body' };
      }

      addFeature(feature);
    }
    onClose();
  }, [selectedSketchId, distance, direction, mode, targetBodyId, isEditMode, editFeatureId, addFeature, updateFeature, onClose]);

  if (availableSketches.length === 0) {
    return (
      <div className="dialog-overlay">
        <div className="dialog">
          <div className="dialog-header">
            <h2>Extrude</h2>
            <button className="dialog-close" onClick={onClose}>×</button>
          </div>
          <div className="dialog-body">
            <div className="dialog-message">
              No sketches with profiles available.<br />
              Create a sketch with closed shapes first.
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
          <h2>{isEditMode ? 'Edit Extrude' : 'Extrude'}</h2>
          <button className="dialog-close" onClick={onClose}>×</button>
        </div>

        <div className="dialog-body">
          <div className="dialog-field">
            <label>Sketch</label>
            <select
              value={selectedSketchId}
              onChange={(e) => setSelectedSketchId(e.target.value)}
            >
              {availableSketches.map(sketch => (
                <option key={sketch.id} value={sketch.id}>
                  {sketch.name} ({sketch.sketchData?.profiles?.length || 0} profiles)
                </option>
              ))}
            </select>
          </div>

          <div className="dialog-field">
            <label>Distance</label>
            <div className="input-with-unit">
              <input
                type="number"
                value={distance}
                onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
                min={0.1}
                step={1}
              />
              <span className="unit">mm</span>
            </div>
          </div>

          <div className="dialog-field">
            <label>Direction</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as typeof direction)}
            >
              <option value="normal">Normal</option>
              <option value="reverse">Reverse</option>
              <option value="symmetric">Symmetric</option>
            </select>
          </div>

          <div className="dialog-field">
            <label>Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as typeof mode)}
            >
              <option value="new">New Body</option>
              <option value="join">Join</option>
              <option value="cut">Cut</option>
            </select>
          </div>

          {(mode === 'join' || mode === 'cut') && (
            <div className="dialog-field">
              <label>Target Body</label>
              <select
                value={targetBodyId}
                onChange={(e) => setTargetBodyId(e.target.value)}
              >
                {availableBodies.map(feature => (
                  <option key={feature.id} value={feature.id}>
                    {feature.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="dialog-btn secondary" onClick={onClose}>Cancel</button>
          <button
            className="dialog-btn primary"
            onClick={handleSubmit}
            disabled={!selectedSketchId}
          >
            {isEditMode ? 'Update' : 'Create Extrude'}
          </button>
        </div>
      </div>
    </div>
  );
}
