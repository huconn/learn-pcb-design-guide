# Verify Images

실측 오실로스코프 스크린샷을 이 디렉토리에 PNG/JPG 로 넣으세요. 예:

- `0-caps.png` — cap 없음
- `1-cap.png` — 100 nF × 1
- `4-caps.png` — 100 nF × 4
- `4plus-bulk.png` — 100 nF × 4 + 10 μF + bulk

그 다음 `src/pages/decoupling-capacitor.mdx` 의 `<MeasurementGallery shots={...} />` 의 `src` 속성을 `/verify/0-caps.png` 처럼 채우세요.

권장 측정 설정: 20 ns/div, 50 mV/div, AC 커플링, IC 전원 핀 직근에서 프로브.
