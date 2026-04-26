# Image generation prompts

각 항목을 ChatGPT Image 2.0 에 **하나씩 따로** 입력하세요. 한 번에 여러 이미지를 묶어서 시키면 일관성이 깨집니다.

---

## 공통 스타일 (모든 프롬프트의 전제)

- 평탄하고 사실적인 결과물. 일러스트 스타일 절대 금지.
- 화려한 색상 / 만화풍 절대 금지.
- 16:9 가로 비율, 1200 × 675 px 권장 (지정한 항목은 그것을 따름).
- 사이트 톤: 흰 배경 + 명확한 라벨 + 모노스페이스 텍스트 라벨.
- 필요한 경우만 영문 라벨, 한글 텍스트는 이미지에 넣지 마세요 (사이트 캡션이 별도).

### 첫 결과가 안 좋을 때 빠른 진단

이전 시도에서 얻은 교훈:

1. **"PCB 사진"** 으로 요청하면 보드가 텅 빈 그림이 나오기 쉬움 → **"PCB CAD viewer 스타일 (Altium 3D / KiCad 3D 처럼)"** 으로 톤을 명시. 그리고 `GND copper pour fills the entire visible area` + `many GND vias scattered (~30+ visible)` 를 명시적으로 적기.
2. **교육적 포인트(핫 루프, 큰 면적, 결합 등)는 그림에 직접 오버레이로 그리도록 요청** — `BAD` 라벨 텍스트로 끝나면 안 됨. **빨간 점선 + 반투명 채움** 패턴이 잘 작동.
3. **"오실로스코프 사진"** 대신 **"screen export"** 라고 명시 — bezel/desk/window 들어가는 걸 막음.
4. 이미지 안 텍스트는 영어로만 (한글은 폰트 렌더링이 깨질 수 있음). 한글 캡션은 사이트 MDX 에서 처리.

---

## 1. ESD — IEC 61000-4-2 waveform on oscilloscope

**Goes to**: `/esd-protection` 페이지의 새 카드 (현재 텍스트만)
**Save as**: `public/esd/iec-waveform.png`
**Aspect**: 16:9 · 1200 × 675

### Prompt

> Oscilloscope screen capture (digital storage oscilloscope, screen-only export, NOT a photo of a bezel).
>
> - Background: near-black navy (#0a0e1a). Faint teal graticule, 10 horizontal × 8 vertical divisions. Slightly brighter center crosshair. Tiny tick marks on the center axes.
> - One trace, bright cyan (#22d3a5), ~1.5 px stroke. The trace shows the canonical IEC 61000-4-2 ESD discharge current waveform: from baseline at left, the trace shoots upward to a sharp peak at roughly 1/4 from the left, then decays exponentially over the next several divisions back toward baseline. Peak about 4 divisions tall. Initial rise time about 0.7 ns shown across less than 1 division (very steep).
> - Top-left line 1: `CH1  Iesd  DC  10A/div`
> - Top-left line 2 (cyan): `5 ns/div`
> - Top-right line 1: `±8kV CONTACT`
> - Top-right line 2: `IEC 61000-4-2`
> - Bottom-left (cyan): `Ipk = 30 A`
> - Bottom-right (red #f43f5e): `t_r = 0.8 ns`
> - Small rose-red dashed vertical at the trace start marking t = 0
> - No bezel, no scope brand logo, no measurement menus, no soft keys. Just the screen content.

### After generating

MDX 에 추가:

```mdx
<figure class="not-prose my-6 rounded-lg border border-slate-200 bg-white overflow-hidden">
  <img src="/esd/iec-waveform.png" alt="IEC 61000-4-2 ESD discharge waveform" class="w-full" />
  <figcaption class="px-4 py-3 text-sm text-slate-700">
    IEC 61000-4-2 의 표준 ESD 펄스 — 30 A peak · 0.8 ns rise. 이 펄스가 트레이스 인덕턴스를 만나면 V = L·di/dt 로 수백 V 가 IC 핀에 도달합니다.
  </figcaption>
</figure>
```

---

## 2. Buck converter PCB layout — bad vs good (사진 2장)

**Goes to**: `/vrm-selection` 페이지 (또는 basics 의 hot-loop 카드 위)
**Save as**: `public/buck/buck-bad.png` 와 `public/buck/buck-good.png`
**Aspect**: 4:3 · 1200 × 900 (각각)

> **두 이미지를 각각 따로 생성**하되 **같은 스타일** 로 유지. PCB CAD 뷰 + 핫 루프가 IC 의 한쪽 변(V_in/PGND 측) 옆에 작은 빨간 사각형으로 표시.

### 핵심 — 실제 async buck 의 핀 배치 + 외부 부품을 따를 것

이전 시도들의 결정적 오류:
1. 핫 루프가 IC 본체를 wrapping 하거나 가로지름.
2. 외부 freewheel **다이오드 (D1)** 가 빠짐 — async buck (LM2596, MC34063 등 입문자/전형적 회로) 에서는 핫 루프의 일부.
3. L1 / C2 가 옆으로 일렬로 놓여 있어 출력 체인이 안 보임.

**실제 async buck IC 의 표준 배치**:
- **V_in 핀과 PGND 핀이 IC 한쪽 변에 인접**해 있음 (예: LM2596, RT7297, MP2459 등의 SOIC/QFN 표준 배치).
- **SW 핀은 반대쪽 변** 에 있음.
- 외부 부품 체인: **C_in (V_in 옆)** → IC 내부 HS-FET → **SW 핀** → **D1 (Schottky, SW 와 GND 사이)** + **L1 (SW → V_out)** → **C2 (V_out → GND)**.
- async buck 의 핫 루프 (commutation loop) = C_in 의 V+ → V_in 핀 → 내부 HS-FET → SW 핀 → D1.cathode → D1.anode → GND pour → C_in 의 GND → 닫힘.
- 즉 핫 루프에 **C_in, IC, D1 모두 포함** — 셋 다 가까이 있어야 작아짐.

따라서 BAD vs GOOD:
- **GOOD**: C_in 이 V_in/PGND 핀 바로 옆 + D1 이 SW/PGND 핀 바로 옆 + L1 이 D1 다음에 SW 와 출력 사이. → 핫 루프 = IC 둘레의 작은 사각형.
- **BAD**: C_in 이 멀리 + D1 도 SW 핀에서 멀리 떨어짐 → 핫 루프가 길게 늘어짐.

### Prompt — bad layout

> Top-down view of a PCB section, rendered like a high-quality professional PCB CAD viewer (Altium 3D viewer / KiCad 3D top-down). NOT a photograph, NOT a schematic.
>
> Board:
> - 60 mm × 45 mm visible region of green FR4 (matte solder mask, deep green #0d4d2a)
> - **GND copper pour fills the entire visible area** except where traces, pads, and components sit. Subtly visible darker green/copper tint with thin clearance gaps around routing.
> - **30+ small GND vias** scattered evenly across the pour as gold filled circles (~0.5 mm, with darker plated rings).
>
> IC pinout (CRITICAL — REAL ASYNC BUCK CONVERTER ARRANGEMENT, like LM2596 / RT7297):
> - **U1** placed roughly at the horizontal center of the board: SOIC-8 or small QFN buck IC, ~5 mm × 5 mm, matte black body, silver leads on the perimeter.
> - **LEFT edge of U1 has `V_in` pin (top-left position) and `PGND` pin (bottom-left position) — they are adjacent on the SAME edge**. White silkscreen labels `Vin` and `PGND` next to those pins.
> - **RIGHT edge of U1 has `SW` pin** (the switching output). White silkscreen `SW` next to it.
> - Other pins (FB, EN, BST) on top/bottom — present but small, not labeled.
>
> External components (THE THREE THAT FORM THE COMMUTATION LOOP):
> - **C1** (0805 ceramic input cap): placed **far to the LEFT of U1, about 18 mm away from U1's V_in pin**. Cap rotated so its V+ terminal faces right (toward U1) and its GND terminal faces left.
> - **D1** (Schottky diode in SOD-123 package, small black body with white cathode stripe): placed below the IC's SW pin area, but **about 8 mm away from U1's SW pin** (also wrong — too far). Cathode connects to a trace going up to SW pin, anode connects to GND pour through vias.
> - **L1** (shielded SMD inductor, ~5×5×3 mm, dark navy body): immediately to the right of U1's SW pin, ~2 mm gap. Its left terminal connects to SW pin and to D1's cathode trace; its right terminal goes to C2.
> - **C2** (0805 ceramic output cap): to the right of L1, ~2 mm gap. V+ terminal connects to L1's right terminal; GND to GND pour.
>
> Routing:
> - Long thin gold `V_in` trace from C1.V+ to U1.V_in (~18 mm, runs through the GND pour with clearance).
> - Short trace from C1.GND down into GND pour via nearby vias.
> - Short trace from U1.SW to L1.left and to D1.cathode.
> - D1.anode connects to GND pour via several vias.
>
> **Hot loop overlay (anatomically correct async-buck commutation loop)**:
> - The loop is: C1.V+ → V_in trace → U1.V_in pin → (through U1's internal HS-FET) → U1.SW pin → trace right of U1 to D1.cathode → through D1 to D1.anode → GND pour → all the way back along the bottom edge of the V_in trace → up to C1.GND terminal.
> - Draw it as a **red dashed outline** (#dc2626, 60% opacity, 2 mm line width) following this exact path:
>   - From C1.V+, trace right along the V_in line to U1.V_in.
>   - Across U1's top edge toward U1.SW (the loop hugs the OUTSIDE of U1, NOT crossing the body).
>   - Down/right from U1.SW to D1.cathode.
>   - Through D1 (small zigzag through the diode body).
>   - From D1.anode along the GND pour back left (path goes BELOW C1's V_in trace) all the way to C1.GND.
> - Fill the entire enclosed area (a long elongated shape ~22 mm long × ~10 mm tall, sitting between the V_in trace at the top and the GND return at the bottom, hugging the OUTSIDE of U1) with translucent red (15% opacity, no border).
> - **The loop must NOT cross U1's body.** It runs around the perimeter only.
>
> Other:
> - White text overlay, bottom-right: `BAD — hot loop ≈ 35 mm path length`
> - Component reference designators in white silkscreen: `U1`, `C1`, `D1`, `L1`, `C2`.
> - Image fully top-down (orthographic), evenly lit, no shadows, no motion blur. No watermark, no rulers.

### Prompt — good layout

> Same scene, same camera, same components (U1, C1, D1, L1, C2), same GND pour density, same via density, same U1 pinout (V_in / PGND adjacent on left edge, SW on right edge) — but:
> - **C1 is placed immediately to the LEFT of U1**, with its V+ terminal touching U1's V_in pin (~1 mm gap, very short trace) and its GND terminal directly aligned with U1's PGND pin.
> - **D1 is placed immediately to the RIGHT of U1**, with its cathode touching U1's SW pin (~1 mm gap) and its anode going straight down into the GND pour through 2 vias right next to it.
> - **L1** is placed to the right of D1, ~2 mm away. Its left terminal connects to D1's cathode (the SW node).
> - **C2** is to the right of L1, output stage.
> - The red dashed hot loop is now a **tight rectangle (~7 mm × 5 mm) hugging U1's left and right edges plus the C1 and D1 components**: from C1.V+ → U1.V_in → across U1's TOP outside edge → U1.SW → D1.cathode → D1.anode → through GND pour BELOW U1 → back to C1.GND. Translucent red fill (15% opacity) inside.
> - The loop is much smaller than BAD because both C1 and D1 are tightly clustered against the IC.
> - White text overlay, bottom-right: `GOOD — hot loop ≈ 4 mm path length`
> - Everything else identical to BAD.

### Why this prompt is different (lessons learned)

이전 두 시도의 문제 + 이번 수정:
- ❌ 핫 루프가 IC 본체 가로지름 → ✅ "loop hugs the OUTSIDE of U1, NOT crossing the body" 명시
- ❌ Freewheel diode (D1) 부재 → ✅ async buck 의 핵심 부품인 D1 (Schottky) 명시 추가, 핫 루프의 일부로 표시
- ❌ L1 / C2 가 옆으로 일렬로만 놓여있음 → ✅ "U1.SW → D1.cathode + L1.left → L1.right → C2" 의 출력 체인 명시
- ❌ V_in / PGND / SW 핀이 모호 → ✅ "left edge: V_in (top), PGND (bottom). right edge: SW" 의 표준 async buck 핀배치 명시
- ❌ 실 IC reference 없음 → ✅ LM2596 / RT7297 같은 흔한 async buck IC 명시

### After generating

`/src/pages/vrm-selection.mdx` 의 `BuckHotLoop` 컴포넌트를 사진 2장 비교로 교체하거나, 옆에 추가하면 됩니다. 새 카드 예시:

```mdx
<div class="mt-6">
  <Card id="real" title="실제 보드 사례 — Cin 위치 차이">
    <div class="not-prose grid gap-3 md:grid-cols-2">
      <figure class="rounded-lg border border-rose-200 overflow-hidden">
        <img src="/buck/buck-bad.png" alt="bad buck layout" />
        <figcaption class="p-3 text-sm bg-rose-50 text-rose-800">
          BAD — Cin 이 IC 에서 멀어 핫 루프가 큼. 출력 ripple/EMI 증가.
        </figcaption>
      </figure>
      <figure class="rounded-lg border border-emerald-200 overflow-hidden">
        <img src="/buck/buck-good.png" alt="good buck layout" />
        <figcaption class="p-3 text-sm bg-emerald-50 text-emerald-800">
          GOOD — Cin 핀 바로 옆. 핫 루프 mm 단위. 깨끗한 출력.
        </figcaption>
      </figure>
    </div>
  </Card>
</div>
```

---

## 3. High-speed differential pair — length matching serpentine

**Goes to**: `/high-speed-interfaces` 페이지 (USB 3.x 또는 GbE 섹션)
**Save as**: `public/hsi/length-match-serpentine.png`
**Aspect**: 16:9 · 1200 × 675

### Prompt

> Top-down view of a PCB section, rendered like a high-quality professional PCB CAD viewer (Altium 3D viewer / KiCad 3D top-down). NOT a flat photograph.
>
> Board:
> - Visible region 30 mm × 17 mm of green FR4 (matte deep green #0d4d2a)
> - **GND copper pour fills the entire visible area** except where signal traces and pads sit, with thin clearance gaps visible around all routing
> - **Many small GND vias** scattered evenly across the GND pour (gold filled circles, ~0.4 mm, with darker plated rings) — at least 60–80 vias visible total to give a real-board density. Vias are arranged in a loose grid pattern at ~2 mm spacing.
>
> Differential pair routing:
> - Two parallel gold microstrip traces (matte gold #d4a04c, each ~7 mil wide with a ~7 mil edge-to-edge gap between them) running horizontally from the left edge to the right edge.
> - On the **left edge**: two square IC-style pads labeled `TX+` (top) and `TX-` (bottom) in white silkscreen.
> - On the **right edge**: two pads, simply labeled (`TX+ out` and `TX- out`) in small silkscreen.
> - **Length compensation serpentine**: ONLY on the **upper trace (TX+)**, in the middle third of the routing. Three or four tight rectangular zig-zags each about 2 mm × 1 mm, shaped like a square wave with sharp 90° corners. The lower trace (TX-) runs straight through the same region. After the serpentine the two traces become parallel again until the right edge.
> - The serpentine zig-zags maintain the same trace width as the rest of the line.
>
> **Highlight overlay (the educational element)**:
> - Subtle translucent yellow band (≈15% opacity) following the serpentine region, ~6 mm wide, drawn behind the traces.
> - Small white sans-serif text overlay below the serpentine: `Δlength compensation`
> - Two thin orange arrows above the pair (one near left, one near right) pointing in the propagation direction (left → right) labeled `signal →` in tiny white text.
>
> Image is sharp, fully top-down (orthographic), evenly lit, no shadows, no motion blur. No watermark, no rulers, no rendered measurement scale bars (we'll add captions in the page).

### After generating

```mdx
<figure class="not-prose my-4 rounded-lg border border-slate-200 overflow-hidden">
  <img src="/hsi/length-match-serpentine.png" alt="differential pair length matching serpentine" class="block w-full" loading="lazy" />
  <figcaption class="px-4 py-3 text-sm text-slate-700 bg-white leading-relaxed">
    페어 안 길이 매칭(intra-pair) 을 위한 사형(serpentine) — 두 트레이스 끝의 도착 시각을 맞추기 위해 짧은 쪽 트레이스만 늘립니다. <b>중간에서 처리</b> 하는 게 끝단 처리보다 임피던스 변동이 적어 안정. USB 3 / DDR / HDMI 모두 동일한 패턴.
  </figcaption>
</figure>
```

---

## 4. Decoupling — real measurement gallery (4장)

**Goes to**: `/decoupling-capacitor` 의 Measurement Gallery (현재 모사 4장 교체)
**Save as**: `public/verify/real-vdd-{0caps,1cap,4caps,full}.png`
**Aspect**: 16:9 · 1200 × 675 each

> 이미 만든 모사 갤러리 형식과 100% 동일하게 가지만, **사진처럼 약간의 노이즈/그레인** 을 추가해서 "진짜 실측처럼 보이게" 합니다.

### Prompt 공통 (모든 4장)

> Oscilloscope screen capture (digital storage oscilloscope, screen-only). Same UI as before:
> - Background: near-black navy (#0a0e1a). Faint teal graticule, 10 × 8 divisions, brighter center crosshair, tiny ticks.
> - CH1 (Vdd) trace in bright mint/teal (#22d3a5), ~1.5 px stroke. Slight realistic noise/jitter on the trace (NOT smooth — like a real scope capture with ~2 mV RMS noise floor).
> - CH2 (Iload) in dim amber/yellow (#eab308), 50% opacity, clean rectangular pulse from 0 → 1A and back.
> - Timebase 300 ns/div · CH1 50 mV/div · CH2 500 mA/div.
> - Text overlays in monospaced slate-gray (#94a3b8):
>   - Top-left: `CH1  Vdd  DC` and below in teal `50 mV/div`
>   - Top-right: `300 ns/div` and below in amber `CH2 Iload 500 mA/div`
>   - Bottom-left in teal: `Vpp = <value>`
>   - Bottom-right in red (#f43f5e): `droop = <value>`
> - Thin red dashed vertical at the load-step start (about 1/6 from left).

### 4장의 차이 — Vdd trace shape + 값만 다름

**Image 4a (`real-vdd-0caps.png`)** — `Vpp = 580 mV`, `droop = 310 mV`
> Vdd trace: massive ringing 5 MHz, ~6 visible cycles during load-on, plunges 6 divisions below center.

**Image 4b (`real-vdd-1cap.png`)** — `Vpp = 290 mV`, `droop = 160 mV`
> Vdd trace: moderate ringing ~2 MHz, ~3-4 cycles, drops 3 divisions.

**Image 4c (`real-vdd-4caps.png`)** — `Vpp = 95 mV`, `droop = 55 mV`
> Vdd trace: small dip ~1 division, settles in ~1 μs.

**Image 4d (`real-vdd-full.png`)** — `Vpp = 22 mV`, `droop = 14 mV`
> Vdd trace: tiny spike (<0.5 division) at each transition edge, otherwise nearly flat on center line.

### After generating

`src/pages/decoupling-capacitor.mdx` 의 `MeasurementGallery shots` 의 `src` 만 교체. caption/Vpp 그대로 유지하고 `subtitle` 을 "**스코프 실측 캡처**" (모사 표기 제거).

---

## 5. PDN — plane resonance impedance plot

**Goes to**: `/pdn-planning/basics` 의 Plane Resonance 카드
**Save as**: `public/pdn/plane-resonance.png`
**Aspect**: 16:9 · 1200 × 675

### Prompt

> Clean instrument screen export of a Vector Network Analyzer (VNA) impedance magnitude plot. Screen-only export (the rectangle of plot area + axes + labels). NOT a photo of a bezel, NOT inside a window frame, NOT on a wood desk, NOT with any analyzer model name visible.
>
> Canvas:
> - Background: white (#ffffff)
> - Plot area inset 60 px from edges, surrounded by axis label region
> - Light slate gridlines (#e2e8f0) — both major and minor for log axes
>
> Axes (log-log):
> - X-axis: `Frequency (Hz)` — labeled at 1 MHz, 10 MHz, 100 MHz, 1 GHz, 10 GHz with major decade gridlines
> - Y-axis: `|Z| (Ω)` — labeled at 1 mΩ, 10 mΩ, 100 mΩ, 1 Ω, 10 Ω with major decade gridlines
> - Axis label text in dark slate (#0f172a), sans-serif
> - Small tick marks at minor decade subdivisions (2, 3, 5)
>
> Trace (THE MAIN ELEMENT):
> - One curve in indigo (#4f46e5), ~2 px stroke, smooth
> - Below 100 MHz: trace sits flat near 5–10 mΩ (well under target)
> - 100–300 MHz: trace gently rises to ~30 mΩ
> - **First sharp resonance peak at ~500 MHz reaching ~2 Ω** (a tall narrow spike — clearly the dominant feature)
> - Notch back down to ~50 mΩ between 600–800 MHz
> - **Second smaller peak at ~1.5 GHz reaching ~600 mΩ**
> - Above 2 GHz: trace becomes irregular with multiple smaller peaks/notches (cavity modes)
> - Final trace position around 200–500 mΩ at 10 GHz
>
> Overlays (educational):
> - **Horizontal dashed green line (#10b981) at 50 mΩ across the entire plot** labeled `Z_target = 50 mΩ` in green text on the right side
> - **Red dashed vertical line at the first peak (~500 MHz)** labeled `f_res ≈ c / (2L√εr)` in small red text near the top of the line
> - Small annotation text near the peak: `cavity mode · 10 cm × 15 cm board · εr = 4.2` in slate gray
> - Small annotation in the high-frequency region: `multiple modes`
>
> Title at top-left: `PDN Impedance · Vcc plane to GND plane` (small sans-serif)
> No watermark. No tooltip box. No marker menu. No analyzer brand. No frame around the image — it should look like a direct PNG export from analysis software.

### After generating

```mdx
<figure class="not-prose my-4 rounded-lg border border-slate-200 overflow-hidden">
  <img src="/pdn/plane-resonance.png" alt="PDN Vcc/GND plane resonance impedance" class="block w-full" loading="lazy" />
  <figcaption class="px-4 py-3 text-sm text-slate-700 bg-white leading-relaxed">
    실측에 가까운 PDN 임피던스 — 500 MHz 부근의 첫 번째 <b>cavity resonance</b> 가 Z_target (50 mΩ) 을 한참 뚫고 올라가는 게 보입니다. plane 가장자리에 stitching via 와 damping cap 을 분포시켜 Q 를 낮추는 게 이 영역을 잠재우는 표준 처방.
  </figcaption>
</figure>
```

---

## 6. Stack-up cross-section — multilayer PCB cutaway

**Goes to**: `/trace-geometry/basics`, `/pdn-planning/basics`, `/high-speed-interfaces` 에서 모두 재사용
**Save as**: `public/stackup/6layer-cutaway.png`
**Aspect**: 16:9 · 1200 × 675 (옆으로 긴 단면이라 16:9 더 적합)

### Prompt

> Cross-section illustration of a 6-layer PCB cut and viewed from the side. Render as a clean professional engineering diagram — somewhere between a textbook illustration and a high-quality 3D rendering. NOT a photograph of a real cut sample (real polished sections are dark and hard to read).
>
> Composition:
> - View horizontal, showing 30 mm of board width × full board thickness (~1.6 mm tall, exaggerated to fit aspect)
> - Camera looking straight at the cut face (orthographic)
> - White (#ffffff) background outside the board
>
> Stack from top to bottom (label each on the LEFT side with thin lines connecting layer to label):
> - Solder mask, top — thin green band (#0d4d2a), ~25 μm
> - **L1 — top signal**: gold copper layer with 3 short trace cross-sections visible (small gold rectangles spaced apart). Label: `L1 — Top signal` in dark slate sans-serif
> - Prepreg (dielectric) — translucent amber/tan band (#fef3c7) ~75 μm tall
> - **L2 — GND plane**: solid continuous gold strip across the entire width. Label: `L2 — GND plane (solid)` in green-tinted text
> - Core dielectric — slightly thicker amber band ~150 μm
> - **L3 — inner signal**: gold layer with 2 trace cross-sections. Label: `L3 — Inner signal`
> - Prepreg — amber band ~100 μm
> - **L4 — Vcc plane**: solid gold strip. Label: `L4 — Vcc plane (3.3 V)` in orange-tinted text
> - Core — amber band ~150 μm
> - **L5 — GND plane**: solid gold strip. Label: `L5 — GND plane (solid)` in green-tinted text
> - Prepreg — amber band ~75 μm
> - **L6 — bottom signal**: gold layer with 3 trace cross-sections. Label: `L6 — Bottom signal`
> - Solder mask, bottom — thin green band ~25 μm
>
> Vertical features:
> - One **through-hole via** drawn at ~30% from the left, going from L1 to L6: a vertical gold cylinder cross-section (with darker plated barrel walls) connecting all copper layers. Tiny gold pads at L1 and L6 ends.
> - One **blind via** at ~75% from the left, only spanning L1 to L2 (top to GND only): a smaller gold structure.
>
> Annotations on the RIGHT side of the diagram (in dark slate):
> - Bracket spanning L1↔L2 with label `H = 75 μm = 3 mil` (the dielectric height between top signal and GND)
> - Bracket spanning the entire L1↔L6 stack with label `Total: 1.6 mm`
> - Small text near a top trace: `W = 0.18 mm` (width of one of the L1 traces)
>
> Style:
> - Clean engineering illustration, not a 3D photograph
> - Subtle drop shadows on each layer for depth
> - All text in slate dark gray (#0f172a) sans-serif
> - Image is sharp, vector-quality look
> - No watermark, no rulers other than the labeled ones

### After generating

이 이미지는 다양한 페이지에서 재사용 가능 (Trace Geometry, PDN, High-speed interfaces).

---

## 7. BMS Back-to-back N-channel 스키매틱 (low-side)

**Goes to**: `/bms-mosfet` 페이지의 "Back-to-back 토폴로지" 카드 (현재 SVG 자리 또는 옆에 추가)
**Save as**: `public/bms/back-to-back-schematic.png`
**Aspect**: 16:9 · 1600 × 900

### Prompt

> Clean, modern engineering schematic — professional PDF datasheet aesthetic. NOT hand-drawn, NOT a photo, NOT a 3D render. Crisp white background with thin black lines for wiring and component bodies. Subtle accent colors for educational annotations. Think TI / ADI application-note quality — uncluttered, every label legible at small zoom.
>
> The schematic depicts a **low-side back-to-back N-channel MOSFET BMS bidirectional switch**. Layout horizontal, left to right:
>
> Far left:
> - A vertical battery symbol (rectangle with rounded corners, dark green fill, white "Li-ion BAT" label inside).
> - Top terminal labeled **B+** in bold sans-serif, bottom terminal labeled **B−**.
>
> Top wire:
> - A single straight black horizontal wire from B+ all the way to PACK+ on the right side. No components on it.
>
> Bottom MOSFET path (this is the focus):
> - From B− a wire goes right toward two N-channel MOSFETs placed side by side.
> - **Q1 (CHG FET)** — left MOSFET. Standard schematic symbol for an N-channel enhancement-mode MOSFET drawn vertically:
>   * Drain (D) at the top-left side of the symbol, connected to the wire from B−. Pin labeled "D" in small sans-serif next to the pin.
>   * Source (S) at the bottom-right side, connected to the MID node. Pin labeled "S".
>   * Gate (G) extending upward, labeled "G".
>   * **Intrinsic body diode drawn next to the channel symbol with its anode at the source (S, right side) and cathode at the drain (D, left side)** — triangle pointing LEFT (toward D), with a vertical bar at the cathode side. Use red color (#dc2626) for the diode to make it pop.
>   * Below the symbol, a small label "Q1 (CHG)" in dark amber (#92400e) bold.
> - **Wire labeled MID** between Q1.S and Q2.S — a single black wire with a small filled dot indicating the node, and the text "MID" above the wire in indigo (#4f46e5) bold.
> - **Q2 (DSG FET)** — right MOSFET. Mirror image of Q1:
>   * Source (S) at the top-left of the symbol, connected to MID node. Pin labeled "S".
>   * Drain (D) at the bottom-right, connected to a wire going right to PACK−. Pin labeled "D".
>   * Gate (G) extending upward.
>   * **Body diode anode at S (left side), cathode at D (right side)** — triangle pointing RIGHT, vertical bar at the cathode (right). Same red color.
>   * Below: "Q2 (DSG)" in dark amber.
> - The wire continues from Q2.D to PACK− on the right.
>
> **Key visual emphasis**: the two body diodes face OPPOSITE directions (Q1's diode points outward toward B−, Q2's diode points outward toward PACK−). This is the entire point of back-to-back — make it visually unmissable.
>
> Top of schematic:
> - A horizontal rectangle labeled "BMS IC" in white sans-serif on dark slate (#0f172a) fill, centered above the two FETs.
> - Two thin blue (#1e40af) wires drop from the IC: one labeled "CHG" going to Q1.G, the other labeled "DSG" going to Q2.G.
>
> Far right:
> - A vertical rectangle labeled "PACK / load / charger" in white text on dark slate fill.
> - Top terminal labeled **PACK+**, bottom **PACK−**, with the appropriate wires connecting.
>
> Educational arrows (transparent, secondary):
> - A green arrow at the top wire pointing rightward labeled "discharge →" in green (#10b981).
> - A green arrow at the bottom wire pointing leftward (since current returns through the FETs from PACK− back to B−).
> - Optionally a yellow arrow opposite direction labeled "charge ←" (use lighter opacity so it doesn't compete).
>
> Bottom annotations (small monospaced font, slate gray):
> - "두 FET 모두 ON → 양방향 도통 (정상)"
> - "CHG OFF (Q1) → 충전 차단 (충전 시 전류 B−→MID 방향이 Q1 body diode 의 reverse 방향)"
> - "DSG OFF (Q2) → 방전 차단 (방전 시 전류 PACK−→MID 방향이 Q2 body diode 의 reverse 방향)"
>
> NO unrelated component (no decoupling caps, no shunt resistor, no current sense — this diagram is about the back-to-back FET pair only). Crisp lines, no shadows, no gradient backgrounds, no chip artwork — schematic-style only.
>
> Image is sharp, all text legible at 1600 × 900, every label clear. White background. No watermark.

### After generating

```mdx
<figure class="not-prose rounded-lg border border-slate-200 overflow-hidden">
  <img src="/bms/back-to-back-schematic.png" alt="Low-side back-to-back N-channel MOSFET BMS topology" class="block w-full" loading="lazy" />
  <figcaption class="px-4 py-3 text-sm text-slate-700 leading-relaxed">
    Low-side back-to-back 토폴로지 — 두 N-ch MOSFET 의 source 가 MID 에서 묶이고, body diode 가 서로 반대 방향. CHG OFF 면 충전 차단, DSG OFF 면 방전 차단, 둘 다 ON 일 때만 양방향 도통.
  </figcaption>
</figure>
```

기존 `BackToBackMosfet.astro` SVG 컴포넌트는 그대로 두고 이 사진을 카드 안에 추가하거나 SVG 를 details 안으로 접어 넣으면 됩니다.

---

## 작업 순서 추천

1. **#1 ESD 파형** — 가장 임팩트 큼 (현재 텍스트만)
2. **#5 Plane resonance** — PDN 페이지에 시각적 hook
3. **#4 실측 갤러리 4장** — 모사 → 실측 같은 그림으로 업그레이드
4. **#2 Buck PCB** — 비교 학습 효과
5. **#3 Differential pair serpentine** — 페어 매칭 시각화
6. **#6 Stackup cutaway** — 여러 페이지 재사용

각 이미지를 받으면 `public/` 의 해당 위치에 저장하고, 알려주시면 MDX 에 박아넣겠습니다.
