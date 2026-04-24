export type Topic = {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  readingMinutes: number;
  level: '초급' | '초급~중급' | '중급' | '중급~고급';
  status: 'draft' | 'published' | 'coming-soon';
};

export type Category = {
  id: string;
  name: string;
  topics: Topic[];
};

/** Currently published topic — single source of truth for layout props */
export const DECOUPLING_CAPACITOR: Topic = {
  slug: 'decoupling-capacitor',
  title: '디커플링 커패시터',
  subtitle: 'Design low-impedance PDN across frequency',
  category: '01 · POWER INTEGRITY',
  readingMinutes: 12,
  level: '초급~중급',
  status: 'published',
};

export const TOPICS: Topic[] = [DECOUPLING_CAPACITOR];

/** Sidebar navigation tree — includes planned/coming-soon topics for visual richness */
export const CATEGORIES: Category[] = [
  {
    id: 'fundamentals',
    name: 'Fundamentals',
    topics: [
      { slug: 'ohms-law',       title: 'Ohm의 법칙 복습',    subtitle: '', category: '00 · FUNDAMENTALS', readingMinutes: 4,  level: '초급', status: 'coming-soon' },
      { slug: 'ac-ac-coupling', title: 'AC 커플링 기초',      subtitle: '', category: '00 · FUNDAMENTALS', readingMinutes: 5,  level: '초급', status: 'coming-soon' },
    ],
  },
  {
    id: 'power-integrity',
    name: 'Power Integrity',
    topics: [
      DECOUPLING_CAPACITOR,
      { slug: 'pdn-planning',  title: 'PDN Planning',      subtitle: '', category: '01 · POWER INTEGRITY', readingMinutes: 14, level: '중급',     status: 'coming-soon' },
      { slug: 'vrm-selection', title: 'VRM Selection',     subtitle: '', category: '01 · POWER INTEGRITY', readingMinutes: 10, level: '중급',     status: 'coming-soon' },
    ],
  },
  {
    id: 'signal-integrity',
    name: 'Signal Integrity',
    topics: [
      { slug: 'impedance-matching', title: 'Impedance Matching', subtitle: '', category: '02 · SIGNAL INTEGRITY', readingMinutes: 12, level: '중급',   status: 'coming-soon' },
      { slug: 'crosstalk',          title: 'Crosstalk',          subtitle: '', category: '02 · SIGNAL INTEGRITY', readingMinutes: 10, level: '중급~고급', status: 'coming-soon' },
    ],
  },
  {
    id: 'grounding-emc',
    name: 'Grounding & EMC',
    topics: [
      { slug: 'return-paths', title: 'Return Paths / GND Bounce', subtitle: '', category: '03 · GROUNDING', readingMinutes: 12, level: '중급', status: 'coming-soon' },
      { slug: 'esd',          title: 'ESD Protection',            subtitle: '', category: '03 · GROUNDING', readingMinutes: 8,  level: '초급~중급', status: 'coming-soon' },
    ],
  },
];
