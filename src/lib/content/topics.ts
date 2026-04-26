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

export const THERMAL: Topic = {
  slug: 'thermal',
  title: 'Thermal Management',
  subtitle: '발열 → junction 온도 · 방열 비아 · 동박 영역',
  category: '90 · PRACTICAL',
  readingMinutes: 8,
  level: '초급~중급',
  status: 'published',
};

export const BUCK_LAYOUT: Topic = {
  slug: 'buck-layout-deep-dive',
  title: 'Buck Layout 심화 · Snubber',
  subtitle: 'SW 노드 ringing · snubber RC · FB 트레이스',
  category: '01 · POWER INTEGRITY',
  readingMinutes: 9,
  level: '중급',
  status: 'published',
};

export const BMS_MOSFET: Topic = {
  slug: 'bms-mosfet',
  title: 'BMS · 고전류 MOSFET 스위칭',
  subtitle: 'Back-to-back · I²R 발열 · Kelvin 라우팅',
  category: '90 · PRACTICAL',
  readingMinutes: 10,
  level: '중급',
  status: 'published',
};

export const EMI_RADIATION: Topic = {
  slug: 'emi-radiation',
  title: 'EMI · Radiation',
  subtitle: '공통모드 · 페라이트 비드 · FCC/CE 한계',
  category: '03 · GROUNDING',
  readingMinutes: 8,
  level: '중급',
  status: 'published',
};

export const DFM: Topic = {
  slug: 'dfm',
  title: 'DFM · 제조 한계',
  subtitle: 'Fab 능력 표 + 내 디자인 호환성 체크',
  category: '90 · PRACTICAL',
  readingMinutes: 7,
  level: '초급~중급',
  status: 'published',
};

export const CRYSTAL_LAYOUT: Topic = {
  slug: 'crystal-layout',
  title: 'Crystal · 오실레이터',
  subtitle: 'Pierce 회로 · load cap · 가드 링',
  category: '90 · PRACTICAL',
  readingMinutes: 6,
  level: '초급~중급',
  status: 'published',
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

export const OHMS_LAW: Topic = {
  slug: 'ohms-law',
  title: 'Ohm의 법칙 · 전력 · 분압',
  subtitle: 'V = I·R, P = V·I — 한 번 더 챙기는 기초',
  category: '00 · FUNDAMENTALS',
  readingMinutes: 4,
  level: '초급',
  status: 'published',
};

export const AC_COUPLING: Topic = {
  slug: 'ac-coupling',
  title: 'AC 커플링 · 바이패스 캡',
  subtitle: 'DC 는 막고 AC 만 통과 — RC 1차 필터',
  category: '00 · FUNDAMENTALS',
  readingMinutes: 6,
  level: '초급',
  status: 'published',
  subpages: [
    { slug: 'basics', label: '기초 · 개념', href: '/ac-coupling/basics' },
    { slug: 'lab',    label: '실험실 · HPF', href: '/ac-coupling' },
  ],
};

export const ESD_PROTECTION: Topic = {
  slug: 'esd-protection',
  title: 'ESD Protection',
  subtitle: 'TVS · 커넥터 옆 배치 · IEC 61000-4-2',
  category: '03 · GROUNDING',
  readingMinutes: 7,
  level: '초급~중급',
  status: 'published',
};

export const CROSSTALK: Topic = {
  slug: 'crosstalk',
  title: 'Crosstalk · NEXT/FEXT',
  subtitle: '인접 트레이스 사이 결합 — 시간 영역 동작',
  category: '02 · SIGNAL INTEGRITY',
  readingMinutes: 9,
  level: '중급',
  status: 'published',
  subpages: [
    { slug: 'basics', label: '기초 · 개념',  href: '/crosstalk/basics' },
    { slug: 'lab',    label: '실험실 · 시뮬', href: '/crosstalk' },
  ],
};

export const VRM_SELECTION: Topic = {
  slug: 'vrm-selection',
  title: 'VRM Selection · Buck Layout',
  subtitle: 'LDO vs Switching — 스펙 읽기와 핫 루프',
  category: '01 · POWER INTEGRITY',
  readingMinutes: 9,
  level: '중급',
  status: 'published',
  subpages: [
    { slug: 'basics', label: '기초 · 개념',  href: '/vrm-selection/basics' },
    { slug: 'lab',    label: '실험실 · 효율', href: '/vrm-selection' },
  ],
};

export const PDN_PLANNING: Topic = {
  slug: 'pdn-planning',
  title: 'PDN Planning',
  subtitle: '전체 PDN 계획 — 스택업 · 타겟 임피던스 · plane 자원',
  category: '01 · POWER INTEGRITY',
  readingMinutes: 11,
  level: '중급',
  status: 'published',
  subpages: [
    { slug: 'basics', label: '기초 · 개념',  href: '/pdn-planning/basics' },
    { slug: 'lab',    label: '실험실 · 타겟Z', href: '/pdn-planning' },
  ],
};

export const TOPICS: Topic[] = [
  DECOUPLING_CAPACITOR, RETURN_PATHS, IMPEDANCE_MATCHING, HIGH_SPEED_INTERFACES, TRACE_GEOMETRY,
  OHMS_LAW, AC_COUPLING, ESD_PROTECTION, CROSSTALK, VRM_SELECTION, PDN_PLANNING,
  CRYSTAL_LAYOUT, DFM, THERMAL, BUCK_LAYOUT, EMI_RADIATION, BMS_MOSFET,
];

/** Sidebar navigation tree — includes planned/coming-soon topics for visual richness */
export const CATEGORIES: Category[] = [
  {
    id: 'practical',
    name: 'Practical · 실전',
    topics: [TRACE_GEOMETRY, CRYSTAL_LAYOUT, HIGH_SPEED_INTERFACES, DFM, THERMAL, BMS_MOSFET],
  },
  {
    id: 'fundamentals',
    name: 'Fundamentals',
    topics: [OHMS_LAW, AC_COUPLING],
  },
  {
    id: 'power-integrity',
    name: 'Power Integrity',
    topics: [DECOUPLING_CAPACITOR, PDN_PLANNING, VRM_SELECTION, BUCK_LAYOUT],
  },
  {
    id: 'signal-integrity',
    name: 'Signal Integrity',
    topics: [IMPEDANCE_MATCHING, CROSSTALK],
  },
  {
    id: 'grounding-emc',
    name: 'Grounding & EMC',
    topics: [RETURN_PATHS, ESD_PROTECTION, EMI_RADIATION],
  },
];
