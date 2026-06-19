export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 30,
  pill: 999,
  full: 999,
} as const;

export type Radius = typeof radius;
export type RadiusToken = keyof Radius;
