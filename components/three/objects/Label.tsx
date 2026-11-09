"use client";

import { Text } from "@react-three/drei";
import type { ComponentProps } from "react";

export const FONT_BOLD = "/fonts/inter-latin-700-normal.woff";
export const FONT_REGULAR = "/fonts/inter-latin-400-normal.woff";

/** SDF text: razor sharp at any zoom, depth-tested, and it blooms like the rest of the scene. */
export function Label({
  bold = true,
  ...props
}: ComponentProps<typeof Text> & { bold?: boolean }) {
  return (
    <Text
      font={bold ? FONT_BOLD : FONT_REGULAR}
      anchorX="center"
      anchorY="middle"
      letterSpacing={-0.02}
      {...props}
    />
  );
}
