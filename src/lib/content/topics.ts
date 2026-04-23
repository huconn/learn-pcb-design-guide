export type Topic = {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  readingMinutes: number;
  level: '초급' | '초급~중급' | '중급' | '중급~고급';
  status: 'draft' | 'published';
};

export const TOPICS: Topic[] = [
  {
    slug: 'decoupling-capacitor',
    title: '디커플링 커패시터 (Decoupling Capacitor)',
    subtitle:
      'IC 옆에 작은 커패시터 하나 붙이는 그 관행. 왜 필요한가, 몇 개면 충분한가, 어디에 놓아야 하는가.',
    category: '01 · POWER INTEGRITY',
    readingMinutes: 12,
    level: '초급~중급',
    status: 'published',
  },
];
