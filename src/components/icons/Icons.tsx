/**
 * CAD Icons - Professional SVG icons for 3DDesignLab
 * Inspired by Fusion 360's icon style
 */

import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

const defaultProps = {
  size: 20,
  color: 'currentColor',
};

// File Operations
export const SaveIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M17 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V7L17 3Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 3V7H21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 17H17" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M7 13H17" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const FolderOpenIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M22 19C22 20.1 21.1 21 20 21H4C2.9 21 2 20.1 2 19V5C2 3.9 2.9 3 4 3H9L11 6H20C21.1 6 22 6.9 22 8V19Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ExportIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 8L12 3L7 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 3V15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const UndoIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M3 10H14C17.3137 10 20 12.6863 20 16C20 19.3137 17.3137 22 14 22H10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 6L3 10L7 14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const RedoIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M21 10H10C6.68629 10 4 12.6863 4 16C4 19.3137 6.68629 22 10 22H14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 6L21 10L17 14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Primitives
export const BoxIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M21 16V8C21 7.46957 20.7893 6.96086 20.4142 6.58579C20.0391 6.21071 19.5304 6 19 6H5C4.46957 6 3.96086 6.21071 3.58579 6.58579C3.21071 6.96086 3 7.46957 3 8V16C3 16.5304 3.21071 17.0391 3.58579 17.4142C3.96086 17.7893 4.46957 18 5 18H19C19.5304 18 20.0391 17.7893 20.4142 17.4142C20.7893 17.0391 21 16.5304 21 16Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 8L12 13L21 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 13V18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CylinderIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <ellipse cx="12" cy="6" rx="8" ry="3" stroke={color} strokeWidth="2"/>
    <path d="M4 6V18C4 19.6569 7.58172 21 12 21C16.4183 21 20 19.6569 20 18V6" stroke={color} strokeWidth="2"/>
    <ellipse cx="12" cy="18" rx="8" ry="3" stroke={color} strokeWidth="2" strokeOpacity="0.3"/>
  </svg>
);

export const SphereIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2"/>
    <ellipse cx="12" cy="12" rx="9" ry="3" stroke={color} strokeWidth="1.5" strokeOpacity="0.5"/>
    <ellipse cx="12" cy="12" rx="3" ry="9" stroke={color} strokeWidth="1.5" strokeOpacity="0.5"/>
  </svg>
);

export const ConeIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <ellipse cx="12" cy="18" rx="8" ry="3" stroke={color} strokeWidth="2"/>
    <path d="M4 18L12 4L20 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const TorusIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <ellipse cx="12" cy="12" rx="9" ry="4" stroke={color} strokeWidth="2"/>
    <ellipse cx="12" cy="12" rx="4" ry="1.5" stroke={color} strokeWidth="2"/>
  </svg>
);

// Sketch Tools
export const SketchIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M17 3C17.2626 2.73735 17.5744 2.52901 17.9176 2.38687C18.2608 2.24473 18.6286 2.17157 19 2.17157C19.3714 2.17157 19.7392 2.24473 20.0824 2.38687C20.4256 2.52901 20.7374 2.73735 21 3C21.2626 3.26264 21.471 3.57444 21.6131 3.9176C21.7553 4.26077 21.8284 4.62856 21.8284 5C21.8284 5.37143 21.7553 5.73923 21.6131 6.08239C21.471 6.42555 21.2626 6.73735 21 7L7.5 20.5L2 22L3.5 16.5L17 3Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 5L19 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const LineIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 20L20 4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="4" cy="20" r="2" fill={color}/>
    <circle cx="20" cy="4" r="2" fill={color}/>
  </svg>
);

export const RectangleIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="4" y="6" width="16" height="12" rx="1" stroke={color} strokeWidth="2"/>
    <circle cx="4" cy="6" r="1.5" fill={color}/>
    <circle cx="20" cy="6" r="1.5" fill={color}/>
    <circle cx="4" cy="18" r="1.5" fill={color}/>
    <circle cx="20" cy="18" r="1.5" fill={color}/>
  </svg>
);

export const CircleIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="2"/>
    <circle cx="12" cy="12" r="1.5" fill={color}/>
  </svg>
);

export const ArcIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M5 19C5 14.0294 9.02944 10 14 10C17.3137 10 20.1863 11.7909 21.6569 14.5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="5" cy="19" r="2" fill={color}/>
    <circle cx="21.6569" cy="14.5" r="2" fill={color}/>
  </svg>
);

export const PointIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="3" fill={color}/>
    <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="2" strokeDasharray="2 2"/>
  </svg>
);

// Operations
export const ExtrudeIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="6" y="14" width="12" height="6" stroke={color} strokeWidth="2"/>
    <path d="M6 14L9 8H15L18 14" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    <path d="M9 8V4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M15 8V4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M7 4L12 1L17 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const BooleanUnionIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="9" cy="12" r="6" stroke={color} strokeWidth="2"/>
    <circle cx="15" cy="12" r="6" stroke={color} strokeWidth="2"/>
    <path d="M12 6.8C13.1 7.7 14 9.2 14 12C14 14.8 13.1 16.3 12 17.2" stroke={color} strokeWidth="2" strokeOpacity="0.3"/>
  </svg>
);

export const BooleanDifferenceIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="9" cy="12" r="6" stroke={color} strokeWidth="2"/>
    <circle cx="15" cy="12" r="6" stroke={color} strokeWidth="2" strokeDasharray="3 2"/>
  </svg>
);

export const BooleanIntersectIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="9" cy="12" r="6" stroke={color} strokeWidth="2" strokeOpacity="0.4"/>
    <circle cx="15" cy="12" r="6" stroke={color} strokeWidth="2" strokeOpacity="0.4"/>
    <path d="M12 6.8C10.9 7.7 10 9.2 10 12C10 14.8 10.9 16.3 12 17.2C13.1 16.3 14 14.8 14 12C14 9.2 13.1 7.7 12 6.8Z" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="2"/>
  </svg>
);

// Modify Tools
export const FilletIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 4V16C4 18.2091 5.79086 20 8 20H20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M4 12C4 12 4 16 8 16C12 16 12 16 12 20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray="3 2"/>
  </svg>
);

export const ChamferIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 4V14L10 20H20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 14L10 14L10 20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 2"/>
  </svg>
);

export const ShellIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="2"/>
    <rect x="7" y="7" width="10" height="10" rx="1" stroke={color} strokeWidth="2" strokeDasharray="3 2"/>
  </svg>
);

// Navigation
export const OrbitIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="2"/>
    <path d="M12 4C14.5 4 19 6 19 12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M19 9L19 12L16 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const PanIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 2L12 22" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M2 12L22 12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 2L9 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 2L15 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 22L9 19" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 22L15 19" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L5 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L5 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 12L19 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 12L19 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ZoomIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2"/>
    <path d="M21 21L16.5 16.5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M11 8V14" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 11H14" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const ZoomOutIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2"/>
    <path d="M21 21L16.5 16.5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 11H14" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const FitViewIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 4H8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M4 4V8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M20 4H16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M20 4V8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M4 20H8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M4 20V16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M20 20H16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M20 20V16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <rect x="8" y="8" width="8" height="8" stroke={color} strokeWidth="2"/>
  </svg>
);

export const HomeIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 22V12H15V22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// View Icons
export const TopViewIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="4" y="8" width="16" height="12" stroke={color} strokeWidth="2"/>
    <path d="M4 8L12 4L20 8" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    <circle cx="12" cy="14" r="2" fill={color}/>
  </svg>
);

export const FrontViewIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="4" y="4" width="16" height="16" stroke={color} strokeWidth="2"/>
    <circle cx="12" cy="12" r="2" fill={color}/>
  </svg>
);

export const RightViewIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 4V20H20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 4L12 8V20" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    <circle cx="12" cy="14" r="2" fill={color}/>
  </svg>
);

export const IsometricViewIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 2L22 8V16L12 22L2 16V8L12 2Z" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    <path d="M12 22V12" stroke={color} strokeWidth="2"/>
    <path d="M22 8L12 12L2 8" stroke={color} strokeWidth="2"/>
  </svg>
);

// Browser/Tree Icons
export const FolderIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M22 19C22 20.1 21.1 21 20 21H4C2.9 21 2 20.1 2 19V5C2 3.9 2.9 3 4 3H9L11 6H20C21.1 6 22 6.9 22 8V19Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const DocumentIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2V8H20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const BodyIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 2L22 8V16L12 22L2 16V8L12 2Z" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    <path d="M12 22V12" stroke={color} strokeWidth="2"/>
    <path d="M22 8L12 12" stroke={color} strokeWidth="2"/>
    <path d="M2 8L12 12" stroke={color} strokeWidth="2"/>
  </svg>
);

export const OriginIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="2"/>
    <path d="M12 4V20" stroke={color} strokeWidth="1.5"/>
    <path d="M4 12H20" stroke={color} strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="2" fill={color}/>
  </svg>
);

export const PlaneIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 6L12 2L20 6V18L12 22L4 18V6Z" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    <path d="M4 6L12 10L20 6" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
  </svg>
);

export const AxisIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 2V22" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 2L8 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 2L16 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="22" r="2" fill={color}/>
  </svg>
);

// UI Icons
export const ChevronDownIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M9 18L15 12L9 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const EyeIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2"/>
  </svg>
);

export const EyeOffIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.4811 9.80385 14.1962C9.51897 13.9113 9.29439 13.5719 9.14351 13.1984C8.99262 12.8248 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4859 9.58525 10.1546 9.88 9.88" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1 1L23 23" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CloseIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M18 6L6 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 6L18 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const PlusIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 5V19" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M5 12H19" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const MinusIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M5 12H19" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2"/>
    <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2"/>
    <path d="M21 21L16.5 16.5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const PlayIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <polygon points="5 3 19 12 5 21 5 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={color} fillOpacity="0.2"/>
  </svg>
);

export const PauseIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="6" y="4" width="4" height="16" rx="1" stroke={color} strokeWidth="2"/>
    <rect x="14" y="4" width="4" height="16" rx="1" stroke={color} strokeWidth="2"/>
  </svg>
);

export const StepBackIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <polygon points="19 20 9 12 19 4 19 20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="5" y1="4" x2="5" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const StepForwardIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <polygon points="5 4 15 12 5 20 5 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="19" y1="4" x2="19" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Selection & Edit Icons
export const SelectIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 4L10 20L12.5 13.5L19 16L4 4Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12.5 13.5L18 19" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const TrashIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M3 6H5H21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 11V17" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M14 11V17" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M20 6L9 17L4 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ProfileIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="2"/>
    <path d="M4 12H8L10 8L14 16L16 12H20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ConstructionIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 4L20 20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4"/>
    <circle cx="4" cy="4" r="2" fill={color}/>
    <circle cx="20" cy="20" r="2" fill={color}/>
  </svg>
);

export const TrimIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 12H10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M14 12H20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 4V10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 14V20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" strokeDasharray="2 2"/>
  </svg>
);

export const ExtendIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 12H16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M16 12L20 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2"/>
    <path d="M14 8L18 12L14 16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const OffsetIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="6" y="6" width="12" height="12" rx="1" stroke={color} strokeWidth="2"/>
    <rect x="3" y="3" width="12" height="12" rx="1" stroke={color} strokeWidth="2" strokeDasharray="3 2"/>
  </svg>
);

export const DimensionIcon: React.FC<IconProps> = ({ size = defaultProps.size, color = defaultProps.color, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 8V4H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 8V4H16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 4H20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M4 16V20H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 16V20H16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 20H20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <text x="12" y="14" textAnchor="middle" fill={color} fontSize="8" fontWeight="bold">50</text>
  </svg>
);
