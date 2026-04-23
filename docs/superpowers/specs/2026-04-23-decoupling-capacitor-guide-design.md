# Hardware PCB Design Guide — Decoupling Capacitor 페이지 설계

**날짜**: 2026-04-23
**상태**: 설계 승인 완료 (구현 계획 착수 전)
**스코프**: 첫 릴리즈 (Decoupling Capacitor 토픽 1개, 향후 토픽의 템플릿 겸용)

---

## 1. 목적과 독자

하드웨어 설계 리뷰 시 반복적으로 확인해야 하는 항목들을 **직관적으로 이해하고 → 만져보면서 체득하고 → 실측으로 검증할 수 있는** 인터랙티브 웹 가이드를 만든다.

**주 독자**:
- 주니어 HW 엔지니어 — 기본 원리부터 물리적 직관 중심으로 배우고 싶은 층
- SW/FW 개발자·메이커 — 전자기학 배경 없이도 HW를 이해하려는 층

**사이트 전체 장기 방향**: Decoupling cap, PDN planning, Signal integrity, Ground/return path, ESD 등 하드웨어 리뷰 토픽들의 시리즈. 이번 첫 릴리즈는 **Decoupling Capacitor 한 토픽을 끝까지 완성**하여 후속 토픽의 템플릿을 확립한다.

## 2. 콘텐츠 철학 — 3단 레이어

모든 토픽 페이지는 같은 학습 여정을 따른다.

1. **Layer 1 · 개념** — 정적/간단 애니메이션 일러스트로 "왜 필요한가"를 직관화. 비유와 그림 중심, 수식 최소.
2. **Layer 2 · 탐색** — 브라우저 내 실시간 시뮬레이션. 독자가 파라미터를 슬라이더로 만져보며 관계를 체득.
3. **Layer 3 · 검증** — 실제 기판 위 오실로스코프 실측 이미지/데이터. Layer 1·2의 주장을 현실 측정으로 뒷받침. 초기엔 placeholder 로 시작해 점진 보강.

각 레이어는 서로를 보강한다. 전자기학 배경이 없는 독자도 Layer 1로 "아하!" 를, Layer 2 로 "내가 만져봄"을, Layer 3 로 "현실에서도 그렇다"를 얻게 한다.

## 3. 페이지 구조 — 스크롤 여정

Decoupling Capacitor 페이지 구성 (위→아래):

| # | 섹션 | 레이어 | 목적 |
|---|---|---|---|
| HERO | 토픽명 · 예상 소요 시간 · 난이도 배지 | — | 맥락 설정 |
| §1 | TL;DR | — | "바쁜 사람만" 3줄 요약 + 체크리스트 프리뷰 |
| §2 | 왜 필요한가? (저수지 비유) | Layer 1 | 물리적 직관 |
| §3 | 시간영역 시뮬레이션 — cap 개수/값/load 바꿔보기 | Layer 2 | "얼마나 출렁이는가" 체험 |
| §4 | 주파수영역 시뮬레이션 — PDN Z(f) · 다중 cap | Layer 2 | "왜 여러 값 섞는가" (anti-resonance) |
| §5 | 실측 갤러리 | Layer 3 | 현실 검증 (점진 채움) |
| §6 | 설계 리뷰 체크리스트 | — | 실무용 · 각 항목은 위 섹션으로 앵커 링크 |
| §7 | 더 깊이 / 다음 토픽 | — | 레퍼런스 · 피드백 · 연계 |

## 4. Layer 1 — 개념 섹션 상세

§2 에 들어갈 세 개의 일러스트 (모두 인라인 SVG):

- **A1 · 회로 애니메이션** — VRM → 긴 트레이스(L) → IC · 옆에 cap. IC 전류 땡김 → cap 먼저 공급 → VRM 뒤따름. 화살표 애니메이션이 반복.
- **A2 · 저수지 비유** — "VRM = 먼 댐, 트레이스 = 긴 파이프, cap = 동네 물탱크, IC = 샤워기" 를 같은 타이밍에 맞춰 움직임. 비기술 독자용 입구.
- **A3 · 주파수 담당 구역** — bulk(저주파) / 10μF(중주파) / 100nF(고주파) 의 커버 구간을 색띠로 표현. Layer 2 주파수영역의 예고편.

본문은 짧게 유지. 수식은 금지 (Layer 2에서 등장).

## 5. Layer 2 — 시뮬레이션 상세

두 개의 독립 컴포넌트. 둘 다 브라우저에서 100% JS 계산.

### 5.1 시간영역 시뮬 (`<TimeDomainScope />`)

**수학 모델**: 단일 노드 근사
```
C_total · dV/dt = I_VRM(t) − I_load(t)
I_VRM = (V_target − V) / R_vrm − L_vrm · dI_VRM/dt
```
Load 는 step 혹은 주기 펄스.

**수치적분**: RK4. `dt = 1 ns`, 윈도우 약 10 μs.

**사용자 조작**:
- Cap 개수 슬라이더 (0 ~ 8)
- Cap 값 선택 (100 nF / 1 μF / 10 μF / mix 프리셋)
- Load step ΔI (0.1 A ~ 5 A)
- Load rise time (1 ns ~ 100 ns)

**출력**: 스코프 스타일 2채널 플롯 (Vdd 파형 + load current). 현재 설정의 피크-투-피크 리플을 mV 배지로 실시간 표시.

**프리셋 버튼** 3~4개: "0개 (나쁜 예)" / "0.1μF × 1" / "0.1μF × 4 + 10μF × 1" / "권장 풀세트".

### 5.2 주파수영역 시뮬 (`<PdnImpedance />`)

**수학 모델**: 각 cap 의 임피던스
```
Z_cap = ESR + jωL_esl + 1/(jωC)
```
병렬 합성 `1/Z_total = Σ 1/Z_i`. VRM 출력 임피던스 모델 포함 (저주파 영역).

**주파수 범위**: 10 Hz ~ 1 GHz, 로그 스케일 Bode plot (Z magnitude).

**사용자 조작**: cap 그룹 on/off 토글
- **Bulk 100 μF**
- **10 μF × N**
- **100 nF × N**
- **VRM only**

**시각적 요소**:
- 각 그룹 기여를 **색 분리 파선** + 합성 **실선**
- **타겟 임피던스 수평선** (기본 50 mΩ) — "이 선 아래면 OK" 기준
- **Anti-resonance 피크에 자동 마커 + 툴팁** (예: "180 MHz에서 피크 180 mΩ — 이 주파수에서 최악")
- ESR 는 초기엔 부품 타입 디폴트 고정 (이후 업데이트에서 노출)

### 5.3 시뮬의 정확도 기준과 책임 명시

이 시뮬은 **교육용 직관 모델**이다. 페이지에 명시한다:
> SPICE 수준 정확도를 목표로 하지 않음. 수치는 ±30% 정도 맞도록 설계. 실제 설계 검증은 SPICE·측정 필수.

## 6. Layer 3 — 검증 갤러리

`<MeasurementGallery />` 는 단순한 사진 비교 그리드.
- 4 개 슬롯: "0 caps" / "1 cap" / "4 caps" / "4 caps + bulk"
- 각 슬롯: 오실로스코프 스크린샷 + 설정값(time/div, V/div) + 측정 요약(Vpp 리플)
- 초기엔 **placeholder + "직접 측정해보세요" 가이드 박스** 로 대체
- 사진 추가는 `public/verify/` 에 PNG 를 두고 MDX에서 참조

## 7. 기술 스택

| 계층 | 선택 | 이유 |
|---|---|---|
| 사이트 생성기 | **Astro 4.x** | 콘텐츠 정적 렌더 + 인터랙티브 부분만 island 하이드레이트. 페이지별 JS 최소화. |
| 인터랙티브 island | **Svelte 5** | 컴팩트, 반응성 간결, Astro 친화. |
| 언어 | **TypeScript** | 시뮬레이션 수학 안정성. |
| 스타일 | **Tailwind CSS** | 유틸리티 일관성, 듀얼 카드(라이트 페이지 + 다크 차트) 표현 빠름. |
| 차트 | **Apache ECharts 5.x** | 로그-로그(Bode) 축 1급, `markPoint`/`markArea` 로 anti-resonance 콜아웃, 충분한 성능, 문서 풍부, 한 라이브러리로 시간+주파수 모두 처리. |
| 콘텐츠 | **MDX** | 마크다운 + 중간에 Astro/Svelte 컴포넌트 삽입. |
| 수식 | **KaTeX** | 빌드타임 렌더, 런타임 비용 0. |
| 테스트 | **Vitest** + Testing Library | Astro·Svelte 표준. |
| 호스팅 | 정적 (GitHub Pages / Vercel / Netlify 중 택1, 첫 릴리즈는 임의) | Astro 결과물이 순수 정적. |

## 8. 프로젝트 구조

```
hardware-pcb-design-guide/
├─ src/
│  ├─ pages/
│  │  ├─ index.astro                  # 토픽 목록 (향후 확장)
│  │  └─ decoupling-capacitor.mdx     # 본 페이지
│  ├─ layouts/
│  │  └─ TopicLayout.astro            # 공통 레이아웃 (hero/목차/푸터)
│  ├─ components/
│  │  ├─ concept/                     # Layer 1 · SVG 애니메이션
│  │  │  ├─ ReservoirAnalogy.astro
│  │  │  ├─ CurrentWaveAnimation.astro
│  │  │  └─ FrequencyBandMap.astro
│  │  ├─ sim/                         # Layer 2 · Svelte islands
│  │  │  ├─ TimeDomainScope.svelte
│  │  │  ├─ PdnImpedance.svelte
│  │  │  └─ shared/
│  │  │     ├─ Slider.svelte
│  │  │     └─ ChartCard.svelte       # 다크 카드 래퍼
│  │  ├─ verify/
│  │  │  └─ MeasurementGallery.astro  # Layer 3
│  │  └─ ui/
│  │     ├─ ChecklistBlock.astro      # §6
│  │     ├─ TlDrBlock.astro           # §1
│  │     └─ SectionHeader.astro
│  ├─ lib/
│  │  ├─ pdn/                         # 순수 함수 · 단위 테스트 대상
│  │  │  ├─ impedance.ts              # Z(f) 합성
│  │  │  ├─ timeDomain.ts             # RK4 solver
│  │  │  └─ presets.ts                # cap 프리셋 정의
│  │  └─ content/
│  │     └─ topics.ts                 # 토픽 메타 (제목/시간/난이도)
│  └─ styles/
│     └─ global.css
├─ public/
│  └─ verify/                         # 실측 이미지 (나중에 채움)
├─ tests/
│  └─ pdn/
│     ├─ impedance.test.ts
│     └─ timeDomain.test.ts
├─ astro.config.mjs
├─ tailwind.config.mjs
├─ tsconfig.json
└─ package.json
```

**템플릿화 전략**: `TopicLayout.astro` + `decoupling-capacitor.mdx` 가 후속 토픽의 본보기. 다음 토픽을 만들 때 새 MDX 파일에 같은 7 섹션 구조를 따른다. 공통 UI 블록은 `components/ui/` 로 추출하여 재사용.

## 9. 비주얼 & 톤

- **전체 라이트 테마**. 본문·UI 모두 밝은 배경.
- **차트 캔버스만 다크 카드**: `slate-950` 배경에 가는 그리드, rounded corner. "여기는 계측/측정 구간" 이라는 시각적 기호. `ChartCard.svelte` 로 감싼다.
- **파형 색 토큰** (전 토픽 공통):
  - `--trace-primary: #0284c7` (sky-600) — Vdd 등 기본 관심 신호
  - `--trace-warn: #db2777` (pink-600) — "no cap / bad" 비교 트레이스
  - `--trace-ok: #059669` (emerald-600) — 실측/권장 상태
  독자가 색 하나로 상태를 학습하도록 일관 유지.
- **수식은 블록 + 한 줄 캡션**. 인라인 수식 지양 (가독성).
- **반응형**: 모바일에서 슬라이더는 터치 조작, 차트는 너비 기반 스케일. 가로 스크롤은 허용 (차트 정보 보존).
- **접근성**: 빨강-초록 동시 사용 금지 (파란-핑크 대비 채택), 슬라이더 키보드 조작, 차트에 `aria-label` 로 현재 수치 요약 제공.

## 10. 테스트 전략

- **단위 테스트** (`tests/pdn/`) — 순수 함수만.
  - `impedance.ts`: 단일 cap 의 self-resonant frequency = `1/(2π√(L·C))` 와 수치 일치 검증 (오차 < 1%).
  - `impedance.ts`: 병렬 합성 공식이 저·고주파 극한에서 지배항과 일치.
  - `timeDomain.ts`: RC 스텝 응답이 τ = RC 시점에 63% 도달.
- **컴포넌트 스모크** (Vitest + Testing Library) — 슬라이더 이벤트가 차트 데이터 업데이트를 트리거하는지 1~2 개.
- **빌드 CI**: `astro build` + `tsc --noEmit`.
- **접근성 스모크**: axe-core 로 페이지 한 번 통과.
- **시각적 회귀 테스트는 도입하지 않는다** (콘텐츠 성격상 사람 검토가 더 효율적).

## 11. 범위 경계 — 명시적으로 "안 한다"

- SPICE 급 정확도 시뮬 — 우리는 교육용 직관 모델
- Parasitic 배치 효과 (via 위치, trace length → ESL 증가) — **향후 업데이트 C** 로 연기
- 다른 토픽 페이지(PDN planning, SI, GND, ESD …) — 템플릿만 준비, 콘텐츠는 차기 릴리즈
- 회원/댓글/검색/CMS — 정적 사이트 원칙 유지
- 실측 이미지 — 장비 준비되면 추가. 초기엔 placeholder + "직접 측정" 가이드

## 12. 성공 기준 (이 릴리즈가 "완료" 되는 조건)

1. `/decoupling-capacitor` 페이지가 7 개 섹션 (HERO·§1~§7) 모두 동작.
2. 시간영역 시뮬: cap 개수 0 → 1 → 4 변경 시 리플 감소가 눈으로 명확.
3. 주파수영역 시뮬: 100nF 만 / 10μF 만 / 혼용 토글 시 **anti-resonance 피크가 가시화**되고 혼용 상태에서 타겟 임피던스 선 아래로 떨어진다.
4. 모바일 (iOS Safari, Android Chrome) 에서 슬라이더·차트 정상 동작.
5. Lighthouse: Performance ≥ 90, Accessibility ≥ 95.
6. 다음 토픽 추가 절차가 README 에 문서화되고, 새 MDX 파일 하나로 시작 가능함이 확인됨.

## 13. 용어 · 언어 규칙

- 본문 언어: **한국어**
- 기술 용어는 첫 등장 시 영문 병기: "디커플링 커패시터 (Decoupling Capacitor)"
- 단위/수식은 영문/SI 그대로 (μF, Ω, MHz)
- 코드·파일명·식별자는 영문
