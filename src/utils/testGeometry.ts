import * as THREE from 'three';

export interface TestMeshInfo {
  id: string;
  mesh: THREE.Mesh;
}

const defaultMaterial = new THREE.MeshStandardMaterial({
  color: 0x4a9eff,
  metalness: 0.1,
  roughness: 0.5,
  flatShading: false,
});

const secondaryMaterial = new THREE.MeshStandardMaterial({
  color: 0xff6b6b,
  metalness: 0.1,
  roughness: 0.5,
  flatShading: false,
});

const accentMaterial = new THREE.MeshStandardMaterial({
  color: 0x51cf66,
  metalness: 0.1,
  roughness: 0.5,
  flatShading: false,
});

export function createTestCube(size: number = 1): TestMeshInfo {
  const geometry = new THREE.BoxGeometry(size, size, size);
  const mesh = new THREE.Mesh(geometry, defaultMaterial);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set(0, size / 2, 0);

  return {
    id: 'test-cube',
    mesh,
  };
}

export function createTestSphere(radius: number = 0.5): TestMeshInfo {
  const geometry = new THREE.SphereGeometry(radius, 32, 24);
  const mesh = new THREE.Mesh(geometry, secondaryMaterial);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set(2.5, radius, 0);

  return {
    id: 'test-sphere',
    mesh,
  };
}

export function createTestCylinder(radiusTop: number = 0.5, radiusBottom: number = 0.5, height: number = 1.5): TestMeshInfo {
  const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 32);
  const mesh = new THREE.Mesh(geometry, accentMaterial);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set(-2.5, height / 2, 0);

  return {
    id: 'test-cylinder',
    mesh,
  };
}

export function createTestTorus(radius: number = 0.5, tube: number = 0.2): TestMeshInfo {
  const geometry = new THREE.TorusGeometry(radius, tube, 16, 48);
  const mesh = new THREE.Mesh(geometry, defaultMaterial.clone());
  (mesh.material as THREE.MeshStandardMaterial).color.setHex(0xffd43b);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set(0, 1, 2.5);
  mesh.rotation.x = Math.PI / 2;

  return {
    id: 'test-torus',
    mesh,
  };
}

export function createAllTestGeometry(): TestMeshInfo[] {
  return [
    createTestCube(1.5),
    createTestSphere(0.7),
    createTestCylinder(0.4, 0.6, 1.8),
    createTestTorus(0.6, 0.2),
  ];
}
