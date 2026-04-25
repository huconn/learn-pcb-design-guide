# 추가 토픽 / 콘텐츠 확장 계획

현재 11개 토픽으로 PCB 설계의 SI / PI / EMC 의 핵심 골조는 잡혀있습니다. 이 문서는 **다음에 무엇을 추가하면 가치가 클지** 조사한 결과입니다.

---

## 현재 커버리지 (스냅샷)

| 카테고리 | 토픽 |
|--|--|
| Practical | Trace Geometry · High-speed interfaces |
| Fundamentals | Ohm 의 법칙 · AC 커플링 |
| Power Integrity | Decoupling · PDN Planning · VRM Selection |
| Signal Integrity | Impedance Matching · Crosstalk |
| Grounding & EMC | Return Paths · ESD Protection |

---

## 빈 영역 (Gap analysis)

PCB 설계 가이드 표준 커리큘럼과 비교했을 때 **명백히 빠진** 영역:

### A. 제조 / 물리 영역 (전혀 없음)
- **DFM (Design for Manufacturing)** — fab 의 제약 (최소 폭/드릴/spacing) 을 알고 그려야 양산 가능. 현재 Trace Geometry 계산기가 "이론값" 만 주는데 fab 능력과 비교가 없음.
- **Thermal Management** — 트레이스/IC 발열, theta-JA, 방열 비아, 동박 영역. Power 토픽이 효율은 다루지만 발열은 없음.
- **Mechanical / 보드 외곽** — 마운팅 홀, edge clearance, 패널라이제이션 — 거의 모든 실 설계에서 나오는 이슈.

### B. 회로 블록 단위 (작지만 자주 헤매는 곳)
- **Crystal / 오실레이터 레이아웃** — load cap 공식, ground guard ring, 트레이스 길이 — 거의 모든 MCU 설계에서 만나지만 실수 잦음.
- **Clock Distribution** — 클럭이 여러 IC 로 가는 fanout, 버퍼 선택, 길이 매칭. Crosstalk · Impedance matching 의 자연스러운 연장.
- **Reset / Power-on 회로** — RC 시상수, supervisor IC, sequencing.
- **I2C / SPI 버스 설계** — 풀업 사이징, 라우팅, 다중 디바이스.

### C. 전원 영역 심화
- **Buck Converter Layout 심화** — VRM Selection 이 추상적이라면, "실제 LM3489/TPS54xxx 같은 IC 데이터시트의 PCB 가이드 따라하기" 가 빠짐.
- **Multi-rail Sequencing** — 여러 전원이 켜지는 순서. Power-on 이슈 생기면 자주 만남.
- **Battery / Power Path** — 충전 IC + 배터리 + 시스템 부하의 path 매니지먼트.

### D. 신호 인터페이스 심화
- **DDR 메모리 라우팅** — fly-by vs T 토폴로지, address-to-clock skew, ZQ. 실 SoC 설계에서 가장 까다로운 부분.
- **Eye Diagram / Jitter** — 고속 신호의 품질 지표. Impedance Matching 의 자연스러운 다음 토픽.
- **EMI Radiation** — ESD 와 다른 도메인. 공통모드, 차폐, 페라이트 비드. 인증 시험 통과 관점.

### E. 사이트 도구 / UX 측면 (콘텐츠 외)
- **검색 기능** — 토픽 11개 넘어가니 grep 이 필요해짐.
- **다크모드** — 모니터 작업 시간 긴 엔지니어 대상이라 가치 있음.
- **PDF / Print stylesheet** — 리뷰 회의에 출력해 들고가는 워크플로.
- **YouTube 영상 큐레이션** — 컴포넌트는 있고 콘텐츠 없음. Phil's Lab, Eric Bogatin 등 추천 영상 5–10개.

---

## 추천 우선순위 (Tier 1)

가치 × 부담 × 기존 토픽과의 시너지 기준. 각각 basics + lab 또는 단일 페이지로 가능.

### 1. **Thermal Management** ★★★★★
**왜**: 현재 사이트에 발열 계산이 전혀 없음. Trace Geometry 의 폭 계산기가 "전류 → 온도 상승" 까지 가는데, IC 자체 발열 / 방열 비아는 빠져있음. 매우 흔한 실수 영역.

**구성**:
- Basics: 발열 메커니즘 (P → ΔT), theta-JA / theta-JC 의미, 방열 경로 (PCB plane / 열 비아 / 히트싱크), copper pour 효과
- Lab:
  - **IC 발열 계산기** — power dissipation + theta-JA → junction temp. 데이터시트의 thermal pad spec 입력 → 필요한 plane 면적 추산
  - **방열 비아 효과 시각화** — via 개수 vs 효과 곡선

**연결**: VRM (효율 → 손실 → 발열), Trace Geometry (전류 → 트레이스 발열), Decoupling (cap 과 발열 무관 — 간접만)

### 2. **Crystal / 오실레이터 레이아웃** ★★★★★
**왜**: 거의 모든 MCU/SoC 설계에서 나오지만 실수 잦은 작은 영역. 이미 만든 토픽들의 빈 자리를 잘 메움.

**구성**:
- 단일 페이지 (basics 만):
  - Pierce 오실레이터 회로
  - Load capacitance 계산: C_L = (C1·C2)/(C1+C2) + C_stray
  - 가드 링, 신호 트레이스 분리, 전용 GND 영역
  - Common pitfall: 트레이스 옆에 다른 신호가 지나가서 jitter 추가
- Lab 위젯: Load cap 계산기 (crystal 사양 + 스트레이 추정 → C1/C2 권장값)

**연결**: Trace Geometry (격리 거리), Crosstalk (외부 결합), Return Paths (가드 링)

### 3. **DFM (Design for Manufacturing)** ★★★★
**왜**: Trace Geometry 계산기가 "이론적으로 50 Ω 이 되는 폭" 을 주는데, 실제 fab 의 최소 폭 (예: JLCPCB economy 4 mil) 보다 작으면 만들 수 없음. 이론 ↔ 현실 갭을 메움.

**구성**:
- 단일 페이지:
  - 보드 클래스 (IPC Class 1/2/3) 의미
  - 흔한 fab 의 능력 표 (JLCPCB / PCBWay / Sierra economy/standard/HDI)
  - 최소 트레이스 폭/spacing/드릴/annular ring
  - 솔더마스크 / 페이스트 마스크 / 실크스크린 한계
  - 가격에 큰 영향 미치는 factor 5가지
- Lab 위젯: "내 디자인 vs fab class" 호환성 체커 (입력: 최소 폭/spacing/드릴 → 어느 fab class 까지 가능한지)

**연결**: Trace Geometry 의 모든 계산기 (이론값 vs 실현 가능성)

### 4. **Buck Converter Layout 심화** ★★★★
**왜**: VRM Selection 이 "어떤 종류 고를까" 라면 이건 "이 IC 데이터시트 봐도 안 되는 이유 — 레이아웃" 의 실전편. 이미 buck 사진 자료는 있음.

**구성**:
- 단일 페이지 또는 basics + lab:
  - 데이터시트 PCB 가이드 읽는 법
  - Snubber RC 설계 (SW 노드 ringing 잡기)
  - FB 트레이스 라우팅 (SW 노드와 멀리, 깨끗한 GND 위)
  - Soft-start, enable, power-good 처리
  - Single-ended vs differential FB sensing
- Lab: Snubber R/C 계산기 (SW ringing 주파수 → 적정 RC)

**연결**: VRM Selection, Decoupling (입출력 cap), Return Paths (핫 루프)

### 5. **EMI Radiation 입문** ★★★
**왜**: ESD 가 "외부 충격 막기" 라면 EMI 는 "내가 노이즈 만드는 것 막기". 인증 시험 (FCC/CE) 통과 관점이라 실 양산 직전 만남.

**구성**:
- Basics:
  - 방사 메커니즘 — common-mode vs differential-mode
  - 페라이트 비드 / common-mode choke 모델
  - 차폐 (cable shield, board shield)
  - FCC Class B / EN 55022 한계 (그래프)
- Lab: 페라이트 비드 임피던스 시뮬레이터 (R + jX vs 주파수, 효과적인 주파수 범위 표시)

**연결**: Return Paths (loop area = radiation), VRM (스위칭 주파수 → EMI), 고속 인터페이스

---

## Tier 2 — 가치 있지만 좀 좁음

### 6. **DDR 메모리 라우팅**
실 SoC 설계의 가장 까다로운 부분이지만, 대상 독자 (junior HW + SW/FW) 에게는 다소 깊음. 짧은 reference 카드 형식으로는 가능.

### 7. **Eye Diagram / Jitter**
Impedance Matching 의 자연스러운 다음 토픽. 시뮬 위젯이 까다로워 부담 큼.

### 8. **Reset / Power Sequencing**
간단한 RC 부터 supervisor IC 까지. 단일 페이지로 충분.

### 9. **I2C / SPI 버스 설계**
풀업 사이징은 Ohm 법칙에서 살짝 다뤘지만 라우팅 / multi-master / level shifting 빠짐.

### 10. **Battery / Power Path**
충전 IC + 시스템 부하의 path management. 모바일 / IoT 제품에 매우 중요하지만 일반 PCB 가이드의 핵심은 아님.

---

## Tier 3 — 사이트 기능 / UX

### F1. 검색 기능
**구현**: pagefind (정적 사이트용 검색, Astro 와 잘 맞음). 빌드 시 인덱스 생성, 사이드바 상단에 검색 박스.
**작업**: 1–2 시간.

### F2. 다크모드 토글
**구현**: Tailwind v4 의 `@variant dark` + localStorage. global.css 에 다크 변수 추가.
**작업**: 2–3 시간. 모든 페이지/컴포넌트 색상 한 번씩 점검 필요.

### F3. Print stylesheet
**구현**: `@media print {}` CSS — 사이드바 숨기기, 차트는 정적 이미지로 대체, 페이지 분기 hint.
**작업**: 1–2 시간.

### F4. YouTube 영상 큐레이션
**구현**: 이미 컴포넌트 있음. 토픽별 추천 영상 1–2개 박는 것뿐. 외부 자료 (Phil's Lab, Eric Bogatin, Robert Feranec) 큐레이션이 본 작업.
**작업**: 영상 후보 선정에 시간 (조사) + 박는 데 30분.

### F5. 토픽 간 "다음/이전" 네비게이션
긴 토픽 끝에 "다음 토픽" 추천 버튼. 이미 manual 로 cross-link 있지만 일관된 UI 가 부재.

---

## 추천 작업 순서

**짧은 호흡 (각 1 세션)**:
1. **Crystal 레이아웃** (Tier 1 #2) — 단일 페이지 + 작은 위젯, 빠르게 가치 큰 추가
2. **DFM 페이지** (Tier 1 #3) — 표 위주, 작은 위젯
3. **검색 기능** (F1) — 토픽이 늘어나면서 점점 필요해짐

**중간 호흡 (각 2 세션)**:
4. **Thermal Management** (Tier 1 #1) — 새 카테고리 + basics + lab
5. **Buck Layout 심화** (Tier 1 #4) — 기존 VRM 의 깊이 추가
6. **EMI Radiation** (Tier 1 #5) — 새 카테고리

**긴 호흡 (선택)**:
7. **다크모드** — 사이트 전체 점검 필요
8. **DDR 라우팅** — 깊이 있는 단일 토픽
9. **Eye diagram lab** — 새 시뮬 엔진 필요

---

## 결정해야 할 질문

1. **새 카테고리 추가 vs 기존 확장** — Thermal 을 새 카테고리로 둘지 (Power Integrity 안에 둘지), DFM 을 Practical 안에 둘지 새로 만들지.
2. **Lab (인터랙티브) 가 모든 토픽에 필요한가** — 일부는 reference-only 가 맞을 수 있음 (DFM, EMI 표). 단순화해도 OK?
3. **콘텐츠 깊이** — 현재 수준 (입문 + 실무 시작) 이 적정한가, 더 깊이 (DDR / SerDes / RF) 가 필요한가?
4. **언어** — 한글 only 유지 vs EN/한 토글 (현재 토픽은 한글 본문 + 영문 기술용어).

위 질문에 대한 방향 정해지면 차례로 진행.
