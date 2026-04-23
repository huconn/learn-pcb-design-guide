import type { Cap } from './impedance';

export type CapKind = 'bulk' | 'mid' | 'hf';

export type NamedCap = Cap & { kind: CapKind; label: string };

export const CAP_100NF: NamedCap = {
  kind: 'hf',
  label: '100 nF (ceramic, 0402)',
  C: 100e-9,
  ESL: 0.5e-9,
  ESR: 0.02,
};

export const CAP_10UF: NamedCap = {
  kind: 'mid',
  label: '10 μF (ceramic, 0603)',
  C: 10e-6,
  ESL: 1.0e-9,
  ESR: 0.01,
};

export const CAP_100UF_BULK: NamedCap = {
  kind: 'bulk',
  label: '100 μF (polymer bulk)',
  C: 100e-6,
  ESL: 2.5e-9,
  ESR: 0.015,
};

export type CapMix = { cap: NamedCap; count: number };

export const MIX_PRESETS: { name: string; mix: CapMix[] }[] = [
  { name: '0개 (나쁜 예)', mix: [] },
  { name: '0.1μF × 1', mix: [{ cap: CAP_100NF, count: 1 }] },
  {
    name: '0.1μF × 4 + 10μF × 1',
    mix: [
      { cap: CAP_100NF, count: 4 },
      { cap: CAP_10UF, count: 1 },
    ],
  },
  {
    name: '권장 풀세트 (100μF + 10μF + 100nF×4)',
    mix: [
      { cap: CAP_100UF_BULK, count: 1 },
      { cap: CAP_10UF, count: 1 },
      { cap: CAP_100NF, count: 4 },
    ],
  },
];

export const LOAD_PRESETS: { name: string; step: number; rise: number }[] = [
  { name: 'soft (0.5A / 50ns)', step: 0.5, rise: 50e-9 },
  { name: 'typical (1A / 10ns)', step: 1.0, rise: 10e-9 },
  { name: 'aggressive (3A / 2ns)', step: 3.0, rise: 2e-9 },
];
