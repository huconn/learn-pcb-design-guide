export type SubPage = {
  slug: string;        // e.g. 'basics' (empty string for the topic root)
  label: string;       // sidebar label, e.g. '기초'
  href: string;        // absolute path
};

export type Topic = {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  readingMinutes: number;
  level: '초급' | '초급~중급' | '중급' | '중급~고급';
  status: 'draft' | 'published' | 'coming-soon';
  subpages?: SubPage[];
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
  subpages: [
    { slug: 'basics', label: '기초 · 개념',  href: '/decoupling-capacitor/basics' },
    { slug: 'lab',    label: '실험실 · 시뮬', href: '/decoupling-capacitor' },
  ],
};

export const RETURN_PATHS: Topic = {
  slug: 'return-paths',
  title: 'Return Paths · Ground Bounce',
  subtitle: '전류는 항상 루프로 돌아온다 — 돌아올 길을 설계하자',
  category: '03 · GROUNDING',
  readingMinutes: 8,
  level: '초급~중급',
  status: 'published',
  subpages: [
    { slug: 'basics', label: '기초 · 개념',  href: '/return-paths/basics' },
    { slug: 'lab',    label: '실험실 · 계산', href: '/return-paths' },
  ],
};

export const IMPEDANCE_MATCHING: Topic = {
  slug: 'impedance-matching',
  title: 'Impedance Matching',
  subtitle: '신호는 파동 — Z 가 변하는 지점에서 반사한다',
  category: '02 · SIGNAL INTEGRITY',
  readingMinutes: 9,
  level: '중급',
  status: 'published',
  subpages: [
    { slug: 'basics', label: '기초 · 개념',  href: '/impedance-matching/basics' },
    { slug: 'lab',    label: '실험실 · 반사', href: '/impedance-matching' },
  ],
};

export const HIGH_SPEED_INTERFACES: Topic = {
  slug: 'high-speed-interfaces',
  title: '고속 인터페이스 설계',
  subtitle: 'USB · HDMI · Ethernet — 어떤 값을 기준으로 라우팅하나',
  category: '90 · PRACTICAL',
  readingMinutes: 10,
  level: '중급',
  status: 'published',
  // No subpages — single reference page
};

export const TRACE_GEOMETRY: Topic = {
  slug: 'trace-geometry',
  title: '트레이스 기하 · Geometry',
  subtitle: '폭 · 간격 · 두께 — 임피던스와 전류용량을 결정한다',
  category: '90 · PRACTICAL',
  readingMinutes: 8,
  level: '초급~중급',
  status: 'published',
  subpages: [
    { slug: 'basics', label: '기초 · 개념',  href: '/trace-geometry/basics' },
    { slug: 'lab',    label: '실험실 · 계산기', href: '/trace-geometry' },
  ],
};

export const TOPICS: Topic[] = [DECOUPLING_CAPACITOR, RETURN_PATHS, IMPEDANCE_MATCHING, HIGH_SPEED_INTERFACES, TRACE_GEOMETRY];

/** Sidebar navigation tree — includes planned/coming-soon topics for visual richness */
export const CATEGORIES: Category[] = [
  {
    id: 'practical',
    name: 'Practical · 실전',
    topics: [TRACE_GEOMETRY, HIGH_SPEED_INTERFACES],
  },
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
      IMPEDANCE_MATCHING,
      { slug: 'crosstalk',          title: 'Crosstalk',          subtitle: '', category: '02 · SIGNAL INTEGRITY', readingMinutes: 10, level: '중급~고급', status: 'coming-soon' },
    ],
  },
  {
    id: 'grounding-emc',
    name: 'Grounding & EMC',
    topics: [
      RETURN_PATHS,
      { slug: 'esd',          title: 'ESD Protection',            subtitle: '', category: '03 · GROUNDING', readingMinutes: 8,  level: '초급~중급', status: 'coming-soon' },
    ],
  },
];
