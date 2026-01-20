import { useSceneStore, type SelectionMode } from '../store/sceneStore';
import { CSGTestPanel } from './CSGTestPanel';
import './Sidebar.css';

export function Sidebar() {
  const {
    selectionMode,
    setSelectionMode,
    hoveredSelection,
    selectedItems,
    clearSelection,
  } = useSceneStore();

  const selectionModes: { mode: SelectionMode; label: string }[] = [
    { mode: 'face', label: 'Face' },
    { mode: 'edge', label: 'Edge' },
    { mode: 'body', label: 'Body' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <h2>3DDesignLab</h2>
        <p className="subtitle">Milestone 0.3 - CSG Engine Spike</p>
      </div>

      <CSGTestPanel />

      <div className="sidebar-section">
        <h3>Selection Mode</h3>
        <div className="button-group">
          {selectionModes.map(({ mode, label }) => (
            <button
              key={mode}
              className={`mode-button ${selectionMode === mode ? 'active' : ''}`}
              onClick={() => setSelectionMode(mode)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <h3>Hover Info</h3>
        {hoveredSelection ? (
          <div className="info-box">
            <div className="info-row">
              <span className="label">Object:</span>
              <span className="value">{hoveredSelection.objectId}</span>
            </div>
            {hoveredSelection.faceIndex !== undefined && (
              <div className="info-row">
                <span className="label">Face:</span>
                <span className="value">{hoveredSelection.faceIndex}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="muted">Hover over geometry to see info</p>
        )}
      </div>

      <div className="sidebar-section">
        <h3>Selection ({selectedItems.length})</h3>
        {selectedItems.length > 0 ? (
          <>
            <div className="selection-list">
              {selectedItems.map((item, index) => (
                <div key={index} className="selection-item">
                  <span>{item.objectId}</span>
                  {item.faceIndex !== undefined && (
                    <span className="face-badge">Face {item.faceIndex}</span>
                  )}
                </div>
              ))}
            </div>
            <button className="clear-button" onClick={clearSelection}>
              Clear Selection
            </button>
          </>
        ) : (
          <p className="muted">Click on faces to select</p>
        )}
      </div>

      <div className="sidebar-section">
        <h3>Controls</h3>
        <div className="controls-help">
          <div className="control-item">
            <kbd>Click</kbd>
            <span>Select face</span>
          </div>
          <div className="control-item">
            <kbd>Shift+Click</kbd>
            <span>Multi-select</span>
          </div>
          <div className="control-item">
            <kbd>Drag</kbd>
            <span>Orbit camera</span>
          </div>
          <div className="control-item">
            <kbd>Scroll</kbd>
            <span>Zoom</span>
          </div>
          <div className="control-item">
            <kbd>Right-drag</kbd>
            <span>Pan camera</span>
          </div>
        </div>
      </div>
    </div>
  );
}
