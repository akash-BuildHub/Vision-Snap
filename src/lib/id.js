/**
 * Stable unique id for a sample. Falls back to a timestamp+random pair on
 * browsers (or insecure origins) where crypto.randomUUID is unavailable.
 */
export const buildSampleId = () => (
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
);
