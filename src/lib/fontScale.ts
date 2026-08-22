/**
 * Reader font-size scaling. `fontScale` is a multiplier applied to the reading
 * text's base sizes (Chinese, pinyin, English, vocabulary). 1 = default.
 * Kept deliberately wide so the reader works from "fits more on screen" down to
 * large-print accessibility. Bounds are mirrored server-side in api/_shared.ts.
 */
export const FONT_SCALE_MIN = 0.6;
export const FONT_SCALE_MAX = 3;
export const FONT_SCALE_STEP = 0.1;
export const FONT_SCALE_DEFAULT = 1;

/** Coerce any value into a valid scale, snapping to the step grid to avoid
 *  floating-point drift from repeated +0.1 / -0.1 stepping. */
export function clampFontScale(value: number): number {
  if (!Number.isFinite(value)) return FONT_SCALE_DEFAULT;
  const snapped = Math.round(value / FONT_SCALE_STEP) * FONT_SCALE_STEP;
  const bounded = Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, snapped));
  // Round to 2 decimals so values stay clean (e.g. 1.2 not 1.2000000000000002).
  return Math.round(bounded * 100) / 100;
}
