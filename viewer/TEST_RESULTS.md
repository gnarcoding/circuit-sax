# Verification results

Verified locally on September 8, 2026 (America/Chicago), checkout `f489e059a23dcc02d92af0e73dd39f2e44a21971`.

## Completed checks

| Check | Result |
| --- | --- |
| Asset preparation | 19/19 binary STL assets; 10 curated source/reference files |
| Original asset preservation | Every copied STL equals its source byte-for-byte; SHA-256 verified |
| TypeScript typecheck | Passed |
| Vitest | **34 tests passed** |
| Production build | Passed; `dist/` produced |
| Browser interaction suites | **24 scenarios passed** in installed Chrome |
| Primary browser console/page errors | 0 |
| Failed requests in normal operation | 0 |
| External runtime requests | 0 |
| npm audit after patched test runner | 0 vulnerabilities |
| Ordinary `npm ci --dry-run` | Passed with retained lockfile |
| Existing tracked repository work | `git diff --stat` empty; original firmware, meshes and build documents unchanged |

## Browser evidence

The in-app browser connector returned ?No browser is available.? Browser verification was completed using the installed `agent-browser` CLI and Playwright with system Chrome. These were actual WebGL renders, screenshots and interactions, not just HTTP checks. The Playwright suites create isolated headless test sessions. The local development server remains available at **http://127.0.0.1:5173/**.

Primary suite (`scripts/browser-test.mjs`):

- Default full WebGL scene: 21 caps, 22 switches, 19 assets
- Tree selection and inspector agree
- Connection toggles and selected-component labels
- Continuous explosion moves parts and anchored graph endpoints
- Three rendered explosion/reassembly cycles return without drift
- Raycast selection changes an unselected scene to the clicked mesh
- Isolation, hide and restore all
- Actual mesh click with ghosted surrounding parts
- Cap/switch close-up and press/release
- Separate bench scene with three caps and no IMU
- Source-traced bench sequence, zero-breath mute, power-off and sound opt-in/reset
- Original-asset library and independent mesh fitting
- Seven-step guided tour and replay
- Conceptual assembly sequence and staged control
- Sources modal, evidence and Escape dismissal
- 390px viewport with working collapsible panels and no horizontal overflow
- No console/page errors, failed requests or external runtime requests

Additional suite (`scripts/browser-extra.mjs`):

- Front/back/left/right/isometric camera views
- Orbit drag / wheel zoom, with auto-rotation stopping on interaction
- Hidden cap does not intercept selection of the switch beneath
- X-ray display and low-effects rendering
- Full +3 transposition, unsupported FF state, audio opt-in and zero gain on power-off / hidden-event handler
- Malformed-mesh response shows an error while the remaining WebGL scene renders
- Reduced-motion preference disables automatic orbit

The hidden-document audio test deterministically dispatched the visibility handler with a synthetic `document.hidden` state and checked the gain stayed at zero after its previous scheduled gain had time to resume. This verifies handler behavior; it is not a physical sound-level measurement. The malformed-asset test intentionally supplied a truncated STL response in a separate browser page and verified the remaining 18 assets still rendered. No original files were changed to perform that test.

## Saved screenshots

- [Full assembled instrument](test-results/assembled.png)
- [Exploded instrument](test-results/exploded.png)
- [Selected Teensy and connection paths](test-results/selected-connections.png)
- [Three-key bench](test-results/bench.png)
- [Original cap and separate switch close-up](test-results/cap-switch-closeup.png)
- [Original neck/rest asset library](test-results/asset-neck.png)
- [390 ? 844 narrow viewport](test-results/narrow.png)
- [X-ray view](test-results/xray.png)
- [Simulation / unsupported-state notice](test-results/simulation.png)

The final screenshots and passing JSON reports are included in the repository. Temporary failure captures remain ignored. Rerun `npm run test:browser` to regenerate the verification artifacts.

## Rendering observation and limits

The complete solid scene reported **865,610 triangles** and **340 draw calls**. During an 89-interval headless Chrome requestAnimationFrame sample at 1600 ? 1000 with auto-orbit enabled, median interval was **16.6 ms**, p95 **16.8 ms**. This is one local browser observation, not a sustained GPU benchmark or a promise about integrated-graphics laptops. Device pixel ratio was 1 in the test; the app caps it at 1.5 and offers a 1? low-effects mode.

Production build retains a Vite size advisory for the Three/Fiber/Drei chunk (about 1.10 MB uncompressed / 307 kB gzip). It is a warning, not a build failure; the 3D engine is essential to the first scene. No ornamental postprocessing or remote fonts/assets are loaded.

Browser checks found and corrected: mobile part/inspector panel coordination, small-window framing, physical-cable inclusion in camera fitting, stale line-buffer replacement after layer toggles, unreadable overlapping connection labels, and cancellation of scheduled Web Audio gain when immediately muting. Both actual rendered line endpoints and cap travel were checked after those fixes.

The viewer does not certify physical assembly, manufacturability, fit, wiring, moisture safety, voltage protection, exact sound synthesis or original firmware compilation. Static fingering is tested; stateful front-F/config shortcuts, motion and timing are deliberately not emulated. Direct freeform mesh dragging is not implemented; selected parts have a constrained extraction slider. Engineering uncertainties and provenance remain visible in the application and in `ASSETS_AND_ASSUMPTIONS.md`.
