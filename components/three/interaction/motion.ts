/**
 * Output of the webcam motion detector (DOM side) consumed by the 3D
 * MotionCursor every frame. A plain mutable object: no React involved.
 */
export const motion = {
  active: false,
  /** normalised, already mirrored: 0 = left of screen, 1 = right */
  x: 0.5,
  /** normalised: 0 = top, 1 = bottom */
  y: 0.5,
  /** fraction of pixels that changed since the last frame */
  energy: 0,
};
