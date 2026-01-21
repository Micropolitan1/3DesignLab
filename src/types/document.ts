/**
 * Document model and serialization types
 */

import type { Feature, Parameter } from './features';

// ============ DOCUMENT ============

export interface Document {
  id: string;
  name: string;
  version: string;
  createdAt: string;
  modifiedAt: string;
  features: Feature[];
  globalParameters: Record<string, Parameter>;
}

// ============ SERIALIZATION TYPES ============

// Serializable version of Feature (without Manifold objects)
export interface SerializedFeature {
  id: string;
  type: Feature['type'];
  name: string;
  suppressed: boolean;
  parameters: Record<string, SerializedParameter>;
  // Type-specific refs
  sketchRef?: { featureId: string; type: string; index?: number };
  targetBodyRef?: { featureId: string; type: string; index?: number };
  toolBodyRef?: { featureId: string; type: string; index?: number };
  // Sketch data
  sketchData?: SerializedSketchData;
}

export interface SerializedParameter {
  id: string;
  name: string;
  type: 'number' | 'string' | 'boolean' | 'enum';
  value: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: { value: string; label: string }[];
}

export interface SerializedSketchData {
  entities: SerializedSketchEntity[];
  constraints: SerializedConstraint[];
}

export interface SerializedSketchEntity {
  id: string;
  type: 'line' | 'rectangle' | 'circle' | 'arc' | 'point';
  data: Record<string, unknown>;
}

export interface SerializedConstraint {
  id: string;
  type: string;
  entityRefs: string[];
  value?: number;
}

export interface SerializedDocument {
  id: string;
  name: string;
  version: string;
  createdAt: string;
  modifiedAt: string;
  features: SerializedFeature[];
  globalParameters: Record<string, SerializedParameter>;
}

// ============ DOCUMENT VERSION ============

export const DOCUMENT_VERSION = '1.0.0';
