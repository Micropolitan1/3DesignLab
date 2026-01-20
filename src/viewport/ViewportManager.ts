import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  computeBoundsTree,
  disposeBoundsTree,
  acceleratedRaycast,
} from 'three-mesh-bvh';

// Add BVH methods to THREE.BufferGeometry for accelerated raycasting
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

export interface RaycastHit {
  object: THREE.Object3D;
  objectId: string;
  faceIndex: number;
  point: THREE.Vector3;
  distance: number;
  face: THREE.Face | null;
}

export class ViewportManager {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver;

  // Highlight meshes
  private hoverHighlight: THREE.Mesh | null = null;
  private selectionHighlights: Map<string, THREE.Mesh> = new Map();

  // Materials
  private hoverMaterial: THREE.MeshBasicMaterial;
  private selectionMaterial: THREE.MeshBasicMaterial;

  // Object ID tracking
  private objectIds: Map<THREE.Object3D, string> = new Map();

  // Callbacks
  public onHover: ((hit: RaycastHit | null) => void) | null = null;
  public onClick: ((hit: RaycastHit | null, shiftKey: boolean) => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    // Set raycaster to use first hit only for performance
    this.raycaster.firstHitOnly = true;

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x1a1a2e, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Create scene
    this.scene = new THREE.Scene();

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(0, 0, 0);

    // Create controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 100;

    // Create highlight materials
    this.hoverMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthTest: false,
    });

    this.selectionMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      depthTest: false,
    });

    // Setup lighting
    this.setupLighting();

    // Setup grid
    this.setupGrid();

    // Handle resize
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);
    this.handleResize();

    // Setup event listeners
    this.setupEventListeners();

    // Start render loop
    this.animate();
  }

  private setupLighting(): void {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);

    // Main directional light
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(10, 20, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -10;
    mainLight.shadow.camera.right = 10;
    mainLight.shadow.camera.top = 10;
    mainLight.shadow.camera.bottom = -10;
    this.scene.add(mainLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);

    // Hemisphere light for ambient color variation
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
    this.scene.add(hemiLight);
  }

  private setupGrid(): void {
    const grid = new THREE.GridHelper(20, 20, 0x444444, 0x333333);
    grid.position.y = -0.001; // Slightly below origin to avoid z-fighting
    this.scene.add(grid);
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    canvas.addEventListener('click', (e) => this.handleClick(e));
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private updateMouse(event: MouseEvent): void {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private handleMouseMove(event: MouseEvent): void {
    this.updateMouse(event);
    const hit = this.raycast();

    // Update hover highlight
    this.updateHoverHighlight(hit);

    if (this.onHover) {
      this.onHover(hit);
    }
  }

  private handleClick(event: MouseEvent): void {
    this.updateMouse(event);
    const hit = this.raycast();

    if (this.onClick) {
      this.onClick(hit, event.shiftKey);
    }
  }

  private raycast(): RaycastHit | null {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Get all meshes in the scene that are selectable
    const meshes: THREE.Mesh[] = [];
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && this.objectIds.has(obj)) {
        meshes.push(obj);
      }
    });

    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const objectId = this.objectIds.get(hit.object) || '';

      return {
        object: hit.object,
        objectId,
        faceIndex: hit.faceIndex ?? -1,
        point: hit.point.clone(),
        distance: hit.distance,
        face: hit.face ?? null,
      };
    }

    return null;
  }

  private updateHoverHighlight(hit: RaycastHit | null): void {
    // Remove existing hover highlight
    if (this.hoverHighlight) {
      this.scene.remove(this.hoverHighlight);
      this.hoverHighlight.geometry.dispose();
      this.hoverHighlight = null;
    }

    if (!hit || hit.faceIndex < 0) return;

    const mesh = hit.object as THREE.Mesh;
    const geometry = mesh.geometry as THREE.BufferGeometry;
    const position = geometry.getAttribute('position');
    const index = geometry.getIndex();

    if (!position) return;

    // Create highlight geometry for the hovered face
    const highlightGeom = new THREE.BufferGeometry();
    const vertices = new Float32Array(9); // 3 vertices * 3 components

    let i0: number, i1: number, i2: number;
    if (index) {
      i0 = index.getX(hit.faceIndex * 3);
      i1 = index.getX(hit.faceIndex * 3 + 1);
      i2 = index.getX(hit.faceIndex * 3 + 2);
    } else {
      i0 = hit.faceIndex * 3;
      i1 = hit.faceIndex * 3 + 1;
      i2 = hit.faceIndex * 3 + 2;
    }

    vertices[0] = position.getX(i0);
    vertices[1] = position.getY(i0);
    vertices[2] = position.getZ(i0);
    vertices[3] = position.getX(i1);
    vertices[4] = position.getY(i1);
    vertices[5] = position.getZ(i1);
    vertices[6] = position.getX(i2);
    vertices[7] = position.getY(i2);
    vertices[8] = position.getZ(i2);

    highlightGeom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    this.hoverHighlight = new THREE.Mesh(highlightGeom, this.hoverMaterial);
    this.hoverHighlight.matrixAutoUpdate = false;
    this.hoverHighlight.matrix.copy(mesh.matrixWorld);
    this.hoverHighlight.renderOrder = 999;

    this.scene.add(this.hoverHighlight);
  }

  public addSelectionHighlight(objectId: string, faceIndex: number): void {
    const key = `${objectId}-${faceIndex}`;
    if (this.selectionHighlights.has(key)) return;

    // Find the mesh
    let mesh: THREE.Mesh | null = null;
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && this.objectIds.get(obj) === objectId) {
        mesh = obj;
      }
    });

    if (!mesh) return;

    const geometry = (mesh as THREE.Mesh).geometry as THREE.BufferGeometry;
    const position = geometry.getAttribute('position');
    const index = geometry.getIndex();

    if (!position) return;

    const highlightGeom = new THREE.BufferGeometry();
    const vertices = new Float32Array(9);

    let i0: number, i1: number, i2: number;
    if (index) {
      i0 = index.getX(faceIndex * 3);
      i1 = index.getX(faceIndex * 3 + 1);
      i2 = index.getX(faceIndex * 3 + 2);
    } else {
      i0 = faceIndex * 3;
      i1 = faceIndex * 3 + 1;
      i2 = faceIndex * 3 + 2;
    }

    vertices[0] = position.getX(i0);
    vertices[1] = position.getY(i0);
    vertices[2] = position.getZ(i0);
    vertices[3] = position.getX(i1);
    vertices[4] = position.getY(i1);
    vertices[5] = position.getZ(i1);
    vertices[6] = position.getX(i2);
    vertices[7] = position.getY(i2);
    vertices[8] = position.getZ(i2);

    highlightGeom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    const highlight = new THREE.Mesh(highlightGeom, this.selectionMaterial);
    highlight.matrixAutoUpdate = false;
    highlight.matrix.copy((mesh as THREE.Mesh).matrixWorld);
    highlight.renderOrder = 998;

    this.scene.add(highlight);
    this.selectionHighlights.set(key, highlight);
  }

  public removeSelectionHighlight(objectId: string, faceIndex: number): void {
    const key = `${objectId}-${faceIndex}`;
    const highlight = this.selectionHighlights.get(key);
    if (highlight) {
      this.scene.remove(highlight);
      highlight.geometry.dispose();
      this.selectionHighlights.delete(key);
    }
  }

  public clearSelectionHighlights(): void {
    this.selectionHighlights.forEach((highlight) => {
      this.scene.remove(highlight);
      highlight.geometry.dispose();
    });
    this.selectionHighlights.clear();
  }

  public addMesh(id: string, mesh: THREE.Mesh): void {
    // Compute BVH for fast raycasting
    const geometry = mesh.geometry as THREE.BufferGeometry;
    geometry.computeBoundsTree();

    this.objectIds.set(mesh, id);
    this.scene.add(mesh);
  }

  public removeMesh(id: string): void {
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && this.objectIds.get(obj) === id) {
        const geometry = obj.geometry as THREE.BufferGeometry;
        if (geometry.boundsTree) {
          geometry.disposeBoundsTree();
        }
        this.scene.remove(obj);
        this.objectIds.delete(obj);
      }
    });
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  private handleResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  public dispose(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.resizeObserver.disconnect();

    // Dispose highlights
    if (this.hoverHighlight) {
      this.hoverHighlight.geometry.dispose();
    }
    this.selectionHighlights.forEach((h) => h.geometry.dispose());

    // Dispose materials
    this.hoverMaterial.dispose();
    this.selectionMaterial.dispose();

    // Dispose BVH trees
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const geometry = obj.geometry as THREE.BufferGeometry;
        if (geometry.boundsTree) {
          geometry.disposeBoundsTree();
        }
      }
    });

    this.controls.dispose();
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
