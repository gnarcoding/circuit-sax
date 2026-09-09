# CIRCUIT SAX // ASSEMBLY LAB

A working, local browser explorer of the complete **Phase 1 open-PCB instrument**, with a separate three-key bench configuration. Educational reconstruction — assembly fit and wiring are not certified.

## Launch on Windows PowerShell

Requires Node.js **22.12 or later** (tested with 22.17.0) and npm. From a new terminal:

```powershell
cd C:\Users\errol\circuit-sax\viewer
npm ci
npm run dev
```

Open **http://127.0.0.1:5173/**. The server binds to loopback only and uses a strict port; if it is already running, open that URL instead of launching a second copy. Stop the server with Ctrl+C. No embedded toolchain, backend, API key, microphone, hardware access or online service is needed. Installation needs the package registry; normal use after installation makes no external runtime requests.

Preparation automatically copies only the curated models and source/reference files into `public/assets/`. Vite is restricted to `viewer/`, not the full instrument repository. Firmware and original models are read, never edited. All dependencies, scripts and the lockfile are isolated here. No deployment is configured or requested.

For a production build and local preview:

```powershell
npm run build
npm run preview
```

Production preview: **http://127.0.0.1:4173/**.

## Explore

- The default is the full instrument: **79 selectable parts**, 21 original-mesh playing caps, 22 distinct switches including configuration, main PCB plus four side PCBs, complete breath/audio/power chain, and the full-only motion sensor. All 19 source meshes are represented. The separate bench has 23 parts, three caps/switches (B, A, G), and no IMU.
- Drag the canvas to orbit; right-drag or Shift-drag to pan; wheel or pinch to zoom. Front, back, left, right, isometric, reset and fit-selection controls are provided. Optional auto-orbit stops on interaction. Buttons and inputs are keyboard accessible.
- Use the continuous Explode slider, with optional staged groups, then reassemble. The inspector's extraction slider moves a selected part along its saved local extraction axis. No disassembly motion claims mechanical validity. Direct freeform dragging of meshes is not implemented.
- Click a mesh or its parts-tree entry for the same inspector. Search, hide, isolate, ghost others and restore all are supported. A cap/switch close-up keeps both separate parts visible and demonstrates an illustrative 2 mm press/release; it does not validate physical fit.
- Connection layers distinguish attachment, pressure/drainage, power/ground, control and audio. Selected-part paths carry labels; the inspector distinguishes physical cables/tubes, board/header relationships, and conceptual overlays. Overview intentionally suppresses per-path labels. Physical cables/tubes and overlays follow moving endpoints.
- Asset library lets you examine each of the 19 original STLs without asserting an installed location. Original bounds, triangle counts and SHA-256 hashes are available under Sources & assumptions.
- Play the signal is clearly marked **SIMULATION**. Keys latch independently of inspection. A normalized breath slider and power toggle drive the visual signal chain. Optional quiet sine-wave audio requires Enable sound, and stops on mute, reset, power-off, zero breath, mode/configuration change or visibility loss. No microphone or device access is requested.
- The seven-step tour has Previous/Next/Replay and focused camera views. A separate five-step conceptual assembly sequence progressively joins component groups.
- Solid and X-ray modes, a low-effects setting, reduced-motion support and narrow-screen panel controls are available. Rendering uses a demand loop, shared source geometry, instanced header contacts, no bloom and a maximum pixel ratio of 1.5 (1 in low-effects mode).

## Evidence and scope

Actual inspected checkout: **f489e059a23dcc02d92af0e73dd39f2e44a21971**. The older build-plan audit refers to a different commit; the preparation script records the current revision each time it runs.

`v2/Circuit Sax v2/platformio.ini` builds `src/circuit_sax_v2.cpp`. That CPP is the visualization's firmware authority. Its alternate INO swaps the left-pinky C-sharp/low-B GPIO assignments 29 and 30 and uses a different MPU library. These are not merged. The CPP, `patches.h` and `waveforms.h` were inspected; no firmware build or flash is claimed. The CPP has two synth patches; this viewer's optional sine tone is not their emulation.

Static `getPressedNote()` logic is ported in `src/logic.ts`. Full configuration uses the CPP default +3-semitone transposition; the proposed bench fixture uses zero per the build plan. Written/reference and concert pitches are explicit, with MIDI 60 = C4. Bench fixtures are none → C♯4/61, B → B3/59, B+A → A3/57, B+A+G → G3/55. Front-F's stateful octave changes and config shortcuts are unsupported and explicitly say so. Debounce, timing, portamento, motion and calibrated breath response are not emulated.

All placements and key-to-asset assignments are inferred. One coordinate unit is interpreted as one millimeter, an assumption because STL has no unit metadata. Caps use an underside stem-plane reference and rests use their bounds center; these are translation-only display transforms. No original asset is rescaled or repaired. Repeated instances share the original geometry.

PCBs, switches, electronics, mouthpiece, cables, holder and fastening hardware are recognizable procedural approximations. Main/side outlines and arrangement follow the visually inspected v2 board image and photograph, not manufacturing CAD. The Teensy outline and candidate-bank envelope use documented dimensions; most other dimensions, board angles, offsets, fastener counts and stack heights remain illustrative. Original rest 19 lacks the v2 battery sleeve, and rest 18's neck compatibility is unverified. They remain explicitly uncertain stand-ins, with a separate holder proxy.

The pressure sensor's 5 V output **must not** connect directly to the Teensy 3.3 V input. Conditioning/protection is an unresolved functional block, not a released circuit. Moisture isolation is proposed. Pressure transmission into the sensor branch is distinct from exhaust/drainage. Headphone **HP_VGND is separate from circuit GND**. I2S audio and I2C codec setup are distinct. Shield SD is empty, optional memory is unpopulated, and no optional speaker, Bluetooth, touchscreen, computer power source or Phase 2 shell is added.

Original project attribution is preserved. No explicit upstream firmware/model license was found; the unrelated submodule license does not establish a license for these assets. Clarify upstream licensing before any public redistribution.

## Editable files

| File | Purpose |
| --- | --- |
| `src/data/manifest.ts` | Typed asset IDs, installed parts, configurations, local parent transforms, extraction offsets, anchors, educational text and separate provenance fields |
| `src/data/connections.ts` | Typed graph, layers, media, certainty and source-traced optional pin annotations |
| `src/logic.ts` | Deterministic motion/visibility and static CPP fingering port |
| `src/geometry.ts` | Procedural visual approximations; original STL geometry is loaded separately |
| `src/Scene.tsx` | R3F scene, camera, physical routes and anchored overlays |
| `src/App.tsx`, `src/style.css` | Accessible controls, inspector, simulation, tour and responsive layout |
| `scripts/prepare-assets.mjs`, `scripts/stl.mjs` | Cross-platform copying and binary/LFS/vertex validation |
| `public/assets/inventory.json` | Generated inventory: current commit, source paths, hashes, original mesh bounds and normalization references |
| `ASSETS_AND_ASSUMPTIONS.md` | Human-readable asset inventory and reconstruction record |
| `TEST_RESULTS.md` | Verification results, screenshots and limits |

Change a part's saved local transform, parent, anchors and evidence in the manifest; do not edit the published mesh to adjust the viewer. Parent-child explosion offsets compose consistently. Missing or malformed assets appear in a visible error notice while the rest of the scene stays usable; preparation can be rerun after restoring originals.

## Verification commands

```powershell
cd C:\Users\errol\circuit-sax\viewer
npm run prepare-assets
npm run typecheck
npm test
npm run build
```

With `npm run dev` still running in another terminal:

```powershell
npm run test:browser
```

The repeatable browser suite uses the installed Google Chrome through Playwright. For installed Edge instead:

```powershell
$env:BROWSER_CHANNEL = "msedge"
npm run test:browser
```

It records console/page errors, failed requests, external runtime requests, real scene transforms, rendered line endpoints, screenshot artifacts and measured animation frame intervals in `test-results/`. Browser diagnostics are read-only and development-only. Production does not expose that test surface. The main in-app browser connector was unavailable in this environment; `agent-browser` and Playwright both successfully inspected the local Chrome WebGL scene instead.

## Primary library and hardware references checked

- [Three.js STLLoader](https://threejs.org/docs/pages/STLLoader.html)
- [React Three Fiber: React 19 pairs with Fiber 9](https://github.com/pmndrs/react-three-fiber)
- [Vite Node requirements](https://vite.dev/guide/) (installed Node 22.17 satisfies 22.12+)
- [PJRC Teensy 4.1](https://www.pjrc.com/store/teensy41.html)
- [PJRC Audio Shield Rev D / D2](https://www.pjrc.com/store/teensy3_audio.html)
- [Original Circuit Sax project](https://github.com/Whackalenso/CircuitSax)

Versions are pinned in `package.json` and `package-lock.json`. An npm 10 optional-peer resolution error occurred during the patched Vitest installation; required peers were checked and installation completed with legacy peer resolution. A subsequent ordinary `npm ci --dry-run` succeeded. `npm audit` reported zero vulnerabilities after the patched test-runner update.
