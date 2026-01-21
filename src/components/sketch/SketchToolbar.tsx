/**
 * SketchToolbar - Drawing tools for sketch mode (Fusion 360 style)
 */

import React, { useCallback } from 'react';
import { useSketchStore } from '../../store/sketchStore';
import type { SketchTool } from '../../types/sketch';
import {
  SelectIcon,
  LineIcon,
  RectangleIcon,
  CircleIcon,
  ArcIcon,
  PointIcon,
  TrashIcon,
  ProfileIcon,
  CheckIcon,
  CloseIcon,
  ConstructionIcon,
  TrimIcon,
  OffsetIcon,
  DimensionIcon,
} from '../icons/Icons';
import './SketchToolbar.css';

interface SketchToolbarProps {
  onFinish: () => void;
  onCancel: () => void;
}

export function SketchToolbar({ onFinish, onCancel }: SketchToolbarProps) {
  const activeTool = useSketchStore(state => state.toolState.activeTool);
  const setActiveTool = useSketchStore(state => state.setActiveTool);
  const deleteSelectedEntities = useSketchStore(state => state.deleteSelectedEntities);
  const selectedEntityIds = useSketchStore(state => state.selectedEntityIds);
  const detectProfiles = useSketchStore(state => state.detectProfiles);
  const toggleConstruction = useSketchStore(state => state.toggleConstruction);
  const sketchData = useSketchStore(state => state.sketchData);
  const isDrawing = useSketchStore(state => state.toolState.isDrawing);

  const handleToolSelect = useCallback((tool: SketchTool) => {
    setActiveTool(tool);
  }, [setActiveTool]);

  const handleDelete = useCallback(() => {
    deleteSelectedEntities();
  }, [deleteSelectedEntities]);

  const handleDetectProfiles = useCallback(() => {
    detectProfiles();
  }, [detectProfiles]);

  const handleToggleConstruction = useCallback(() => {
    for (const id of selectedEntityIds) {
      toggleConstruction(id);
    }
  }, [selectedEntityIds, toggleConstruction]);

  // Check if any selected entity is construction
  const hasConstructionSelected = selectedEntityIds.some(id => {
    const entity = sketchData?.entities.find(e => e.id === id);
    return entity?.construction;
  });

  // Icon colors - match light theme
  const iconColor = '#555555';
  const activeColor = '#0696d7';

  const tools: { tool: SketchTool; icon: React.ReactNode; label: string; shortcut?: string }[] = [
    { tool: 'select', icon: <SelectIcon size={18} color={activeTool === 'select' ? activeColor : iconColor} />, label: 'Select', shortcut: 'S' },
    { tool: 'line', icon: <LineIcon size={18} color={activeTool === 'line' ? activeColor : iconColor} />, label: 'Line', shortcut: 'L' },
    { tool: 'rectangle', icon: <RectangleIcon size={18} color={activeTool === 'rectangle' ? activeColor : iconColor} />, label: 'Rectangle', shortcut: 'R' },
    { tool: 'circle', icon: <CircleIcon size={18} color={activeTool === 'circle' ? activeColor : iconColor} />, label: 'Circle', shortcut: 'C' },
    { tool: 'arc', icon: <ArcIcon size={18} color={activeTool === 'arc' ? activeColor : iconColor} />, label: 'Arc', shortcut: 'A' },
    { tool: 'point', icon: <PointIcon size={18} color={activeTool === 'point' ? activeColor : iconColor} />, label: 'Point', shortcut: 'P' },
    { tool: 'trim', icon: <TrimIcon size={18} color={activeTool === 'trim' ? activeColor : iconColor} />, label: 'Trim', shortcut: 'T' },
    { tool: 'offset', icon: <OffsetIcon size={18} color={activeTool === 'offset' ? activeColor : iconColor} />, label: 'Offset', shortcut: 'O' },
    { tool: 'dimension', icon: <DimensionIcon size={18} color={activeTool === 'dimension' ? activeColor : iconColor} />, label: 'Dimension', shortcut: 'D' },
  ];

  return (
    <div className="sketch-toolbar">
      <div className="sketch-toolbar-section">
        <span className="sketch-toolbar-title">SKETCH</span>
        <div className="sketch-tool-buttons">
          {tools.map(({ tool, icon, label, shortcut }) => (
            <button
              key={tool}
              className={`sketch-tool-btn ${activeTool === tool ? 'active' : ''}`}
              onClick={() => handleToolSelect(tool)}
              title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
            >
              <span className="tool-icon">{icon}</span>
              <span className="tool-label">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="sketch-toolbar-divider" />

      <div className="sketch-toolbar-section">
        <span className="sketch-toolbar-title">EDIT</span>
        <div className="sketch-action-buttons">
          <button
            className="sketch-action-btn"
            onClick={handleDelete}
            disabled={selectedEntityIds.length === 0}
            title="Delete selected (Del)"
          >
            <TrashIcon size={16} color={iconColor} />
            <span>Delete</span>
          </button>
          <button
            className={`sketch-action-btn ${hasConstructionSelected ? 'active' : ''}`}
            onClick={handleToggleConstruction}
            disabled={selectedEntityIds.length === 0}
            title="Toggle construction mode (X)"
          >
            <ConstructionIcon size={16} color={hasConstructionSelected ? activeColor : iconColor} />
            <span>Construction</span>
          </button>
          <button
            className="sketch-action-btn"
            onClick={handleDetectProfiles}
            title="Detect closed profiles"
          >
            <ProfileIcon size={16} color={iconColor} />
            <span>Profiles</span>
          </button>
        </div>
      </div>

      <div className="sketch-toolbar-spacer" />

      {isDrawing && activeTool === 'line' && (
        <div className="sketch-toolbar-hint">
          Click to add points, double-click or Esc to finish
        </div>
      )}
      {activeTool === 'arc' && (
        <div className="sketch-toolbar-hint">
          3-point arc: Click start, end, then point on arc
        </div>
      )}
      {activeTool === 'trim' && (
        <div className="sketch-toolbar-hint">
          Click on line segment to trim between intersections
        </div>
      )}
      {activeTool === 'offset' && (
        <div className="sketch-toolbar-hint">
          Click entity to select, then click to set offset direction
        </div>
      )}
      {activeTool === 'dimension' && (
        <div className="sketch-toolbar-hint">
          Click entity or two points to add/edit dimension constraint
        </div>
      )}

      <div className="sketch-toolbar-section">
        <div className="sketch-finish-buttons">
          <button
            className="sketch-finish-btn primary"
            onClick={onFinish}
            title="Finish and save sketch"
          >
            <CheckIcon size={16} color="#ffffff" />
            <span>Finish Sketch</span>
          </button>
          <button
            className="sketch-finish-btn secondary"
            onClick={onCancel}
            title="Cancel and discard changes"
          >
            <CloseIcon size={16} color="#333333" />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
