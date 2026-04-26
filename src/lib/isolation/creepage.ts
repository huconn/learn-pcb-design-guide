/**
 * IEC 60664-1 creepage (creepage distance) and clearance (air gap) lookup
 * for PCB design.
 *
 * Creepage = surface distance along the insulator between two conductors.
 * Clearance = shortest air gap between two conductors.
 *
 * Both depend on:
 *   - Working voltage (V_RMS)
 *   - Pollution degree (1 = clean, 2 = office, 3 = industrial)
 *   - For creepage: material group (I = best, IIIb = worst CTI)
 *
 * Tables here are simplified — based on IEC 60664-1 + UL 60950-1.
 * Always verify with the up-to-date standard for production designs.
 */

export type PollutionDegree = 1 | 2 | 3;
export type MaterialGroup = 'I' | 'II' | 'IIIa' | 'IIIb';
export type IsolationGrade = 'functional' | 'basic' | 'reinforced';

// Clearance (air gap), in mm — IEC 60664-1 table for pollution degree 2
// (most common). Linear interpolation between table rows.
const CLEARANCE_PD2: Array<[number, number]> = [
  [50,    0.20],
  [100,   0.20],
  [150,   0.50],
  [300,   1.50],
  [600,   3.00],
  [1000,  5.50],
  [1500, 14.00],
];

// Creepage (mm) for material group II at pollution degree 2 — table per
// IEC 60664-1. Other groups scale (I = ×0.8, IIIa = ×1.25, IIIb = ×1.6).
const CREEPAGE_PD2_MII: Array<[number, number]> = [
  [50,    0.6],
  [100,   0.71],
  [150,   1.10],
  [200,   1.40],
  [250,   1.80],
  [300,   2.20],
  [400,   2.80],
  [500,   3.60],
  [600,   4.50],
  [800,   5.60],
  [1000,  7.10],
  [1250, 10.00],
  [1600, 12.50],
];

const MATERIAL_GROUP_FACTOR: Record<MaterialGroup, number> = {
  'I':    0.8,
  'II':   1.0,
  'IIIa': 1.25,
  'IIIb': 1.6,
};

const POLLUTION_FACTOR: Record<PollutionDegree, number> = {
  1: 0.6,
  2: 1.0,
  3: 1.4,
};

function interpolate(table: Array<[number, number]>, v: number): number {
  if (v <= table[0][0]) return table[0][1];
  if (v >= table[table.length - 1][0]) return table[table.length - 1][1];
  for (let i = 1; i < table.length; i++) {
    const [v1, d1] = table[i - 1];
    const [v2, d2] = table[i];
    if (v >= v1 && v <= v2) {
      const t = (v - v1) / (v2 - v1);
      return d1 + t * (d2 - d1);
    }
  }
  return table[table.length - 1][1];
}

export function clearanceMm(workingV: number, pollution: PollutionDegree, grade: IsolationGrade): number {
  const base = interpolate(CLEARANCE_PD2, workingV) * POLLUTION_FACTOR[pollution];
  if (grade === 'reinforced') return base * 2;
  return base;
}

export function creepageMm(
  workingV: number,
  pollution: PollutionDegree,
  material: MaterialGroup,
  grade: IsolationGrade,
): number {
  const base = interpolate(CREEPAGE_PD2_MII, workingV)
    * POLLUTION_FACTOR[pollution]
    * MATERIAL_GROUP_FACTOR[material];
  if (grade === 'reinforced') return base * 2;
  return base;
}
