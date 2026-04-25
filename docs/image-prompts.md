# Image generation prompts

각 항목을 ChatGPT Image 2.0 에 **하나씩 따로** 입력하세요. 한 번에 여러 이미지를 묶어서 시키면 일관성이 깨집니다.

---

## 공통 스타일 (모든 프롬프트의 전제)

- 평탄하고 사실적인 결과물. 일러스트 스타일 절대 금지.
- 화려한 색상 / 만화풍 절대 금지.
- 16:9 가로 비율, 1200 × 675 px 권장 (지정한 항목은 그것을 따름).
- 사이트 톤: 흰 배경 + 명확한 라벨 + 모노스페이스 텍스트 라벨.
- 필요한 경우만 영문 라벨, 한글 텍스트는 이미지에 넣지 마세요 (사이트 캡션이 별도).

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

> **두 이미지를 각각 따로 생성**하되 **같은 스타일** 로 유지하세요. PCB CAD 뷰 + 핫 루프가 빨간 오버레이로 표시되는 형식.

### Prompt — bad layout

> Top-down view of a PCB section, rendered like a high-quality professional PCB CAD viewer (think Altium 3D viewer / KiCad 3D top-down). NOT a flat photograph, NOT a schematic, NOT a clean studio shot. The look should resemble a 3D-rendered preview of an actual board.
>
> Board:
> - 50 mm × 50 mm visible region of green FR4 (matte solder mask, deep green #0d4d2a)
> - **Most of the visible area is covered by a copper GND pour** — shown as a subtly visible darker green/copper-tinted zone with thin clearance gaps around traces and pads. The pour is everywhere except where traces, pads, and component footprints sit.
> - Many small **GND vias** scattered across the pour (filled gold dots, ~0.5 mm, with a darker plated ring) — at least 30 vias visible total to give a real-board density
>
> Components (all top-side, oriented for clear viewing):
> - **U1** at center: QFN-16 buck IC, 4mm × 4mm, matte black body, with 16 silver leads visible on the perimeter and a center exposed thermal pad. The thermal pad has 5 GND vias drilled into it (visible as small dots inside).
> - **C1** (input ceramic cap, 0805 size): placed **far to the LEFT of U1, about 18 mm away**. Light tan body, two silver terminations.
> - **L1** (shielded SMD inductor, ~5×5×3 mm): immediately to the right of U1, ~2 mm gap. Dark navy body.
> - **C2** (output ceramic cap, 0805): right of L1, ~2 mm gap.
>
> Routing:
> - Thin gold trace from C1's V+ pad runs ~18 mm right across the GND pour, with a clearance gap visible around the trace, ending at U1's V_in pin (left side of U1).
> - U1's PGND pin connects only to the GND pour through vias.
> - SW pin of U1 → L1 → C2 forms a clean output chain.
>
> **Hot loop highlight (THE KEY VISUAL ELEMENT)**:
> - Draw a translucent **red dashed loop** (#dc2626, 50% opacity, 2 mm thick line) tracing the entire commutation current path: from C1's V+ terminal → along the long V_in trace → into U1's V_in pin → across U1 body → out U1's PGND → return through the GND pour back to C1's GND terminal → closing the loop.
> - Fill the area enclosed by the loop with translucent red (15% opacity, no border).
> - The result: a large red rectangle/ellipse roughly 22 mm × 6 mm dominating the left half of the image — clearly conveying "this loop is huge".
>
> White sans-serif text overlay, bottom-right corner: `BAD — hot loop ≈ 35 mm path length`
> Component reference designators (`U1`, `C1`, `L1`, `C2`) in small white sans-serif silkscreen on the board.
>
> Image is sharp, fully top-down (orthographic camera), evenly lit, no shadows, no motion blur, no HDR. No watermark, no rulers, no measurement scale bars.

### Prompt — good layout

> Same scene, same camera, same components, same GND pour density, same via density — but with one critical difference:
> - **C1 is now placed touching U1's V_in pin pad** (less than 1 mm gap). Cluster: C1 immediately to the left of U1, sharing the V_in trace through the shortest possible link.
> - The red dashed hot loop is now a tiny rectangle (~3 mm × 2 mm) wrapping just around C1 and U1's V_in/PGND corner. Translucent red fill covers only that small area.
>
> White text overlay, bottom-right: `GOOD — hot loop ≈ 4 mm path length`
> Everything else identical to the BAD image — same board size, same component selection, same GND pour, same vias, same lighting.

### Why these prompts are different from before

이전 프롬프트의 문제점 + 수정:
- 이전: 단순 photo / GND pour 없음 → **GND pour 명시적 요청 + via 30개 + 동밀도** 추가
- 이전: "BAD" 이유가 라벨에만 있음 → **빨간 점선 루프 + 반투명 채움 으로 핫 루프 자체를 그림에 그리도록**
- 이전: PCB CAD 톤 부재 → **Altium 3D viewer 같은 느낌으로 명시**

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

> Photorealistic top-down view of a green PCB section (FR4) showing a 25 mm × 12 mm region with **a differential pair of traces** routed between two IC pads on the left and a connector on the right.
>
> - The two parallel traces (gold copper, ~7 mil wide, ~7 mil edge-to-edge gap) run side-by-side from left to right.
> - In the **middle of one of the two traces** (the shorter one), there is a serpentine (sawtooth-like) length compensation section with **3 tight back-and-forth loops** each ~2 mm wide. The other trace runs straight through this region. After the serpentine, both traces continue straight together to the right edge.
> - White silkscreen labels on the board: `TX+`, `TX-` near the left pads.
> - Solder mask green, classic FR4. Crisp focus. No annotations on the image, no watermark, no rulers.

### After generating

```mdx
<figure class="not-prose my-4">
  <img src="/hsi/length-match-serpentine.png" alt="differential pair length matching" class="rounded-lg border border-slate-200" />
  <figcaption class="mt-2 text-xs text-slate-600">
    페어 안 길이 매칭(intra-pair) 을 위한 사형(serpentine) — 두 트레이스 끝의 도착 시각을 맞추기 위해 한쪽만 늘림. <b>중간에서 처리</b> 하는 게 끝단 처리보다 안정.
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

> Vector Network Analyzer (VNA) impedance magnitude plot, screen-only export, NOT a photo of a bezel.
>
> - Background: white (#ffffff). Light slate gridlines (#e2e8f0).
> - Axes: log-log. X-axis labeled `Frequency (Hz)` from 1 MHz to 10 GHz. Y-axis labeled `|Z| (Ω)` from 1 mΩ to 10 Ω. Dark slate axis labels (#0f172a) in sans-serif.
> - One main trace in indigo (#4f46e5), ~2 px stroke. The trace starts low (~5 mΩ) at 1 MHz, gently rises, then **shows two sharp resonance peaks** at approximately 500 MHz (peak ~2 Ω) and 1.5 GHz (peak ~1 Ω), with deep notches between, then drops back. After 2 GHz the curve oscillates more (multiple cavity modes).
> - Horizontal dashed green line at 50 mΩ labeled `Z_target` in green.
> - Red dashed vertical line at 500 MHz labeled `f_res` in red.
> - Small text annotation near the first peak: `cavity mode (10 cm × 15 cm board)`.
> - No tooltip box, no markers menu, no scope/VNA branding.

### After generating

```mdx
<figure class="not-prose my-4">
  <img src="/pdn/plane-resonance.png" alt="PDN plane resonance Z(f)" class="rounded-lg border border-slate-200" />
  <figcaption class="mt-2 text-xs text-slate-600">
    실제 보드의 PDN 임피던스 측정 예 — 500 MHz 부근의 첫 번째 cavity resonance 가 Z_target 을 위로 뚫고 나가는 모습.
  </figcaption>
</figure>
```

---

## 6. (선택) Stack-up cross-section — multilayer PCB cutaway

**Goes to**: `/trace-geometry/basics` 또는 `/pdn-planning/basics`
**Save as**: `public/stackup/6layer-cutaway.png`
**Aspect**: 4:3 · 1200 × 900

### Prompt

> Photorealistic close-up cross-section of a 6-layer PCB cut and polished, showing the layer stack from above. Macro photography, ~50 mm width visible.
>
> - 6 alternating copper layers (gold/copper color) separated by 5 dielectric prepreg/core layers (translucent yellow-tan).
> - Layer 1 (top, copper): a few signal traces visible as cross-section rectangles (small gold squares).
> - Layer 2 (full plane): solid GND plane visible as a continuous gold strip across.
> - Layer 3 (signal): one signal trace visible.
> - Layer 4 (Vcc plane): solid copper.
> - Layer 5 (GND plane): solid copper.
> - Layer 6 (bottom, signal): a few traces.
> - One vertical via shown going through all layers (gold cylinder), plated barrel.
> - Solder mask green on top and bottom outer surfaces.
> - White ruler at the top edge showing 0–2 mm scale.
> - No annotations, no labels on the image (we'll add them via overlay in the page).

### After generating

이 이미지는 다양한 페이지에서 재사용 가능 (Trace Geometry, PDN, High-speed interfaces).

---

## 작업 순서 추천

1. **#1 ESD 파형** — 가장 임팩트 큼 (현재 텍스트만)
2. **#5 Plane resonance** — PDN 페이지에 시각적 hook
3. **#4 실측 갤러리 4장** — 모사 → 실측 같은 그림으로 업그레이드
4. **#2 Buck PCB** — 비교 학습 효과
5. **#3 Differential pair serpentine** — 페어 매칭 시각화
6. **#6 Stackup cutaway** — 여러 페이지 재사용

각 이미지를 받으면 `public/` 의 해당 위치에 저장하고, 알려주시면 MDX 에 박아넣겠습니다.
