/**
 * Feature and Parameter type definitions for parametric modeling
 */

import type { Manifold } from 'manifold-3d';

// ============ PARAMETERS ============

export type ParameterType = 'number' | 'string' | 'boolean' | 'enum';

export interface BaseParameter {
  id: string;
  name: string;
  type: ParameterType;
}

export interface NumberParameter extends BaseParameter {
  type: 'number';
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface StringParameter extends BaseParameter {
  type: 'string';
  value: string;
}

export interface BooleanParameter extends BaseParameter {
  type: 'boolean';
  value: boolean;
}

export interface EnumParameter extends BaseParameter {
  type: 'enum';
  value: string;
  options: { value: string; label: string }[];
}

export type Parameter = NumberParameter | StringParameter | BooleanParameter | EnumParameter;

// ============ GEOMETRY REFERENCES ============

export interface GeometryRef {
  featureId: string;
  type: 'body' | 'face' | 'edge' | 'vertex' | 'profile' | 'sketch';
  index?: number;
}

// ============ CACHED RESULTS ============

export interface CachedBody {
  manifold: Manifold;
  bodyId: string;
  originFeatureId: string;
}

export interface CachedResult {
  bodies: CachedBody[];
  timestamp: number;
}

// ============ FEATURE TYPES ============

export type FeatureType = 'primitive' | 'sketch' | 'extrude' | 'boolean';

export type PrimitiveShape = 'box' | 'cylinder' | 'sphere';
export type BooleanOperation = 'union' | 'difference' | 'intersect';
export type ExtrudeMode = 'new' | 'join' | 'cut';

// ============ FEATURE DEFINITIONS ============

export interface BaseFeature {
  id: string;
  type: FeatureType;
  name: string;
  suppressed: boolean;
  _dirty: boolean;
  _cachedResult?: CachedResult;
}

export interface PrimitiveFeature extends BaseFeature {
  type: 'primitive';
  parameters: {
    shape: EnumParameter;
    // Box parameters
    width?: NumberParameter;
    height?: NumberParameter;
    depth?: NumberParameter;
    // Cylinder parameters
    radius?: NumberParameter;
    radiusTop?: NumberParameter;
    cylinderHeight?: NumberParameter;
    // Sphere parameters
    sphereRadius?: NumberParameter;
    // Transform parameters
    positionX: NumberParameter;
    positionY: NumberParameter;
    positionZ: NumberParameter;
  };
}

export interface SketchFeature extends BaseFeature {
  type: 'sketch';
  parameters: {
    plane: EnumParameter;
    planeOffset: NumberParameter;
  };
  sketchData?: import('./sketch').SketchData;
}

export interface ExtrudeFeature extends BaseFeature {
  type: 'extrude';
  parameters: {
    distance: NumberParameter;
    direction: EnumParameter;
    mode: EnumParameter;
  };
  sketchRef: GeometryRef;
  targetBodyRef?: GeometryRef;
}

export interface BooleanFeature extends BaseFeature {
  type: 'boolean';
  parameters: {
    operation: EnumParameter;
  };
  targetBodyRef: GeometryRef;
  toolBodyRef: GeometryRef;
}

export type Feature = PrimitiveFeature | SketchFeature | ExtrudeFeature | BooleanFeature;

// ============ FEATURE FACTORY HELPERS ============

export function createNumberParam(
  id: string,
  name: string,
  value: number,
  options?: { min?: number; max?: number; step?: number; unit?: string }
): NumberParameter {
  return {
    id,
    name,
    type: 'number',
    value,
    ...options,
  };
}

export function createEnumParam(
  id: string,
  name: string,
  value: string,
  options: { value: string; label: string }[]
): EnumParameter {
  return {
    id,
    name,
    type: 'enum',
    value,
    options,
  };
}

export function createBooleanParam(
  id: string,
  name: string,
  value: boolean
): BooleanParameter {
  return {
    id,
    name,
    type: 'boolean',
    value,
  };
}
