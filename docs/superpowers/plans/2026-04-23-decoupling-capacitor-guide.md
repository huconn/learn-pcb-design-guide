# Decoupling Capacitor Guide — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Korean-language interactive web guide that teaches junior HW / SW-to-HW engineers about decoupling capacitors through a 3-layer (concept → explore → verify) experience, and establishes a template for future hardware review topics.

**Architecture:** Astro static site with Svelte 5 islands for interactive simulations. The math core is a set of pure TypeScript functions (unit-tested) that compute time-domain voltage ripple (RK4 integration of a lumped RLC PDN model) and frequency-domain PDN impedance Z(f) (parallel combination of cap impedances). ECharts renders both. Content authored in MDX with shared Astro layout components so future topics clone the same 7-section structure.

**Tech Stack:** Astro 4.x, Svelte 5, TypeScript, Tailwind CSS, Apache ECharts 5.x, KaTeX, MDX, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-04-23-decoupling-capacitor-guide-design.md`

---

## File Map

**New files (created in this plan):**

| Path | Responsibility |
|---|---|
| `package.json`, `astro.config.mjs`, `tsconfig.json`, `tailwind.config.mjs`, `vitest.config.ts`, `.gitignore` | Project config |
| `src/pages/index.astro` | Topic list landing |
| `src/pages/decoupling-capacitor.mdx` | Main topic page (7 sections) |
| `src/layouts/TopicLayout.astro` | Shared hero / TOC / footer for all topic pages |
| `src/components/ui/SectionHeader.astro` | Section label + title primitive |
| `src/components/ui/TlDrBlock.astro` | §1 TL;DR block |
| `src/components/ui/ChecklistBlock.astro` | §6 anchored checklist |
| `src/components/concept/ReservoirAnalogy.astro` | Layer 1 · reservoir metaphor SVG |
| `src/components/concept/CurrentWaveAnimation.astro` | Layer 1 · current pulse SVG |
| `src/components/concept/FrequencyBandMap.astro` | Layer 1 · cap-value→frequency bands |
| `src/components/sim/shared/Slider.svelte` | Accessible labeled slider |
| `src/components/sim/shared/ChartCard.svelte` | Dark-themed chart wrapper |
| `src/components/sim/TimeDomainScope.svelte` | §3 · time-domain scope island |
| `src/components/sim/PdnImpedance.svelte` | §4 · Z(f) Bode island |
| `src/components/verify/MeasurementGallery.astro` | §5 · scope-shot gallery (placeholders initially) |
| `src/lib/pdn/impedance.ts` | Pure Z(f) math (cap impedance, parallel combination) |
| `src/lib/pdn/timeDomain.ts` | Pure RK4 solver for lumped PDN model |
| `src/lib/pdn/presets.ts` | Cap and load presets |
| `src/lib/content/topics.ts` | Topic metadata registry |
| `src/styles/global.css` | Tailwind + CSS custom properties for trace colors |
| `tests/pdn/impedance.test.ts` | Math unit tests |
| `tests/pdn/timeDomain.test.ts` | Solver unit tests |
| `public/verify/README.md` | Instructions for adding measurement photos later |
| `README.md` | How to add a new topic (template) |

---

## Phase 0 — Bootstrap

### Task 0.1: Initialize git repo and Astro scaffold

**Files:**
- Create: `.gitignore`, `package.json`, `astro.config.mjs`, `tsconfig.json`, `tailwind.config.mjs`, `src/pages/index.astro`

- [ ] **Step 1: Initialize git in the project root**

```bash
cd /Users/dkkang/dev/hardware-pcb-design-guide
git init
git branch -M main
```

- [ ] **Step 2: Create `.gitignore`**

Write `.gitignore`:
```
node_modules/
dist/
.astro/
.env
.env.*
.DS_Store
.superpowers/
```

- [ ] **Step 3: Scaffold Astro with TypeScript**

```bash
npm create astro@latest . -- --template minimal --typescript strict --no-install --no-git --yes
npm install
```

Expected: creates `src/pages/index.astro`, `astro.config.mjs`, `package.json`, installs deps.

- [ ] **Step 4: Add Tailwind integration**

```bash
npx astro add tailwind --yes
```

Expected: updates `astro.config.mjs`, creates `tailwind.config.mjs`, adds `src/styles/global.css`.

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```

Expected: dev server at `http://localhost:4321`, default Astro welcome page renders. Stop with Ctrl-C.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Astro + Tailwind project"
```

---

### Task 0.2: Add Svelte, MDX, KaTeX integrations

**Files:**
- Modify: `astro.config.mjs`, `package.json`

- [ ] **Step 1: Add Svelte integration**

```bash
npx astro add svelte --yes
```

- [ ] **Step 2: Add MDX integration**

```bash
npx astro add mdx --yes
```

- [ ] **Step 3: Install KaTeX plugins**

```bash
npm install remark-math rehype-katex katex
```

- [ ] **Step 4: Wire KaTeX into MDX config**

Modify `astro.config.mjs` (add to `defineConfig`):
```js
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import svelte from '@astrojs/svelte';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  integrations: [tailwind(), svelte(), mdx()],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});
```

- [ ] **Step 5: Import KaTeX CSS**

Append to `src/styles/global.css`:
```css
@import 'katex/dist/katex.min.css';
```

- [ ] **Step 6: Verify build succeeds**

```bash
npm run build
```

Expected: build completes, `dist/` generated.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: add Svelte, MDX, KaTeX integrations"
```

---

### Task 0.3: Install ECharts, Vitest, and set up Tailwind tokens

**Files:**
- Modify: `package.json`, `tailwind.config.mjs`, `src/styles/global.css`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install runtime and test dependencies**

```bash
npm install echarts
npm install -D vitest @testing-library/svelte @testing-library/jest-dom jsdom
```

- [ ] **Step 2: Create `vitest.config.ts`**

Write `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: false })],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

- [ ] **Step 3: Add `test` script to `package.json`**

Edit `package.json` `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Add color tokens to Tailwind and CSS custom properties**

Modify `tailwind.config.mjs` to extend colors:
```js
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        trace: {
          primary: '#0284c7',
          warn: '#db2777',
          ok: '#059669',
        },
        scope: {
          bg: '#020617',
          grid: '#1e293b',
          axis: '#64748b',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
};
```

Append to `src/styles/global.css`:
```css
:root {
  --trace-primary: #0284c7;
  --trace-warn: #db2777;
  --trace-ok: #059669;
  --scope-bg: #020617;
  --scope-grid: #1e293b;
}

html { scroll-behavior: smooth; }
body { font-family: system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', sans-serif; }
```

- [ ] **Step 5: Verify tests run (empty)**

```bash
npm test
```

Expected: `No test files found, exiting with code 1` or similar (acceptable — no tests yet).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: add ECharts, Vitest, Tailwind color tokens"
```

---

## Phase 1 — PDN Math Core (TDD)

### Task 1.1: `impedance.ts` — single cap + parallel combination

**Files:**
- Create: `src/lib/pdn/impedance.ts`
- Test: `tests/pdn/impedance.test.ts`

Model: each cap is `Z(f) = ESR + jωL_esl + 1/(jωC)`. Parallel combination of multiple impedances: `1/Z_total = Σ 1/Z_i`.

- [ ] **Step 1: Write failing tests**

Create `tests/pdn/impedance.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { capImpedance, parallelImpedance, magnitude, type Cap, type Complex } from '../../src/lib/pdn/impedance';

const CAP_100NF: Cap = { C: 100e-9, ESL: 1e-9, ESR: 0.01 };

describe('capImpedance', () => {
  it('at self-resonant frequency, magnitude approaches ESR', () => {
    const srf = 1 / (2 * Math.PI * Math.sqrt(CAP_100NF.ESL * CAP_100NF.C));
    const z = capImpedance(CAP_100NF, srf);
    expect(magnitude(z)).toBeCloseTo(CAP_100NF.ESR, 3);
  });

  it('far below SRF, magnitude matches 1/(2πfC)', () => {
    const f = 1e3;
    const z = capImpedance(CAP_100NF, f);
    const expected = 1 / (2 * Math.PI * f * CAP_100NF.C);
    expect(magnitude(z) / expected).toBeCloseTo(1, 2);
  });

  it('far above SRF, magnitude matches 2πfL', () => {
    const f = 1e9;
    const z = capImpedance(CAP_100NF, f);
    const expected = 2 * Math.PI * f * CAP_100NF.ESL;
    expect(magnitude(z) / expected).toBeCloseTo(1, 2);
  });
});

describe('parallelImpedance', () => {
  it('two equal impedances combine to half', () => {
    const a: Complex = { re: 2, im: 0 };
    const b: Complex = { re: 2, im: 0 };
    const z = parallelImpedance([a, b]);
    expect(z.re).toBeCloseTo(1, 9);
    expect(z.im).toBeCloseTo(0, 9);
  });

  it('empty array returns infinity (open circuit)', () => {
    const z = parallelImpedance([]);
    expect(magnitude(z)).toBe(Infinity);
  });

  it('single element returned unchanged', () => {
    const a: Complex = { re: 3, im: 4 };
    const z = parallelImpedance([a]);
    expect(z.re).toBeCloseTo(3, 9);
    expect(z.im).toBeCloseTo(4, 9);
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test -- tests/pdn/impedance.test.ts
```

Expected: FAIL (module not found).

- [ ] **Step 3: Implement `impedance.ts`**

Create `src/lib/pdn/impedance.ts`:
```ts
export type Complex = { re: number; im: number };

export type Cap = {
  C: number;    // Farads
  ESL: number;  // Henries
  ESR: number;  // Ohms
};

export function magnitude(z: Complex): number {
  return Math.hypot(z.re, z.im);
}

function cAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

function cInv(a: Complex): Complex {
  const d = a.re * a.re + a.im * a.im;
  if (d === 0) return { re: Infinity, im: 0 };
  return { re: a.re / d, im: -a.im / d };
}

/** Z(f) = ESR + jωL + 1/(jωC) = ESR + j(ωL − 1/(ωC)) */
export function capImpedance(cap: Cap, freqHz: number): Complex {
  const w = 2 * Math.PI * freqHz;
  const im = w * cap.ESL - 1 / (w * cap.C);
  return { re: cap.ESR, im };
}

/** 1/Ztotal = Σ 1/Zi */
export function parallelImpedance(zs: Complex[]): Complex {
  if (zs.length === 0) return { re: Infinity, im: 0 };
  let sum: Complex = { re: 0, im: 0 };
  for (const z of zs) sum = cAdd(sum, cInv(z));
  return cInv(sum);
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test -- tests/pdn/impedance.test.ts
```

Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(pdn): add impedance math with single-cap and parallel combination"
```

---

### Task 1.2: `timeDomain.ts` — RK4 solver for lumped PDN

**Files:**
- Create: `src/lib/pdn/timeDomain.ts`
- Test: `tests/pdn/timeDomain.test.ts`

Model: single Vdd node.
- `C_total · dV/dt = I_VRM − I_load(t)`
- `L_vrm · dI_VRM/dt = V_target − V − R_vrm · I_VRM`

State: `[V, I_VRM]`. Integrate with classic RK4.

- [ ] **Step 1: Write failing test**

Create `tests/pdn/timeDomain.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { simulateTimeDomain, type SimParams } from '../../src/lib/pdn/timeDomain';

describe('simulateTimeDomain', () => {
  it('at steady state with no load, V stays near V_target', () => {
    const params: SimParams = {
      Vtarget: 3.3,
      Rvrm: 0.01,
      Lvrm: 100e-9,
      Ctotal: 1e-6,
      ESRtotal: 0.01,
      loadCurrent: () => 0,
      dt: 10e-9,
      tMax: 5e-6,
    };
    const { t, V } = simulateTimeDomain(params);
    expect(t.length).toBe(V.length);
    const last = V[V.length - 1];
    expect(last).toBeCloseTo(3.3, 2);
  });

  it('on a load step, V dips and recovers within window', () => {
    const params: SimParams = {
      Vtarget: 3.3,
      Rvrm: 0.05,
      Lvrm: 500e-9,
      Ctotal: 10e-6,
      ESRtotal: 0.005,
      loadCurrent: (t) => (t > 1e-6 ? 1.0 : 0),
      dt: 10e-9,
      tMax: 10e-6,
    };
    const { V } = simulateTimeDomain(params);
    const minV = Math.min(...V);
    expect(minV).toBeLessThan(3.3);
    expect(minV).toBeGreaterThan(2.5);
    const last = V[V.length - 1];
    expect(last).toBeGreaterThan(3.0);
  });

  it('larger Ctotal reduces peak dip for same load step', () => {
    const base = (C: number) => ({
      Vtarget: 3.3,
      Rvrm: 0.05,
      Lvrm: 500e-9,
      Ctotal: C,
      ESRtotal: 0.005,
      loadCurrent: (t: number) => (t > 1e-6 ? 1.0 : 0),
      dt: 10e-9,
      tMax: 10e-6,
    });
    const small = simulateTimeDomain(base(1e-6));
    const big = simulateTimeDomain(base(100e-6));
    expect(Math.min(...big.V)).toBeGreaterThan(Math.min(...small.V));
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test -- tests/pdn/timeDomain.test.ts
```

Expected: FAIL (module not found).

- [ ] **Step 3: Implement `timeDomain.ts`**

Create `src/lib/pdn/timeDomain.ts`:
```ts
export type SimParams = {
  Vtarget: number;
  Rvrm: number;
  Lvrm: number;
  Ctotal: number;
  ESRtotal: number;
  loadCurrent: (t: number) => number;
  dt: number;
  tMax: number;
};

export type SimResult = {
  t: Float64Array;
  V: Float64Array;
  Ivrm: Float64Array;
  Iload: Float64Array;
};

/** state = [V, Ivrm]; returns [dV, dIvrm] */
function derivs(
  state: [number, number],
  t: number,
  p: SimParams
): [number, number] {
  const [V, Ivrm] = state;
  const Iload = p.loadCurrent(t);
  const dV = (Ivrm - Iload) / p.Ctotal;
  const dIvrm = (p.Vtarget - V - p.Rvrm * Ivrm) / p.Lvrm;
  return [dV, dIvrm];
}

export function simulateTimeDomain(p: SimParams): SimResult {
  const n = Math.floor(p.tMax / p.dt) + 1;
  const t = new Float64Array(n);
  const V = new Float64Array(n);
  const Ivrm = new Float64Array(n);
  const Iload = new Float64Array(n);

  let state: [number, number] = [p.Vtarget, 0];
  for (let i = 0; i < n; i++) {
    const ti = i * p.dt;
    t[i] = ti;
    V[i] = state[0];
    Ivrm[i] = state[1];
    Iload[i] = p.loadCurrent(ti);

    const k1 = derivs(state, ti, p);
    const s2: [number, number] = [state[0] + (p.dt / 2) * k1[0], state[1] + (p.dt / 2) * k1[1]];
    const k2 = derivs(s2, ti + p.dt / 2, p);
    const s3: [number, number] = [state[0] + (p.dt / 2) * k2[0], state[1] + (p.dt / 2) * k2[1]];
    const k3 = derivs(s3, ti + p.dt / 2, p);
    const s4: [number, number] = [state[0] + p.dt * k3[0], state[1] + p.dt * k3[1]];
    const k4 = derivs(s4, ti + p.dt, p);

    state = [
      state[0] + (p.dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
      state[1] + (p.dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
    ];
  }
  return { t, V, Ivrm, Iload };
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test -- tests/pdn/timeDomain.test.ts
```

Expected: all 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(pdn): add RK4 time-domain PDN solver"
```

---

### Task 1.3: `presets.ts` — cap and load presets

**Files:**
- Create: `src/lib/pdn/presets.ts`

No tests — pure data. Consumed by UI components.

- [ ] **Step 1: Create `presets.ts`**

Create `src/lib/pdn/presets.ts`:
```ts
import type { Cap } from './impedance';

export type CapKind = 'bulk' | 'mid' | 'hf';

export type NamedCap = Cap & { kind: CapKind; label: string };

export const CAP_100NF: NamedCap = {
  kind: 'hf',
  label: '100 nF (ceramic, 0402)',
  C: 100e-9,
  ESL: 0.5e-9,
  ESR: 0.02,
};

export const CAP_10UF: NamedCap = {
  kind: 'mid',
  label: '10 μF (ceramic, 0603)',
  C: 10e-6,
  ESL: 1.0e-9,
  ESR: 0.01,
};

export const CAP_100UF_BULK: NamedCap = {
  kind: 'bulk',
  label: '100 μF (polymer bulk)',
  C: 100e-6,
  ESL: 2.5e-9,
  ESR: 0.015,
};

export type CapMix = { cap: NamedCap; count: number };

export const MIX_PRESETS: { name: string; mix: CapMix[] }[] = [
  { name: '0개 (나쁜 예)', mix: [] },
  { name: '0.1μF × 1', mix: [{ cap: CAP_100NF, count: 1 }] },
  {
    name: '0.1μF × 4 + 10μF × 1',
    mix: [
      { cap: CAP_100NF, count: 4 },
      { cap: CAP_10UF, count: 1 },
    ],
  },
  {
    name: '권장 풀세트 (100μF + 10μF + 100nF×4)',
    mix: [
      { cap: CAP_100UF_BULK, count: 1 },
      { cap: CAP_10UF, count: 1 },
      { cap: CAP_100NF, count: 4 },
    ],
  },
];

export const LOAD_PRESETS: { name: string; step: number; rise: number }[] = [
  { name: 'soft (0.5A / 50ns)', step: 0.5, rise: 50e-9 },
  { name: 'typical (1A / 10ns)', step: 1.0, rise: 10e-9 },
  { name: 'aggressive (3A / 2ns)', step: 3.0, rise: 2e-9 },
];
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(pdn): add cap and load presets"
```

---

## Phase 2 — Layout & Page Skeleton

### Task 2.1: `TopicLayout.astro` + topics registry + index page

**Files:**
- Create: `src/layouts/TopicLayout.astro`
- Create: `src/lib/content/topics.ts`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create topics registry**

Create `src/lib/content/topics.ts`:
```ts
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
```

- [ ] **Step 2: Create `TopicLayout.astro`**

Create `src/layouts/TopicLayout.astro`:
```astro
---
import '../styles/global.css';
import type { Topic } from '../lib/content/topics';

interface Props { topic: Topic }
const { topic } = Astro.props;
---
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{topic.title} · Hardware PCB Design Guide</title>
    <meta name="description" content={topic.subtitle} />
  </head>
  <body class="bg-white text-slate-900 antialiased">
    <header class="border-b border-slate-200">
      <div class="mx-auto max-w-3xl px-6 py-5 flex items-center justify-between">
        <a href="/" class="font-mono text-sm text-slate-600 hover:text-slate-900">
          ← hardware-guide
        </a>
      </div>
    </header>

    <section class="border-b border-slate-200">
      <div class="mx-auto max-w-3xl px-6 py-10">
        <div class="font-mono text-xs tracking-widest text-sky-700">{topic.category}</div>
        <h1 class="mt-2 text-3xl font-semibold text-slate-900">{topic.title}</h1>
        <p class="mt-3 text-slate-600 leading-relaxed">{topic.subtitle}</p>
        <div class="mt-5 flex gap-2 font-mono text-xs">
          <span class="rounded bg-slate-100 px-2 py-1 text-slate-700">⏱ {topic.readingMinutes}분</span>
          <span class="rounded bg-amber-50 px-2 py-1 text-amber-800">★ {topic.level}</span>
        </div>
      </div>
    </section>

    <main class="mx-auto max-w-3xl px-6 py-10 prose prose-slate max-w-none">
      <slot />
    </main>

    <footer class="border-t border-slate-200 mt-20">
      <div class="mx-auto max-w-3xl px-6 py-8 text-sm text-slate-500">
        © hardware-guide · <a class="underline" href="https://github.com/">repo</a>
      </div>
    </footer>
  </body>
</html>
```

- [ ] **Step 3: Add Tailwind typography plugin**

```bash
npm install -D @tailwindcss/typography
```

Update `tailwind.config.mjs` `plugins`:
```js
import typography from '@tailwindcss/typography';
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: { /* ... existing ... */ },
  plugins: [typography],
};
```

- [ ] **Step 4: Write topic list landing page**

Overwrite `src/pages/index.astro`:
```astro
---
import '../styles/global.css';
import { TOPICS } from '../lib/content/topics';
---
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Hardware PCB Design Guide</title>
  </head>
  <body class="bg-white text-slate-900">
    <main class="mx-auto max-w-3xl px-6 py-16">
      <h1 class="text-3xl font-semibold">Hardware PCB Design Guide</h1>
      <p class="mt-3 text-slate-600">하드웨어 설계 리뷰 시 반복적으로 확인해야 하는 항목들을 직관적으로 이해하고, 만져보고, 검증할 수 있도록.</p>

      <ul class="mt-10 divide-y divide-slate-200">
        {TOPICS.map((t) => (
          <li class="py-5">
            <a href={`/${t.slug}`} class="block group">
              <div class="font-mono text-xs tracking-widest text-sky-700">{t.category}</div>
              <div class="mt-1 text-xl font-medium group-hover:text-sky-700">{t.title}</div>
              <div class="mt-1 text-slate-600 text-sm">{t.subtitle}</div>
            </a>
          </li>
        ))}
      </ul>
    </main>
  </body>
</html>
```

- [ ] **Step 5: Verify build + dev**

```bash
npm run build && npm run dev
```

Expected: build passes. `http://localhost:4321/` shows topic list with the one entry.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add TopicLayout, topics registry, index page"
```

---

### Task 2.2: UI primitives — SectionHeader, TlDrBlock, ChecklistBlock

**Files:**
- Create: `src/components/ui/SectionHeader.astro`
- Create: `src/components/ui/TlDrBlock.astro`
- Create: `src/components/ui/ChecklistBlock.astro`

- [ ] **Step 1: Create `SectionHeader.astro`**

Create `src/components/ui/SectionHeader.astro`:
```astro
---
interface Props {
  id: string;
  label: string;     // e.g. "§2 · 개념"
  title: string;
}
const { id, label, title } = Astro.props;
---
<header id={id} class="mt-16 mb-6 scroll-mt-20">
  <div class="font-mono text-xs tracking-widest text-slate-500">{label}</div>
  <h2 class="mt-1 text-2xl font-semibold text-slate-900">{title}</h2>
</header>
```

- [ ] **Step 2: Create `TlDrBlock.astro`**

Create `src/components/ui/TlDrBlock.astro`:
```astro
---
interface Props { points: string[] }
const { points } = Astro.props;
---
<aside class="not-prose my-8 rounded-lg border border-slate-200 bg-slate-50 p-5">
  <div class="font-mono text-xs tracking-widest text-slate-500">TL;DR</div>
  <ul class="mt-2 list-disc pl-5 text-slate-800 space-y-1">
    {points.map((p) => <li>{p}</li>)}
  </ul>
</aside>
```

- [ ] **Step 3: Create `ChecklistBlock.astro`**

Create `src/components/ui/ChecklistBlock.astro`:
```astro
---
interface Item { text: string; anchor?: string }
interface Props { items: Item[] }
const { items } = Astro.props;
---
<ul class="not-prose my-4 space-y-2">
  {items.map((it) => (
    <li class="flex items-start gap-3">
      <input type="checkbox" class="mt-1 h-4 w-4 accent-sky-600" />
      <span class="text-slate-800">
        {it.anchor ? <a href={`#${it.anchor}`} class="underline decoration-slate-300 hover:decoration-sky-600">{it.text}</a> : it.text}
      </span>
    </li>
  ))}
</ul>
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(ui): add SectionHeader, TlDrBlock, ChecklistBlock primitives"
```

---

### Task 2.3: `decoupling-capacitor.mdx` — skeleton with 7 sections

**Files:**
- Create: `src/pages/decoupling-capacitor.mdx`

Full Korean narrative content for the non-interactive parts. Layer 1/2/3 components come empty here and get filled in Phases 3 and 4 — the MDX will import them and update as those tasks complete.

- [ ] **Step 1: Create the MDX page**

Create `src/pages/decoupling-capacitor.mdx`:
```mdx
---
import TopicLayout from '../layouts/TopicLayout.astro';
import SectionHeader from '../components/ui/SectionHeader.astro';
import TlDrBlock from '../components/ui/TlDrBlock.astro';
import ChecklistBlock from '../components/ui/ChecklistBlock.astro';
import { TOPICS } from '../lib/content/topics';

export const topic = TOPICS.find((t) => t.slug === 'decoupling-capacitor');
---

<TopicLayout topic={topic}>

<SectionHeader id="tldr" label="§1 · TL;DR" title="바쁜 사람을 위한 3줄 요약" />

<TlDrBlock points={[
  "IC가 순간적으로 전류를 땡기면 전원에서 바로 공급되지 못한다 (선로가 Inductive). Cap이 근처에서 임시 공급한다.",
  "한 값이 모든 주파수를 커버하지 못한다. 100 nF · 10 μF · bulk를 섞어야 PDN 임피던스가 고르게 낮아진다.",
  "얼마나 많이가 아니라 어디에·어떻게 놓느냐가 중요하다 (IC 핀 옆, via 최단거리)."
]} />

<SectionHeader id="concept" label="§2 · 개념" title="왜 필요한가 — 저수지 비유" />

IC는 일종의 "샤워기" 다. 물(전류)을 쓸 때, 먼 댐(VRM)에서 긴 파이프(PCB 트레이스)를 통해 오기 때문에 **즉시** 도달하지 못한다. 파이프 자체가 관성(Inductance)을 가지기 때문이다.

그래서 샤워기 바로 옆에 **동네 물탱크(디커플링 커패시터)** 를 둔다. 수요가 튀는 순간에는 이 물탱크가 먼저 공급하고, VRM은 느긋하게 따라온다.

{/* ReservoirAnalogy, CurrentWaveAnimation, FrequencyBandMap 컴포넌트는 Phase 3에서 삽입 */}

<SectionHeader id="time-domain" label="§3 · 탐색 1" title="시간영역 — cap 개수/값을 바꿔보자" />

아래 시뮬레이션에서 cap 개수와 값, load step 크기를 조절해보세요. Vdd 전압이 얼마나 출렁이는지 실시간으로 확인할 수 있습니다.

{/* TimeDomainScope 컴포넌트는 Phase 4에서 삽입 */}

<SectionHeader id="frequency-domain" label="§4 · 탐색 2" title="주파수영역 — 왜 여러 값을 섞는가 (PDN Z(f))" />

하나의 값만으로는 한 주파수 대역만 커버된다. 여러 값을 섞으면 전체 주파수에서 임피던스가 고르게 낮아진다. 다만, 두 cap의 주파수가 만나는 지점에서 **반공진(anti-resonance)** 피크가 생길 수 있다 — 이 피크가 타겟 임피던스 위로 튀어나오면 거기서 리플이 최악이 된다.

$$Z_\text{cap}(f) = \text{ESR} + j\omega L_\text{ESL} + \frac{1}{j\omega C}$$

{/* PdnImpedance 컴포넌트는 Phase 4에서 삽입 */}

<SectionHeader id="verify" label="§5 · 검증" title="실측 — 현실에서도 그런가" />

아래는 실제 기판에서 찍은 오실로스코프 캡처입니다. 0개 / 1개 / 4개 / 4개+bulk 비교.

{/* MeasurementGallery 컴포넌트는 Phase 5에서 삽입. 초기엔 placeholder */}

<SectionHeader id="checklist" label="§6 · 설계 리뷰 체크리스트" title="실무에서 확인할 것" />

<ChecklistBlock items={[
  { text: "각 전원 핀마다 0.1 μF 하나 — IC 바로 옆", anchor: "concept" },
  { text: "다른 값 혼용 (100 nF + 10 μF + bulk)", anchor: "frequency-domain" },
  { text: "via/trace 최단거리 · 같은 층 우선", anchor: "concept" },
  { text: "Ground return 경로 확인", anchor: "concept" },
  { text: "타겟 임피던스 아래 전 주파수에서 유지", anchor: "frequency-domain" }
]} />

<SectionHeader id="further" label="§7 · 더 깊이 / 다음" title="참고자료와 다음 토픽" />

이 가이드의 시뮬레이션은 **교육용 직관 모델** 입니다. 수치는 ±30% 정도만 맞습니다. 실제 설계 검증은 SPICE 와 실측을 꼭 병행하세요.

- 다음 토픽 (예정): PDN planning, Signal integrity, Ground bounce
- 피드백/오류 신고: (repo link)

</TopicLayout>
```

- [ ] **Step 2: Verify page builds and renders**

```bash
npm run dev
```

Visit `http://localhost:4321/decoupling-capacitor` — all 7 sections render with headers, TL;DR bullets, text, and checklist. KaTeX formula in §4 renders as math.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add decoupling-capacitor.mdx skeleton with 7 sections"
```

---

## Phase 3 — Layer 1 · Concept illustrations

### Task 3.1: `ReservoirAnalogy.astro` — reservoir metaphor SVG

**Files:**
- Create: `src/components/concept/ReservoirAnalogy.astro`
- Modify: `src/pages/decoupling-capacitor.mdx` (insert after §2 narrative paragraph)

A static-with-CSS-animation SVG showing dam → pipe → tank → shower, with a pulsing flow indicator.

- [ ] **Step 1: Create the component**

Create `src/components/concept/ReservoirAnalogy.astro`:
```astro
---
---
<figure class="not-prose my-8 rounded-lg border border-slate-200 bg-white p-4">
  <svg viewBox="0 0 600 220" class="w-full" role="img" aria-label="저수지 비유: 댐(VRM)에서 파이프(트레이스)를 통해 물탱크(cap)를 거쳐 샤워기(IC)로 흐르는 구조">
    <!-- Dam (VRM) -->
    <rect x="20" y="70" width="80" height="80" fill="#cbd5e1" stroke="#475569" stroke-width="2" rx="4"/>
    <text x="60" y="175" text-anchor="middle" font-family="ui-monospace" font-size="11" fill="#475569">VRM (댐)</text>

    <!-- Long pipe -->
    <rect x="100" y="100" width="260" height="20" fill="#94a3b8" stroke="#475569" stroke-width="1"/>
    <text x="230" y="145" text-anchor="middle" font-family="ui-monospace" font-size="11" fill="#475569">PCB trace — inductive</text>

    <!-- Tank (cap) -->
    <rect x="360" y="40" width="60" height="80" fill="#bae6fd" stroke="#0284c7" stroke-width="2" rx="4"/>
    <text x="390" y="175" text-anchor="middle" font-family="ui-monospace" font-size="11" fill="#0284c7">cap (물탱크)</text>

    <!-- Short pipe to IC -->
    <rect x="420" y="100" width="60" height="20" fill="#94a3b8" stroke="#475569" stroke-width="1"/>

    <!-- Shower (IC) -->
    <path d="M 480 80 L 540 80 L 540 120 L 480 120 Z" fill="#fde68a" stroke="#b45309" stroke-width="2"/>
    <text x="510" y="175" text-anchor="middle" font-family="ui-monospace" font-size="11" fill="#b45309">IC (샤워기)</text>

    <!-- Flow particles — slow from VRM -->
    <circle r="4" fill="#0284c7">
      <animateMotion dur="5s" repeatCount="indefinite" path="M 100 110 L 360 110"/>
    </circle>
    <circle r="4" fill="#0284c7">
      <animateMotion dur="5s" begin="1.6s" repeatCount="indefinite" path="M 100 110 L 360 110"/>
    </circle>
    <circle r="4" fill="#0284c7">
      <animateMotion dur="5s" begin="3.3s" repeatCount="indefinite" path="M 100 110 L 360 110"/>
    </circle>

    <!-- Fast bursts from cap -->
    <circle r="4" fill="#db2777">
      <animateMotion dur="1s" repeatCount="indefinite" path="M 420 110 L 480 110"/>
    </circle>
    <circle r="4" fill="#db2777">
      <animateMotion dur="1s" begin="0.3s" repeatCount="indefinite" path="M 420 110 L 480 110"/>
    </circle>
  </svg>
  <figcaption class="mt-2 text-xs text-slate-500 text-center">느린 VRM 공급 (파랑) vs IC 근처 cap의 빠른 응답 (핑크)</figcaption>
</figure>
```

- [ ] **Step 2: Insert into MDX**

Edit `src/pages/decoupling-capacitor.mdx` — add import at top:
```mdx
import ReservoirAnalogy from '../components/concept/ReservoirAnalogy.astro';
```

Replace the `{/* ReservoirAnalogy ... */}` comment with:
```mdx
<ReservoirAnalogy />
```

- [ ] **Step 3: Verify dev renders animation**

Open `http://localhost:4321/decoupling-capacitor#concept` — dots flow continuously left-to-right in long pipe, faster bursts in short pipe.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(concept): add ReservoirAnalogy SVG"
```

---

### Task 3.2: `CurrentWaveAnimation.astro` — circuit with current pulses

**Files:**
- Create: `src/components/concept/CurrentWaveAnimation.astro`
- Modify: `src/pages/decoupling-capacitor.mdx`

An SVG showing the actual circuit (VRM - L - Vdd node with cap - IC). A current arrow animates between "VRM lags behind, cap supplies first".

- [ ] **Step 1: Create the component**

Create `src/components/concept/CurrentWaveAnimation.astro`:
```astro
---
---
<figure class="not-prose my-8 rounded-lg border border-slate-200 bg-white p-4">
  <svg viewBox="0 0 600 240" class="w-full" role="img" aria-label="전류 파동 애니메이션: IC 순간 전류 수요 시 cap이 먼저 응답, VRM이 뒤따름">
    <!-- Horizontal rail -->
    <line x1="40" y1="80" x2="560" y2="80" stroke="#475569" stroke-width="2"/>

    <!-- VRM symbol -->
    <circle cx="60" cy="80" r="18" fill="white" stroke="#475569" stroke-width="2"/>
    <text x="60" y="85" text-anchor="middle" font-family="ui-monospace" font-size="12" fill="#475569">V</text>
    <text x="60" y="125" text-anchor="middle" font-family="ui-monospace" font-size="11" fill="#475569">VRM</text>

    <!-- Inductor (pipe) -->
    <path d="M 100 80 C 108 60, 118 60, 126 80 C 134 60, 144 60, 152 80 C 160 60, 170 60, 178 80 C 186 60, 196 60, 204 80" fill="none" stroke="#475569" stroke-width="2"/>
    <text x="152" y="55" text-anchor="middle" font-family="ui-monospace" font-size="10" fill="#64748b">L (trace)</text>

    <!-- Vdd node label -->
    <circle cx="340" cy="80" r="4" fill="#475569"/>
    <text x="340" y="65" text-anchor="middle" font-family="ui-monospace" font-size="11" fill="#475569">Vdd</text>

    <!-- Cap -->
    <line x1="340" y1="80" x2="340" y2="140" stroke="#475569" stroke-width="2"/>
    <line x1="320" y1="140" x2="360" y2="140" stroke="#0284c7" stroke-width="3"/>
    <line x1="320" y1="150" x2="360" y2="150" stroke="#0284c7" stroke-width="3"/>
    <line x1="340" y1="150" x2="340" y2="180" stroke="#475569" stroke-width="2"/>
    <line x1="320" y1="180" x2="360" y2="180" stroke="#475569" stroke-width="3"/>
    <line x1="325" y1="185" x2="355" y2="185" stroke="#475569" stroke-width="2"/>
    <line x1="330" y1="190" x2="350" y2="190" stroke="#475569" stroke-width="1"/>
    <text x="380" y="150" font-family="ui-monospace" font-size="11" fill="#0284c7">cap</text>

    <!-- IC block -->
    <rect x="460" y="55" width="80" height="50" fill="#fde68a" stroke="#b45309" stroke-width="2" rx="4"/>
    <text x="500" y="85" text-anchor="middle" font-family="ui-monospace" font-size="11" fill="#b45309">IC</text>
    <line x1="460" y1="80" x2="340" y2="80" stroke="#475569" stroke-width="2"/>

    <!-- Animated current arrows -->
    <!-- fast: cap → IC -->
    <g>
      <circle r="5" fill="#db2777">
        <animateMotion dur="0.6s" repeatCount="indefinite" path="M 340 80 L 460 80" keyTimes="0;1" keySplines="0.1 0.9 0.2 1" calcMode="spline"/>
      </circle>
    </g>
    <!-- slow: VRM → cap node -->
    <g>
      <circle r="5" fill="#0284c7">
        <animateMotion dur="2.4s" repeatCount="indefinite" path="M 60 80 L 340 80"/>
      </circle>
      <circle r="5" fill="#0284c7">
        <animateMotion dur="2.4s" begin="0.8s" repeatCount="indefinite" path="M 60 80 L 340 80"/>
      </circle>
      <circle r="5" fill="#0284c7">
        <animateMotion dur="2.4s" begin="1.6s" repeatCount="indefinite" path="M 60 80 L 340 80"/>
      </circle>
    </g>
  </svg>
  <figcaption class="mt-2 text-xs text-slate-500 text-center">IC 수요에 먼저 응답하는 cap (핑크) · 늦게 따라오는 VRM 공급 (파랑)</figcaption>
</figure>
```

- [ ] **Step 2: Insert into MDX**

Add import:
```mdx
import CurrentWaveAnimation from '../components/concept/CurrentWaveAnimation.astro';
```

Place right after `<ReservoirAnalogy />`.

- [ ] **Step 3: Verify**

Visit page — both animations visible. Animations loop cleanly.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(concept): add CurrentWaveAnimation SVG"
```

---

### Task 3.3: `FrequencyBandMap.astro` — cap value → frequency band coverage

**Files:**
- Create: `src/components/concept/FrequencyBandMap.astro`
- Modify: `src/pages/decoupling-capacitor.mdx`

Static illustration: three horizontal bands (100nF hf, 10μF mid, bulk lf), a frequency axis with labels. A teaser for §4.

- [ ] **Step 1: Create the component**

Create `src/components/concept/FrequencyBandMap.astro`:
```astro
---
---
<figure class="not-prose my-8 rounded-lg border border-slate-200 bg-white p-4">
  <svg viewBox="0 0 600 200" class="w-full" role="img" aria-label="cap 값별 주파수 담당 구역: bulk는 저주파, 중간값은 중주파, 세라믹은 고주파">
    <!-- axis -->
    <line x1="40" y1="160" x2="560" y2="160" stroke="#475569" stroke-width="1.5"/>
    <text x="40" y="185" font-family="ui-monospace" font-size="11" fill="#64748b">1 kHz</text>
    <text x="180" y="185" font-family="ui-monospace" font-size="11" fill="#64748b">100 kHz</text>
    <text x="320" y="185" font-family="ui-monospace" font-size="11" fill="#64748b">10 MHz</text>
    <text x="460" y="185" font-family="ui-monospace" font-size="11" fill="#64748b">1 GHz</text>
    <text x="520" y="185" font-family="ui-monospace" font-size="11" fill="#64748b">freq →</text>

    <!-- Bulk band -->
    <rect x="40" y="30" width="240" height="30" fill="#059669" fill-opacity="0.25" stroke="#059669" stroke-width="1"/>
    <text x="50" y="50" font-family="ui-monospace" font-size="11" fill="#065f46">100 μF bulk</text>

    <!-- Mid band -->
    <rect x="180" y="70" width="220" height="30" fill="#0284c7" fill-opacity="0.25" stroke="#0284c7" stroke-width="1"/>
    <text x="190" y="90" font-family="ui-monospace" font-size="11" fill="#075985">10 μF</text>

    <!-- HF band -->
    <rect x="300" y="110" width="220" height="30" fill="#db2777" fill-opacity="0.25" stroke="#db2777" stroke-width="1"/>
    <text x="310" y="130" font-family="ui-monospace" font-size="11" fill="#9d174d">100 nF (ceramic)</text>
  </svg>
  <figcaption class="mt-2 text-xs text-slate-500 text-center">값이 작을수록 더 높은 주파수를 담당 — 여러 값을 섞어야 전 대역 커버</figcaption>
</figure>
```

- [ ] **Step 2: Insert into MDX**

Add import:
```mdx
import FrequencyBandMap from '../components/concept/FrequencyBandMap.astro';
```

Place after `<CurrentWaveAnimation />`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(concept): add FrequencyBandMap SVG"
```

---

## Phase 4 — Layer 2 · Interactive simulations

### Task 4.1: Shared Slider.svelte + ChartCard.svelte

**Files:**
- Create: `src/components/sim/shared/Slider.svelte`
- Create: `src/components/sim/shared/ChartCard.svelte`

- [ ] **Step 1: Create `Slider.svelte`**

Create `src/components/sim/shared/Slider.svelte`:
```svelte
<script lang="ts">
  export let label: string;
  export let value: number;
  export let min: number;
  export let max: number;
  export let step: number = 1;
  export let format: (v: number) => string = (v) => String(v);
  export let id: string;
</script>

<label class="block" for={id}>
  <div class="flex items-baseline justify-between">
    <span class="text-sm text-slate-700">{label}</span>
    <span class="font-mono text-sm text-slate-900">{format(value)}</span>
  </div>
  <input
    {id}
    type="range"
    {min}
    {max}
    {step}
    bind:value
    class="mt-1 w-full accent-sky-600"
    aria-valuemin={min}
    aria-valuemax={max}
    aria-valuenow={value}
    aria-label={label}
  />
</label>
```

- [ ] **Step 2: Create `ChartCard.svelte`**

Create `src/components/sim/shared/ChartCard.svelte`:
```svelte
<script lang="ts">
  export let title: string = '';
  export let aria: string = '';
</script>

<div class="rounded-lg bg-slate-950 text-slate-200 p-4 shadow-sm" aria-label={aria || title}>
  {#if title}
    <div class="mb-2 font-mono text-xs tracking-widest text-slate-400">{title}</div>
  {/if}
  <div class="bg-slate-950">
    <slot />
  </div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(sim): add shared Slider and ChartCard"
```

---

### Task 4.2: `TimeDomainScope.svelte` — §3 interactive scope

**Files:**
- Create: `src/components/sim/TimeDomainScope.svelte`
- Modify: `src/pages/decoupling-capacitor.mdx`

Uses `simulateTimeDomain` from `lib/pdn/timeDomain.ts` and `MIX_PRESETS`, `LOAD_PRESETS` from `lib/pdn/presets.ts`. Rendered with ECharts. Reactive: any slider change re-runs sim and pushes new data to the chart.

- [ ] **Step 1: Create the component**

Create `src/components/sim/TimeDomainScope.svelte`:
```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as echarts from 'echarts';
  import Slider from './shared/Slider.svelte';
  import ChartCard from './shared/ChartCard.svelte';
  import { simulateTimeDomain } from '../../lib/pdn/timeDomain';
  import { MIX_PRESETS, LOAD_PRESETS, type NamedCap } from '../../lib/pdn/presets';

  let chartEl: HTMLDivElement;
  let chart: echarts.ECharts | null = null;

  let mixIdx = 2; // default: 0.1μF ×4 + 10μF ×1
  let loadIdx = 1; // typical
  let Vtarget = 3.3;

  $: mix = MIX_PRESETS[mixIdx].mix;
  $: loadSpec = LOAD_PRESETS[loadIdx];

  function totalFromMix(caps: { cap: NamedCap; count: number }[]) {
    let C = 0, L = Infinity, ESR = Infinity;
    for (const { cap, count } of caps) {
      C += cap.C * count;
      // parallel inductance: 1/L_tot = Σ count/L_i
      const Ltot = 1 / (count / cap.ESL);
      L = L === Infinity ? Ltot : 1 / (1 / L + 1 / Ltot);
      const ESRtot = cap.ESR / count;
      ESR = ESR === Infinity ? ESRtot : 1 / (1 / ESR + 1 / ESRtot);
    }
    if (caps.length === 0) return { C: 1e-12, L: 1e-6, ESR: 10 };
    return { C, L, ESR };
  }

  $: totals = totalFromMix(mix);

  $: result = simulateTimeDomain({
    Vtarget,
    Rvrm: 0.05,
    Lvrm: 500e-9,
    Ctotal: totals.C,
    ESRtotal: totals.ESR,
    loadCurrent: (t) => {
      const rise = loadSpec.rise;
      const t0 = 1e-6;
      if (t < t0) return 0;
      if (t < t0 + rise) return loadSpec.step * ((t - t0) / rise);
      return loadSpec.step;
    },
    dt: 10e-9,
    tMax: 8e-6,
  });

  $: vpp = (() => {
    const arr = Array.from(result.V);
    return (Math.max(...arr) - Math.min(...arr)) * 1000; // mV
  })();

  function updateChart() {
    if (!chart) return;
    const tUs = Array.from(result.t).map((x) => x * 1e6);
    const V = Array.from(result.V);
    const I = Array.from(result.Iload);
    chart.setOption({
      animation: false,
      grid: [{ top: 30, height: '45%', left: 50, right: 30 }, { top: '60%', height: '30%', left: 50, right: 30 }],
      xAxis: [
        { type: 'value', gridIndex: 0, name: '', axisLabel: { color: '#94a3b8' }, axisLine: { lineStyle: { color: '#475569' } }, splitLine: { lineStyle: { color: '#1e293b' } } },
        { type: 'value', gridIndex: 1, name: 't (μs)', nameTextStyle: { color: '#94a3b8' }, axisLabel: { color: '#94a3b8' }, axisLine: { lineStyle: { color: '#475569' } }, splitLine: { lineStyle: { color: '#1e293b' } } },
      ],
      yAxis: [
        { type: 'value', gridIndex: 0, name: 'Vdd (V)', nameTextStyle: { color: '#94a3b8' }, axisLabel: { color: '#94a3b8' }, axisLine: { lineStyle: { color: '#475569' } }, splitLine: { lineStyle: { color: '#1e293b' } }, scale: true },
        { type: 'value', gridIndex: 1, name: 'I_load (A)', nameTextStyle: { color: '#94a3b8' }, axisLabel: { color: '#94a3b8' }, axisLine: { lineStyle: { color: '#475569' } }, splitLine: { lineStyle: { color: '#1e293b' } } },
      ],
      series: [
        { type: 'line', xAxisIndex: 0, yAxisIndex: 0, showSymbol: false, data: tUs.map((t, i) => [t, V[i]]), lineStyle: { color: '#0284c7', width: 1.5 } },
        { type: 'line', xAxisIndex: 1, yAxisIndex: 1, showSymbol: false, data: tUs.map((t, i) => [t, I[i]]), lineStyle: { color: '#db2777', width: 1.5 } },
      ],
    });
  }

  onMount(() => {
    chart = echarts.init(chartEl);
    updateChart();
    const ro = new ResizeObserver(() => chart?.resize());
    ro.observe(chartEl);
    return () => ro.disconnect();
  });

  $: if (chart && result) updateChart();

  onDestroy(() => chart?.dispose());
</script>

<div class="not-prose my-8 space-y-4">
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 rounded-lg border border-slate-200 bg-white p-4">
    <label class="block">
      <span class="text-sm text-slate-700">프리셋 (cap 조합)</span>
      <select class="mt-1 w-full rounded border-slate-300" bind:value={mixIdx}>
        {#each MIX_PRESETS as p, i}
          <option value={i}>{p.name}</option>
        {/each}
      </select>
    </label>
    <label class="block">
      <span class="text-sm text-slate-700">Load step</span>
      <select class="mt-1 w-full rounded border-slate-300" bind:value={loadIdx}>
        {#each LOAD_PRESETS as p, i}
          <option value={i}>{p.name}</option>
        {/each}
      </select>
    </label>
    <Slider id="vtarget" label="V_target" bind:value={Vtarget} min={1.8} max={5.0} step={0.1} format={(v) => `${v.toFixed(1)} V`} />
    <div class="rounded bg-slate-50 p-2 text-sm">
      <div class="text-slate-500">현재 리플 (peak-peak)</div>
      <div class="font-mono text-lg text-sky-700">{vpp.toFixed(1)} mV</div>
    </div>
  </div>

  <ChartCard title="Vdd · load current (time domain)" aria="Vdd 전압과 load 전류 시간영역 파형">
    <div bind:this={chartEl} class="h-[380px] w-full"></div>
  </ChartCard>
</div>
```

- [ ] **Step 2: Wire into MDX**

Add import:
```mdx
import TimeDomainScope from '../components/sim/TimeDomainScope.svelte';
```

Replace `{/* TimeDomainScope ... */}` with:
```mdx
<TimeDomainScope client:visible />
```

- [ ] **Step 3: Verify**

Visit `/decoupling-capacitor#time-domain`. Changing the mix preset from "0개" to "권장 풀세트" visibly reduces peak-peak ripple. The mV badge updates.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(sim): add TimeDomainScope island"
```

---

### Task 4.3: `PdnImpedance.svelte` — §4 Bode plot with anti-resonance markers

**Files:**
- Create: `src/components/sim/PdnImpedance.svelte`
- Modify: `src/pages/decoupling-capacitor.mdx`

Log-log Z(f) plot. Users toggle cap groups on/off and see total + per-group contributions. Target impedance is a horizontal line. Anti-resonance peaks auto-detected and marked.

- [ ] **Step 1: Create the component**

Create `src/components/sim/PdnImpedance.svelte`:
```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as echarts from 'echarts';
  import ChartCard from './shared/ChartCard.svelte';
  import Slider from './shared/Slider.svelte';
  import { capImpedance, parallelImpedance, magnitude, type Complex } from '../../lib/pdn/impedance';
  import { CAP_100NF, CAP_10UF, CAP_100UF_BULK } from '../../lib/pdn/presets';

  let chartEl: HTMLDivElement;
  let chart: echarts.ECharts | null = null;

  let onBulk = true, onMid = true, onHf = true;
  let nMid = 1, nHf = 4;
  let Ztarget = 0.05; // 50 mΩ

  // VRM output impedance: low-freq flat at Rvrm, rises at very high freq
  function vrmImpedance(freq: number): Complex {
    const Rvrm = 0.02;
    const Lvrm = 500e-9;
    const w = 2 * Math.PI * freq;
    return { re: Rvrm, im: w * Lvrm };
  }

  function buildCurves() {
    const freqs: number[] = [];
    for (let e = 1; e <= 9; e += 0.02) freqs.push(Math.pow(10, e));

    const bulkLine: number[] = [];
    const midLine: number[] = [];
    const hfLine: number[] = [];
    const totalLine: number[] = [];
    const vrmLine: number[] = [];

    for (const f of freqs) {
      const zs: Complex[] = [];
      const bulkZ = capImpedance(CAP_100UF_BULK, f);
      const midZ = parallelImpedance(Array(nMid).fill(capImpedance(CAP_10UF, f)));
      const hfZ = parallelImpedance(Array(nHf).fill(capImpedance(CAP_100NF, f)));
      const vrmZ = vrmImpedance(f);

      if (onBulk) zs.push(bulkZ);
      if (onMid && nMid > 0) zs.push(midZ);
      if (onHf && nHf > 0) zs.push(hfZ);
      zs.push(vrmZ);

      bulkLine.push(magnitude(bulkZ));
      midLine.push(magnitude(midZ));
      hfLine.push(magnitude(hfZ));
      vrmLine.push(magnitude(vrmZ));
      totalLine.push(magnitude(parallelImpedance(zs)));
    }
    return { freqs, bulkLine, midLine, hfLine, vrmLine, totalLine };
  }

  function findPeaks(freqs: number[], mags: number[]) {
    const peaks: { f: number; z: number }[] = [];
    for (let i = 2; i < mags.length - 2; i++) {
      if (mags[i] > mags[i - 1] && mags[i] > mags[i + 1] && mags[i] > mags[i - 2] && mags[i] > mags[i + 2]) {
        if (mags[i] > Ztarget * 0.8) peaks.push({ f: freqs[i], z: mags[i] });
      }
    }
    peaks.sort((a, b) => b.z - a.z);
    return peaks.slice(0, 2);
  }

  function updateChart() {
    if (!chart) return;
    const { freqs, bulkLine, midLine, hfLine, vrmLine, totalLine } = buildCurves();
    const peaks = findPeaks(freqs, totalLine);

    chart.setOption({
      animation: false,
      grid: { top: 30, bottom: 60, left: 60, right: 30 },
      xAxis: {
        type: 'log',
        name: 'frequency (Hz)',
        nameLocation: 'middle',
        nameGap: 32,
        nameTextStyle: { color: '#94a3b8' },
        axisLabel: { color: '#94a3b8' },
        axisLine: { lineStyle: { color: '#475569' } },
        splitLine: { lineStyle: { color: '#1e293b' } },
        min: 10,
        max: 1e9,
      },
      yAxis: {
        type: 'log',
        name: '|Z| (Ω)',
        nameTextStyle: { color: '#94a3b8' },
        axisLabel: { color: '#94a3b8' },
        axisLine: { lineStyle: { color: '#475569' } },
        splitLine: { lineStyle: { color: '#1e293b' } },
      },
      legend: { textStyle: { color: '#cbd5e1' }, top: 0 },
      tooltip: { trigger: 'axis', backgroundColor: '#0f172a', borderColor: '#334155', textStyle: { color: '#e2e8f0' }, valueFormatter: (v: number) => `${(v * 1000).toFixed(2)} mΩ` },
      series: [
        { name: 'Bulk 100μF', type: 'line', showSymbol: false, lineStyle: { color: '#10b981', type: 'dashed', width: 1 }, data: freqs.map((f, i) => [f, bulkLine[i]]) },
        { name: `10μF × ${nMid}`, type: 'line', showSymbol: false, lineStyle: { color: '#0284c7', type: 'dashed', width: 1 }, data: freqs.map((f, i) => [f, midLine[i]]) },
        { name: `100nF × ${nHf}`, type: 'line', showSymbol: false, lineStyle: { color: '#db2777', type: 'dashed', width: 1 }, data: freqs.map((f, i) => [f, hfLine[i]]) },
        { name: 'VRM', type: 'line', showSymbol: false, lineStyle: { color: '#64748b', type: 'dashed', width: 1 }, data: freqs.map((f, i) => [f, vrmLine[i]]) },
        {
          name: 'Total (합성)',
          type: 'line',
          showSymbol: false,
          lineStyle: { color: '#e2e8f0', width: 2.5 },
          data: freqs.map((f, i) => [f, totalLine[i]]),
          markLine: {
            symbol: 'none',
            data: [{ yAxis: Ztarget, lineStyle: { color: '#facc15', type: 'solid', width: 1.5 }, label: { color: '#facc15', formatter: `타겟 ${(Ztarget * 1000).toFixed(0)} mΩ` } }],
          },
          markPoint: {
            symbol: 'pin',
            symbolSize: 40,
            itemStyle: { color: '#f87171' },
            label: { color: '#fff', fontSize: 10, formatter: ({ data }: any) => `${data.coord[1] * 1000 >= 1 ? (data.coord[1] * 1000).toFixed(0) + 'm' : (data.coord[1] * 1e6).toFixed(0) + 'μ'}Ω` },
            data: peaks.map((p) => ({ coord: [p.f, p.z], name: 'anti-resonance' })),
          },
        },
      ],
    });
  }

  onMount(() => {
    chart = echarts.init(chartEl);
    updateChart();
    const ro = new ResizeObserver(() => chart?.resize());
    ro.observe(chartEl);
    return () => ro.disconnect();
  });

  $: if (chart) updateChart();
  $: [onBulk, onMid, onHf, nMid, nHf, Ztarget]; // reactive trigger

  onDestroy(() => chart?.dispose());
</script>

<div class="not-prose my-8 space-y-4">
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 rounded-lg border border-slate-200 bg-white p-4">
    <label class="flex items-center gap-2"><input type="checkbox" class="accent-emerald-600" bind:checked={onBulk} /> <span class="text-sm">Bulk 100 μF</span></label>
    <div class="flex items-center gap-2">
      <label class="flex items-center gap-2"><input type="checkbox" class="accent-sky-600" bind:checked={onMid} /> <span class="text-sm">10 μF ×</span></label>
      <input type="number" min="0" max="8" step="1" class="w-16 rounded border-slate-300" bind:value={nMid} />
    </div>
    <div class="flex items-center gap-2">
      <label class="flex items-center gap-2"><input type="checkbox" class="accent-pink-600" bind:checked={onHf} /> <span class="text-sm">100 nF ×</span></label>
      <input type="number" min="0" max="16" step="1" class="w-16 rounded border-slate-300" bind:value={nHf} />
    </div>
    <Slider id="ztarget" label="타겟 임피던스" bind:value={Ztarget} min={0.01} max={0.5} step={0.005} format={(v) => `${(v * 1000).toFixed(0)} mΩ`} />
  </div>

  <ChartCard title="PDN |Z(f)| · Bode plot · markers = anti-resonance" aria="PDN 임피던스 주파수 응답">
    <div bind:this={chartEl} class="h-[420px] w-full"></div>
  </ChartCard>
</div>
```

- [ ] **Step 2: Wire into MDX**

Add import:
```mdx
import PdnImpedance from '../components/sim/PdnImpedance.svelte';
```

Replace `{/* PdnImpedance ... */}` with:
```mdx
<PdnImpedance client:visible />
```

- [ ] **Step 3: Verify**

Visit `/decoupling-capacitor#frequency-domain`. Toggle HF off → total |Z| spikes at high frequency. Turn on + bulk + mid → total drops below yellow target line across wide range. Peak marker labels update.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(sim): add PdnImpedance Bode plot with anti-resonance markers"
```

---

## Phase 5 — Verify Layer + Polish

### Task 5.1: `MeasurementGallery.astro` — Layer 3 with placeholders

**Files:**
- Create: `src/components/verify/MeasurementGallery.astro`
- Create: `public/verify/README.md`
- Modify: `src/pages/decoupling-capacitor.mdx`

- [ ] **Step 1: Create the gallery component**

Create `src/components/verify/MeasurementGallery.astro`:
```astro
---
interface Shot {
  key: string;
  label: string;
  caption: string;
  src?: string;
  setup?: string;
  vpp?: string;
}

interface Props { shots: Shot[] }
const { shots } = Astro.props;
---
<div class="not-prose my-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {shots.map((s) => (
    <figure class="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div class="aspect-video bg-slate-950 flex items-center justify-center relative">
        {s.src ? (
          <img src={s.src} alt={s.caption} class="w-full h-full object-cover" />
        ) : (
          <div class="text-center p-4">
            <div class="font-mono text-xs text-emerald-400">{s.label}</div>
            <div class="mt-2 text-[10px] text-slate-500">실측 이미지 준비중</div>
          </div>
        )}
      </div>
      <figcaption class="p-3 text-sm">
        <div class="font-mono text-xs text-slate-500">{s.label}</div>
        <div class="mt-1 text-slate-800">{s.caption}</div>
        {s.setup && <div class="mt-1 font-mono text-[10px] text-slate-500">{s.setup}</div>}
        {s.vpp && <div class="mt-1 font-mono text-xs text-sky-700">Vpp = {s.vpp}</div>}
      </figcaption>
    </figure>
  ))}
</div>

<aside class="not-prose my-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
  <div class="font-mono text-xs tracking-widest text-amber-800">DIY</div>
  <div class="mt-1">
    오실로스코프가 있으면 직접 측정해 비교해보세요 — Load step은 FET 스위칭 회로 또는 간단한 LED 토글로. <code>public/verify/</code>에 PNG를 추가하고 <code>shots</code> 배열에 경로를 넣으면 갤러리에 표시됩니다.
  </div>
</aside>
```

- [ ] **Step 2: Create `public/verify/README.md`**

```markdown
# Verify Images

실측 오실로스코프 스크린샷을 이 디렉토리에 PNG/JPG 로 넣으세요. 예:

- `0-caps.png` — cap 없음
- `1-cap.png` — 100 nF × 1
- `4-caps.png` — 100 nF × 4
- `4plus-bulk.png` — 100 nF × 4 + 10 μF + bulk

그 다음 `src/pages/decoupling-capacitor.mdx` 의 `<MeasurementGallery shots={...} />` 의 `src` 속성을 `/verify/0-caps.png` 처럼 채우세요.

권장 측정 설정: 20 ns/div, 50 mV/div, AC 커플링, IC 전원 핀 직근에서 프로브.
```

- [ ] **Step 3: Wire into MDX**

Add import:
```mdx
import MeasurementGallery from '../components/verify/MeasurementGallery.astro';
```

Replace `{/* MeasurementGallery ... */}` with:
```mdx
<MeasurementGallery shots={[
  { key: 'none', label: '0 caps', caption: 'cap 없음 — 기준' },
  { key: 'one',  label: '1 cap',  caption: '100 nF × 1' },
  { key: 'four', label: '4 caps', caption: '100 nF × 4' },
  { key: 'full', label: '4 + bulk', caption: '100 nF × 4 + 10 μF + 100 μF bulk' },
]} />
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(verify): add MeasurementGallery with placeholder slots"
```

---

### Task 5.2: Accessibility pass + build polish

**Files:**
- Modify: existing components as needed
- Create: none

- [ ] **Step 1: Install axe for quick check**

```bash
npm install -D @axe-core/cli
```

- [ ] **Step 2: Build and serve static site**

```bash
npm run build
npx http-server dist -p 4322 &
sleep 2
```

- [ ] **Step 3: Run axe on both pages**

```bash
npx axe http://localhost:4322/ http://localhost:4322/decoupling-capacitor --exit
```

Expected: 0 violations. If violations (e.g. missing alt, low contrast), fix them in the components.

- [ ] **Step 4: Kill server**

```bash
kill %1 2>/dev/null || true
```

- [ ] **Step 5: Verify keyboard operation**

Open `http://localhost:4321/decoupling-capacitor` in browser. Tab to sliders. Arrow keys change value → chart updates. All controls reachable without mouse.

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "chore: accessibility pass (axe + keyboard verified)"
```

---

### Task 5.3: README with topic template instructions + Lighthouse smoke

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write `README.md`**

```markdown
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
2. `src/pages/<slug>.mdx` 생성. `decoupling-capacitor.mdx` 복사 후 수정
3. 7 섹션 구조 유지 (HERO · §1 TL;DR · §2 개념 · §3 탐색1 · §4 탐색2 · §5 검증 · §6 체크리스트 · §7 더 깊이)
4. 필요한 일러스트는 `src/components/concept/<Topic>*.astro` 로
5. 필요한 인터랙티브는 `src/components/sim/<Topic>*.svelte` 로 (ECharts 패턴 따라)

## 디자인 철학 (3-레이어)

1. **개념 (Layer 1)** — SVG 일러스트로 직관
2. **탐색 (Layer 2)** — 슬라이더로 "내가 만져봄"
3. **검증 (Layer 3)** — 실측으로 "현실에서도 그렇다"

시뮬레이션은 교육용 직관 모델. SPICE 수준 정확도 아님. 수치는 ±30% 정도만 신뢰할 것.

## 라이선스

(TBD — 초기 릴리즈 시 결정)
```

- [ ] **Step 2: Run Lighthouse via Chrome CLI**

```bash
npm run build
npx http-server dist -p 4322 &
sleep 2
npx lighthouse http://localhost:4322/decoupling-capacitor --only-categories=performance,accessibility --chrome-flags="--headless" --output=json --output-path=./lighthouse.json --quiet
kill %1 2>/dev/null || true
```

Expected: `performance >= 0.9`, `accessibility >= 0.95`. Inspect `lighthouse.json`:

```bash
node -e "const r = require('./lighthouse.json'); console.log('perf:', r.categories.performance.score, 'a11y:', r.categories.accessibility.score);"
```

- [ ] **Step 3: Clean up**

```bash
rm lighthouse.json
echo "lighthouse.json" >> .gitignore
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: README with template instructions; verify Lighthouse targets"
```

---

## Self-Review

- ✅ Every spec section has tasks: §3 page structure (Task 2.3 MDX), §4 Layer 1 (3.1–3.3), §5 Layer 2 (4.1–4.3), §6 Layer 3 (5.1), §7 tech stack (0.1–0.3), §8 project structure (all tasks), §9 visual/tone (0.3 tokens + 2.1 layout), §10 testing (1.1–1.2), §12 success criteria (5.2–5.3 verification).
- ✅ No TBD/TODO placeholders remain (README's LICENSE line is intentionally deferred).
- ✅ Type names consistent: `Cap`, `NamedCap`, `Complex`, `SimParams`, `MIX_PRESETS`, `LOAD_PRESETS` used identically across tasks.
- ✅ Imports cross-checked: `capImpedance`, `parallelImpedance`, `magnitude`, `simulateTimeDomain` exported in Phase 1 match usage in Phase 4.

---

## Execution

Run this plan with either:
- **Subagent-Driven** (recommended) — fresh subagent per task, review between
- **Inline Execution** — tasks run in current session with checkpoints
