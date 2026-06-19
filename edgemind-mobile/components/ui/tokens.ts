/**
 * ABB Brand Design Tokens — mirrors index.css :root variables from
 * the edgemind-dashboard. Keep in sync whenever the web palette changes.
 */

export const Colors = {
  // ── ABB Brand Palette ──────────────────────────────────────────────
  abbRed:    '#ff000f',
  abbBlack:  '#000000',
  abbWhite:  '#ffffff',
  abbGray1:  '#262626',
  abbGray2:  '#6e6e6e',
  abbGray3:  '#a9a9a9',
  abbGray4:  '#d2d2d2',
  abbGray5:  '#f0f0f0',
  abbGray6:  '#fafafa',
  abbBlue:   '#004c97',
  abbGreen:  '#007a33',
  abbYellow: '#ffd100',

  // ── Semantic ───────────────────────────────────────────────────────
  success:        '#007a33',
  successBorder:  '#005a26',
  warning:        '#b89400',
  warningBorder:  '#7a6200',
  danger:         '#ff000f',
  dangerBorder:   '#cc000c',
  info:           '#004c97',
  infoBorder:     '#003570',
  infoBg:         '#e6eef7',

  // ── Text ──────────────────────────────────────────────────────────
  textPrimary:    '#0d0d0d',
  textSecondary:  '#2d2d2d',
  textTertiary:   '#595959',
  textInfo:       '#004c97',
  textDanger:     '#cc000c',

  // ── Borders ───────────────────────────────────────────────────────
  borderPrimary:   '#a9a9a9',
  borderSecondary: '#d2d2d2',
  borderCard:      '#c8c8c8',
  bgChip:          '#e8e8e8',

  // ── Backgrounds ───────────────────────────────────────────────────
  bgSurface:    '#f0f0f0',
  bgCard:       '#ffffff',
  bgCardHover:  '#f5f5f5',
  bgInput:      '#f0f0f0',

  // ── Tints ─────────────────────────────────────────────────────────
  dangerTint:   'rgba(255, 0, 15, 0.08)',
  warningTint:  'rgba(184, 148, 0, 0.10)',
  successTint:  'rgba(0, 122, 51, 0.08)',
  infoTint:     'rgba(0, 76, 151, 0.08)',
  shadow:       'rgba(0, 0, 0, 0.14)',
} as const;

export const Typography = {
  fontFamily: 'System',
  sizes: {
    xs:   10,
    sm:   12,
    base: 13,
    md:   14,
    lg:   16,
    xl:   20,
    xxl:  24,
    hero: 32,
  },
  weights: {
    regular: '400' as const,
    medium:  '500' as const,
    semibold:'600' as const,
    bold:    '700' as const,
  },
};

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  xxl:  32,
};

export const Radius = {
  sm:   4,
  md:   8,
  lg:   12,
  xl:   16,
  full: 999,
};

/** Map severity string → brand colour */
export function severityColor(severity: string): string {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL': return Colors.danger;
    case 'WARNING':  return Colors.warning;
    case 'HEALTHY':
    case 'RESOLVED': return Colors.success;
    default:         return Colors.abbGray3;
  }
}

/** Map severity string → tint colour */
export function severityTint(severity: string): string {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL': return Colors.dangerTint;
    case 'WARNING':  return Colors.warningTint;
    case 'HEALTHY':
    case 'RESOLVED': return Colors.successTint;
    default:         return Colors.infoTint;
  }
}
