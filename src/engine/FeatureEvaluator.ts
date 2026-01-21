/**
 * FeatureEvaluator - Rebuild engine with caching
 *
 * Evaluates features in order, skipping suppressed ones,
 * using cached results for non-dirty features.
 */

import type { Manifold } from 'manifold-3d';
import type {
  Feature,
  PrimitiveFeature,
  SketchFeature,
  ExtrudeFeature,
  BooleanFeature,
  CachedBody,
} from '../types/features';
import { ManifoldEngine } from './ManifoldEngine';
import { generateBodyId } from '../utils/idGenerator';

// ============ TYPES ============

export interface EvaluationContext {
  features: Feature[];
  bodies: Map<string, CachedBody>;
  featureResults: Map<string, CachedBody[]>;
  errors: Map<string, string>;
}

export interface RebuildResult {
  success: boolean;
  bodies: Map<string, CachedBody>;
  errors: Map<string, string>;
  duration: number;
}

// ============ FEATURE EVALUATOR ============

class FeatureEvaluatorClass {
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Rebuild all dirty features with debouncing
   */
  rebuildDebounced(
    features: Feature[],
    onComplete: (result: RebuildResult) => void,
    debounceMs: number = 150
  ): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(async () => {
      const result = await this.rebuild(features);
      onComplete(result);
    }, debounceMs);
  }

  /**
   * Rebuild all features, using cache for non-dirty ones
   */
  async rebuild(features: Feature[]): Promise<RebuildResult> {
    const start = performance.now();

    // Ensure ManifoldEngine is initialized
    await ManifoldEngine.initialize();

    const context: EvaluationContext = {
      features,
      bodies: new Map(),
      featureResults: new Map(),
      errors: new Map(),
    };

    // Evaluate features in order
    for (const feature of features) {
      if (feature.suppressed) {
        continue;
      }

      // Use cache if available and not dirty
      if (!feature._dirty && feature._cachedResult) {
        for (const body of feature._cachedResult.bodies) {
          context.bodies.set(body.bodyId, body);
        }
        context.featureResults.set(feature.id, feature._cachedResult.bodies);
        continue;
      }

      // Evaluate the feature
      try {
        const bodies = await this.evaluateFeature(feature, context);
        context.featureResults.set(feature.id, bodies);
        for (const body of bodies) {
          context.bodies.set(body.bodyId, body);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        context.errors.set(feature.id, message);
        console.error(`[FeatureEvaluator] Error evaluating ${feature.name}:`, error);
      }
    }

    const duration = performance.now() - start;
    console.log(`[FeatureEvaluator] Rebuild complete in ${duration.toFixed(1)}ms`);

    return {
      success: context.errors.size === 0,
      bodies: context.bodies,
      errors: context.errors,
      duration,
    };
  }

  /**
   * Evaluate a single feature
   */
  private async evaluateFeature(
    feature: Feature,
    context: EvaluationContext
  ): Promise<CachedBody[]> {
    switch (feature.type) {
      case 'primitive':
        return this.evalPrimitive(feature);
      case 'sketch':
        return this.evalSketch(feature);
      case 'extrude':
        return this.evalExtrude(feature, context);
      case 'boolean':
        return this.evalBoolean(feature, context);
      default:
        throw new Error(`Unknown feature type: ${(feature as Feature).type}`);
    }
  }

  /**
   * Evaluate primitive feature (box, cylinder, sphere)
   */
  private evalPrimitive(feature: PrimitiveFeature): CachedBody[] {
    const params = feature.parameters;
    const shape = params.shape.value;

    let manifold: Manifold;

    switch (shape) {
      case 'box': {
        const width = params.width?.value ?? 50;
        const height = params.height?.value ?? 50;
        const depth = params.depth?.value ?? 50;
        manifold = ManifoldEngine.createBox(width, height, depth);
        break;
      }
      case 'cylinder': {
        const radius = params.radius?.value ?? 25;
        const radiusTop = params.radiusTop?.value ?? radius;
        const height = params.cylinderHeight?.value ?? 50;
        manifold = ManifoldEngine.createCylinder(height, radius, radiusTop);
        break;
      }
      case 'sphere': {
        const radius = params.sphereRadius?.value ?? 25;
        manifold = ManifoldEngine.createSphere(radius);
        break;
      }
      default:
        throw new Error(`Unknown primitive shape: ${shape}`);
    }

    // Apply position offset
    const x = params.positionX.value;
    const y = params.positionY.value;
    const z = params.positionZ.value;
    if (x !== 0 || y !== 0 || z !== 0) {
      manifold = ManifoldEngine.translate(manifold, x, y, z);
    }

    return [{
      manifold,
      bodyId: generateBodyId(),
      originFeatureId: feature.id,
    }];
  }

  /**
   * Evaluate sketch feature - sketches don't produce bodies directly
   */
  private evalSketch(_feature: SketchFeature): CachedBody[] {
    // Sketches don't create bodies - they create profiles for extrusion
    // The profiles are stored in feature.sketchData.profiles
    return [];
  }

  /**
   * Evaluate extrude feature
   */
  private evalExtrude(feature: ExtrudeFeature, context: EvaluationContext): CachedBody[] {
    const params = feature.parameters;
    const distance = params.distance.value;
    const direction = params.direction.value;
    const mode = params.mode.value;

    // Get the sketch profiles
    const sketchFeatureId = feature.sketchRef.featureId;
    const sketchFeature = this.findFeatureInContext(sketchFeatureId, context);

    if (!sketchFeature || sketchFeature.type !== 'sketch') {
      throw new Error(`Extrude: Cannot find referenced sketch ${sketchFeatureId}`);
    }

    const profiles = (sketchFeature as SketchFeature).sketchData?.profiles;
    if (!profiles || profiles.length === 0) {
      throw new Error('Extrude: No profiles found in sketch');
    }

    // Extrude each profile
    const results: CachedBody[] = [];

    for (const profile of profiles) {
      // Convert profile to 2D points
      const points = profile.outerLoop.map(p => [p.x, p.y] as [number, number]);

      // Calculate height based on direction
      let height = distance;
      let offset = 0;

      if (direction === 'reverse') {
        height = -distance;
      } else if (direction === 'symmetric') {
        height = distance;
        offset = -distance / 2;
      }

      // Create the extruded solid
      let manifold = ManifoldEngine.extrude(points, Math.abs(height));

      // Apply direction offset
      if (direction === 'reverse') {
        manifold = ManifoldEngine.translate(manifold, 0, 0, -distance);
      } else if (direction === 'symmetric') {
        manifold = ManifoldEngine.translate(manifold, 0, 0, offset);
      }

      // Apply sketch plane transformation
      const sketchParams = (sketchFeature as SketchFeature).parameters;
      const plane = sketchParams.plane.value;
      const planeOffset = sketchParams.planeOffset.value;

      manifold = this.transformToPlane(manifold, plane, planeOffset);

      // Handle modes
      if (mode === 'new') {
        results.push({
          manifold,
          bodyId: generateBodyId(),
          originFeatureId: feature.id,
        });
      } else if (mode === 'join' && feature.targetBodyRef) {
        const targetBody = context.bodies.get(this.findBodyIdForFeature(feature.targetBodyRef.featureId, context));
        if (targetBody) {
          const joined = ManifoldEngine.union(targetBody.manifold, manifold);
          // Remove old body and add new one
          context.bodies.delete(targetBody.bodyId);
          results.push({
            manifold: joined,
            bodyId: targetBody.bodyId,
            originFeatureId: feature.id,
          });
        } else {
          // No target body, create as new
          results.push({
            manifold,
            bodyId: generateBodyId(),
            originFeatureId: feature.id,
          });
        }
      } else if (mode === 'cut' && feature.targetBodyRef) {
        const targetBody = context.bodies.get(this.findBodyIdForFeature(feature.targetBodyRef.featureId, context));
        if (targetBody) {
          const cut = ManifoldEngine.difference(targetBody.manifold, manifold);
          // Remove old body and add new one
          context.bodies.delete(targetBody.bodyId);
          results.push({
            manifold: cut,
            bodyId: targetBody.bodyId,
            originFeatureId: feature.id,
          });
        }
      } else {
        // Default to new body
        results.push({
          manifold,
          bodyId: generateBodyId(),
          originFeatureId: feature.id,
        });
      }
    }

    return results;
  }

  /**
   * Evaluate boolean feature
   */
  private evalBoolean(feature: BooleanFeature, context: EvaluationContext): CachedBody[] {
    const params = feature.parameters;
    const operation = params.operation.value;

    // Get target and tool bodies
    const targetBodyId = this.findBodyIdForFeature(feature.targetBodyRef.featureId, context);
    const toolBodyId = this.findBodyIdForFeature(feature.toolBodyRef.featureId, context);

    const targetBody = context.bodies.get(targetBodyId);
    const toolBody = context.bodies.get(toolBodyId);

    if (!targetBody) {
      throw new Error(`Boolean: Cannot find target body from feature ${feature.targetBodyRef.featureId}`);
    }
    if (!toolBody) {
      throw new Error(`Boolean: Cannot find tool body from feature ${feature.toolBodyRef.featureId}`);
    }

    let result: Manifold;

    switch (operation) {
      case 'union':
        result = ManifoldEngine.union(targetBody.manifold, toolBody.manifold);
        break;
      case 'difference':
        result = ManifoldEngine.difference(targetBody.manifold, toolBody.manifold);
        break;
      case 'intersect':
        result = ManifoldEngine.intersect(targetBody.manifold, toolBody.manifold);
        break;
      default:
        throw new Error(`Unknown boolean operation: ${operation}`);
    }

    // Remove both original bodies
    context.bodies.delete(targetBodyId);
    context.bodies.delete(toolBodyId);

    return [{
      manifold: result,
      bodyId: generateBodyId(),
      originFeatureId: feature.id,
    }];
  }

  /**
   * Transform manifold from XY plane to target plane
   */
  private transformToPlane(manifold: Manifold, plane: string, offset: number): Manifold {
    let transformed = manifold;

    switch (plane) {
      case 'XY':
        // Default plane, just apply Z offset
        if (offset !== 0) {
          transformed = ManifoldEngine.translate(transformed, 0, 0, offset);
        }
        break;
      case 'XZ':
        // Rotate -90 around X, then offset in Y
        transformed = ManifoldEngine.rotate(transformed, -90, 0, 0);
        if (offset !== 0) {
          transformed = ManifoldEngine.translate(transformed, 0, offset, 0);
        }
        break;
      case 'YZ':
        // Rotate 90 around Y, then offset in X
        transformed = ManifoldEngine.rotate(transformed, 0, 90, 0);
        if (offset !== 0) {
          transformed = ManifoldEngine.translate(transformed, offset, 0, 0);
        }
        break;
    }

    return transformed;
  }

  /**
   * Find the body ID for a feature
   */
  private findBodyIdForFeature(featureId: string, context: EvaluationContext): string {
    const bodies = context.featureResults.get(featureId);
    if (bodies && bodies.length > 0) {
      return bodies[0].bodyId;
    }
    // Fallback: search all bodies
    for (const [bodyId, body] of context.bodies) {
      if (body.originFeatureId === featureId) {
        return bodyId;
      }
    }
    return '';
  }

  /**
   * Find a feature by ID in the context
   */
  private findFeatureInContext(featureId: string, context: EvaluationContext): Feature | null {
    return context.features.find(f => f.id === featureId) || null;
  }
}

// Export singleton
export const FeatureEvaluator = new FeatureEvaluatorClass();

// ============ REBUILD HELPER FUNCTIONS ============

/**
 * Perform a full rebuild and update the viewport
 */
export async function rebuildAndUpdateViewport(
  features: Feature[],
  onBodiesUpdated: (bodies: Map<string, CachedBody>) => void,
  onError?: (errors: Map<string, string>) => void
): Promise<RebuildResult> {
  const result = await FeatureEvaluator.rebuild(features);

  if (result.success) {
    onBodiesUpdated(result.bodies);
  } else if (onError) {
    onError(result.errors);
  }

  return result;
}
