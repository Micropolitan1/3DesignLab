/**
 * Sketch Store - Zustand store for sketch mode state
 */

import { create } from 'zustand';
import type {
  SketchData,
  SketchEntity,
  SketchTool,
  SketchToolState,
  SketchPlane,
  Point2D,
  SnapType,
} from '../types/sketch';
import { createSketchData } from '../types/sketch';
import { SketchEngine } from '../engine/SketchEngine';

// ============ DISPLAY SETTINGS ============

export interface SketchDisplaySettings {
  showGrid: boolean;
  showProfiles: boolean;
  showPoints: boolean;
  showDimensions: boolean;
  showConstraints: boolean;
  showProjectedGeometries: boolean;
  sliceView: boolean;
  snapEnabled: boolean;
}

const defaultDisplaySettings: SketchDisplaySettings = {
  showGrid: false,
  showProfiles: true,
  showPoints: true,
  showDimensions: true,
  showConstraints: true,
  showProjectedGeometries: true,
  sliceView: false,
  snapEnabled: true,
};

// ============ STORE STATE ============

interface SketchState {
  // Mode state
  isSketchMode: boolean;
  sketchFeatureId: string | null;

  // Sketch data
  sketchData: SketchData | null;
  plane: SketchPlane | null;

  // Tool state
  toolState: SketchToolState;

  // Display settings
  displaySettings: SketchDisplaySettings;

  // Selection
  selectedEntityIds: string[];
  hoveredEntityId: string | null;

  // Preview
  previewEntity: SketchEntity | null;

  // Actions - Mode
  enterSketchMode: (featureId: string, plane: SketchPlane, existingData?: SketchData) => void;
  exitSketchMode: (save: boolean) => SketchData | null;

  // Actions - Tools
  setActiveTool: (tool: SketchTool) => void;
  startDrawing: (point: Point2D) => void;
  updateDrawing: (point: Point2D) => void;
  finishDrawing: (point: Point2D) => void;
  cancelDrawing: () => void;

  // Actions - Snapping
  setSnapPoint: (point: Point2D | null, entityId: string | null, type: SnapType | null) => void;

  // Actions - Selection
  selectEntity: (id: string, additive: boolean) => void;
  clearSelection: () => void;
  setHoveredEntity: (id: string | null) => void;

  // Actions - Entities
  addEntity: (entity: SketchEntity) => void;
  updateEntity: (id: string, updates: Partial<SketchEntity>) => void;
  deleteSelectedEntities: () => void;
  toggleConstruction: (id: string) => void;

  // Actions - Trim
  trimAtPoint: (point: Point2D) => boolean;

  // Actions - Offset
  selectEntityForOffset: (point: Point2D) => boolean;
  applyOffset: (referencePoint: Point2D) => boolean;
  setOffsetDistance: (distance: number) => void;

  // Actions - Preview
  setPreviewEntity: (entity: SketchEntity | null) => void;

  // Actions - Profiles
  detectProfiles: () => void;

  // Actions - Display Settings
  setDisplaySetting: <K extends keyof SketchDisplaySettings>(key: K, value: SketchDisplaySettings[K]) => void;
  toggleDisplaySetting: (key: keyof SketchDisplaySettings) => void;
}

// ============ INITIAL STATE ============

const initialToolState: SketchToolState = {
  activeTool: 'select',
  isDrawing: false,
  startPoint: null,
  previewPoints: [],
  snapPoint: null,
  snapEntityId: null,
  snapType: null,
  arcPoints: [],
  arcStep: 0,
  offsetEntityId: null,
  offsetDistance: 10, // Default offset distance
};

// Helper: Calculate arc center from 3 points
function calculateArcFrom3Points(p1: Point2D, p2: Point2D, p3: Point2D): { center: Point2D; radius: number; startAngle: number; endAngle: number } | null {
  // Calculate the perpendicular bisectors of p1-p2 and p2-p3
  // Their intersection is the center of the circle through all 3 points

  const mid1 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  const mid2 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };

  // Direction vectors
  const d1 = { x: p2.x - p1.x, y: p2.y - p1.y };
  const d2 = { x: p3.x - p2.x, y: p3.y - p2.y };

  // Perpendicular directions (rotate 90 degrees)
  const perp1 = { x: -d1.y, y: d1.x };
  const perp2 = { x: -d2.y, y: d2.x };

  // Find intersection of the two perpendicular bisectors
  // mid1 + t * perp1 = mid2 + s * perp2
  const det = perp1.x * perp2.y - perp1.y * perp2.x;
  if (Math.abs(det) < 0.0001) {
    // Points are collinear, can't form an arc
    return null;
  }

  const t = ((mid2.x - mid1.x) * perp2.y - (mid2.y - mid1.y) * perp2.x) / det;

  const center = {
    x: mid1.x + t * perp1.x,
    y: mid1.y + t * perp1.y,
  };

  const radius = Math.sqrt((p1.x - center.x) ** 2 + (p1.y - center.y) ** 2);

  // Calculate angles
  const startAngle = Math.atan2(p1.y - center.y, p1.x - center.x);
  const midAngle = Math.atan2(p2.y - center.y, p2.x - center.x);
  let endAngle = Math.atan2(p3.y - center.y, p3.x - center.x);

  // Determine arc direction (CW or CCW) based on midpoint
  // Normalize angles to [0, 2π]
  const normalize = (a: number) => (a + Math.PI * 2) % (Math.PI * 2);
  const nStart = normalize(startAngle);
  const nMid = normalize(midAngle);
  const nEnd = normalize(endAngle);

  // Check if midpoint is on the shorter arc
  const ccwFromStart = (nMid - nStart + Math.PI * 2) % (Math.PI * 2);
  const ccwToEnd = (nEnd - nStart + Math.PI * 2) % (Math.PI * 2);

  // If midpoint is not between start and end going CCW, we need to go the other way
  if (ccwFromStart > ccwToEnd) {
    // Swap start and end to draw the correct arc
    return { center, radius, startAngle: endAngle, endAngle: startAngle };
  }

  return { center, radius, startAngle, endAngle };
}

// ============ STORE IMPLEMENTATION ============

export const useSketchStore = create<SketchState>((set, get) => ({
  // Initial state
  isSketchMode: false,
  sketchFeatureId: null,
  sketchData: null,
  plane: null,
  toolState: { ...initialToolState },
  displaySettings: { ...defaultDisplaySettings },
  selectedEntityIds: [],
  hoveredEntityId: null,
  previewEntity: null,

  // Mode actions
  enterSketchMode: (featureId, plane, existingData) => {
    const data = existingData || createSketchData();
    SketchEngine.loadSketch(data, plane);

    set({
      isSketchMode: true,
      sketchFeatureId: featureId,
      sketchData: data,
      plane,
      toolState: { ...initialToolState },
      selectedEntityIds: [],
      hoveredEntityId: null,
      previewEntity: null,
    });
  },

  exitSketchMode: (save) => {
    const { sketchData } = get();

    if (save && sketchData) {
      // Detect profiles before returning
      SketchEngine.detectProfiles();
      const finalData = SketchEngine.finishSketch();

      set({
        isSketchMode: false,
        sketchFeatureId: null,
        sketchData: null,
        plane: null,
        toolState: { ...initialToolState },
        selectedEntityIds: [],
        hoveredEntityId: null,
        previewEntity: null,
      });

      return finalData;
    }

    SketchEngine.cancelSketch();

    set({
      isSketchMode: false,
      sketchFeatureId: null,
      sketchData: null,
      plane: null,
      toolState: { ...initialToolState },
      selectedEntityIds: [],
      hoveredEntityId: null,
      previewEntity: null,
    });

    return null;
  },

  // Tool actions
  setActiveTool: (tool) => {
    set((state) => ({
      toolState: {
        ...state.toolState,
        activeTool: tool,
        isDrawing: false,
        startPoint: null,
        previewPoints: [],
        arcPoints: [],
        arcStep: 0,
        offsetEntityId: null,
      },
      previewEntity: null,
    }));
  },

  startDrawing: (point) => {
    const { toolState, sketchData } = get();

    // For line tool, check if we're continuing a chain
    if (toolState.activeTool === 'line' && toolState.isDrawing && toolState.startPoint) {
      // We're in chained mode - add the line and continue from this point
      const start = toolState.startPoint;
      const dx = point.x - start.x;
      const dy = point.y - start.y;
      if (Math.sqrt(dx * dx + dy * dy) > 1) {
        SketchEngine.addLine(start, point);

        // Auto-detect profiles after adding a line
        SketchEngine.detectProfiles();
        const dataWithProfiles = SketchEngine.getSketch();

        set({
          sketchData: dataWithProfiles ? { ...dataWithProfiles } : sketchData,
          toolState: {
            ...toolState,
            isDrawing: true,
            startPoint: point, // Continue from this point
            previewPoints: [point],
          },
        });
      }
      return;
    }

    // For arc tool, use 3-point mode (start, midpoint, end)
    if (toolState.activeTool === 'arc') {
      const newArcPoints = [...toolState.arcPoints, point];

      if (newArcPoints.length === 3) {
        // Third click - create the arc
        const arcData = calculateArcFrom3Points(newArcPoints[0], newArcPoints[1], newArcPoints[2]);
        if (arcData) {
          SketchEngine.addArc(arcData.center, arcData.radius, arcData.startAngle, arcData.endAngle);
          SketchEngine.detectProfiles();
          const dataWithProfiles = SketchEngine.getSketch();

          set({
            sketchData: dataWithProfiles ? { ...dataWithProfiles } : sketchData,
            toolState: {
              ...toolState,
              isDrawing: false,
              arcPoints: [],
              arcStep: 0,
            },
            previewEntity: null,
          });
        } else {
          // Points are collinear, reset
          set({
            toolState: {
              ...toolState,
              isDrawing: false,
              arcPoints: [],
              arcStep: 0,
            },
            previewEntity: null,
          });
        }
      } else {
        // First or second click - store point and continue
        set({
          toolState: {
            ...toolState,
            isDrawing: true,
            arcPoints: newArcPoints,
            arcStep: newArcPoints.length,
          },
        });
      }
      return;
    }

    set({
      toolState: {
        ...toolState,
        isDrawing: true,
        startPoint: point,
        previewPoints: [point],
      },
    });
  },

  updateDrawing: (point) => {
    const { toolState } = get();

    // For arc tool, we need different handling
    if (toolState.activeTool === 'arc' && toolState.isDrawing) {
      let preview: SketchEntity | null = null;

      if (toolState.arcPoints.length === 1) {
        // Show line from first point to current point (preview for second point)
        preview = {
          id: 'preview',
          type: 'line',
          construction: false,
          start: { ...toolState.arcPoints[0] },
          end: { ...point },
        };
      } else if (toolState.arcPoints.length === 2) {
        // Show arc preview using first two points and current point as midpoint
        const arcData = calculateArcFrom3Points(toolState.arcPoints[0], point, toolState.arcPoints[1]);
        if (arcData) {
          preview = {
            id: 'preview',
            type: 'arc',
            construction: false,
            center: arcData.center,
            radius: arcData.radius,
            startAngle: arcData.startAngle,
            endAngle: arcData.endAngle,
          };
        }
      }

      set({
        toolState: {
          ...toolState,
          previewPoints: [point],
        },
        previewEntity: preview,
      });
      return;
    }

    if (!toolState.isDrawing || !toolState.startPoint) return;

    // Create preview entity based on tool
    let preview: SketchEntity | null = null;
    const start = toolState.startPoint;

    switch (toolState.activeTool) {
      case 'line':
        preview = {
          id: 'preview',
          type: 'line',
          construction: false,
          start: { ...start },
          end: { ...point },
        };
        break;

      case 'rectangle':
        preview = {
          id: 'preview',
          type: 'rectangle',
          construction: false,
          corner1: { ...start },
          corner2: { ...point },
        };
        break;

      case 'circle': {
        const dx = point.x - start.x;
        const dy = point.y - start.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        preview = {
          id: 'preview',
          type: 'circle',
          construction: false,
          center: { ...start },
          radius,
        };
        break;
      }
    }

    set({
      toolState: {
        ...toolState,
        previewPoints: [...toolState.previewPoints, point],
      },
      previewEntity: preview,
    });
  },

  finishDrawing: (point) => {
    const { toolState, sketchData } = get();
    if (!toolState.isDrawing || !toolState.startPoint || !sketchData) {
      set({
        toolState: { ...toolState, isDrawing: false, startPoint: null, previewPoints: [] },
        previewEntity: null,
      });
      return;
    }

    const start = toolState.startPoint;

    // For line tool, mouse up just updates the preview - actual line is added on next click
    // Double-click or Escape finishes the chain
    if (toolState.activeTool === 'line') {
      // Don't finish - let the chain continue
      return;
    }

    // Create the actual entity for other tools
    try {
      switch (toolState.activeTool) {
        case 'rectangle': {
          const width = Math.abs(point.x - start.x);
          const height = Math.abs(point.y - start.y);
          if (width > 1 && height > 1) {
            SketchEngine.addRectangle(start, point);
          }
          break;
        }

        case 'circle': {
          const dx = point.x - start.x;
          const dy = point.y - start.y;
          const radius = Math.sqrt(dx * dx + dy * dy);
          if (radius > 1) {
            SketchEngine.addCircle(start, radius);
          }
          break;
        }

        case 'point':
          SketchEngine.addPoint(point);
          break;
      }

      // Auto-detect profiles after adding an entity
      SketchEngine.detectProfiles();
      const updatedData = SketchEngine.getSketch();

      set({
        sketchData: updatedData ? { ...updatedData } : sketchData,
        toolState: {
          ...toolState,
          isDrawing: false,
          startPoint: null,
          previewPoints: [],
        },
        previewEntity: null,
      });
    } catch (error) {
      console.error('[SketchStore] Error creating entity:', error);
      set({
        toolState: {
          ...toolState,
          isDrawing: false,
          startPoint: null,
          previewPoints: [],
        },
        previewEntity: null,
      });
    }
  },

  cancelDrawing: () => {
    const { toolState, sketchData } = get();

    // For line tool, if we have a start point, finish the chain (don't add pending line)
    // The chain is complete - just clear the drawing state
    if (toolState.activeTool === 'line' && toolState.isDrawing) {
      // Auto-detect profiles after finishing the line chain
      SketchEngine.detectProfiles();
      const updatedData = SketchEngine.getSketch();

      set({
        sketchData: updatedData ? { ...updatedData } : sketchData,
        toolState: {
          ...toolState,
          isDrawing: false,
          startPoint: null,
          previewPoints: [],
        },
        previewEntity: null,
      });
      return;
    }

    // For arc tool, just reset the arc state
    if (toolState.activeTool === 'arc' && toolState.isDrawing) {
      set({
        toolState: {
          ...toolState,
          isDrawing: false,
          arcPoints: [],
          arcStep: 0,
        },
        previewEntity: null,
      });
      return;
    }

    set((state) => ({
      toolState: {
        ...state.toolState,
        isDrawing: false,
        startPoint: null,
        previewPoints: [],
        arcPoints: [],
        arcStep: 0,
      },
      previewEntity: null,
    }));
  },

  // Snapping actions
  setSnapPoint: (point, entityId, type) => {
    set((state) => ({
      toolState: {
        ...state.toolState,
        snapPoint: point,
        snapEntityId: entityId,
        snapType: type,
      },
    }));
  },

  // Selection actions
  selectEntity: (id, additive) => {
    set((state) => {
      if (additive) {
        const exists = state.selectedEntityIds.includes(id);
        return {
          selectedEntityIds: exists
            ? state.selectedEntityIds.filter(i => i !== id)
            : [...state.selectedEntityIds, id],
        };
      }
      return { selectedEntityIds: [id] };
    });
  },

  clearSelection: () => {
    set({ selectedEntityIds: [] });
  },

  setHoveredEntity: (id) => {
    set({ hoveredEntityId: id });
  },

  // Entity actions
  addEntity: (entity) => {
    const { sketchData } = get();
    if (!sketchData) return;

    set({
      sketchData: {
        ...sketchData,
        entities: [...sketchData.entities, entity],
      },
    });
  },

  updateEntity: (id, updates) => {
    const { sketchData } = get();
    if (!sketchData) return;

    SketchEngine.updateEntity(id, updates);
    const updatedData = SketchEngine.getSketch();

    set({
      sketchData: updatedData ? { ...updatedData } : sketchData,
    });
  },

  deleteSelectedEntities: () => {
    const { sketchData, selectedEntityIds } = get();
    if (!sketchData || selectedEntityIds.length === 0) return;

    for (const id of selectedEntityIds) {
      SketchEngine.deleteEntity(id);
    }

    const updatedData = SketchEngine.getSketch();

    set({
      sketchData: updatedData ? { ...updatedData } : sketchData,
      selectedEntityIds: [],
    });
  },

  toggleConstruction: (id) => {
    SketchEngine.toggleConstruction(id);
    const updatedData = SketchEngine.getSketch();
    const { sketchData } = get();

    set({
      sketchData: updatedData ? { ...updatedData } : sketchData,
    });
  },

  // Trim action
  trimAtPoint: (point) => {
    const nearest = SketchEngine.findNearestLineEntity(point);
    if (!nearest) return false;

    const success = SketchEngine.trimLineAt(nearest.entity.id, point);
    if (success) {
      SketchEngine.detectProfiles();
      const updatedData = SketchEngine.getSketch();
      const { sketchData } = get();

      set({
        sketchData: updatedData ? { ...updatedData } : sketchData,
      });
    }
    return success;
  },

  // Offset actions
  selectEntityForOffset: (point) => {
    const nearest = SketchEngine.findNearestOffsetableEntity(point);
    if (!nearest) return false;

    set((state) => ({
      toolState: {
        ...state.toolState,
        offsetEntityId: nearest.entity.id,
      },
    }));
    return true;
  },

  applyOffset: (referencePoint) => {
    const { toolState, sketchData } = get();
    if (!toolState.offsetEntityId) return false;

    const entity = sketchData?.entities.find(e => e.id === toolState.offsetEntityId);
    if (!entity) return false;

    let success = false;

    if (entity.type === 'line') {
      success = SketchEngine.offsetLine(entity.id, toolState.offsetDistance, referencePoint) !== null;
    } else if (entity.type === 'circle') {
      success = SketchEngine.offsetCircle(entity.id, toolState.offsetDistance, referencePoint) !== null;
    } else if (entity.type === 'rectangle') {
      success = SketchEngine.offsetRectangle(entity.id, toolState.offsetDistance, referencePoint) !== null;
    }

    if (success) {
      SketchEngine.detectProfiles();
      const updatedData = SketchEngine.getSketch();

      set({
        sketchData: updatedData ? { ...updatedData } : sketchData,
        toolState: {
          ...toolState,
          offsetEntityId: null, // Reset after successful offset
        },
      });
    }
    return success;
  },

  setOffsetDistance: (distance) => {
    set((state) => ({
      toolState: {
        ...state.toolState,
        offsetDistance: distance,
      },
    }));
  },

  // Preview actions
  setPreviewEntity: (entity) => {
    set({ previewEntity: entity });
  },

  // Profile detection
  detectProfiles: () => {
    SketchEngine.detectProfiles();
    const updatedData = SketchEngine.getSketch();
    const { sketchData } = get();

    set({
      sketchData: updatedData ? { ...updatedData } : sketchData,
    });
  },

  // Display settings actions
  setDisplaySetting: (key, value) => {
    set((state) => ({
      displaySettings: {
        ...state.displaySettings,
        [key]: value,
      },
    }));
  },

  toggleDisplaySetting: (key) => {
    set((state) => ({
      displaySettings: {
        ...state.displaySettings,
        [key]: !state.displaySettings[key],
      },
    }));
  },
}));
