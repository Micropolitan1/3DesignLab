/**
 * SketchPalette - Right-side panel for sketch options (Fusion 360 style)
 */

import { useSketchStore } from '../../store/sketchStore';
import { ChevronDownIcon, ChevronRightIcon } from '../icons/Icons';
import './SketchPalette.css';

interface SketchPaletteProps {
  onFinish: () => void;
}

export function SketchPalette({ onFinish }: SketchPaletteProps) {
  const sketchData = useSketchStore(state => state.sketchData);
  const toolState = useSketchStore(state => state.toolState);
  const displaySettings = useSketchStore(state => state.displaySettings);
  const toggleDisplaySetting = useSketchStore(state => state.toggleDisplaySetting);

  return (
    <div className="sketch-palette">
      <div className="sketch-palette-header">
        <span className="palette-collapse-icon">−</span>
        <span>SKETCH PALETTE</span>
        <span className="palette-pin-icon">⊞</span>
      </div>

      {/* Feature Options Section */}
      <div className="palette-section">
        <div className="palette-section-header">
          <ChevronDownIcon size={12} />
          <span>Feature Options</span>
        </div>
        <div className="palette-section-content">
          <div className="palette-feature-info">
            <span className="feature-label">
              {toolState.activeTool === 'select' ? 'Select' :
               toolState.activeTool === 'line' ? 'Line' :
               toolState.activeTool === 'rectangle' ? 'Rectangle' :
               toolState.activeTool === 'circle' ? 'Circle' :
               toolState.activeTool === 'arc' ? 'Arc' :
               toolState.activeTool === 'point' ? 'Point' :
               toolState.activeTool === 'trim' ? 'Trim' :
               toolState.activeTool === 'offset' ? 'Offset' : 'Tool'}
            </span>
            <div className="feature-mode-icons">
              <button className="feature-mode-btn active" title="Standard mode">
                <svg viewBox="0 0 16 16" width="16" height="16">
                  <rect x="3" y="3" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </button>
              <button className="feature-mode-btn" title="Construction mode">
                <svg viewBox="0 0 16 16" width="16" height="16">
                  <rect x="3" y="3" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Options Section */}
      <div className="palette-section">
        <div className="palette-section-header">
          <ChevronDownIcon size={12} />
          <span>Options</span>
        </div>
        <div className="palette-section-content options-list">
          <label className="palette-checkbox">
            <input
              type="checkbox"
              checked={displaySettings.showGrid}
              onChange={() => toggleDisplaySetting('showGrid')}
            />
            <span className="checkbox-custom"></span>
            <span>Sketch Grid</span>
          </label>

          <label className="palette-checkbox">
            <input
              type="checkbox"
              checked={displaySettings.snapEnabled}
              onChange={() => toggleDisplaySetting('snapEnabled')}
            />
            <span className="checkbox-custom"></span>
            <span>Snap</span>
          </label>

          <label className="palette-checkbox">
            <input
              type="checkbox"
              checked={displaySettings.sliceView}
              onChange={() => toggleDisplaySetting('sliceView')}
            />
            <span className="checkbox-custom"></span>
            <span>Slice</span>
          </label>

          <div className="palette-divider" />

          <label className="palette-checkbox">
            <input
              type="checkbox"
              checked={displaySettings.showProfiles}
              onChange={() => toggleDisplaySetting('showProfiles')}
            />
            <span className="checkbox-custom"></span>
            <span>Profile</span>
          </label>

          <label className="palette-checkbox">
            <input
              type="checkbox"
              checked={displaySettings.showPoints}
              onChange={() => toggleDisplaySetting('showPoints')}
            />
            <span className="checkbox-custom"></span>
            <span>Points</span>
          </label>

          <label className="palette-checkbox">
            <input
              type="checkbox"
              checked={displaySettings.showDimensions}
              onChange={() => toggleDisplaySetting('showDimensions')}
            />
            <span className="checkbox-custom"></span>
            <span>Dimensions</span>
          </label>

          <label className="palette-checkbox">
            <input
              type="checkbox"
              checked={displaySettings.showConstraints}
              onChange={() => toggleDisplaySetting('showConstraints')}
            />
            <span className="checkbox-custom"></span>
            <span>Constraints</span>
          </label>

          <label className="palette-checkbox">
            <input
              type="checkbox"
              checked={displaySettings.showProjectedGeometries}
              onChange={() => toggleDisplaySetting('showProjectedGeometries')}
            />
            <span className="checkbox-custom"></span>
            <span>Projected Geometries</span>
          </label>
        </div>
      </div>

      {/* Grid Size Control */}
      <div className="palette-section">
        <div className="palette-section-header collapsed">
          <ChevronRightIcon size={12} />
          <span>Grid Settings</span>
        </div>
      </div>

      {/* Sketch Stats */}
      {sketchData && (
        <div className="palette-stats">
          <div className="stat-row">
            <span>Entities:</span>
            <span>{sketchData.entities.length}</span>
          </div>
          <div className="stat-row">
            <span>Profiles:</span>
            <span>{sketchData.profiles.length}</span>
          </div>
          <div className="stat-row">
            <span>Constraints:</span>
            <span>{sketchData.constraints.length}</span>
          </div>
        </div>
      )}

      {/* Finish Sketch Button */}
      <div className="palette-footer">
        <button className="palette-finish-btn" onClick={onFinish}>
          Finish Sketch
        </button>
      </div>
    </div>
  );
}
