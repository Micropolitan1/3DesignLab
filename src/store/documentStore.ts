/**
 * Document Store - Zustand store for document and feature management
 */

import { create } from 'zustand';
import type { Document } from '../types/document';
import type {
  Feature,
  Parameter,
  PrimitiveFeature,
  SketchFeature,
  ExtrudeFeature,
  BooleanFeature,
  CachedBody,
} from '../types/features';
import { createNumberParam, createEnumParam } from '../types/features';
import { generateId, generateFeatureName, resetFeatureCounters } from '../utils/idGenerator';
import { createNewDocument } from '../utils/serialization';

// ============ STORE STATE ============

interface DocumentState {
  // Document
  document: Document;
  isModified: boolean;

  // Selection
  selectedFeatureId: string | null;

  // Rebuild state
  isRebuilding: boolean;
  rebuildError: string | null;

  // Body tracking
  bodies: Map<string, CachedBody>;

  // Actions - Document
  newDocument: (name?: string) => void;
  loadDocument: (doc: Document) => void;
  setDocumentName: (name: string) => void;

  // Actions - Features
  addFeature: (feature: Feature) => void;
  updateFeature: (id: string, updates: Partial<Feature>) => void;
  deleteFeature: (id: string) => void;
  reorderFeature: (id: string, newIndex: number) => void;
  suppressFeature: (id: string, suppressed: boolean) => void;

  // Actions - Parameters
  updateParameter: (featureId: string, paramKey: string, value: number | string | boolean) => void;

  // Actions - Selection
  selectFeature: (id: string | null) => void;

  // Actions - Rebuild
  markFeatureDirty: (id: string) => void;
  markAllDirty: () => void;
  setRebuilding: (isRebuilding: boolean) => void;
  setRebuildError: (error: string | null) => void;
  setCachedResult: (featureId: string, bodies: CachedBody[]) => void;
  clearCachedResult: (featureId: string) => void;

  // Actions - Bodies
  updateBodies: (bodies: Map<string, CachedBody>) => void;
  getBody: (bodyId: string) => CachedBody | undefined;

  // Helpers
  getFeature: (id: string) => Feature | undefined;
  getFeatureIndex: (id: string) => number;
  getFeaturesAfter: (id: string) => Feature[];
}

// ============ STORE IMPLEMENTATION ============

export const useDocumentStore = create<DocumentState>((set, get) => ({
  // Initial state
  document: createNewDocument('Untitled'),
  isModified: false,
  selectedFeatureId: null,
  isRebuilding: false,
  rebuildError: null,
  bodies: new Map(),

  // Document actions
  newDocument: (name = 'Untitled') => {
    resetFeatureCounters();
    set({
      document: createNewDocument(name),
      isModified: false,
      selectedFeatureId: null,
      rebuildError: null,
      bodies: new Map(),
    });
  },

  loadDocument: (doc) => {
    resetFeatureCounters();
    // Mark all features as dirty for rebuild
    const features = doc.features.map(f => ({ ...f, _dirty: true }));
    set({
      document: { ...doc, features },
      isModified: false,
      selectedFeatureId: null,
      rebuildError: null,
      bodies: new Map(),
    });
  },

  setDocumentName: (name) => set((state) => ({
    document: { ...state.document, name },
    isModified: true,
  })),

  // Feature actions
  addFeature: (feature) => set((state) => ({
    document: {
      ...state.document,
      features: [...state.document.features, { ...feature, _dirty: true }],
    },
    isModified: true,
    selectedFeatureId: feature.id,
  })),

  updateFeature: (id, updates) => set((state) => {
    const features: Feature[] = state.document.features.map(f => {
      if (f.id === id) {
        return { ...f, ...updates, _dirty: true } as Feature;
      }
      return f;
    });

    // Mark downstream features as dirty
    const index = features.findIndex(f => f.id === id);
    for (let i = index + 1; i < features.length; i++) {
      features[i] = { ...features[i], _dirty: true } as Feature;
    }

    return {
      document: { ...state.document, features },
      isModified: true,
    };
  }),

  deleteFeature: (id) => set((state) => {
    const index = state.document.features.findIndex(f => f.id === id);
    const features = state.document.features.filter(f => f.id !== id);

    // Mark all features after deleted one as dirty
    for (let i = index; i < features.length; i++) {
      features[i] = { ...features[i], _dirty: true };
    }

    return {
      document: { ...state.document, features },
      isModified: true,
      selectedFeatureId: state.selectedFeatureId === id ? null : state.selectedFeatureId,
    };
  }),

  reorderFeature: (id, newIndex) => set((state) => {
    const features = [...state.document.features];
    const oldIndex = features.findIndex(f => f.id === id);
    if (oldIndex === -1 || oldIndex === newIndex) return state;

    const [feature] = features.splice(oldIndex, 1);
    features.splice(newIndex, 0, feature);

    // Mark all features from min index onward as dirty
    const minIndex = Math.min(oldIndex, newIndex);
    for (let i = minIndex; i < features.length; i++) {
      features[i] = { ...features[i], _dirty: true };
    }

    return {
      document: { ...state.document, features },
      isModified: true,
    };
  }),

  suppressFeature: (id, suppressed) => set((state) => {
    const features = state.document.features.map(f => {
      if (f.id === id) {
        return { ...f, suppressed, _dirty: true };
      }
      return f;
    });

    // Mark downstream features as dirty
    const index = features.findIndex(f => f.id === id);
    for (let i = index + 1; i < features.length; i++) {
      features[i] = { ...features[i], _dirty: true };
    }

    return {
      document: { ...state.document, features },
      isModified: true,
    };
  }),

  // Parameter actions
  updateParameter: (featureId, paramKey, value) => set((state) => {
    const features: Feature[] = state.document.features.map((f) => {
      if (f.id === featureId) {
        const params = { ...f.parameters } as Record<string, Parameter>;
        if (params[paramKey]) {
          params[paramKey] = { ...params[paramKey], value } as Parameter;
        }
        return { ...f, parameters: params, _dirty: true } as Feature;
      }
      return f;
    });

    // Mark downstream features as dirty
    const featureIndex = features.findIndex(f => f.id === featureId);
    for (let i = featureIndex + 1; i < features.length; i++) {
      features[i] = { ...features[i], _dirty: true } as Feature;
    }

    return {
      document: { ...state.document, features },
      isModified: true,
    };
  }),

  // Selection actions
  selectFeature: (id) => set({ selectedFeatureId: id }),

  // Rebuild actions
  markFeatureDirty: (id) => set((state) => {
    const features = state.document.features.map((f, i) => {
      const featureIndex = state.document.features.findIndex(feat => feat.id === id);
      if (f.id === id || (featureIndex !== -1 && i > featureIndex)) {
        return { ...f, _dirty: true };
      }
      return f;
    });
    return { document: { ...state.document, features } };
  }),

  markAllDirty: () => set((state) => ({
    document: {
      ...state.document,
      features: state.document.features.map(f => ({ ...f, _dirty: true })),
    },
  })),

  setRebuilding: (isRebuilding) => set({ isRebuilding }),

  setRebuildError: (error) => set({ rebuildError: error }),

  setCachedResult: (featureId, bodies) => set((state) => {
    const features = state.document.features.map(f => {
      if (f.id === featureId) {
        return {
          ...f,
          _dirty: false,
          _cachedResult: { bodies, timestamp: Date.now() },
        };
      }
      return f;
    });
    return { document: { ...state.document, features } };
  }),

  clearCachedResult: (featureId) => set((state) => {
    const features = state.document.features.map(f => {
      if (f.id === featureId) {
        const { _cachedResult, ...rest } = f;
        return rest as Feature;
      }
      return f;
    });
    return { document: { ...state.document, features } };
  }),

  // Body actions
  updateBodies: (bodies) => set({ bodies }),

  getBody: (bodyId) => get().bodies.get(bodyId),

  // Helpers
  getFeature: (id) => get().document.features.find(f => f.id === id),

  getFeatureIndex: (id) => get().document.features.findIndex(f => f.id === id),

  getFeaturesAfter: (id) => {
    const features = get().document.features;
    const index = features.findIndex(f => f.id === id);
    if (index === -1) return [];
    return features.slice(index + 1);
  },
}));

// ============ FEATURE FACTORIES ============

export function createPrimitiveFeature(shape: 'box' | 'cylinder' | 'sphere'): PrimitiveFeature {
  const id = generateId();
  const name = generateFeatureName(shape);

  const base = {
    id,
    type: 'primitive' as const,
    name,
    suppressed: false,
    _dirty: true,
  };

  const positionParams = {
    positionX: createNumberParam('posX', 'Position X', 0, { unit: 'mm' }),
    positionY: createNumberParam('posY', 'Position Y', 0, { unit: 'mm' }),
    positionZ: createNumberParam('posZ', 'Position Z', 0, { unit: 'mm' }),
  };

  switch (shape) {
    case 'box':
      return {
        ...base,
        parameters: {
          shape: createEnumParam('shape', 'Shape', 'box', [
            { value: 'box', label: 'Box' },
            { value: 'cylinder', label: 'Cylinder' },
            { value: 'sphere', label: 'Sphere' },
          ]),
          width: createNumberParam('width', 'Width', 50, { min: 0.1, unit: 'mm' }),
          height: createNumberParam('height', 'Height', 50, { min: 0.1, unit: 'mm' }),
          depth: createNumberParam('depth', 'Depth', 50, { min: 0.1, unit: 'mm' }),
          ...positionParams,
        },
      };

    case 'cylinder':
      return {
        ...base,
        parameters: {
          shape: createEnumParam('shape', 'Shape', 'cylinder', [
            { value: 'box', label: 'Box' },
            { value: 'cylinder', label: 'Cylinder' },
            { value: 'sphere', label: 'Sphere' },
          ]),
          radius: createNumberParam('radius', 'Radius', 25, { min: 0.1, unit: 'mm' }),
          radiusTop: createNumberParam('radiusTop', 'Radius Top', 25, { min: 0.1, unit: 'mm' }),
          cylinderHeight: createNumberParam('cylinderHeight', 'Height', 50, { min: 0.1, unit: 'mm' }),
          ...positionParams,
        },
      };

    case 'sphere':
      return {
        ...base,
        parameters: {
          shape: createEnumParam('shape', 'Shape', 'sphere', [
            { value: 'box', label: 'Box' },
            { value: 'cylinder', label: 'Cylinder' },
            { value: 'sphere', label: 'Sphere' },
          ]),
          sphereRadius: createNumberParam('sphereRadius', 'Radius', 25, { min: 0.1, unit: 'mm' }),
          ...positionParams,
        },
      };
  }
}

export function createSketchFeature(plane: 'XY' | 'XZ' | 'YZ' = 'XY', offset: number = 0): SketchFeature {
  return {
    id: generateId(),
    type: 'sketch',
    name: generateFeatureName('sketch'),
    suppressed: false,
    _dirty: true,
    parameters: {
      plane: createEnumParam('plane', 'Plane', plane, [
        { value: 'XY', label: 'XY Plane' },
        { value: 'XZ', label: 'XZ Plane' },
        { value: 'YZ', label: 'YZ Plane' },
      ]),
      planeOffset: createNumberParam('offset', 'Offset', offset, { unit: 'mm' }),
    },
  };
}

export function createExtrudeFeature(
  sketchId: string,
  distance: number = 50,
  direction: 'normal' | 'reverse' | 'symmetric' = 'normal',
  mode: 'new' | 'join' | 'cut' = 'new'
): ExtrudeFeature {
  return {
    id: generateId(),
    type: 'extrude',
    name: generateFeatureName('extrude'),
    suppressed: false,
    _dirty: true,
    parameters: {
      distance: createNumberParam('distance', 'Distance', distance, { min: 0.1, unit: 'mm' }),
      direction: createEnumParam('direction', 'Direction', direction, [
        { value: 'normal', label: 'Normal' },
        { value: 'reverse', label: 'Reverse' },
        { value: 'symmetric', label: 'Symmetric' },
      ]),
      mode: createEnumParam('mode', 'Mode', mode, [
        { value: 'new', label: 'New Body' },
        { value: 'join', label: 'Join' },
        { value: 'cut', label: 'Cut' },
      ]),
    },
    sketchRef: { featureId: sketchId, type: 'profile' },
  };
}

export function createBooleanFeature(
  targetBodyFeatureId: string,
  toolBodyFeatureId: string,
  operation: 'union' | 'difference' | 'intersect' = 'union'
): BooleanFeature {
  return {
    id: generateId(),
    type: 'boolean',
    name: generateFeatureName('boolean'),
    suppressed: false,
    _dirty: true,
    parameters: {
      operation: createEnumParam('operation', 'Operation', operation, [
        { value: 'union', label: 'Union' },
        { value: 'difference', label: 'Difference' },
        { value: 'intersect', label: 'Intersect' },
      ]),
    },
    targetBodyRef: { featureId: targetBodyFeatureId, type: 'body' },
    toolBodyRef: { featureId: toolBodyFeatureId, type: 'body' },
  };
}
