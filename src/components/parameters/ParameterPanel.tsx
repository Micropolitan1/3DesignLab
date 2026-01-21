/**
 * ParameterPanel - Parameter editor for selected feature
 */

import { useMemo, useCallback } from 'react';
import { useDocumentStore } from '../../store/documentStore';
import { ParameterInput } from './ParameterInput';
import type { Parameter, Feature } from '../../types/features';
import './ParameterPanel.css';

interface ParameterPanelProps {
  onStartSketch?: (featureId: string) => void;
}

export function ParameterPanel({ onStartSketch }: ParameterPanelProps) {
  const selectedFeatureId = useDocumentStore(state => state.selectedFeatureId);
  const getFeature = useDocumentStore(state => state.getFeature);
  const updateParameter = useDocumentStore(state => state.updateParameter);

  const selectedFeature = useMemo(() => {
    if (!selectedFeatureId) return null;
    return getFeature(selectedFeatureId);
  }, [selectedFeatureId, getFeature]);

  const handleParameterChange = useCallback((paramKey: string, value: number | string | boolean) => {
    if (selectedFeatureId) {
      updateParameter(selectedFeatureId, paramKey, value);
    }
  }, [selectedFeatureId, updateParameter]);

  if (!selectedFeature) {
    return (
      <div className="parameter-panel">
        <div className="parameter-header">
          <h3>Parameters</h3>
        </div>
        <div className="parameter-empty">
          Select a feature to edit its parameters
        </div>
      </div>
    );
  }

  const parameters = getEditableParameters(selectedFeature);

  return (
    <div className="parameter-panel">
      <div className="parameter-header">
        <h3>Parameters</h3>
        <span className="feature-type-badge">{selectedFeature.type}</span>
      </div>

      <div className="parameter-content">
        <div className="parameter-feature-name">{selectedFeature.name}</div>

        {parameters.length === 0 ? (
          <div className="parameter-empty">
            No editable parameters
          </div>
        ) : (
          <div className="parameter-list">
            {parameters.map(({ key, param }) => (
              <ParameterInput
                key={key}
                parameter={param}
                onChange={(value) => handleParameterChange(key, value)}
              />
            ))}
          </div>
        )}

        {selectedFeature.type === 'sketch' && (
          <div className="parameter-actions">
            <button
              className="edit-sketch-btn"
              onClick={() => onStartSketch?.(selectedFeature.id)}
            >
              ✏️ Edit Sketch
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Extract editable parameters from a feature
 */
function getEditableParameters(feature: Feature): Array<{ key: string; param: Parameter }> {
  const result: Array<{ key: string; param: Parameter }> = [];
  const params = feature.parameters as Record<string, Parameter | undefined>;

  for (const [key, param] of Object.entries(params)) {
    if (param) {
      result.push({ key, param });
    }
  }

  // Sort parameters: enums first, then numbers, then booleans
  result.sort((a, b) => {
    const typeOrder = { enum: 0, number: 1, boolean: 2, string: 3 };
    const orderA = typeOrder[a.param.type] ?? 4;
    const orderB = typeOrder[b.param.type] ?? 4;
    return orderA - orderB;
  });

  return result;
}
