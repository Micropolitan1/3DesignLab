/**
 * 3DDesignLab - Main Application
 *
 * Parametric CAD system with Fusion 360-style UI:
 * - Top toolbar with tool categories
 * - Left browser panel (document tree)
 * - Center viewport with ViewCube
 * - Bottom horizontal timeline
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import { Viewport } from './components/Viewport';
import { Toolbar } from './components/toolbar/Toolbar';
import { BrowserPanel } from './components/browser/BrowserPanel';
import { HorizontalTimeline } from './components/timeline/HorizontalTimeline';
import { ParameterPanel } from './components/parameters/ParameterPanel';
import { ResizablePanel } from './components/common/ResizablePanel';
import { ViewCube } from './components/viewport/ViewCube';
import { NavigationBar } from './components/viewport/NavigationBar';
import { SketchOverlay } from './components/sketch/SketchOverlay';
import { ExtrudeDialog } from './components/dialogs/ExtrudeDialog';
import { BooleanDialog } from './components/dialogs/BooleanDialog';
import { ViewportManager } from './viewport/ViewportManager';
import { ManifoldEngine } from './engine/ManifoldEngine';
import { FeatureEvaluator } from './engine/FeatureEvaluator';
import { useDocumentStore } from './store/documentStore';
import type { CachedBody, SketchFeature } from './types/features';
import type { SketchData, SketchPlane } from './types/sketch';
import './App.css';

function App() {
  const initialized = useRef(false);
  const rebuildTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sketch mode state
  const [sketchModeFeatureId, setSketchModeFeatureId] = useState<string | null>(null);
  const [sketchPlane, setSketchPlane] = useState<SketchPlane | null>(null);
  const [initialSketchData, setInitialSketchData] = useState<SketchData | undefined>(undefined);

  // Dialog state
  const [showExtrudeDialog, setShowExtrudeDialog] = useState(false);
  const [showBooleanDialog, setShowBooleanDialog] = useState(false);
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);

  const document = useDocumentStore(state => state.document);
  const setRebuilding = useDocumentStore(state => state.setRebuilding);
  const setRebuildError = useDocumentStore(state => state.setRebuildError);
  const updateBodies = useDocumentStore(state => state.updateBodies);
  const setCachedResult = useDocumentStore(state => state.setCachedResult);
  const updateFeature = useDocumentStore(state => state.updateFeature);
  const getFeature = useDocumentStore(state => state.getFeature);

  // Rebuild function
  const performRebuild = useCallback(async () => {
    const viewport = (window as unknown as { viewport: ViewportManager }).viewport;
    if (!viewport) return;

    setRebuilding(true);
    setRebuildError(null);

    try {
      const result = await FeatureEvaluator.rebuild(document.features);

      // Remove all old CAD body meshes
      const scene = viewport.getScene();
      const toRemove: THREE.Object3D[] = [];
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.userData.isCADBody) {
          toRemove.push(obj);
        }
      });
      toRemove.forEach(obj => {
        viewport.removeMesh(obj.userData.bodyId || '');
        scene.remove(obj);
      });

      // Add new meshes for each body
      result.bodies.forEach((body, bodyId) => {
        const tessellated = ManifoldEngine.tessellate(body.manifold);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(tessellated.vertices, 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(tessellated.normals, 3));
        geometry.setIndex(new THREE.BufferAttribute(tessellated.indices, 1));

        const material = new THREE.MeshStandardMaterial({
          color: 0x4a90d9,
          metalness: 0.1,
          roughness: 0.5,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.isCADBody = true;
        mesh.userData.bodyId = bodyId;

        viewport.addMesh(bodyId, mesh);
      });

      // Update cached results for each feature
      for (const feature of document.features) {
        if (feature.suppressed) continue;

        const featureBodies: CachedBody[] = [];
        result.bodies.forEach((body) => {
          if (body.originFeatureId === feature.id) {
            featureBodies.push(body);
          }
        });

        if (featureBodies.length > 0) {
          setCachedResult(feature.id, featureBodies);
        }
      }

      updateBodies(result.bodies);

      if (!result.success) {
        const errorMessages = Array.from(result.errors.values()).join(', ');
        setRebuildError(errorMessages);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setRebuildError(message);
      console.error('[App] Rebuild error:', error);
    } finally {
      setRebuilding(false);
    }
  }, [document.features, setRebuilding, setRebuildError, updateBodies, setCachedResult]);

  // Debounced rebuild on feature changes
  useEffect(() => {
    // Don't rebuild in sketch mode
    if (sketchModeFeatureId) return;

    // Check if any features are dirty
    const hasDirty = document.features.some(f => f._dirty && !f.suppressed);
    if (!hasDirty) return;

    // Debounce rebuild
    if (rebuildTimeout.current) {
      clearTimeout(rebuildTimeout.current);
    }

    rebuildTimeout.current = setTimeout(() => {
      performRebuild();
    }, 150);

    return () => {
      if (rebuildTimeout.current) {
        clearTimeout(rebuildTimeout.current);
      }
    };
  }, [document.features, performRebuild, sketchModeFeatureId]);

  // Initialize ManifoldEngine
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    ManifoldEngine.initialize().then(() => {
      console.log('[App] ManifoldEngine initialized');
    }).catch((error) => {
      console.error('[App] Failed to initialize ManifoldEngine:', error);
    });
  }, []);

  // Enter sketch mode for a feature
  const enterSketchMode = useCallback((featureId: string) => {
    const feature = getFeature(featureId);
    if (!feature || feature.type !== 'sketch') return;

    const sketchFeature = feature as SketchFeature;
    const planeType = sketchFeature.parameters.plane.value as 'XY' | 'XZ' | 'YZ';
    const offset = sketchFeature.parameters.planeOffset.value;

    // Create plane definition
    const plane: SketchPlane = {
      type: planeType,
      origin: { x: 0, y: 0, z: 0 },
      normal: planeType === 'XY' ? { x: 0, y: 0, z: 1 } :
              planeType === 'XZ' ? { x: 0, y: 1, z: 0 } :
              { x: 1, y: 0, z: 0 },
      xAxis: planeType === 'XY' ? { x: 1, y: 0, z: 0 } :
             planeType === 'XZ' ? { x: 1, y: 0, z: 0 } :
             { x: 0, y: 0, z: -1 },
      yAxis: planeType === 'XY' ? { x: 0, y: 1, z: 0 } :
             planeType === 'XZ' ? { x: 0, y: 0, z: -1 } :
             { x: 0, y: 1, z: 0 },
      offset,
    };

    // Get existing sketch data if any
    setInitialSketchData(sketchFeature.sketchData);
    setSketchPlane(plane);
    setSketchModeFeatureId(featureId);
  }, [getFeature]);

  // Handle edit feature - opens appropriate dialog based on feature type
  const handleEditFeature = useCallback((featureId: string) => {
    const feature = document.features.find(f => f.id === featureId);
    if (!feature) return;

    setEditingFeatureId(featureId);

    switch (feature.type) {
      case 'sketch':
        enterSketchMode(featureId);
        break;
      case 'extrude':
        setShowExtrudeDialog(true);
        break;
      case 'boolean':
        setShowBooleanDialog(true);
        break;
      case 'primitive':
        // TODO: Add primitive edit dialog
        console.log('Edit primitive:', featureId);
        break;
    }
  }, [document.features, enterSketchMode]);

  // Handle start sketch (new sketch)
  const handleStartSketch = useCallback(() => {
    // Find the most recently added sketch
    const sketches = document.features.filter(f => f.type === 'sketch');
    if (sketches.length > 0) {
      const lastSketch = sketches[sketches.length - 1];
      enterSketchMode(lastSketch.id);
    }
  }, [document.features, enterSketchMode]);

  // Handle finish sketch
  const handleFinishSketch = useCallback((data: SketchData | null) => {
    if (sketchModeFeatureId && data) {
      updateFeature(sketchModeFeatureId, { sketchData: data } as Partial<SketchFeature>);
    }
    setSketchModeFeatureId(null);
    setSketchPlane(null);
    setInitialSketchData(undefined);
  }, [sketchModeFeatureId, updateFeature]);

  // Handle cancel sketch
  const handleCancelSketch = useCallback(() => {
    setSketchModeFeatureId(null);
    setSketchPlane(null);
    setInitialSketchData(undefined);
  }, []);

  // Handle finish sketch and open Extrude dialog (E key shortcut)
  const handleFinishAndExtrude = useCallback(() => {
    // Open the Extrude dialog after sketch finishes
    setShowExtrudeDialog(true);
  }, []);

  return (
    <div className="app">
      {/* Top Toolbar */}
      <Toolbar
        onStartSketch={handleStartSketch}
        onOpenExtrudeDialog={() => setShowExtrudeDialog(true)}
        onOpenBooleanDialog={() => setShowBooleanDialog(true)}
      />

      {/* Main content area */}
      <div className="main-content">
        {/* Left Browser Panel - Resizable */}
        <ResizablePanel
          side="left"
          defaultWidth={240}
          minWidth={160}
          maxWidth={400}
        >
          <BrowserPanel onEditFeature={handleEditFeature} />
        </ResizablePanel>

        {/* Center viewport area */}
        <div className="center-area">
          <div className={`viewport-container ${sketchModeFeatureId ? 'sketch-mode' : ''}`}>
            <Viewport />
            <ViewCube />
            {/* Hide NavigationBar in sketch mode - SketchOverlay has its own status bar */}
            {!sketchModeFeatureId && <NavigationBar />}
            {sketchModeFeatureId && sketchPlane && (
              <SketchOverlay
                featureId={sketchModeFeatureId}
                plane={sketchPlane}
                initialSketchData={initialSketchData}
                onFinish={handleFinishSketch}
                onCancel={handleCancelSketch}
                onFinishAndExtrude={handleFinishAndExtrude}
              />
            )}
          </div>

          {/* Bottom Timeline */}
          <HorizontalTimeline onEditFeature={handleEditFeature} />
        </div>

        {/* Right Parameter Panel - Resizable (hidden in sketch mode) */}
        {!sketchModeFeatureId && (
          <ResizablePanel
            side="right"
            defaultWidth={280}
            minWidth={200}
            maxWidth={450}
          >
            <ParameterPanel onStartSketch={(featureId) => enterSketchMode(featureId)} />
          </ResizablePanel>
        )}
      </div>

      {/* Dialogs */}
      {showExtrudeDialog && (
        <ExtrudeDialog
          editFeatureId={editingFeatureId}
          onClose={() => {
            setShowExtrudeDialog(false);
            setEditingFeatureId(null);
          }}
        />
      )}
      {showBooleanDialog && (
        <BooleanDialog
          editFeatureId={editingFeatureId}
          onClose={() => {
            setShowBooleanDialog(false);
            setEditingFeatureId(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
