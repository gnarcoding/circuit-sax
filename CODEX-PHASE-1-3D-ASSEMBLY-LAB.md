# Codex prompt: Circuit Sax — Phase 1 3D Assembly Lab

You are working in my existing Circuit Sax repository, normally at:
C:\Users\errol\circuit-sax

BUILD AND TEST a working browser application called:
CIRCUIT SAX // ASSEMBLY LAB

This is an implementation request, not a request for a proposal or scaffold.

## 1. The experience

I want a genuinely impressive, interactive 3D reconstruction of our complete Phase 1 Circuit Sax: rotate it, pull it apart, inspect every component, see how the components connect, and understand how blowing and pressing keys turns into sound.

Think Minority Report-style engineering workstation: a beautiful instrument floating in a dark workspace, precise selection highlights, animated exploded assemblies, connection paths, and useful technical annotations. The instrument is the hero, not decorative dashboard cards.

This is an educational build explorer, NOT a manufacturing-certified digital twin, circuit simulator, or live hardware connection.

Two configurations:
- FULL PHASE 1 INSTRUMENT — default; the complete open-PCB sax before the optional shell.
- THREE-KEY BENCH — secondary; the reusable breath/audio prototype from our build plan, with the IMU omitted.

Do not deliver only the bench. Do not add our Phase 2 custom enclosure, Bluetooth, an onboard speaker, a touchscreen, or imaginary components. Keep the battery's USB cable and wired-headphone connection visible in the full instrument. No computer is required in the playing configuration; an optional programming view may show a computer replacing the battery connection, not powering it simultaneously.

## 2. Inspect the repository and preserve our work

Read applicable AGENTS.md instructions, README.md, docs/build/BUILD_PLAN.md, and relevant existing project notes first. Locate PHASE-2-CUSTOM-ENCLOSURE.md if present, solely to understand what is excluded.

Inspect the actual local files, including:
- models/ and all its STL files.
- v2/Circuit Sax v2/platformio.ini and the source it actually builds.
- v2/Circuit Sax v2/src/circuit_sax_v2.cpp, patches.h, and waveforms.h.
- v2 reference photographs, including v2/images/pcb.png.
- Older v1 material only as explicitly labeled historical reference.

The CPP and alternate INO may differ. Do not silently merge their mappings. Record the actual checkout revision and identify the authoritative firmware source for this visualization. Inspect images visually; do not infer an assembly only from filenames.

Create an isolated viewer/ app, or extend an existing equivalent viewer without disrupting its work. Keep dependencies and scripts inside that app. Preserve existing uncommitted changes. Do not modify firmware, original meshes, build-plan decisions, submodules, or fabrication files; do not reset, auto-update, flash hardware, purchase anything, commit, push, or deploy.

Do not install an embedded toolchain merely to build this viewer.

## 3. Use real assets; be explicit about reconstruction

Our prior audit found 19 published STLs, incomplete full-assembly geometry, missing v2 manufacturing CAD, and unresolved rest/neck/battery-holder compatibility. Recheck the checkout rather than treating that old inventory as permanently authoritative.

Load the real STL geometry wherever available. Do not replace our sax-shaped keycaps with generic spheres or keyboard buttons. Preserve the concave faces, offset stems, tabs, and palm/side-key shapes.

Separate an asset from its instances: one STL may represent several installed keys. Reconcile playing controls and the configuration switch with firmware and the build plan. Do not equate STL file count with installed-part count. Label inferred instance quantities and key-to-file mappings.

Use original mesh coordinates as evidence, not proof of a complete assembly. Some repeated parts may share origins. Preserve original assets; keep normalization and instance transforms in separate data. Establish one consistent scene scale. STL has no authoritative unit metadata: label a millimeter interpretation as an assumption unless verified. Never independently rescale components just to make them fit.

For missing geometry, create attractive, recognizable procedural representations using manufacturer dimensions when documented and photographs for visual arrangement. Reconstruct the main/side PCB layout as faithfully as the available evidence permits. Do not invent a cylindrical sax body or depict uncertain board geometry as production-ready CAD.

Give components separate provenance for:
- Geometry: original mesh / documented approximation / illustrative proxy.
- Placement: documented / inferred / unknown.
- Function and connections: source-supported / proposed / unresolved.

An original STL does NOT make its placement or v2 compatibility verified. Show compact badges and an accessible Sources & Assumptions panel. Keep a subtle persistent notice: “Educational reconstruction — assembly fit and wiring not certified.” Missing CAD should not prevent building the viewer; use clearly labeled reconstruction instead.

## 4. Implementation foundation

Prefer Vite + React + TypeScript + Three.js + @react-three/fiber + @react-three/drei. Inspect existing tooling first, select mutually compatible stable versions, verify current official documentation and Node requirements, and retain a lockfile. Avoid unnecessary state or animation dependencies.

Use Three.js STLLoader for the STL assets. Curate assets into the viewer using a repeatable cross-platform script; do not expose the entire repository through an unrestricted file-serving configuration. Detect missing assets, malformed files, and Git LFS pointer files. Report errors visibly without crashing the whole scene.

No backend, database, authentication, API key, paid service, or runtime AI dependency. Serve models, fonts, and required graphics locally. The app should work without external runtime requests once installed and running locally.

Use a typed, data-driven manifest containing stable component IDs, asset IDs, instances, groups, transforms, assembly/explosion offsets, connection anchors, educational text, evidence, and configuration membership. Use a separate typed connection graph referencing those IDs. Keep this information out of scattered rendering conditionals.

Create scripts for asset preparation, development, production build, typecheck, and tests. Asset preparation should run automatically where needed. Bind development to localhost by default and document Windows PowerShell commands.

## 5. The actual 3D instrument

Represent every major component and all identified controls:
- Main PCB and side PCBs, with recognizable mounting relationships.
- Each printed keycap and its mechanical switch as separately selectable parts.
- Teensy 4.1, with recognizable chip, headers, and correct connector type.
- The compatible Rev D/D2 Audio Shield, with its headphone jack.
- MPXV5010GP pressure sensor and its pressure port.
- MPU6050 module in the full configuration only.
- Mouthpiece, neck/rest parts, tubing, and drainage path.
- USB power bank, power cable, and holder or explicitly labeled holder proxy.
- Headphone plug/cable and a recognizable headphone representation.
- Headers, brackets, fasteners, and proposed protection/moisture components where supported by the plan; mark unspecified designs as unresolved functional blocks.

Use the original photographs for visual character. Make PCBs, printed plastic, metal pins, rubber tubing, and cables visibly different materials. Do not add an SD card or optional feature merely because its socket exists on a board.

Provide orbit, pan, zoom, reset, fit-selection, and front/back/left/right/isometric views. Start with a well-framed three-quarter view of the whole instrument. Auto-rotation must be optional and stop on interaction. No introductory animation should obstruct immediate use.

## 6. Explode, isolate, and inspect

Implement a continuous 0–100% Explode slider with reversible animation, not an instant switch between two unrelated scenes. Separate the assemblies in understandable directions: caps from switches, switches from boards, daughterboards from the main board, and electronics/rests/battery from their mounts.

Support staged group explosion and, where practical, dragging a selected part along its extraction axis with a clear Return to Assembly action. Do not present illustrative extraction motion as verified disassembly instructions.

Maintain coherent parent/child transforms, part labels, and connection endpoints throughout movement. Repeated explode/reassemble cycles must return exactly to saved transforms without drift. Camera fitting must accommodate the exploded state.

Clicking a mesh or its matching item in the searchable parts tree must select the same component, highlight it, and open its inspector. Allow Hide, Isolate, Ghost Others, Show Connections, and Restore All. Hidden or ghosted objects must not prevent selection of visible parts.

The inspector should answer in plain English suitable for a curious 11-year-old:
“What is this?”, “What does it do?”, “What connects to it?”, and “Why do we need it?”

Add an expandable technical section with exact model/filename, part role, quantity and its certainty, documented dimensions, source references, and unresolved details. Include a keycap-to-switch close-up that shows the separate parts and illustrative press/release motion. Call out fit uncertainty rather than claiming a successful physical fit.

Also provide an asset-library view so every available STL can be inspected even when its placement or version compatibility is unresolved.

## 7. Make the connections understandable

Provide independently toggled layers for:
- Mechanical attachment.
- Air pressure and drainage.
- Power and circuit ground.
- Key/sensor control signals.
- Digital audio and analog headphone output.

Use labeled paths, a legend, and distinct styles as well as colors. Selecting a component should emphasize its immediate connections rather than showing an unreadable global spaghetti diagram.

Distinguish three things: physical wires/tubes, board/header connections, and conceptual signal-flow overlays. A glowing educational line across a PCB is not necessarily a literal external wire or verified copper trace. Keep overlays anchored to the moving components in all modes.

Explain these source-supported functional relationships:
- Pressed keys change switch states read by the Teensy.
- Breath pressure reaches the pressure sensor; its conditioned electrical output is read by the Teensy.
- The Teensy combines fingering and expression inputs to synthesize audio.
- Digital audio goes to the Audio Shield over I2S; shield configuration uses I2C, a different interface.
- The Audio Shield provides analog headphone output.
- The power bank supplies power, not musical instructions.
- The motion sensor supplies motion information for the full instrument's vibrato behavior.

For breath, depict pressure transmission into the sensor branch, not continuous airflow passing through the sensor electronics. Show exhaust/drainage separately. Moisture-protection designs remain proposed until reviewed; a pretty tube arrangement is not validation.

Default to functional connection labels. Only display specific pins when traced to the chosen source and appropriate board documentation. A firmware pin assignment alone does not certify physical wiring. Do not copy the v1 circuit into the Teensy build.

Represent the unresolved pressure-sensor conditioning/protection as a labeled block. Never show a raw 5 V sensor signal as safe for a Teensy 3.3 V input. Preserve any headphone virtual-ground isolation warning from the build plan; do not indiscriminately join every ground-looking terminal. Do not invent reviewed resistor values, routing, or a safe-to-build schematic.

## 8. “Play the signal” educational simulation

Add a clearly labeled SIMULATION mode with a breath slider, pressable/latched keys, and a simulated power toggle. Clicking keys in simulation must be distinct from normal inspection.

Animate the causal sequence: key state and breath input → Teensy processing → digital audio → shield → headphones. This should show why the tiny board is the computer and why the instrument can operate without a laptop.

Use actual, source-traced fingering logic for any note names shown. A sax key is not an independent piano note. Reproduce only mappings you can substantiate; unsupported combinations should say so. Keep written pitch, concert pitch, octave naming, and transposition explicit rather than silently mixing them. Add fixtures for the supported three-key sequence.

At zero breath, show no active note/audio output; simulated power-off also stops output. Any behavior simplified from the firmware must be labeled. All meters and traces are simulated, not live readings or measured latency.

An optional Web Audio demonstration may play a modest synthetic tone only after explicit Enable Sound, with low default gain, mute, and immediate stop on power-off/reset/visibility loss. Label it an illustrative tone, not an exact emulation of the Teensy firmware or an acoustic sax. Do not request microphone or hardware access.

## 9. Guided understanding and visual finish

Include a short guided tour with camera focus, highlighted components, and Previous/Next/Replay controls:
“The printed keys” → “The switches underneath” → “The breath path” → “The Teensy brain” → “The Audio Shield and headphones” → “Battery-powered playing” → “The three-key bench versus the full instrument.”

Add a conceptual assembly sequence showing components joining the model. Label it educational and retain unresolved fit/wiring notices; do not pretend it is a validated soldering or manufacturing procedure.

Visual direction: charcoal/navy workspace, restrained cyan highlights, warm accents for uncertainty, translucent inspector panels, clean technical typography, a subtle spatial grid, and purposeful cinematic camera motion. Offer solid-material and holographic/X-ray-style display modes. Avoid unreadable glow, heavy bloom, ornamental fake telemetry, or an endless particle background.

The canvas should dominate. Use a compact left parts tree, right inspector, top mode controls, and bottom explosion/simulation controls. Panels collapse on smaller screens. Provide keyboard-accessible controls, visible focus states, readable contrast, reduced-motion support, and understandable error/loading states.

Optimize for a normal laptop with integrated graphics: cap device-pixel ratio, reuse geometry/materials, avoid per-frame React updates, pause unnecessary animation, and provide a low-effects setting. Performance claims must be measured, not invented.

## 10. Test, inspect, and deliver

Implement the useful complete interaction loop before adding extra visual effects. Do not stop at a plan, a static screenshot, a blank canvas, a generic dashboard, or a row of placeholder boxes.

Test manifest integrity, asset existence, unique instance IDs, connection endpoints, configuration filtering, selection/visibility behavior, deterministic explosion transforms, and any claimed fingering mappings.

Run typecheck, tests, and a production build. Start the dev server and verify it in a real browser using the available browser automation tooling. Inspect the actual WebGL scene visually: a successful HTTP response or visible HTML panel does not prove the instrument rendered.

Exercise assembly/explosion, mesh and tree selection, isolation/restoration, connection toggles, simulation, camera reset, both configurations, and a narrow viewport. Capture actual console/page errors and failed requests. Save screenshots of assembled, exploded, selected-component/connections, and bench views. Inspect and fix obvious rendering or interaction problems.

If browser tooling is unavailable, still complete and build the app, report that specific verification limit honestly, and provide manual checks. Never claim a browser check passed without running it.

Deliver the functioning app, viewer/README.md with exact run commands, the editable component/connection manifest, asset/source inventory, reconstruction assumptions, and test results. Include a short report of original meshes versus proxies and remaining engineering uncertainties. Keep the original firmware and models unchanged. No deployment is requested; preserve attribution and flag unresolved upstream asset licensing before any future public distribution.

Finish by giving me the exact local launch commands and verified local URL, what works, what remains approximate, and the test results. The result should let me open my browser and immediately explore the whole sax together and part by part.

Primary references to verify alongside the local build plan:
- https://github.com/Whackalenso/CircuitSax
- https://threejs.org/docs/pages/STLLoader.html
- https://github.com/pmndrs/react-three-fiber
- https://www.pjrc.com/store/teensy41.html
- https://www.pjrc.com/store/teensy3_audio.html
