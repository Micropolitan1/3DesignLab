/**
 * ResizablePanel - A panel with draggable edge for resizing
 * Like Fusion 360's browser and properties panels
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import './ResizablePanel.css';

interface ResizablePanelProps {
  children: ReactNode;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  side: 'left' | 'right';
  className?: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onWidthChange?: (width: number) => void;
}

export function ResizablePanel({
  children,
  defaultWidth,
  minWidth,
  maxWidth,
  side,
  className = '',
  collapsed: controlledCollapsed,
  onCollapsedChange,
  onWidthChange,
}: ResizablePanelProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Use controlled or internal collapsed state
  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  // Handle mouse down on resize handle
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;

    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  }, [width]);

  // Handle mouse move during resize
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - startXRef.current;
    // For left panel, dragging right increases width
    // For right panel, dragging left increases width
    const newWidth = side === 'left'
      ? startWidthRef.current + deltaX
      : startWidthRef.current - deltaX;

    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    setWidth(clampedWidth);
    onWidthChange?.(clampedWidth);
  }, [isResizing, side, minWidth, maxWidth, onWidthChange]);

  // Handle mouse up - end resize
  const handleMouseUp = useCallback(() => {
    if (!isResizing) return;
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [isResizing]);

  // Add/remove global mouse listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Toggle collapse
  const toggleCollapse = useCallback(() => {
    const newCollapsed = !collapsed;
    if (controlledCollapsed === undefined) {
      setInternalCollapsed(newCollapsed);
    }
    onCollapsedChange?.(newCollapsed);
  }, [collapsed, controlledCollapsed, onCollapsedChange]);

  // Double-click on handle to collapse/expand
  const handleDoubleClick = useCallback(() => {
    toggleCollapse();
  }, [toggleCollapse]);

  return (
    <div
      ref={panelRef}
      className={`resizable-panel resizable-panel-${side} ${collapsed ? 'collapsed' : ''} ${isResizing ? 'resizing' : ''} ${className}`}
      style={{ width: collapsed ? 0 : width }}
    >
      {/* Panel content */}
      <div className="resizable-panel-content">
        {children}
      </div>

      {/* Resize handle */}
      <div
        className={`resize-handle resize-handle-${side}`}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        title="Drag to resize, double-click to collapse"
      >
        <div className="resize-handle-indicator" />
      </div>

      {/* Collapse button (shown when collapsed) */}
      {collapsed && (
        <button
          className={`panel-expand-btn panel-expand-${side}`}
          onClick={toggleCollapse}
          title={`Expand ${side} panel`}
        >
          {side === 'left' ? '›' : '‹'}
        </button>
      )}
    </div>
  );
}
