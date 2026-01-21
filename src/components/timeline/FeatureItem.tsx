/**
 * FeatureItem - Single feature row in the timeline
 */

import { useState, useCallback } from 'react';
import type { Feature } from '../../types/features';
import { useDocumentStore } from '../../store/documentStore';
import './FeatureItem.css';

interface FeatureItemProps {
  feature: Feature;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}

export function FeatureItem({ feature, isSelected, onSelect, onEdit }: FeatureItemProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(feature.name);

  const updateFeature = useDocumentStore(state => state.updateFeature);
  const deleteFeature = useDocumentStore(state => state.deleteFeature);
  const suppressFeature = useDocumentStore(state => state.suppressFeature);

  const handleDoubleClick = useCallback(() => {
    setIsRenaming(true);
    setNewName(feature.name);
  }, [feature.name]);

  const handleRenameSubmit = useCallback(() => {
    if (newName.trim() && newName !== feature.name) {
      updateFeature(feature.id, { name: newName.trim() });
    }
    setIsRenaming(false);
  }, [feature.id, feature.name, newName, updateFeature]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setIsRenaming(false);
    }
  }, [handleRenameSubmit]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${feature.name}"?`)) {
      deleteFeature(feature.id);
    }
  }, [feature.id, feature.name, deleteFeature]);

  const handleSuppress = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    suppressFeature(feature.id, !feature.suppressed);
  }, [feature.id, feature.suppressed, suppressFeature]);

  const getFeatureIcon = (type: Feature['type']): string => {
    switch (type) {
      case 'primitive': return '📦';
      case 'sketch': return '✏️';
      case 'extrude': return '⬆️';
      case 'boolean': return '🔗';
      default: return '📄';
    }
  };

  const getStatusIcon = (): string => {
    if (feature.suppressed) return '🚫';
    if (feature._dirty) return '🔄';
    return '✓';
  };

  return (
    <div
      className={`feature-item ${isSelected ? 'selected' : ''} ${feature.suppressed ? 'suppressed' : ''}`}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
    >
      <span className="feature-icon">{getFeatureIcon(feature.type)}</span>

      {isRenaming ? (
        <input
          type="text"
          className="feature-name-input"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={handleKeyDown}
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="feature-name">{feature.name}</span>
      )}

      <span className="feature-status" title={feature.suppressed ? 'Suppressed' : feature._dirty ? 'Needs rebuild' : 'Up to date'}>
        {getStatusIcon()}
      </span>

      <div className="feature-actions">
        <button
          className="feature-action-btn"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          title="Edit"
        >
          ⚙️
        </button>
        <button
          className="feature-action-btn"
          onClick={handleSuppress}
          title={feature.suppressed ? 'Unsuppress' : 'Suppress'}
        >
          {feature.suppressed ? '👁️' : '🚫'}
        </button>
        <button
          className="feature-action-btn delete"
          onClick={handleDelete}
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
