/**
 * Toolbar - Fusion 360 style top toolbar with categorized tools
 */

import { useState, useCallback } from 'react';
import { useDocumentStore, createPrimitiveFeature, createSketchFeature } from '../../store/documentStore';
import {
  SaveIcon,
  FolderOpenIcon,
  ExportIcon,
  UndoIcon,
  RedoIcon,
  BoxIcon,
  CylinderIcon,
  SphereIcon,
  ExtrudeIcon,
  BooleanUnionIcon,
  SketchIcon,
  PlaneIcon,
  FilletIcon,
  ChamferIcon,
  ShellIcon,
  AxisIcon,
} from '../icons/Icons';
import './Toolbar.css';

interface ToolbarProps {
  onStartSketch: () => void;
  onOpenExtrudeDialog: () => void;
  onOpenBooleanDialog: () => void;
  onSaveDocument?: () => void;
  onLoadDocument?: () => void;
  onExportSTL?: () => void;
}

type ToolCategory = 'solid' | 'sketch' | 'modify' | 'assemble' | 'construct';

export function Toolbar({
  onStartSketch,
  onOpenExtrudeDialog,
  onOpenBooleanDialog,
  onSaveDocument,
  onLoadDocument,
  onExportSTL,
}: ToolbarProps) {
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('solid');
  const addFeature = useDocumentStore(state => state.addFeature);
  const document = useDocumentStore(state => state.document);

  const handleAddPrimitive = useCallback((shape: 'box' | 'cylinder' | 'sphere') => {
    const feature = createPrimitiveFeature(shape);
    addFeature(feature);
  }, [addFeature]);

  const handleNewSketch = useCallback(() => {
    const feature = createSketchFeature('XY', 0);
    addFeature(feature);
    onStartSketch();
  }, [addFeature, onStartSketch]);

  // Check capabilities
  const hasSketchesWithProfiles = document.features.some(
    f => f.type === 'sketch' && !f.suppressed && f.sketchData?.profiles?.length
  );
  const bodyCount = document.features.filter(
    f => !f.suppressed && (f.type === 'primitive' || f.type === 'extrude' || f.type === 'boolean')
  ).length;

  return (
    <div className="toolbar">
      {/* File operations */}
      <div className="toolbar-section file-section">
        <button
          className="toolbar-btn file-btn"
          onClick={() => onSaveDocument?.()}
          title="Save (Ctrl+S)"
        >
          <SaveIcon size={18} />
        </button>
        <button
          className="toolbar-btn file-btn"
          onClick={() => onLoadDocument?.()}
          title="Open (Ctrl+O)"
        >
          <FolderOpenIcon size={18} />
        </button>
        <button
          className="toolbar-btn file-btn"
          onClick={() => onExportSTL?.()}
          title="Export STL"
        >
          <ExportIcon size={18} />
        </button>
        <div className="toolbar-divider" />
        <button className="toolbar-btn file-btn" title="Undo (Ctrl+Z)" disabled>
          <UndoIcon size={18} />
        </button>
        <button className="toolbar-btn file-btn" title="Redo (Ctrl+Y)" disabled>
          <RedoIcon size={18} />
        </button>
        <div className="toolbar-divider" />
      </div>

      {/* Category tabs */}
      <div className="toolbar-categories">
        <button
          className={`category-tab ${activeCategory === 'solid' ? 'active' : ''}`}
          onClick={() => setActiveCategory('solid')}
        >
          SOLID
        </button>
        <button
          className={`category-tab ${activeCategory === 'sketch' ? 'active' : ''}`}
          onClick={() => setActiveCategory('sketch')}
        >
          SKETCH
        </button>
        <button
          className={`category-tab ${activeCategory === 'modify' ? 'active' : ''}`}
          onClick={() => setActiveCategory('modify')}
        >
          MODIFY
        </button>
        <button
          className={`category-tab ${activeCategory === 'construct' ? 'active' : ''}`}
          onClick={() => setActiveCategory('construct')}
        >
          CONSTRUCT
        </button>
      </div>

      {/* Tool ribbon based on active category */}
      <div className="toolbar-ribbon">
        {activeCategory === 'solid' && (
          <>
            <div className="tool-group">
              <span className="tool-group-label">Create</span>
              <div className="tool-group-buttons">
                <button className="toolbar-btn tool-btn" onClick={() => handleAddPrimitive('box')} title="Box">
                  <BoxIcon size={20} />
                  <span className="btn-label">Box</span>
                </button>
                <button className="toolbar-btn tool-btn" onClick={() => handleAddPrimitive('cylinder')} title="Cylinder">
                  <CylinderIcon size={20} />
                  <span className="btn-label">Cylinder</span>
                </button>
                <button className="toolbar-btn tool-btn" onClick={() => handleAddPrimitive('sphere')} title="Sphere">
                  <SphereIcon size={20} />
                  <span className="btn-label">Sphere</span>
                </button>
              </div>
            </div>
            <div className="tool-group">
              <span className="tool-group-label">Extrude</span>
              <div className="tool-group-buttons">
                <button
                  className="toolbar-btn tool-btn"
                  onClick={onOpenExtrudeDialog}
                  disabled={!hasSketchesWithProfiles}
                  title="Extrude (E)"
                >
                  <ExtrudeIcon size={20} />
                  <span className="btn-label">Extrude</span>
                </button>
              </div>
            </div>
            <div className="tool-group">
              <span className="tool-group-label">Combine</span>
              <div className="tool-group-buttons">
                <button
                  className="toolbar-btn tool-btn"
                  onClick={onOpenBooleanDialog}
                  disabled={bodyCount < 2}
                  title="Combine"
                >
                  <BooleanUnionIcon size={20} />
                  <span className="btn-label">Combine</span>
                </button>
              </div>
            </div>
          </>
        )}

        {activeCategory === 'sketch' && (
          <>
            <div className="tool-group">
              <span className="tool-group-label">Create</span>
              <div className="tool-group-buttons">
                <button className="toolbar-btn tool-btn primary" onClick={handleNewSketch} title="Create Sketch (S)">
                  <SketchIcon size={20} />
                  <span className="btn-label">Create Sketch</span>
                </button>
              </div>
            </div>
            <div className="tool-group">
              <span className="tool-group-label">Planes</span>
              <div className="tool-group-buttons">
                <button className="toolbar-btn tool-btn" onClick={() => {
                  const feature = createSketchFeature('XY', 0);
                  addFeature(feature);
                  onStartSketch();
                }} title="Sketch on XY Plane">
                  <PlaneIcon size={20} />
                  <span className="btn-label">XY Plane</span>
                </button>
                <button className="toolbar-btn tool-btn" onClick={() => {
                  const feature = createSketchFeature('XZ', 0);
                  addFeature(feature);
                  onStartSketch();
                }} title="Sketch on XZ Plane">
                  <PlaneIcon size={20} />
                  <span className="btn-label">XZ Plane</span>
                </button>
                <button className="toolbar-btn tool-btn" onClick={() => {
                  const feature = createSketchFeature('YZ', 0);
                  addFeature(feature);
                  onStartSketch();
                }} title="Sketch on YZ Plane">
                  <PlaneIcon size={20} />
                  <span className="btn-label">YZ Plane</span>
                </button>
              </div>
            </div>
          </>
        )}

        {activeCategory === 'modify' && (
          <>
            <div className="tool-group">
              <span className="tool-group-label">Modify</span>
              <div className="tool-group-buttons">
                <button className="toolbar-btn tool-btn" title="Fillet (Coming Soon)" disabled>
                  <FilletIcon size={20} />
                  <span className="btn-label">Fillet</span>
                </button>
                <button className="toolbar-btn tool-btn" title="Chamfer (Coming Soon)" disabled>
                  <ChamferIcon size={20} />
                  <span className="btn-label">Chamfer</span>
                </button>
                <button className="toolbar-btn tool-btn" title="Shell (Coming Soon)" disabled>
                  <ShellIcon size={20} />
                  <span className="btn-label">Shell</span>
                </button>
              </div>
            </div>
          </>
        )}

        {activeCategory === 'construct' && (
          <>
            <div className="tool-group">
              <span className="tool-group-label">Work Features</span>
              <div className="tool-group-buttons">
                <button className="toolbar-btn tool-btn" title="Offset Plane (Coming Soon)" disabled>
                  <PlaneIcon size={20} />
                  <span className="btn-label">Offset Plane</span>
                </button>
                <button className="toolbar-btn tool-btn" title="Axis (Coming Soon)" disabled>
                  <AxisIcon size={20} />
                  <span className="btn-label">Axis</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
