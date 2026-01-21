/**
 * Document serialization utilities - Save/Load model.json
 */

import type { Document, SerializedDocument, SerializedFeature, SerializedParameter } from '../types/document';
import type { Feature, Parameter } from '../types/features';
import type { SketchData, SketchEntity, Constraint } from '../types/sketch';
import { DOCUMENT_VERSION } from '../types/document';
import { generateId } from './idGenerator';

// ============ SERIALIZATION (Document -> JSON) ============

function serializeParameter(param: Parameter): SerializedParameter {
  const base: SerializedParameter = {
    id: param.id,
    name: param.name,
    type: param.type,
    value: param.value,
  };

  if (param.type === 'number') {
    if (param.min !== undefined) base.min = param.min;
    if (param.max !== undefined) base.max = param.max;
    if (param.step !== undefined) base.step = param.step;
    if (param.unit !== undefined) base.unit = param.unit;
  }

  if (param.type === 'enum') {
    base.options = param.options;
  }

  return base;
}

function serializeFeature(feature: Feature): SerializedFeature {
  const serialized: SerializedFeature = {
    id: feature.id,
    type: feature.type,
    name: feature.name,
    suppressed: feature.suppressed,
    parameters: {},
  };

  // Serialize parameters
  const params = feature.parameters as Record<string, Parameter | undefined>;
  for (const [key, param] of Object.entries(params)) {
    if (param) {
      serialized.parameters[key] = serializeParameter(param);
    }
  }

  // Type-specific data
  if (feature.type === 'sketch' && feature.sketchData) {
    serialized.sketchData = {
      entities: feature.sketchData.entities.map(e => ({
        id: e.id,
        type: e.type,
        data: serializeEntityData(e),
      })),
      constraints: feature.sketchData.constraints.map(c => ({
        id: c.id,
        type: c.type,
        entityRefs: getConstraintEntityRefs(c),
        value: 'value' in c ? c.value : undefined,
      })),
    };
  }

  if (feature.type === 'extrude') {
    serialized.sketchRef = feature.sketchRef;
    if (feature.targetBodyRef) {
      serialized.targetBodyRef = feature.targetBodyRef;
    }
  }

  if (feature.type === 'boolean') {
    serialized.targetBodyRef = feature.targetBodyRef;
    serialized.toolBodyRef = feature.toolBodyRef;
  }

  return serialized;
}

function serializeEntityData(entity: SketchEntity): Record<string, unknown> {
  switch (entity.type) {
    case 'point':
      return { position: entity.position, construction: entity.construction };
    case 'line':
      return { start: entity.start, end: entity.end, construction: entity.construction };
    case 'rectangle':
      return { corner1: entity.corner1, corner2: entity.corner2, construction: entity.construction };
    case 'circle':
      return { center: entity.center, radius: entity.radius, construction: entity.construction };
    case 'arc':
      return {
        center: entity.center,
        radius: entity.radius,
        startAngle: entity.startAngle,
        endAngle: entity.endAngle,
        construction: entity.construction,
      };
  }
}

function getConstraintEntityRefs(constraint: Constraint): string[] {
  if ('entityId' in constraint) {
    return [constraint.entityId];
  }
  if ('entityId1' in constraint && 'entityId2' in constraint) {
    return constraint.entityId2 ? [constraint.entityId1, constraint.entityId2] : [constraint.entityId1];
  }
  return [];
}

export function serializeDocument(doc: Document): SerializedDocument {
  const serialized: SerializedDocument = {
    id: doc.id,
    name: doc.name,
    version: doc.version,
    createdAt: doc.createdAt,
    modifiedAt: new Date().toISOString(),
    features: doc.features.map(serializeFeature),
    globalParameters: {},
  };

  for (const [key, param] of Object.entries(doc.globalParameters)) {
    serialized.globalParameters[key] = serializeParameter(param);
  }

  return serialized;
}

// ============ DESERIALIZATION (JSON -> Document) ============

function deserializeParameter(serialized: SerializedParameter): Parameter {
  switch (serialized.type) {
    case 'number':
      return {
        id: serialized.id,
        name: serialized.name,
        type: 'number',
        value: serialized.value as number,
        min: serialized.min,
        max: serialized.max,
        step: serialized.step,
        unit: serialized.unit,
      };
    case 'string':
      return {
        id: serialized.id,
        name: serialized.name,
        type: 'string',
        value: serialized.value as string,
      };
    case 'boolean':
      return {
        id: serialized.id,
        name: serialized.name,
        type: 'boolean',
        value: serialized.value as boolean,
      };
    case 'enum':
      return {
        id: serialized.id,
        name: serialized.name,
        type: 'enum',
        value: serialized.value as string,
        options: serialized.options || [],
      };
  }
}

function deserializeSketchData(serialized: NonNullable<SerializedFeature['sketchData']>): SketchData {
  const entities: SketchEntity[] = serialized.entities.map(e => {
    const data = e.data;
    switch (e.type) {
      case 'point':
        return {
          id: e.id,
          type: 'point' as const,
          position: data.position as { x: number; y: number },
          construction: data.construction as boolean || false,
        };
      case 'line':
        return {
          id: e.id,
          type: 'line' as const,
          start: data.start as { x: number; y: number },
          end: data.end as { x: number; y: number },
          construction: data.construction as boolean || false,
        };
      case 'rectangle':
        return {
          id: e.id,
          type: 'rectangle' as const,
          corner1: data.corner1 as { x: number; y: number },
          corner2: data.corner2 as { x: number; y: number },
          construction: data.construction as boolean || false,
        };
      case 'circle':
        return {
          id: e.id,
          type: 'circle' as const,
          center: data.center as { x: number; y: number },
          radius: data.radius as number,
          construction: data.construction as boolean || false,
        };
      case 'arc':
        return {
          id: e.id,
          type: 'arc' as const,
          center: data.center as { x: number; y: number },
          radius: data.radius as number,
          startAngle: data.startAngle as number,
          endAngle: data.endAngle as number,
          construction: data.construction as boolean || false,
        };
    }
  });

  const constraints: Constraint[] = serialized.constraints.map(c => {
    // For now, just recreate basic constraints
    if (c.type === 'horizontal' || c.type === 'vertical' || c.type === 'fixed') {
      return {
        id: c.id,
        type: c.type,
        entityId: c.entityRefs[0],
      };
    }
    if (c.type === 'distance' || c.type === 'angle') {
      return {
        id: c.id,
        type: c.type,
        entityId1: c.entityRefs[0],
        entityId2: c.entityRefs[1],
        value: c.value || 0,
      };
    }
    // Binary constraints
    return {
      id: c.id,
      type: c.type as 'coincident' | 'parallel' | 'perpendicular' | 'equal' | 'tangent' | 'concentric',
      entityId1: c.entityRefs[0],
      entityId2: c.entityRefs[1] || c.entityRefs[0],
    };
  });

  return {
    entities,
    constraints,
    profiles: [], // Profiles are regenerated on load
    gridSize: 10,
    snapEnabled: true,
  };
}

function deserializeFeature(serialized: SerializedFeature): Feature {
  const base = {
    id: serialized.id,
    name: serialized.name,
    suppressed: serialized.suppressed,
    _dirty: true, // Mark as dirty to force rebuild
  };

  // Deserialize parameters
  const parameters: Record<string, Parameter> = {};
  for (const [key, param] of Object.entries(serialized.parameters)) {
    parameters[key] = deserializeParameter(param);
  }

  switch (serialized.type) {
    case 'primitive':
      return {
        ...base,
        type: 'primitive' as const,
        parameters,
      } as unknown as Feature;

    case 'sketch':
      return {
        ...base,
        type: 'sketch' as const,
        parameters,
        sketchData: serialized.sketchData ? deserializeSketchData(serialized.sketchData) : undefined,
      } as unknown as Feature;

    case 'extrude':
      return {
        ...base,
        type: 'extrude' as const,
        parameters,
        sketchRef: serialized.sketchRef!,
        targetBodyRef: serialized.targetBodyRef,
      } as unknown as Feature;

    case 'boolean':
      return {
        ...base,
        type: 'boolean' as const,
        parameters,
        targetBodyRef: serialized.targetBodyRef!,
        toolBodyRef: serialized.toolBodyRef!,
      } as unknown as Feature;
  }
}

export function deserializeDocument(json: string | SerializedDocument): Document {
  const serialized = typeof json === 'string' ? JSON.parse(json) as SerializedDocument : json;

  const doc: Document = {
    id: serialized.id,
    name: serialized.name,
    version: serialized.version,
    createdAt: serialized.createdAt,
    modifiedAt: serialized.modifiedAt,
    features: serialized.features.map(deserializeFeature),
    globalParameters: {},
  };

  for (const [key, param] of Object.entries(serialized.globalParameters)) {
    doc.globalParameters[key] = deserializeParameter(param);
  }

  return doc;
}

// ============ FILE I/O ============

export function exportDocumentToJson(doc: Document): string {
  const serialized = serializeDocument(doc);
  return JSON.stringify(serialized, null, 2);
}

export function downloadDocument(doc: Document): void {
  const json = exportDocumentToJson(doc);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${doc.name || 'model'}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function loadDocumentFromFile(file: File): Promise<Document> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const doc = deserializeDocument(json);
        resolve(doc);
      } catch (error) {
        reject(new Error(`Failed to parse document: ${error}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// ============ NEW DOCUMENT ============

export function createNewDocument(name: string = 'Untitled'): Document {
  return {
    id: generateId(),
    name,
    version: DOCUMENT_VERSION,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    features: [],
    globalParameters: {},
  };
}
