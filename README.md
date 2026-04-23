# Hardware PCB Design Guide

주니어 하드웨어 엔지니어와 SW/FW 개발자를 위한 인터랙티브 하드웨어 설계 리뷰 가이드.

## 개발

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # dist/
npm test         # vitest unit tests
```

## 아키텍처

- Astro + Svelte 5 (인터랙티브 섹션만 island)
- Apache ECharts (시간·주파수 차트 통일)
- MDX 로 토픽 작성, 공통 레이아웃 `src/layouts/TopicLayout.astro`
- PDN 수학은 `src/lib/pdn/` 에 순수 함수로 (vitest 로 단위 테스트)

## 새 토픽 추가하기

1. `src/lib/content/topics.ts` 에 `Topic` 엔트리 추가
2. `src/pages/<slug>.mdx` 생성. `decoupling-capacitor.mdx` 복사 후 수정. **주의**: import 들은 파일 최상단에 두고 `---` frontmatter 펜스로 감싸지 말 것 (Astro MDX의 import 해석 이슈).
3. 7 섹션 구조 유지 (HERO · §1 TL;DR · §2 개념 · §3 탐색1 · §4 탐색2 · §5 검증 · §6 체크리스트 · §7 더 깊이)
4. 필요한 일러스트는 `src/components/concept/<Topic>*.astro` 로
5. 필요한 인터랙티브는 `src/components/sim/<Topic>*.svelte` 로 (ECharts 패턴 따라)

## 디자인 철학 (3-레이어)

1. **개념 (Layer 1)** — SVG 일러스트로 직관
2. **탐색 (Layer 2)** — 슬라이더로 "내가 만져봄"
3. **검증 (Layer 3)** — 실측으로 "현실에서도 그렇다"

시뮬레이션은 교육용 직관 모델. SPICE 수준 정확도 아님. 수치는 ±30% 정도만 신뢰할 것.

## 라이선스

(초기 릴리즈 시 결정 예정)
