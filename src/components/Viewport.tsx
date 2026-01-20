import { useEffect, useRef, useCallback } from 'react';
import { ViewportManager, type RaycastHit } from '../viewport/ViewportManager';
import { useSceneStore } from '../store/sceneStore';

export function Viewport() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<ViewportManager | null>(null);

  const {
    setHoveredSelection,
    toggleSelection,
    clearSelection,
    selectedItems,
  } = useSceneStore();

  // Handle hover
  const handleHover = useCallback((hit: RaycastHit | null) => {
    if (hit && hit.faceIndex >= 0) {
      setHoveredSelection({
        objectId: hit.objectId,
        faceIndex: hit.faceIndex,
      });
    } else {
      setHoveredSelection(null);
    }
  }, [setHoveredSelection]);

  // Handle click
  const handleClick = useCallback((hit: RaycastHit | null, shiftKey: boolean) => {
    if (!shiftKey) {
      // Clear previous selection highlights
      viewportRef.current?.clearSelectionHighlights();
      clearSelection();
    }

    if (hit && hit.faceIndex >= 0) {
      toggleSelection({
        objectId: hit.objectId,
        faceIndex: hit.faceIndex,
      });
    }
  }, [clearSelection, toggleSelection]);

  // Update selection highlights when selection changes
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.clearSelectionHighlights();
    selectedItems.forEach((item) => {
      if (item.faceIndex !== undefined) {
        viewport.addSelectionHighlight(item.objectId, item.faceIndex);
      }
    });
  }, [selectedItems]);

  // Initialize viewport
  useEffect(() => {
    if (!containerRef.current) return;

    const viewport = new ViewportManager(containerRef.current);
    viewport.onHover = handleHover;
    viewport.onClick = handleClick;
    viewportRef.current = viewport;

    // Expose viewport for other components
    (window as unknown as { viewport: ViewportManager }).viewport = viewport;

    return () => {
      viewport.dispose();
      viewportRef.current = null;
    };
  }, [handleHover, handleClick]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    />
  );
}
