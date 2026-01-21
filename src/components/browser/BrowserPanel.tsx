/**
 * BrowserPanel - Fusion 360 style document browser (left panel)
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useDocumentStore } from '../../store/documentStore';
import type { Feature } from '../../types/features';
import {
  DocumentIcon,
  FolderIcon,
  OriginIcon,
  PlaneIcon,
  AxisIcon,
  BodyIcon,
  BoxIcon,
  CylinderIcon,
  SphereIcon,
  SketchIcon,
  ExtrudeIcon,
  BooleanUnionIcon,
  EyeIcon,
  EyeOffIcon,
  ChevronRightIcon,
  SearchIcon,
  SettingsIcon,
} from '../icons/Icons';
import './BrowserPanel.css';

interface BrowserPanelProps {
  onEditFeature: (featureId: string) => void;
}

interface TreeNode {
  id: string;
  label: string;
  iconType: string;
  type: 'folder' | 'feature';
  children?: TreeNode[];
  featureId?: string;
  expanded?: boolean;
}

// Icon mapping function
function getIcon(iconType: string, size: number = 14): React.ReactNode {
  const props = { size, color: 'currentColor' };
  switch (iconType) {
    case 'document': return <DocumentIcon {...props} />;
    case 'folder': return <FolderIcon {...props} />;
    case 'origin': return <OriginIcon {...props} />;
    case 'plane': return <PlaneIcon {...props} />;
    case 'axis': return <AxisIcon {...props} />;
    case 'body': return <BodyIcon {...props} />;
    case 'box': return <BoxIcon {...props} />;
    case 'cylinder': return <CylinderIcon {...props} />;
    case 'sphere': return <SphereIcon {...props} />;
    case 'sketch': return <SketchIcon {...props} />;
    case 'extrude': return <ExtrudeIcon {...props} />;
    case 'boolean': return <BooleanUnionIcon {...props} />;
    default: return <DocumentIcon {...props} />;
  }
}

export function BrowserPanel({ onEditFeature }: BrowserPanelProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(['document', 'bodies', 'sketches', 'origin'])
  );

  const document = useDocumentStore(state => state.document);
  const selectedFeatureId = useDocumentStore(state => state.selectedFeatureId);
  const selectFeature = useDocumentStore(state => state.selectFeature);
  const suppressFeature = useDocumentStore(state => state.suppressFeature);

  // Build tree structure from features
  const treeData = useMemo((): TreeNode[] => {
    const bodies: TreeNode[] = [];
    const sketches: TreeNode[] = [];

    for (const feature of document.features) {
      const node: TreeNode = {
        id: feature.id,
        label: feature.name,
        iconType: getFeatureIconType(feature),
        type: 'feature',
        featureId: feature.id,
      };

      if (feature.type === 'sketch') {
        sketches.push(node);
      } else if (feature.type === 'primitive' || feature.type === 'extrude' || feature.type === 'boolean') {
        bodies.push(node);
      }
    }

    return [
      {
        id: 'document',
        label: document.name,
        iconType: 'document',
        type: 'folder',
        children: [
          {
            id: 'origin',
            label: 'Origin',
            iconType: 'origin',
            type: 'folder',
            children: [
              { id: 'origin-xy', label: 'XY Plane', iconType: 'plane', type: 'feature' },
              { id: 'origin-xz', label: 'XZ Plane', iconType: 'plane', type: 'feature' },
              { id: 'origin-yz', label: 'YZ Plane', iconType: 'plane', type: 'feature' },
              { id: 'origin-x', label: 'X Axis', iconType: 'axis', type: 'feature' },
              { id: 'origin-y', label: 'Y Axis', iconType: 'axis', type: 'feature' },
              { id: 'origin-z', label: 'Z Axis', iconType: 'axis', type: 'feature' },
            ],
          },
          {
            id: 'bodies',
            label: `Bodies (${bodies.length})`,
            iconType: 'body',
            type: 'folder',
            children: bodies,
          },
          {
            id: 'sketches',
            label: `Sketches (${sketches.length})`,
            iconType: 'sketch',
            type: 'folder',
            children: sketches,
          },
        ],
      },
    ];
  }, [document]);

  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleNodeClick = useCallback((node: TreeNode, e: React.MouseEvent) => {
    if (node.type === 'folder') {
      toggleExpand(node.id);
    } else if (node.featureId) {
      if (e.detail === 2) {
        onEditFeature(node.featureId);
      } else {
        selectFeature(node.featureId);
      }
    }
  }, [toggleExpand, selectFeature, onEditFeature]);

  const handleVisibilityToggle = useCallback((e: React.MouseEvent, featureId: string) => {
    e.stopPropagation();
    const feature = document.features.find(f => f.id === featureId);
    if (feature) {
      suppressFeature(featureId, !feature.suppressed);
    }
  }, [document.features, suppressFeature]);

  const renderNode = (node: TreeNode, depth: number = 0): React.ReactElement => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const feature = node.featureId ? document.features.find(f => f.id === node.featureId) : null;
    const isSelected = node.featureId === selectedFeatureId;
    const isSuppressed = feature?.suppressed;

    return (
      <div key={node.id} className="tree-node-container">
        <div
          className={`tree-node ${isSelected ? 'selected' : ''} ${isSuppressed ? 'suppressed' : ''}`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={(e) => handleNodeClick(node, e)}
        >
          {/* Expand/collapse arrow */}
          <span
            className={`tree-arrow ${hasChildren ? 'has-children' : ''} ${isExpanded ? 'expanded' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) toggleExpand(node.id);
            }}
          >
            {hasChildren && <ChevronRightIcon size={12} />}
          </span>

          {/* Icon */}
          <span className="tree-icon">{getIcon(node.iconType)}</span>

          {/* Label */}
          <span className="tree-label">{node.label}</span>

          {/* Visibility toggle for features */}
          {node.featureId && (
            <button
              className="visibility-toggle"
              onClick={(e) => handleVisibilityToggle(e, node.featureId!)}
              title={isSuppressed ? 'Show' : 'Hide'}
            >
              {isSuppressed ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
            </button>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="tree-children">
            {node.children!.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="browser-panel">
      <div className="browser-header">
        <span className="browser-title">BROWSER</span>
      </div>

      <div className="browser-tree">
        {treeData.map(node => renderNode(node))}
      </div>

      <div className="browser-footer">
        <button className="browser-action" title="Search">
          <SearchIcon size={14} />
        </button>
        <button className="browser-action" title="Settings">
          <SettingsIcon size={14} />
        </button>
      </div>
    </div>
  );
}

function getFeatureIconType(feature: Feature): string {
  switch (feature.type) {
    case 'primitive':
      const shape = feature.parameters.shape?.value;
      if (shape === 'box') return 'box';
      if (shape === 'cylinder') return 'cylinder';
      if (shape === 'sphere') return 'sphere';
      return 'box';
    case 'sketch':
      return 'sketch';
    case 'extrude':
      return 'extrude';
    case 'boolean':
      return 'boolean';
    default:
      return 'document';
  }
}
