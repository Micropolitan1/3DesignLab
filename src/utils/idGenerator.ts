/**
 * UUID generation utilities
 */

let counter = 0;

/**
 * Generate a unique ID using crypto.randomUUID or fallback
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `id-${Date.now()}-${++counter}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a short ID for display purposes
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 8);
}

/**
 * Generate a feature name with auto-incrementing number
 */
const featureCounters: Record<string, number> = {};

export function generateFeatureName(type: string): string {
  const displayNames: Record<string, string> = {
    primitive: 'Primitive',
    sketch: 'Sketch',
    extrude: 'Extrude',
    boolean: 'Boolean',
    box: 'Box',
    cylinder: 'Cylinder',
    sphere: 'Sphere',
  };

  const baseName = displayNames[type] || type;
  featureCounters[type] = (featureCounters[type] || 0) + 1;
  return `${baseName} ${featureCounters[type]}`;
}

/**
 * Reset feature name counters (for new documents)
 */
export function resetFeatureCounters(): void {
  Object.keys(featureCounters).forEach(key => {
    delete featureCounters[key];
  });
}

/**
 * Generate a body ID
 */
export function generateBodyId(): string {
  return `body-${generateShortId()}`;
}

/**
 * Generate a profile ID
 */
export function generateProfileId(): string {
  return `profile-${generateShortId()}`;
}
