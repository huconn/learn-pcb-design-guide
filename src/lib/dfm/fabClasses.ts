/**
 * Typical PCB fab capability tiers — values represent the *minimum* that
 * each tier reliably supports. Real fabs vary; verify against the chosen
 * vendor's current capability sheet before tape-out.
 *
 * Units:
 *   trace width / spacing / annular ring: mil (1 mil = 0.0254 mm)
 *   drill: mm
 *   silkscreen text height: mil
 */

export type FabTier = {
  id: string;
  name: string;
  vendor: string;       // e.g. 'JLCPCB / PCBWay'
  description: string;  // 1-line use-case
  costFactor: string;   // e.g. '1×', '1.5×', '3×'
  trace: number;        // min trace width (mil)
  spacing: number;      // min trace spacing (mil)
  drill: number;        // min hole diameter (mm)
  annularRing: number;  // min annular ring (mil)
  maskDam: number;      // min solder mask dam (mil)
  silkscreen: number;   // min silkscreen text height (mil)
  layers: string;       // supported layer counts
  via: string;          // supported via types
};

export const FAB_TIERS: FabTier[] = [
  {
    id: 'economy',
    name: 'Economy / Standard',
    vendor: 'JLCPCB · PCBWay · Sierra',
    description: '대부분 보드의 1차 선택. 견적 빠름.',
    costFactor: '1×',
    trace: 5,
    spacing: 5,
    drill: 0.3,
    annularRing: 5,
    maskDam: 4,
    silkscreen: 32,
    layers: '1 ~ 8',
    via: '관통 (through-hole) only',
  },
  {
    id: 'precision',
    name: 'Precision',
    vendor: 'JLCPCB Standard · PCBWay Advanced',
    description: 'BGA 라우팅, 임피던스 컨트롤 보드.',
    costFactor: '1.5 ~ 2×',
    trace: 3.5,
    spacing: 3.5,
    drill: 0.2,
    annularRing: 3,
    maskDam: 3,
    silkscreen: 24,
    layers: '4 ~ 12',
    via: '관통 + blind/buried',
  },
  {
    id: 'hdi',
    name: 'HDI / 고밀도',
    vendor: 'PCBWay HDI · 양산 fab',
    description: '0.4 mm pitch BGA, 휴대폰 메인보드급.',
    costFactor: '3 ~ 5×',
    trace: 2,
    spacing: 2,
    drill: 0.1,
    annularRing: 2,
    maskDam: 2,
    silkscreen: 20,
    layers: '8 ~ 20',
    via: 'HDI · microvia · stacked',
  },
  {
    id: 'aerospace',
    name: 'Aerospace · IPC Class 3',
    vendor: 'Sierra · TTM · 군수용 fab',
    description: '의료 / 항공 / 군수. 트레이스 자체가 작지는 않지만 검증 엄격.',
    costFactor: '5 ~ 10×',
    trace: 3,
    spacing: 3,
    drill: 0.15,
    annularRing: 4,
    maskDam: 3,
    silkscreen: 24,
    layers: '12 ~ 40',
    via: '모든 종류 + 채워진 via (filled)',
  },
];

/**
 * Check whether a given design rule set fits within a fab tier.
 * Each parameter is "what your design *requires*" — the function tells
 * you which tiers can make it.
 */
export type Design = {
  trace: number;        // mil
  spacing: number;      // mil
  drill: number;        // mm
  annularRing: number;  // mil
};

export type FitResult = {
  tier: FabTier;
  fits: boolean;
  fails: string[];      // which constraints fail
};

export function evaluateFit(design: Design, tier: FabTier): FitResult {
  const fails: string[] = [];
  if (design.trace < tier.trace) fails.push(`trace ${design.trace} < ${tier.trace} mil`);
  if (design.spacing < tier.spacing) fails.push(`spacing ${design.spacing} < ${tier.spacing} mil`);
  if (design.drill < tier.drill) fails.push(`drill ${design.drill.toFixed(2)} < ${tier.drill.toFixed(2)} mm`);
  if (design.annularRing < tier.annularRing) fails.push(`annular ${design.annularRing} < ${tier.annularRing} mil`);
  return { tier, fits: fails.length === 0, fails };
}
