import { create } from 'zustand';
import * as THREE from 'three';

export type SelectionMode = 'face' | 'edge' | 'body';

export interface SelectionInfo {
  objectId: string;
  faceIndex?: number;
  edgeIndex?: number;
}

interface SceneState {
  // Scene objects
  objects: Map<string, THREE.Object3D>;

  // Selection state
  selectionMode: SelectionMode;
  hoveredSelection: SelectionInfo | null;
  selectedItems: SelectionInfo[];

  // Actions
  setSelectionMode: (mode: SelectionMode) => void;
  setHoveredSelection: (selection: SelectionInfo | null) => void;
  addSelection: (selection: SelectionInfo) => void;
  removeSelection: (selection: SelectionInfo) => void;
  clearSelection: () => void;
  toggleSelection: (selection: SelectionInfo) => void;

  // Object management
  addObject: (id: string, object: THREE.Object3D) => void;
  removeObject: (id: string) => void;
  getObject: (id: string) => THREE.Object3D | undefined;
}

export const useSceneStore = create<SceneState>((set, get) => ({
  objects: new Map(),
  selectionMode: 'face',
  hoveredSelection: null,
  selectedItems: [],

  setSelectionMode: (mode) => set({ selectionMode: mode }),

  setHoveredSelection: (selection) => set({ hoveredSelection: selection }),

  addSelection: (selection) => set((state) => ({
    selectedItems: [...state.selectedItems, selection]
  })),

  removeSelection: (selection) => set((state) => ({
    selectedItems: state.selectedItems.filter(
      (s) => !(s.objectId === selection.objectId &&
               s.faceIndex === selection.faceIndex &&
               s.edgeIndex === selection.edgeIndex)
    )
  })),

  clearSelection: () => set({ selectedItems: [] }),

  toggleSelection: (selection) => {
    const state = get();
    const exists = state.selectedItems.some(
      (s) => s.objectId === selection.objectId &&
             s.faceIndex === selection.faceIndex &&
             s.edgeIndex === selection.edgeIndex
    );
    if (exists) {
      state.removeSelection(selection);
    } else {
      state.addSelection(selection);
    }
  },

  addObject: (id, object) => set((state) => {
    const newObjects = new Map(state.objects);
    newObjects.set(id, object);
    return { objects: newObjects };
  }),

  removeObject: (id) => set((state) => {
    const newObjects = new Map(state.objects);
    newObjects.delete(id);
    return { objects: newObjects };
  }),

  getObject: (id) => get().objects.get(id),
}));
