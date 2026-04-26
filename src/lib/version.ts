/**
 * Single source of truth for site version + release history.
 *
 * Format follows Keep a Changelog (https://keepachangelog.com/) with SemVer
 * (https://semver.org/) — pre-1.0 so the rule of thumb is:
 *   0.minor.patch
 *   - minor bumped when a new topic ships or major UX change
 *   - patch bumped for bug fixes / image swaps / wording
 *
 * Mirror of CHANGELOG.md at the project root.
 */

export type Release = {
  version: string;
  date: string;       // ISO yyyy-mm-dd
  added?: string[];
  changed?: string[];
  fixed?: string[];
  notes?: string;
};

export const RELEASES: Release[] = [
  {
    version: '0.5.0',
    date: '2026-04-27',
    notes: 'Power & safety chapter — three new topics on heat, switching, and isolation domains.',
    added: [
      'Thermal Management — junction temp + θ_JA enhancement model + via/copper-area calculator',
      'Buck Layout · 심화 — Sandler RC snubber design, FB trace, soft-start, spread-spectrum',
      'EMI · Radiation — DM/CM mechanism, ferrite-bead Bode plot widget, FCC/CE limits',
      'BMS · 고전류 MOSFET — back-to-back topology, iterative R_DS(T) thermal solver, Kelvin sense',
      'Galvanic Isolation — IEC 60664-1 creepage/clearance calculator, 4 isolator methods',
    ],
  },
  {
    version: '0.4.0',
    date: '2026-04-26',
    notes: 'Foundation tools + first wave of Practical topics + site-wide quality of life.',
    added: [
      'Crystal · 오실레이터 레이아웃 — Pierce circuit, load cap calculator',
      'DFM — fab capability table + design fit checker (Economy/Precision/HDI/Aerospace)',
      'Pagefind full-text search with ⌘K modal',
      'Mobile drawer navigation (sidebar slides in below lg breakpoint)',
      'Chip-shaped favicon (QFP)',
      'Author credit (hulryung / hulryung@gmail.com / x.com/hulryung)',
    ],
    changed: [
      'ECharts tree-shaken via shared setup module (~1 MB → ~520 KB main chunk; Lighthouse perf 0.64 → 0.99–1.00)',
    ],
  },
  {
    version: '0.3.0',
    date: '2026-04-25',
    notes: 'Curriculum completion — sidebar fully populated, no more SOON badges.',
    added: [
      'Ohm · 전력 · 분압 (Fundamentals)',
      'AC 커플링 · 바이패스 캡 (Fundamentals)',
      'ESD Protection (Grounding & EMC) — IEC 61000-4-2 + TVS layout',
      'Crosstalk · NEXT/FEXT (Signal Integrity) — time-domain coupling sim',
      'VRM Selection · Buck Layout (Power Integrity) — efficiency loss breakdown',
      'PDN Planning (Power Integrity) — target Z + plane resonance',
      '고속 인터페이스 설계 (Practical) — USB/HDMI/GbE comparison',
      'Trace Geometry · Lab — 4 calculators (width/Z₀/Z_diff/crosstalk)',
      'Image generation prompt doc (docs/image-prompts.md) for ChatGPT Image 2.0',
    ],
  },
  {
    version: '0.2.0',
    date: '2026-04-24',
    notes: 'First topic neighbours — Power Integrity expansion + new Signal Integrity / Grounding sections.',
    added: [
      'Return Paths · Ground Bounce (Grounding & EMC) — loop inductance calculator',
      'Impedance Matching (Signal Integrity) — bounce-diagram reflection simulator',
      'Decoupling: split into basics (concept) + lab (interactive) subpages',
      'Measurement Gallery with simulated scope captures',
      'Topic-level basics/lab subpage convention',
    ],
  },
  {
    version: '0.1.0',
    date: '2026-04-23',
    notes: 'Initial release.',
    added: [
      'Decoupling Capacitor — first topic with concept + interactive sims',
      'PDN impedance Bode plot (PdnImpedance widget)',
      'Time-domain Vdd ripple (TimeDomainScope widget)',
      'Sidebar navigation, KpiStrip, Card layout',
      'Astro + Svelte + Tailwind v4 + ECharts foundation',
    ],
  },
];

export const SITE_VERSION = RELEASES[0].version;
export const RELEASE_DATE = RELEASES[0].date;
