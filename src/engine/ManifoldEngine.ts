/**
 * ManifoldEngine - B-rep/CSG kernel wrapper using manifold-3d (WASM)
 *
 * This provides solid modeling operations:
 * - Primitive creation (box, cylinder, sphere)
 * - Boolean operations (union, difference, intersect)
 * - Extrusion from 2D profiles
 * - Tessellation for rendering
 */

import Module from 'manifold-3d';
import type { ManifoldToplevel, Manifold, Mesh, Vec3 } from 'manifold-3d';

export interface TessellatedMesh {
  vertices: Float32Array;  // x, y, z interleaved
  normals: Float32Array;   // nx, ny, nz interleaved
  indices: Uint32Array;
  triCount: number;
  vertCount: number;
}

export interface ExtrudeProfile {
  points: Vec3[];  // 2D points as [x, y, 0]
}

export interface PerformanceMetrics {
  operationName: string;
  durationMs: number;
  inputTriangles?: number;
  outputTriangles?: number;
  memoryUsedMB?: number;
}

class ManifoldEngineClass {
  private wasm: ManifoldToplevel | null = null;
  private initPromise: Promise<void> | null = null;
  private metrics: PerformanceMetrics[] = [];

  /**
   * Initialize the WASM module. Must be called before any operations.
   */
  async initialize(): Promise<void> {
    if (this.wasm) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      console.log('[ManifoldEngine] Initializing WASM module...');
      const start = performance.now();

      this.wasm = await Module();
      // Setup must be called before using the module
      this.wasm.setup();

      const duration = performance.now() - start;
      console.log(`[ManifoldEngine] WASM initialized in ${duration.toFixed(1)}ms`);

      this.recordMetric({
        operationName: 'initialize',
        durationMs: duration,
      });
    })();

    return this.initPromise;
  }

  private ensureInitialized(): ManifoldToplevel {
    if (!this.wasm) {
      throw new Error('ManifoldEngine not initialized. Call initialize() first.');
    }
    return this.wasm;
  }

  private recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    console.log(`[ManifoldEngine] ${metric.operationName}: ${metric.durationMs.toFixed(2)}ms`,
      metric.outputTriangles ? `(${metric.outputTriangles} triangles)` : '');
  }

  // ============ PRIMITIVE CREATION ============

  /**
   * Create a box/cube primitive
   */
  createBox(width: number, height: number, depth: number, center = true): Manifold {
    const wasm = this.ensureInitialized();
    const start = performance.now();

    const box = wasm.Manifold.cube([width, height, depth], center);

    this.recordMetric({
      operationName: 'createBox',
      durationMs: performance.now() - start,
      outputTriangles: box.numTri(),
    });

    return box;
  }

  /**
   * Create a cylinder primitive
   */
  createCylinder(
    height: number,
    radiusLow: number,
    radiusHigh: number = radiusLow,
    circularSegments: number = 32,
    center = true
  ): Manifold {
    const wasm = this.ensureInitialized();
    const start = performance.now();

    const cylinder = wasm.Manifold.cylinder(height, radiusLow, radiusHigh, circularSegments, center);

    this.recordMetric({
      operationName: 'createCylinder',
      durationMs: performance.now() - start,
      outputTriangles: cylinder.numTri(),
    });

    return cylinder;
  }

  /**
   * Create a sphere primitive
   */
  createSphere(radius: number, circularSegments: number = 32): Manifold {
    const wasm = this.ensureInitialized();
    const start = performance.now();

    const sphere = wasm.Manifold.sphere(radius, circularSegments);

    this.recordMetric({
      operationName: 'createSphere',
      durationMs: performance.now() - start,
      outputTriangles: sphere.numTri(),
    });

    return sphere;
  }

  // ============ BOOLEAN OPERATIONS ============

  /**
   * Boolean union (add)
   */
  union(a: Manifold, b: Manifold): Manifold {
    const start = performance.now();
    const inputTris = a.numTri() + b.numTri();

    const result = a.add(b);

    this.recordMetric({
      operationName: 'union',
      durationMs: performance.now() - start,
      inputTriangles: inputTris,
      outputTriangles: result.numTri(),
    });

    return result;
  }

  /**
   * Boolean difference (subtract)
   */
  difference(a: Manifold, b: Manifold): Manifold {
    const start = performance.now();
    const inputTris = a.numTri() + b.numTri();

    const result = a.subtract(b);

    this.recordMetric({
      operationName: 'difference',
      durationMs: performance.now() - start,
      inputTriangles: inputTris,
      outputTriangles: result.numTri(),
    });

    return result;
  }

  /**
   * Boolean intersection
   */
  intersect(a: Manifold, b: Manifold): Manifold {
    const start = performance.now();
    const inputTris = a.numTri() + b.numTri();

    const result = a.intersect(b);

    this.recordMetric({
      operationName: 'intersect',
      durationMs: performance.now() - start,
      inputTriangles: inputTris,
      outputTriangles: result.numTri(),
    });

    return result;
  }

  // ============ TRANSFORMS ============

  /**
   * Translate a manifold
   */
  translate(manifold: Manifold, x: number, y: number, z: number): Manifold {
    return manifold.translate([x, y, z]);
  }

  /**
   * Rotate a manifold (degrees)
   */
  rotate(manifold: Manifold, x: number, y: number, z: number): Manifold {
    return manifold.rotate([x, y, z]);
  }

  /**
   * Scale a manifold
   */
  scale(manifold: Manifold, x: number, y: number = x, z: number = x): Manifold {
    return manifold.scale([x, y, z]);
  }

  // ============ EXTRUSION ============

  /**
   * Extrude a 2D polygon profile along Z axis
   * Points should be in counter-clockwise order for a solid
   */
  extrude(points: [number, number][], height: number, nDivisions: number = 0): Manifold {
    const wasm = this.ensureInitialized();
    const start = performance.now();

    // Create a CrossSection from the 2D points (with default Positive fill rule)
    const crossSection = new wasm.CrossSection([points], 'Positive');

    // Extrude along Z - extrude is a method on CrossSection
    const result = crossSection.extrude(height, nDivisions);

    this.recordMetric({
      operationName: 'extrude',
      durationMs: performance.now() - start,
      outputTriangles: result.numTri(),
    });

    // Clean up cross section
    crossSection.delete();

    return result;
  }

  /**
   * Revolve a 2D polygon profile around Y axis
   */
  revolve(points: [number, number][], circularSegments: number = 32): Manifold {
    const wasm = this.ensureInitialized();
    const start = performance.now();

    const crossSection = new wasm.CrossSection([points], 'Positive');
    // revolve is a method on CrossSection
    const result = crossSection.revolve(circularSegments);

    this.recordMetric({
      operationName: 'revolve',
      durationMs: performance.now() - start,
      outputTriangles: result.numTri(),
    });

    crossSection.delete();

    return result;
  }

  // ============ TESSELLATION ============

  /**
   * Convert a Manifold to a tessellated mesh for rendering
   */
  tessellate(manifold: Manifold): TessellatedMesh {
    const start = performance.now();

    const mesh: Mesh = manifold.getMesh();

    const numVert = mesh.numVert;
    const numTri = mesh.numTri;

    // Get vertex positions
    const vertPos = mesh.vertProperties;
    const triVerts = mesh.triVerts;

    // Create output arrays for indexed mesh
    const indexedVertices = new Float32Array(numVert * 3);
    const indexedNormals = new Float32Array(numVert * 3);

    // Copy vertices (manifold stores them with numProp properties per vertex, first 3 are position)
    const numProp = mesh.numProp;
    for (let i = 0; i < numVert; i++) {
      indexedVertices[i * 3] = vertPos[i * numProp];
      indexedVertices[i * 3 + 1] = vertPos[i * numProp + 1];
      indexedVertices[i * 3 + 2] = vertPos[i * numProp + 2];
    }

    // Copy indices and compute face normals
    const indexArray = new Uint32Array(numTri * 3);
    for (let i = 0; i < numTri * 3; i++) {
      indexArray[i] = triVerts[i];
    }

    // Compute vertex normals by averaging face normals
    const normalCounts = new Uint32Array(numVert);

    for (let t = 0; t < numTri; t++) {
      const i0 = triVerts[t * 3];
      const i1 = triVerts[t * 3 + 1];
      const i2 = triVerts[t * 3 + 2];

      // Get vertices
      const v0x = indexedVertices[i0 * 3];
      const v0y = indexedVertices[i0 * 3 + 1];
      const v0z = indexedVertices[i0 * 3 + 2];
      const v1x = indexedVertices[i1 * 3];
      const v1y = indexedVertices[i1 * 3 + 1];
      const v1z = indexedVertices[i1 * 3 + 2];
      const v2x = indexedVertices[i2 * 3];
      const v2y = indexedVertices[i2 * 3 + 1];
      const v2z = indexedVertices[i2 * 3 + 2];

      // Compute face normal (cross product of edges)
      const e1x = v1x - v0x, e1y = v1y - v0y, e1z = v1z - v0z;
      const e2x = v2x - v0x, e2y = v2y - v0y, e2z = v2z - v0z;

      let nx = e1y * e2z - e1z * e2y;
      let ny = e1z * e2x - e1x * e2z;
      let nz = e1x * e2y - e1y * e2x;

      // Normalize
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (len > 0) {
        nx /= len;
        ny /= len;
        nz /= len;
      }

      // Accumulate normals to vertices
      indexedNormals[i0 * 3] += nx;
      indexedNormals[i0 * 3 + 1] += ny;
      indexedNormals[i0 * 3 + 2] += nz;
      normalCounts[i0]++;

      indexedNormals[i1 * 3] += nx;
      indexedNormals[i1 * 3 + 1] += ny;
      indexedNormals[i1 * 3 + 2] += nz;
      normalCounts[i1]++;

      indexedNormals[i2 * 3] += nx;
      indexedNormals[i2 * 3 + 1] += ny;
      indexedNormals[i2 * 3 + 2] += nz;
      normalCounts[i2]++;
    }

    // Normalize accumulated normals
    for (let i = 0; i < numVert; i++) {
      if (normalCounts[i] > 0) {
        let nx = indexedNormals[i * 3];
        let ny = indexedNormals[i * 3 + 1];
        let nz = indexedNormals[i * 3 + 2];
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        if (len > 0) {
          indexedNormals[i * 3] = nx / len;
          indexedNormals[i * 3 + 1] = ny / len;
          indexedNormals[i * 3 + 2] = nz / len;
        }
      }
    }

    this.recordMetric({
      operationName: 'tessellate',
      durationMs: performance.now() - start,
      outputTriangles: numTri,
    });

    return {
      vertices: indexedVertices,
      normals: indexedNormals,
      indices: indexArray,
      triCount: numTri,
      vertCount: numVert,
    };
  }

  // ============ UTILITIES ============

  /**
   * Delete a manifold to free memory
   */
  delete(manifold: Manifold): void {
    manifold.delete();
  }

  /**
   * Get all recorded performance metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Clear recorded metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Check if a manifold is valid (watertight, non-self-intersecting)
   */
  isValid(manifold: Manifold): boolean {
    // status() returns ManifoldError enum - 'NoError' means valid
    const status = manifold.status();
    return status === 'NoError' || status === (0 as unknown as string);
  }

  /**
   * Get mesh statistics
   */
  getStats(manifold: Manifold): { triangles: number; volume: number; surfaceArea: number } {
    return {
      triangles: manifold.numTri(),
      volume: manifold.volume(),
      surfaceArea: manifold.surfaceArea(),
    };
  }
}

// Export singleton instance
export const ManifoldEngine = new ManifoldEngineClass();
