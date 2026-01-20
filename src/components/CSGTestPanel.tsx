import { useState, useCallback } from 'react';
import * as THREE from 'three';
import { ManifoldEngine, type TessellatedMesh, type PerformanceMetrics } from '../engine/ManifoldEngine';
import type { Manifold } from 'manifold-3d';
import { ViewportManager } from '../viewport/ViewportManager';
import './CSGTestPanel.css';

interface TestResult {
  name: string;
  success: boolean;
  metrics: PerformanceMetrics[];
  triangles?: number;
  error?: string;
}

// Convert TessellatedMesh to Three.js BufferGeometry
function tessellatedMeshToThreeGeometry(mesh: TessellatedMesh): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute('position', new THREE.BufferAttribute(mesh.vertices, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(mesh.normals, 3));
  geometry.setIndex(new THREE.BufferAttribute(mesh.indices, 1));

  return geometry;
}

// Get viewport from window
function getViewport(): ViewportManager | null {
  return (window as unknown as { viewport: ViewportManager }).viewport || null;
}

// Counter for unique mesh IDs
let meshCounter = 0;

export function CSGTestPanel() {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [activeMeshId, setActiveMeshId] = useState<string | null>(null);

  // Initialize the engine
  const handleInitialize = useCallback(async () => {
    setLoading(true);
    try {
      await ManifoldEngine.initialize();
      setInitialized(true);
      setResults([{
        name: 'Initialize WASM',
        success: true,
        metrics: ManifoldEngine.getMetrics(),
      }]);
    } catch (error) {
      setResults([{
        name: 'Initialize WASM',
        success: false,
        metrics: [],
        error: String(error),
      }]);
    }
    setLoading(false);
  }, []);

  // Helper to render a manifold
  const renderManifold = useCallback((manifold: Manifold, color: number = 0x4a9eff): string => {
    const viewport = getViewport();
    if (!viewport) return '';

    // Remove previous mesh
    if (activeMeshId) {
      viewport.removeMesh(activeMeshId);
    }

    // Tessellate and create Three.js geometry
    const tessellated = ManifoldEngine.tessellate(manifold);
    const geometry = tessellatedMeshToThreeGeometry(tessellated);

    const material = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.1,
      roughness: 0.5,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Center on grid
    mesh.position.set(0, 0, 0);

    const id = `csg-test-${++meshCounter}`;
    viewport.addMesh(id, mesh);
    setActiveMeshId(id);

    return id;
  }, [activeMeshId]);

  // Test: Primitives
  const testPrimitives = useCallback(async () => {
    ManifoldEngine.clearMetrics();
    setLoading(true);

    try {
      // Create a box
      const box = ManifoldEngine.createBox(2, 1, 1.5);
      const stats = ManifoldEngine.getStats(box);

      renderManifold(box, 0x4a9eff);

      setResults(prev => [...prev, {
        name: 'Create Box (2x1x1.5)',
        success: true,
        metrics: ManifoldEngine.getMetrics(),
        triangles: stats.triangles,
      }]);

      ManifoldEngine.delete(box);
    } catch (error) {
      setResults(prev => [...prev, {
        name: 'Create Box',
        success: false,
        metrics: [],
        error: String(error),
      }]);
    }

    setLoading(false);
  }, [renderManifold]);

  // Test: Boolean Union
  const testUnion = useCallback(async () => {
    ManifoldEngine.clearMetrics();
    setLoading(true);

    try {
      const box = ManifoldEngine.createBox(2, 2, 2);
      const sphere = ManifoldEngine.createSphere(1.3, 48);
      const result = ManifoldEngine.union(box, sphere);

      const stats = ManifoldEngine.getStats(result);
      renderManifold(result, 0x51cf66);

      setResults(prev => [...prev, {
        name: 'Boolean Union (Box + Sphere)',
        success: true,
        metrics: ManifoldEngine.getMetrics(),
        triangles: stats.triangles,
      }]);

      ManifoldEngine.delete(box);
      ManifoldEngine.delete(sphere);
      ManifoldEngine.delete(result);
    } catch (error) {
      setResults(prev => [...prev, {
        name: 'Boolean Union',
        success: false,
        metrics: [],
        error: String(error),
      }]);
    }

    setLoading(false);
  }, [renderManifold]);

  // Test: Boolean Difference
  const testDifference = useCallback(async () => {
    ManifoldEngine.clearMetrics();
    setLoading(true);

    try {
      const box = ManifoldEngine.createBox(2, 2, 2);
      const sphere = ManifoldEngine.createSphere(1.3, 48);
      const result = ManifoldEngine.difference(box, sphere);

      const stats = ManifoldEngine.getStats(result);
      renderManifold(result, 0xff6b6b);

      setResults(prev => [...prev, {
        name: 'Boolean Difference (Box - Sphere)',
        success: true,
        metrics: ManifoldEngine.getMetrics(),
        triangles: stats.triangles,
      }]);

      ManifoldEngine.delete(box);
      ManifoldEngine.delete(sphere);
      ManifoldEngine.delete(result);
    } catch (error) {
      setResults(prev => [...prev, {
        name: 'Boolean Difference',
        success: false,
        metrics: [],
        error: String(error),
      }]);
    }

    setLoading(false);
  }, [renderManifold]);

  // Test: Boolean Intersection
  const testIntersection = useCallback(async () => {
    ManifoldEngine.clearMetrics();
    setLoading(true);

    try {
      const box = ManifoldEngine.createBox(2, 2, 2);
      const sphere = ManifoldEngine.createSphere(1.3, 48);
      const result = ManifoldEngine.intersect(box, sphere);

      const stats = ManifoldEngine.getStats(result);
      renderManifold(result, 0xffd43b);

      setResults(prev => [...prev, {
        name: 'Boolean Intersection (Box ∩ Sphere)',
        success: true,
        metrics: ManifoldEngine.getMetrics(),
        triangles: stats.triangles,
      }]);

      ManifoldEngine.delete(box);
      ManifoldEngine.delete(sphere);
      ManifoldEngine.delete(result);
    } catch (error) {
      setResults(prev => [...prev, {
        name: 'Boolean Intersection',
        success: false,
        metrics: [],
        error: String(error),
      }]);
    }

    setLoading(false);
  }, [renderManifold]);

  // Test: Extrusion
  const testExtrude = useCallback(async () => {
    ManifoldEngine.clearMetrics();
    setLoading(true);

    try {
      // Create an L-shaped profile
      const profile: [number, number][] = [
        [0, 0],
        [2, 0],
        [2, 0.5],
        [0.5, 0.5],
        [0.5, 2],
        [0, 2],
      ];

      const extruded = ManifoldEngine.extrude(profile, 1.5);
      // Translate to center
      const centered = ManifoldEngine.translate(extruded, -1, -1, -0.75);

      const stats = ManifoldEngine.getStats(centered);
      renderManifold(centered, 0xbe4bdb);

      setResults(prev => [...prev, {
        name: 'Extrude L-Profile (height=1.5)',
        success: true,
        metrics: ManifoldEngine.getMetrics(),
        triangles: stats.triangles,
      }]);

      ManifoldEngine.delete(extruded);
      ManifoldEngine.delete(centered);
    } catch (error) {
      setResults(prev => [...prev, {
        name: 'Extrude Profile',
        success: false,
        metrics: [],
        error: String(error),
      }]);
    }

    setLoading(false);
  }, [renderManifold]);

  // Test: Complex chain (simulating a simple CAD workflow)
  const testComplexChain = useCallback(async () => {
    ManifoldEngine.clearMetrics();
    setLoading(true);

    try {
      // Create a bracket-like shape:
      // 1. Start with an L-profile extrusion
      // 2. Subtract a cylinder (hole)
      // 3. Add mounting bosses

      const profile: [number, number][] = [
        [0, 0],
        [3, 0],
        [3, 0.5],
        [0.5, 0.5],
        [0.5, 2],
        [0, 2],
      ];

      const base = ManifoldEngine.extrude(profile, 1);

      // Create hole cylinder
      let hole = ManifoldEngine.createCylinder(2, 0.3, 0.3, 32);
      hole = ManifoldEngine.rotate(hole, 90, 0, 0);
      hole = ManifoldEngine.translate(hole, 2, 0.25, 0.5);

      // Subtract hole
      let result = ManifoldEngine.difference(base, hole);

      // Add mounting boss
      let boss = ManifoldEngine.createCylinder(0.3, 0.4, 0.4, 32);
      boss = ManifoldEngine.translate(boss, 0.25, 1.5, 1.15);
      result = ManifoldEngine.union(result, boss);

      // Center the result
      result = ManifoldEngine.translate(result, -1.5, -1, -0.5);

      const stats = ManifoldEngine.getStats(result);
      renderManifold(result, 0x4a9eff);

      setResults(prev => [...prev, {
        name: 'Complex Chain (Extrude → Hole → Boss)',
        success: true,
        metrics: ManifoldEngine.getMetrics(),
        triangles: stats.triangles,
      }]);

      // Cleanup
      ManifoldEngine.delete(base);
      ManifoldEngine.delete(hole);
      ManifoldEngine.delete(boss);
      ManifoldEngine.delete(result);
    } catch (error) {
      setResults(prev => [...prev, {
        name: 'Complex Chain',
        success: false,
        metrics: [],
        error: String(error),
      }]);
    }

    setLoading(false);
  }, [renderManifold]);

  // Clear results and mesh
  const clearAll = useCallback(() => {
    const viewport = getViewport();
    if (viewport && activeMeshId) {
      viewport.removeMesh(activeMeshId);
      setActiveMeshId(null);
    }
    setResults([]);
    ManifoldEngine.clearMetrics();
  }, [activeMeshId]);

  return (
    <div className="csg-test-panel">
      <h3>CSG Engine Spike (0.3)</h3>

      {!initialized ? (
        <button
          className="init-button"
          onClick={handleInitialize}
          disabled={loading}
        >
          {loading ? 'Loading WASM...' : 'Initialize Manifold Engine'}
        </button>
      ) : (
        <>
          <div className="test-buttons">
            <button onClick={testPrimitives} disabled={loading}>
              Primitives
            </button>
            <button onClick={testUnion} disabled={loading}>
              Union
            </button>
            <button onClick={testDifference} disabled={loading}>
              Difference
            </button>
            <button onClick={testIntersection} disabled={loading}>
              Intersect
            </button>
            <button onClick={testExtrude} disabled={loading}>
              Extrude
            </button>
            <button onClick={testComplexChain} disabled={loading}>
              Complex Chain
            </button>
          </div>

          <button className="clear-button" onClick={clearAll}>
            Clear All
          </button>
        </>
      )}

      {results.length > 0 && (
        <div className="results">
          <h4>Results</h4>
          {results.map((result, i) => (
            <div
              key={i}
              className={`result ${result.success ? 'success' : 'error'}`}
            >
              <div className="result-header">
                <span className="result-name">{result.name}</span>
                <span className={`result-status ${result.success ? 'success' : 'error'}`}>
                  {result.success ? '✓' : '✗'}
                </span>
              </div>
              {result.triangles !== undefined && (
                <div className="result-stat">Triangles: {result.triangles}</div>
              )}
              {result.metrics.map((m, j) => (
                <div key={j} className="result-metric">
                  {m.operationName}: {m.durationMs.toFixed(2)}ms
                  {m.outputTriangles ? ` (${m.outputTriangles} tris)` : ''}
                </div>
              ))}
              {result.error && (
                <div className="result-error">{result.error}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
