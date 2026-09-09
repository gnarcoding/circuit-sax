# Circuit Sax: Phase 1 build plan

Repository/electrical inspection prepared **2026-09-06**; school-printing plan and prices updated **2026-09-07**. Currency: USD. Intended player: an 11-year-old, with adult electrical/assembly work and school staff supervising printing.

**Recommendation:** confirm school access, test one published cap on the specified switch, then build the reusable three-key breath/audio bench while obtaining the missing mechanical design. Preserve the published sax-shaped keycaps and saxophone fingering layout. The v2 architecture can generate wired-headphone sound using USB battery power without a playing-time computer or phone. No printer will be purchased. The instrument-only planning total is **$686.28 with purchased tools**, or **$589.44 if all listed tools can actually be borrowed**. Both include consumables, school printing, shipping, tax, and revisions; both exceed the roughly $550 benchmark. These are provisional allowances, not manufacturing quotes or a complete, electrically reviewed fabrication package.

This phase inspected files and official documentation and created this plan only. No existing firmware or models were edited; no production PCB files were generated; no hardware was flashed, tools installed, or purchases made. All wiring, firmware changes, printing, and acceptance tests below are proposed future work.

## 1. Revision and evidence

- Upstream remote: <https://github.com/Whackalenso/CircuitSax>.
- Inspected HEAD and local `origin/HEAD`: **`c7d121c8ed9c5809c17bd0cfcf7615b6a861bfd8`**, commit message `add youtube video`, committed **2026-05-09 15:45:48 -0700**. [Pinned upstream tree][upstream]
- This identifies the local upstream snapshot, not a claim that it is the latest remote revision. No fetch or submodule update was performed.
- `.gitmodules` declares `Circuit-Sax-Switch-Controls`, at <https://github.com/Whackalenso/Circuit-Sax-Switch-Controls>. The parent gitlink and checked-out submodule HEAD both equal **`48e67572793bd787b82fd50da810d6ea188c50e3`**. [Submodule declaration][modules]
- No applicable `AGENTS.md` was found in the repository or its checked parent directories.
- Initial ordinary Git status/submodule commands hit a Windows Git/MSYS helper error. Read-only `git ls-tree`, `rev-parse`, and status with submodule recursion/LFS filters bypassed provided the inventory. That initial status showed `v1/videos/demo1.mp4` as modified under the bypass; this LFS-related video state was left untouched. It is unrelated to firmware/model verification.

**Evidence labels:** **Verified** means directly read from this checkout, an inspected mesh, or the cited primary documentation. **Calculated** means derived from stated inputs. **Proposed/assumed** means a design choice or allowance requiring validation. Supplier page observations are dated retrievals, not reserved stock or guaranteed checkout prices.

## 2. What is available, and what is missing

| Area | Verified available | Missing or unresolved |
| --- | --- | --- |
| Project description | Root README describes Teensy 4.1, Rev D audio shield, MPXV5010GP, Haimu Heartbeat switches, MPU6050, USB power bank, alto mouthpiece, and a five-part PCB body. It explicitly reports moisture reaching the sensor tube. [README][readme] | No complete purchasing BOM, assembly drawing, tolerances, production test procedure, or measured runtime. |
| Current v2 firmware | PlatformIO project, `src/circuit_sax_v2.cpp`, `patches.h`, `waveforms.h`. Four oscillators, filter, breath-controlled gain, I2S headphone path, USB audio, motion pitch bend. Two source-defined synth patches. [CPP][cpp], [patches][patches] | Reproducible dependency versions and a verified build; bench mode and pressure-interface calibration; safe headphone level policy. Synthesized tones are present, not a promise of an acoustic sax sample sound. |
| Alternate v2 sketch | `circuit_sax_v2/circuit_sax_v2.ino`: a different, simpler sketch with a different MPU library and left-pinky mapping. [INO][ino] | No explanation identifying this as an equivalent release. Do not combine it with the CPP as though they were interchangeable. |
| Printable geometry | **19 binary STL files** in `models/`, including named sax keycaps, octave part, and two rest/air-path parts. See mesh inventory below. [Models][models] | No STEP/Fusion source, full assembly, print profiles, authoritative copy counts, material specification, or documented fit tolerances. Presence of a mesh does not establish v2 compatibility. |
| Schematics | One-page `v1/schematic.pdf`, visually inspected using the existing Windows PDF renderer. It shows the Arduino Micro-era headers, keys, and MPXV5010GP circuit. Sensor capacitors are C1 470 pF, C2 0.01 uF, C3 1 uF; output goes to A5 without attenuation. [v1 schematic][v1sch] | **No v2 instrument schematic.** The v1 circuit is not a safe Teensy wiring template. Official development-board schematics do not fill in the missing instrument interconnect. |
| PCB/manufacturing files | v1 PCB photographs and `v1/images/pcb.svg`; v2 PCB image. SVG metadata says PCBNEW export, with title `MIDI Sax-F_Paste.svg`. [v1 SVG][v1svg], [v2 image][pcbimage] | **No KiCad project/board/schematic source, Gerbers, drill files, board stack-up, assembly BOM, or fabrication ZIP** in the tracked tree. The SVG is not a complete production board package. |
| Mechanical dimensions | Mesh coordinate extents can be calculated. Manufacturer pin/package drawings exist for the purchased boards/sensor. README says placement was measured or eyeballed from the author's soprano sax. | Main/side PCB outlines and thickness, switch centers, bracket angles, hole diameters/coordinates, stack heights, battery envelope, and v2 mounting fit are not specified in a dimensioned assembly. Never manufacture from photo scaling or SVG viewBox bounds. |
| Licenses | No root firmware/model `LICENSE`, `COPYING`, or explicit license grant was found. The unrelated Switch-controls submodule has MIT `LICENSE` and a separate `LUFA_LICENSE`. [Submodule license][switchlicense], [LUFA notice][lufalicense] | Those submodule licenses do **not** establish a license for Circuit Sax firmware or STLs. Obtain the author's intended firmware/model licensing and preserve dependency notices before distributing a derivative. No legal conclusion is implied by public hosting. |

### Firmware dependencies and configuration

The checked-in [platformio.ini][pio] selects:

```ini
[env:teensy41]
platform = teensy
board = teensy41
framework = arduino
lib_extra_dirs = ~/Documents/Arduino/libraries
build_flags = -D USB_MIDI_AUDIO_SERIAL
lib_deps = tockn/MPU6050_tockn@^1.5.2
```

PlatformIO's default source directory is `src`, so the CPP is the primary build target; the sibling INO is not automatically the same build. The board selection agrees with official PlatformIO documentation. [Source directory][piosrc], [Teensy target][pioboard]

| Dependency | What this checkout establishes |
| --- | --- |
| Teensy Arduino core and ARM compiler | Required; platform/core/toolchain versions are not pinned or vendored. No installed package set was found. |
| `Audio.h`, `Wire.h`, `SPI.h`, `SD.h`, `SerialFlash.h` | Included by the CPP; use the corresponding Teensy-compatible libraries. `Audio` supplies the synth, I2S/USB endpoints, and SGTL5000 control. An include alone does not mean SD/flash hardware is used. |
| `MPU6050_tockn.h` | Only declared external library, with a compatible-version range rather than an exact lock. The sensor is constructed on `Wire2` and used unconditionally. |
| `Bounce2.h` | Included but **not declared in `lib_deps` or vendored**. The author's external Arduino libraries directory may have supplied it. |
| `patches.h`, `waveforms.h` | Present in `src`; no external sound-bank download is required for the two current patches. Both use `NULL` arbitrary-waveform pointers. |
| Alternate INO's `MPU6050.h` | Different API from `MPU6050_tockn`; supplier/version not declared for that sketch. |
| `wavToArray.py` | Optional development utility imports NumPy/SciPy and reads `magbakk2.wav`, which is absent; the checked-in file is `waveform.wav`. Not a prerequisite to compile existing waveform arrays. |
| Switch-controls submodule | Separate AVR/LUFA Nintendo Switch controller project. Its makefile targets `atmega32u4` and references `C:\LUFA\LUFA`, not supplied by that submodule. No dependency from the v2 PlatformIO build was found; omit it from the instrument build. |

**Static compile concern:** CPP line 75 uses unqualified `Button`, while the inspected upstream Bounce2 header declares `Bounce2::Button`. No matching `using` declaration was found in this source. A clean build with that header would need the namespace qualified or imported. This is a source-review finding, **not an observed compiler diagnostic**. First reproduce the untouched build after tools become available, then make the smallest documented correction in a separate phase. [Bounce2 source][bounce]

### Local compilation check: not built

Existing Python is **3.11.5 at `C:\Python311\python.exe`**. The following checks found no usable Teensy build environment:

```text
Get-Command pio, platformio, arduino-cli, arm-none-eabi-g++
  -> none found on PATH
python -m platformio --version
  -> C:\Python311\python.exe: No module named platformio
```

`C:\Users\errol\.platformio`, `AppData\Local\Arduino15`, `Documents\Arduino`, and the checked standard Arduino IDE locations were absent. No local `.pio` packages or project libraries were present. No PrusaSlicer, OrcaSlicer, FreeCAD, or OpenSCAD executable was found in the checked locations/PATH. Existing Python/NumPy/Matplotlib and Windows PDF rendering were used for read-only inspection; nothing was installed.

**Result: compilation was not possible with the discovered tools. No successful build, executable, memory-usage result, or hardware test is claimed.** A future authorized environment needs PlatformIO Core, its Teensy platform/Arduino framework/ARM toolchain, the Teensy libraries, MPU6050_tockn, and an explicit Bounce2 dependency. Pin the resolved versions and remove reliance on a personal library directory for reproducibility. The subsequent compile-only command would be:

```powershell
pio run --project-dir "v2/Circuit Sax v2" --environment teensy41
```

Do not add `--target upload`. No programmer or flash operation is needed to verify compilation. The `test/README` is boilerplate, not an existing test suite.

## 3. Electrical compatibility

### Pin assignments extracted from the primary CPP

All numbers below are **Teensy GPIO labels**, not physical header-position numbers. Switches are individual active-low contacts to circuit GND, configured with `INPUT_PULLUP`; there is no scanned switch matrix. Sources: CPP lines 32-61 and 266-317. [CPP][cpp], [official pin card][pinfront], [Wire buses][wire]

| Function / order | GPIO(s) | Notes |
| --- | --- | --- |
| Breath | **26 / A12** | Analog input, needs voltage conditioning. |
| MPU6050 SDA / SCL | **25 / 24**, `Wire2` | Correct default Teensy 4.1 Wire2 bus. Audio control uses a different bus. |
| Palm D, D-sharp, F | **41, 40, 39** | Three physical switches. |
| Side keys top to bottom | **36, 35, 34** | Preserve that physical order. |
| Left pinky G-sharp, C-sharp, low B, low B-flat | **28, 29, 30, 31** | The alternate INO swaps C-sharp/low-B GPIOs **29 and 30**. Verify the eventual PCB against the CPP. |
| Right pinky E-flat, low C | **5, 4** | Two physical switches. |
| Main B, A, G, F, E, D | **10, 37, 32, 27, 33, 12** | Followed in `whiteKeys` by low C = 4 and low B = 30; those are aliases, not extra switches. |
| Octave | **6** | Also overlaps shield optional memory chip-select. |
| Front F / octave-jump control | **9** | `ffKey`; Bounce2 debounce configured at 5 ms. |
| Bis | **38** | Preserve its published tab/keycap relationship. |
| Configuration | **11** | No dedicated configuration-keycap mapping is documented. |

**Calculated physical count: 22 switches**, comprising 21 playing controls plus configuration. A 36-switch pack covers all of them and 14 spares; the bench uses three of that same pack. GPIO22 is not configured; the repeated source comment says `DONT CONFIGURE 22`. Official Rev D documentation does not list 22 among its required audio pins. Its upstream rationale remains unresolved; do not allocate it casually.

### Audio Shield cross-check

Use **Rev D or D2 for Teensy 4.x**; do not buy Rev C expecting direct stacking compatibility. D2 has the same relevant pin assignment but differs in codec package/address-selection details. [PJRC shield documentation][audio]

| Shield connection | Teensy 4.1 GPIO | Conflict with CPP? |
| --- | --- | --- |
| I2S data into shield, DIN | **7** | No |
| I2S data from shield, DOUT | **8** | No; input unused by this synth |
| LRCLK / BCLK / MCLK | **20 / 21 / 23** | No |
| Codec SDA / SCL | **18 / 19**, `Wire` | No |
| Optional volume potentiometer | **15 / A1** | No; absent from the code |
| Shield SD: CS / MOSI / MISO / SCK | **10 / 11 / 12 / 13** | **10 = B, 11 = config, 12 = D** |
| Optional shield memory: CS / MOSI / MISO / SCK | **6 / 11 / 12 / 13** | **6 = octave**, plus shared SPI conflicts |

The core headphone path has no switch-pin collision. The optional storage does. Keep the shield SD slot **empty**, optional memory chip **unpopulated**, and SPI storage initialization absent. A pressed key could select a populated chip or ground an active bus signal; lack of application reads alone is insufficient protection. Preferred bench interconnect connects only power/GND and the required audio signals, leaving optional SPI/CS pads unconnected. A fully stacked shield instead requires checking its actual fitted components/pull-ups and enforcing the empty-storage restriction. Headers must align with the Teensy's first 14 positions; the longer Teensy 4.1 extends beyond the shield. Keep audio clocks/data very short. [Shield pin table and schematics][audio]

Use the shield's **3.5 mm headphone jack** with ordinary passive stereo headphones. Its headphone return is **HP_VGND, not circuit GND**: do not connect the jack sleeve to a breadboard ground, grounded amplifier/PC input, or oscilloscope ground clip. Use proper line outputs for future external equipment. [SGTL5000 pin definitions, Table 1][codec]

### Exact pressure sensor: MPXV5010GP

The primary source is NXP's **MPX5010 family datasheet, Rev. 14, 17 May 2024**, including the MPXV5010GP ordering entry. The `.com` PDF fetch failed; the same official document was accessible on NXP's `.com.cn` domain. Distributor listings now identify STMicroelectronics; verify the delivered marking and applicable datasheet/PCN. Do not silently substitute MPX5010GP, MPXV5010DP, or a similarly named higher-range sensor. [NXP datasheet][pressure], [Mouser exact part][sensorprice]

| Specification | Verified value |
| --- | --- |
| Type / operating range | Single-port gauge, **0-10 kPa** |
| Supply | **4.75-5.25 V**, nominal 5 V; **3.3 V is outside specification** |
| Current | 5 mA typical, 10 mA maximum |
| Output at nominal 5 V | 0.2 V typical at zero pressure; 4.7 V typical full scale; full-scale maximum **4.925 V** |
| Transfer, nominal | `Vout = Vs * (0.09 * P_kPa + 0.04)` |
| Pinout, small-outline package | **2 = Vs, 3 = GND, 4 = Vout; 1, 5-8 = no-connect** |
| Conditioning in datasheet Figure 11 | 1 uF and 0.01 uF supply bypass; 470 pF output-to-ground filter |
| Media / timing | Characterized with **dry air**; 1 ms typical response, 20 ms typical warm-up |

See datasheet Tables 2, 4, 6 and Figure 11. Package drawing: **SOT1693-3 / case 1369-01**. This is a wide sensor package with **2.54 mm terminal pitch**, not a generic 1.27 mm SOIC-8 breakout. Check pin-1 orientation, lead span, and mounting before ordering an adapter. The six-pin MPX5010GP uses a different pinout. [Pressure datasheet][pressure]

**Direct connection is incompatible.** PJRC states Teensy 4.1 pins are not 5 V tolerant and must not receive more than 3.3 V, except VIN/VUSB. A capacitor does not reduce the sensor's DC output voltage. Software limits and “the child will not blow that hard” do not protect the ADC. [Teensy electrical warning][pinback]

**Proposed attenuator for electrical review, not a released circuit:** sensor Vout -> 47 kOhm, 1% -> divider node -> 56 kOhm, 1% -> GND. From the divider node, use a proposed 1 kOhm series resistor to A12, with a proposed 10 nF capacitor from A12 to GND. Retain the sensor's specified bypass/filter capacitors close to its leads.

- **Calculated:** divider ratio = 56 / 103 = 0.54369. Nominal sensor endpoints become about **0.109-2.555 V**.
- With worst-direction 1% resistor tolerances and a bounded **5.25 V input**, the node is at most about **2.881 V**. This bounds a rail-level signal under that supply assumption, not arbitrary faults/transients.
- Divider load at 5.25 V is about **51 uA**, below the datasheet's 100 uA *typical* output-source-current figure. That typical figure is not a guaranteed load specification. Confirm loaded transfer accuracy.
- Divider Thevenin resistance is about **25.6 kOhm** before the series resistor. Review Teensy ADC acquisition/settling and filter response; use a suitable buffer if needed. The capacitor is a proposed sampling aid, not validated protection.

**Unresolved before connecting A12:** startup/shutdown and sensor-powered/Teensy-unpowered behavior; permitted ADC injection current; transient/ESD protection; output loading; and whether a buffer or power-off-protected analog switch is required. A clamp into the 3.3 V rail can back-power that rail and is not automatically a solution. An electrical reviewer must select and check the final protection components. Disconnect the sensor-to-A12 link until this review and voltage checks pass. The interface budget is an allowance; it does not imply these issues have been solved.

### Power and optional IMU

Propose one regulated **5 V USB power bank**, with a Micro-B cable into the Teensy's **USB device** socket. The VIN/VUSB connection can supply the sensor's 5 V rail, subject to verifying 4.75-5.25 V at the sensor under load; the shield takes the documented 3.3 V supply and circuit GND. Do not connect 5 V to the 3.3 V rail. Power-bank cutoff behavior, noise, runtime, and cable voltage drop must be measured. No runtime is inferred from an advertised mAh figure. [Pin cards][pinfront], [power separation warning][pinback]

For the eventual full build, choose a documented **MPU6050 module**, not merely an unspecified marketplace breakout. The chip supply range is 2.375-3.46 V; breakout regulators and I2C pull-ups vary. Verify the exact module's VCC requirements and that SDA/SCL pull up to **3.3 V**, never 5 V. Proposed bus: SDA25, SCL24, common GND, suitable 3.3 V supply/pull-ups according to that module's schematic. Omit the IMU on the first bench and disable its firmware accesses. [TDK chip datasheet][imu], [PJRC Wire][wire]

While playing, no USB host is required: synthesis feeds I2S locally, and the source has no `while (!Serial)` host wait. This is a code/architecture finding, not a standalone hardware test. Development will still require a computer for compilation and, in a later authorized phase, programming. Use one supply at a time; disconnect the bank when using a computer USB cable. Review VIN/VUSB separation before any simultaneous external power arrangement.

## 4. Smallest useful bench prototype

### Purpose and parts

Demonstrate a quiet boot, breath onset/release and dynamics, and three successive sax fingerings through wired headphones on battery power. Use **three Haimu Heartbeat mechanical switches with the published sax keycaps**, not generic pushbuttons or replacement keyboard caps. Proposed caps are `10_K1.stl`, `12_K2.stl`, and `13_Standard.stl` for the B/A/G roles; this name-to-role mapping is inferred and should be checked against the original assembly. Keep the caps at original scale. A temporary adjustable holder is a test fixture, not the final sax layout.

Reusable parts are one Teensy 4.1, one D/D2 shield, one exact MPXV5010GP, one 36-pack of Haimu switches, appropriate headers, the reviewed sensor adapter/interface, tubing and moisture hardware, a clean commercial alto mouthpiece assembly, a 5 V bank/cable, and passive wired headphones. Additional bench equipment is a small breadboard/perfboard fixture, wire, soldering equipment, and a multimeter. Detailed quantities and allowances are in section 6. No custom production PCB, SD card, display, speaker amplifier, USB-MIDI host, IMU, or full body is necessary for this test.

The three mechanical switches need a mounting plate or secure small fixture and soldered leads; do not assume their five-pin housings simply plug into a solderless breadboard. The sensor also needs a mechanically secure adapter with strain relief; avoid dangling wires pulling on its gull-wing leads.

### Proposed wiring, after electrical review

| Connection | Bench arrangement |
| --- | --- |
| Power | USB bank -> Micro-B device socket on Teensy. Verified 5 V/VIN rail -> sensor pin 2; circuit GND -> sensor pin 3. Teensy 3.3 V/GND -> shield supply/GND. |
| Sensor | Specified bypass capacitors at the sensor; pin 4 -> reviewed divider/buffer/protection -> GPIO26/A12. No-connect leads remain unconnected. Keep the A12 link removable for voltage checks. |
| Headphone audio | GPIO7 -> shield DIN; 20 -> LRCLK; 21 -> BCLK; 23 -> MCLK; 18 -> SDA; 19 -> SCL. Reserve 8 for shield DOUT if connected. Follow the shield pad labels, not connector-position counting. Short header-style connections are preferred. |
| Three note switches | B contact -> GPIO10, A -> GPIO37, G -> GPIO32; each other contact -> circuit GND. Firmware uses `INPUT_PULLUP`. |
| Other keys | Leave physically absent; retain their input pull-ups or explicitly model them as released. Disable configuration/FF features for the bench. Never initialize unused audio pins as buttons. |
| Headphones | Passive 3.5 mm stereo TRS headphones -> shield headphone jack only; no connection from sleeve to circuit GND. |
| Storage / motion | Empty shield SD slot, no shield memory chip; preferably omit all optional SPI/CS connections. No IMU initially. |

### Moisture isolation

Use a removable commercial mouth-contact component and washable tubing. Do not put an untreated printed prototype, taped print, or assumed-safe coating in the child's mouth. A real alto mouthpiece may need its reed/ligature or a purpose-made seal/adapter to direct air; the README does not document that interface, so include it in fit/airflow testing.

Proposed pneumatic path:

```text
mouthpiece -> T/manifold -> deliberate airflow resistance -> downward drain/catch cup
                   |
                   +-> upward sensing branch -> liquid trap
                       -> suitable hydrophobic air barrier -> short dry tube -> sensor
```

Mount electronics and the sensor above the catch point, keep the sensor's gauge reference vent open, and provide an accessible drain. The child should have an open, controlled exhaust path; do not ask them to blow against a completely blocked tube. Never clear tubing with compressed air while it is attached to the sensor.

**This arrangement is a proposal, not proven moisture isolation.** A hydrophobic barrier can stop droplets but can pass water vapor; condensation can still form on its downstream side. Select a barrier intended for air-pressure sensing with documented pressure drop, verify dry-side behavior over a realistic session, and inspect/dry after use. A vapor-isolating diaphragm arrangement may be necessary and would need a new response/calibration check. The author's reported wet sensor branch is direct evidence that a T alone is insufficient. Do not copy that arrangement without testing. [README moisture discussion][readme], [sensor media specification][pressure]

### Firmware changes needed in a later phase

1. Establish a reproducible build and resolve the Bounce2 namespace/dependency issue. Add a separate bench build option; preserve the full fingering arrays and keycap/layout plan.
2. Compile out the MPU object, initialization, update, acceleration reads, and acceleration logging; set pitch bend to zero. Merely leaving the module unplugged does not bypass those accesses.
3. Preserve B/A/G GPIOs and progressive sax fingering behavior. For an untransposed check, use `transposition = 0`, `baseOct = 4`; initialize current/target pitch explicitly so it cannot remain at the `-1` sentinel. The shipped transposition is +3 semitones; do not mistake its concert pitch for a wiring error.
4. Explicitly choose ADC resolution, collect the **post-conditioning** zero-pressure baseline after warm-up, set a comfortable full-scale breath level, and store calibration locally. Replace hard-coded `breathMin = 80` / `breathMax = 650`; they cannot be carried over to a new divider. Add smoothing and separate on/off thresholds to prevent chatter. Mute on implausible/stuck/disconnected sensor readings.
5. Start all audio mixer gains at zero before enabling output. Start headphone control at **`volume(0.05)` or lower**, with a conservative digital gain cap and smooth breath attack/release. Disable the source's configuration shortcuts to **0.5, 0.6, and 1.0**. These software values are not calibrated hearing-safe sound levels: an adult must check the actual headphones off-ear first and establish a suitable maximum. The source's comment about amplifier trouble above 0.5 is not a verified operating limit.
6. Add appropriate button debounce; the current general fingering path has only a 1 ms note-settle period, while FF alone uses Bounce2. No key should sound without breath. Keep USB diagnostic output optional and nonblocking; remove USB endpoints if desired only with matching USB build settings.

Proposed untransposed bench checks, derived from `getPressedNote()`:

| B / A / G pressed | Expected note | MIDI number |
| --- | --- | --- |
| None | C-sharp 4, only with breath | 61 |
| B | B3 | 59 |
| B + A | A3 | 57 |
| B + A + G | G3 | 55 |

The octave numbering above follows MIDI 60 = middle C4. Test the relative sax fingering sequence; the full instrument's configured register/transposition can be chosen later. Also verify no-breath silence, stronger-breath dynamics, clean release, both headphone channels, and repeated battery-only cold boots. MIDI note messages in the primary CPP are commented out; they are not needed for the headphone test.

### Bench acceptance before a full build

- With power off: check continuity, sensor orientation, capacitor polarity where relevant, no 5 V/3.3 V short, and all switch contacts to the intended GPIO/GND.
- With A12 disconnected: verify both rails and sensor/divider voltage at rest and under controlled pressure, then have the reviewed protection checked through startup/shutdown. A multimeter alone cannot rule out short transients; use a qualified review/scope where needed. Do not exceed the sensor's operating range during testing.
- Once electrical checks pass: connect A12, log/calibrate readings, verify mute and output limits, then introduce low-level audio. First hearing check is by the adult, off-ear, before the child wears headphones.
- Run a realistic playing-duration moisture/airflow test, drain inspection, and power-bank stability test. Check for wetting, sluggish pressure recovery, mouthpiece leaks, false notes, resets, and pressure-related discomfort.
- Preserve all reusable components for the full instrument. Three working keys prove the sensing/audio path, not full fingering coverage, ergonomics, or PCB fit.

## 5. Printable models and mechanical gaps

### Mesh inventory and school-filament suitability

**Method:** parsed each binary STL's declared triangle count and 50-byte records with existing Python/NumPy; measured vertex minima/maxima; joined identical vertices and counted undirected edge incidence; rendered the meshes for visual inspection. Extents are axis-aligned **model-coordinate units**. STL carries no authoritative unit metadata; interpreting these values as **millimetres is a plausible assumption**, not a measured part dimension. Models were neither repaired nor rescaled.

| STL in `models/` | X x Y x Z extent, rounded to 0.01 | Edges incident to >2 triangles |
| --- | --- | ---: |
| `1_Gs.stl` | 24.63 x 19.97 x 5.60 | 0 |
| `2_B.stl` | 17.56 x 19.82 x 5.60 | 0 |
| `3_Cs.stl` | 17.20 x 18.28 x 5.60 | 0 |
| `4_Bb.stl` | 27.50 x 19.90 x 10.62 | 0 |
| `5_Eb.stl` | 23.28 x 19.23 x 5.60 | 0 |
| `6_C.stl` | 22.88 x 21.57 x 5.60 | 0 |
| `7_PK1.stl` | 12.21 x 25.40 x 10.70 | 0 |
| `8_PK23.stl` | 12.09 x 25.40 x 9.72 | 0 |
| `9_FF.stl` | 21.93 x 15.46 x 7.20 | 0 |
| `10_K1.stl` | 15.86 x 20.50 x 6.29 | 0 |
| `11_Bis.stl` | 11.80 x 21.45 x 6.10 | 0 |
| `12_K2.stl` | 16.70 x 16.69 x 6.29 | 0 |
| `13_Standard.stl` | 16.70 x 16.70 x 6.29 | 0 |
| `14_SK1.stl` | 10.00 x 19.91 x 10.72 | **177** |
| `15_SK2.stl` | 10.00 x 17.00 x 6.60 | **130** |
| `16_SK3.stl` | 10.00 x 17.00 x 6.60 | **130** |
| `17_Oct_Lower.stl` | 23.05 x 28.89 x 14.40 | 0 |
| `18_OctRest_Angle_PLA.stl` | 36.80 x 150.59 x 39.27 | **463** |
| `19_ThumbRest.stl` | 38.77 x 91.62 x 55.24 | **196** |

All 19 had structurally valid binary records and no one-face boundary edges under this test. That is **not** a guarantee of printable manifold solids: five files have the higher-incidence edges above. Duplicate faces were also found in 14, 18, and 19; 18 has one near-zero-area triangle at the inspection threshold. Self-intersections, internal passage clearance, minimum wall thickness, slicer interpretation, and airtightness have **not** been certified. These findings justify slicer layer-preview and possibly mesh repair on copies in a later phase, with before/after shape checks.

**School printer:** model, process, usable build volume and permitted jobs are unknown. Check each oriented part, supports and brim against the school's actual usable volume; the largest published part has a 150.59-unit axis, but that is not a certified minimum printer-bed requirement. The body is missing PCB geometry, not a supplied printable sax shell. No printer, spare nozzle, maintenance supplies or personal filament stock is budgeted.

**Practical assessment:** the published keycaps are reasonable candidates for school filament trials if that process is available, but this is not a verified ready-to-print FDM set. The author used outsourced JLC printing and trialed stem tolerances; the README does not establish the process/material used for every part. `PLA` in one filename does not certify the whole set. Preserve the sax-shaped surfaces, stem offsets, bis/G-sharp tabs, and palm/side angles. Do not solve fitting problems by replacing caps with generic buttons or uniformly scaling the instrument.

**Smallest useful fit-test print:** one **unmodified [13_Standard.stl][standardcap]**, paired with one actual Haimu Heartbeat switch. Its verified mesh extent is 16.70 x 16.70 x 6.29 coordinate units; this mesh had no boundary or higher-incidence edges in the inspection. At the assumed millimetre scale it is a small dry cap/stem-fit test that requires no invented board, socket or holder CAD. It checks insertion depth, retention, removal and unobstructed switch travel; it does **not** establish complete fingering layout, side-key/tab clearance, child reach or v2 body fit. Stop if the cap needs force or cracks. Record the printer, material, orientation, slicer scale/settings and measured result. A successful cap transfers to the bench's G key and then the instrument; do not charge for another copy merely because the project advances a stage.

After that passes, print original `10_K1` and `12_K2` for the other two bench keys. Defer an offset/tabbed-cap trial and the remaining batch until the school approves the jobs and assembly geometry is resolved. For an approved PLA/FDM dry trial, school staff may consider 0.12-0.16 mm layers **if appropriate to their installed nozzle**. Choose orientation/supports from the actual underside and layer preview; avoid socket support scars and protect slender tabs. Do not change school hardware or assume a nozzle is available. Any later local socket-clearance change needs a separate model-edit phase that retains key shape/contact position; no such edit is part of this update. Test repeated presses and side loading. These are proposed settings, not slicer-tested profiles. [Prusa design-for-printing guidance][prusa]

Provisional copy counts inferred from filenames and key functions: one of each key STL 1-17, except **two of `8_PK23` and four of `13_Standard`**, giving 21 playing caps; one each of 18/19. Confirm with the author/assembly. No dedicated configuration cap is identified. Do not print a complete batch based solely on this inference.

### School details required before any print job

| Confirm with the school | Why it matters |
| --- | --- |
| Printer make/model, FDM or another process, usable X/Y/Z build volume, installed nozzle, slicer and available profiles | Check the actual placed mesh plus supports/brim; verify the STL unit assumption in preview. A printer name alone does not establish usable space or cap tolerance. |
| Available/approved materials and colors, who supplies material, support options and post-processing | Confirm PLA or another suitable dry-fit material is permitted. Do not purchase a spool or assume the school supplies unlimited material. Airway/mouth-contact parts require separate material/cleaning review. |
| Permitted personal/student projects, outside STL acceptance and license requirements, staff approval/supervision | This repository has unresolved model-license information. Confirm that this project and the proposed jobs are accepted; do not assume every published file may be printed under school policy. |
| Maximum job size/time, quantity limits, queue, dates of access, and whether repeated fit tests are allowed | Request one cap first, then two more, then staged approved jobs. Access is neither confirmed unlimited nor presumed available on demand. |
| Setup/job charges, material price or minimum charge, support/waste/time charges, collection costs | Replace the separate first-stage and remaining-print allowances below with actual quotes after slicing. |
| Failed-job and reprint fees, who pays for school-caused versus design-caused failures, retry limits | Keep the reprint allowance separate; establish who authorizes a retry. Confirm whether revised files incur a new setup fee. |

No school quote, approval, slicer preview, material usage or print duration has been obtained. Printing fees and reprints below are explicitly **unverified**, including the possibility that actual fees are lower or higher.

### Model/version mismatch

The rendered `19_ThumbRest.stl` has the rest/drain form resembling [the v1 rest image][v1rest], with **no long battery sleeve** like [the v2 image][v2rest]. `18_OctRest_Angle_PLA.stl` has an extended air-path/rest form, but compatibility with the commercial alto-mouthpiece neck shown in [v2 neck image][neck] is unverified. The model directory's last commit is `0718e860c4eb1d7b6da019f9b50ef70dd1a34c0b` (`init v2`, 2025-10-01); that timestamp is not proof every mesh matches the photographed v2 assembly.

Thus there are published rest meshes, but **no verified matching v2 battery-holder/neck assembly**. Request those source models before ordering battery-shaped mounting hardware or making the airway part. The printed keycaps remain the intended full-build controls.

### Dimensions and fit that must be obtained

1. **Original assembly:** dimensioned switch-center coordinates, orientations and heights; main and four side-board outlines; board thickness; mounting holes; bracket bend angles and connector locations. Request KiCad and Fusion/STEP files with a version matching the firmware/model set. Retained STL origins overlap for some repeated keys and are not a substitute for a complete placement drawing.
2. **Actual switches/caps:** stem cross dimensions and insertion depth, switch mounting geometry, plate thickness, cap clearances through full travel, tab interactions, and the force/reach appropriate to this child's hands. Supplier lists the Haimu as a 65 g, five-pin linear switch; test the actual feel before assembling 22 of them. [Haimu listing][switchprice]
3. **Boards/connectors:** exact Teensy/shield revision, header alignment and spacing, underside clearance, Micro-B and headphone plug access, strain relief, and sensor package/port clearance. Manufacturer drawings can inform these, but physical parts need checking against the assembled stack.
4. **Airway:** actual mouthpiece socket/taper/seal, tube IDs/ODs, sensor barb profile, trap/filter connections, exhaust restriction, drainage, and cleaning access. Distributor port-size fields disagree; use the package drawing and actual fit, not a catalog diameter alone.
5. **Body/battery/child fit:** measured bank dimensions including plugs, secure holder without stressing boards, insulated electronics covers, rounded edges, comfortable thumb support, strap attachment/load path, and complete key reach. A dry fixture can assess reach; preserve the published sax arrangement unless a specific ergonomic change is later agreed.

**Manufacturing gate:** no board dimensions are invented here. The v1 SVG viewBox is a graphic extent, not a validated v2 board dimension. Photographs are references for appearance/arrangement, not manufacturing metrology. If the author's geometry cannot be obtained, reconstruction is a separate measured mechanical design task with uncertain time/cost; a random perfboard layout would not meet the requested layout fidelity.

## 6. Instrument-only budget: first bench purchase and completion

### Price basis and accounting

All supplier prices in this revised budget were checked **2026-09-07**, in USD, before shipping/tax. **Observed** means an accessible supplier page or, where stated, its indexed result; it does not guarantee checkout price or availability. **Unverified allowance** is a budgeting assumption, not an invented supplier price. Totals retain cents for arithmetic traceability, not precision about the unknown work. No orders or quote uploads were made.

There is **no printer purchase or printer-ownership cost**. School setup/printing/material fees and reprints have their own lines. The budget assumes unpaid competent adult/volunteer assembly and electrical/CAD review, an existing development computer and a suitable existing USB charging source used between playing sessions. Confirm the bank's charging requirements against that source; if it is unsuitable, price a charger and add it before ordering. No paid CAD reconstruction, engineering labor, guaranteed full-board redesign, replacement development computer, or commercial print fallback is included. These could materially raise the total.

**Accounting rule:** buy the inventory in A once, then add only B to finish. Tools/consumables in C and overhead in D are also counted once. The first three successful caps are part of the finished set, and the 36-switch pack covers all 22 switches plus 14 spares. A bench cash total is a subtotal of this same ledger, never an extra charge on top of the complete instrument.

### A. First three-key bench-prototype components

This is the parts list for the smallest useful **breath/audio** prototype in section 4, with its switch purchase and cap-fit check staged first. Prices for unselected interfaces remain allowances until the ordering gates are met.

| ID / item | Quantity and scope | Amount | Price evidence / finished-instrument transfer |
| --- | --- | ---: | --- |
| A1 Teensy 4.1 | 1, without headers, SparkFun DEV-16771 | $31.50 | Observed, page showed in stock. **Transfers.** [Supplier][teensyprice] |
| A2 Teensy 4 Audio Shield Rev D | 1, SparkFun DEV-15845 | $9.80 | Observed, page showed in stock; verify actual Rev D/D2 compatibility. D2 substitution needs its own price. **Transfers.** [Supplier][audioprice] |
| A3 MPXV5010GP | 1 exact sensor, Mouser 841-MPXV5010GP | $32.46 | Observed **indexed quantity-one** price; direct fetch failed. Reconfirm stock/package and manufacturer documentation. **Transfers if moisture/protection tests pass.** [Supplier][sensorprice] |
| A4 Haimu Heartbeat Silent Linear switches | 1 pack of **36**; 3 bench, 19 more at completion, 14 spares | $10.80 | Observed pack price. Page contains both availability and unavailable-variant text: confirm the purchasable pack. **All inventory transfers; no second pack in B.** [Supplier][switchprice] |
| A5 Headers/sockets | One Teensy/shield mating set, including Teensy's two 24-position rows; choose stack height and shield connections after review | $12.00 | **Unverified allowance.** Transfers with the stack; does not include later inter-board connectors. |
| A6 Sensor adapter and conditioning | One supported SOT1693-3 interface; proposed 47 k/56 k 1%, 1 k/10 nF, and 1 uF/10 nF/470 pF parts; reviewed protection still to select | $12.00 | **Unverified allowance, incomplete protection BOM.** Intended to transfer as an interface module; do not add a second sensor/interface in B. |
| A7 Airway and moisture isolation | One set of washable tubing, T/reducers, drain/trap and suitable hydrophobic barrier | $25.00 | **Unverified allowance.** Connections and barrier not selected; may cost more. Reusable dry-side parts transfer after validation; replacements draw from the non-print revision reserve. |
| A8 Alto mouthpiece kit | 1 Prelude P3KIT, mouthpiece + ligature + cap | $27.49 | Observed Sweetwater price. **Transfers if the measured neck/airway fit works.** No duplicate ligature purchase. [Supplier][mouthprice] |
| A9 Reed and mouthpiece seal/test coupling | 1 suitable reed plus sealing material as needed | $5.00 | **Unverified allowance.** Reed is not included in A8; fit/seal must be selected. Transfer usable parts; replacements use reserve. |
| A10 Regulated USB power bank and supplied cable | 1 Adafruit PID 1566, 10000 mAh, USB-A 5 V outputs, supplied Micro-B cable | $39.95 | Observed, orderable page. **Transfers.** Cable is included, so no second mandatory power cable is charged. Cutoff/runtime and mounting remain untested. [Supplier][bankprice] |
| A11 Passive wired stereo headphones | 1 Sony MDR-ZX110 black, 3.5 mm | $9.99 | Observed **sale** price, normal displayed price $24.99. **Transfers.** Check fit and actual listening level; sale expiry adds $15 before tax. [Supplier][headphoneprice] |
| A12 Small perfboard and temporary switch fixture | One securely supported bench assembly; excludes wire, breadboard and sensor adapter already listed elsewhere | $5.00 | **Unverified allowance.** Temporary fixture is a bench expense; salvage usable mounting/perfboard parts, but no full-body fit is implied. |
| **A total** | Components and inventory bought once | **$220.99** | School prints, tools, consumables and overhead are below. |

The README-linked DigiKey sensor page did not provide a usable single-unit alternative in the original inspection; its 250-piece price break was not a one-piece quote and is not used. [DigiKey][digikey]

A10 is a **priced candidate**, not a verified fit to the missing v2 holder. The supplier lists about 90.3 x 63 x 23 mm and 212 g: measure the received unit and plugs, and assess an off-instrument pouch to avoid that mass on the child's key assembly. Test low-load shutoff. Disconnect the output to turn the prototype off; do not assume the charge-status button switches the output. Charge separately from playing because charging transitions can disturb its output. [Bank documentation][bankprice]

The supplied cable's USB **data** capability must be checked before later firmware loading. If unsuitable and none can be borrowed, a separately sourced Adafruit PID 592 Micro-B data/power cable was **$2.95**; fund that replacement from the bench reserve and record actual spend, rather than automatically buying duplicate power cables. No flashing is authorized in this phase. [Cable alternative][cableprice]

### B. Additional parts needed to finish the instrument

These are **incremental purchases only**. Missing dimensions prevent a final BOM or board quote; the amounts marked unverified must not be treated as ready-to-order selections.

| ID / additional item | Quantity and scope | Amount | Basis |
| --- | --- | ---: | --- |
| B1 MPU6050 breakout | 1 Adafruit PID 3886; supplied header, use wire already bought in C | $12.95 | Observed, orderable page. Documented module replaces the former unspecified module allowance; physical mounting and compatibility with the existing library still require checking. [Supplier][imuprice] |
| B2 Custom PCB body set | One usable main + four side-board set, including any supplier minimum batch | $60.00 | **Unverified placeholder, not a fabrication quote.** Requires original v2 board/CAD, actual dimensions, thickness, holes and an agreed batch/panel plan. No production files generated. |
| B3 Board brackets and fasteners | Complete set; number, angles and sizes not yet known | $16.00 | **Unverified allowance.** Excludes printed parts and A12's temporary fixture. |
| B4 Inter-board connectors | One full harness connector set; wire comes from C | $9.00 | **Unverified allowance.** Connector count/pitch and service access await the missing assembly. |
| B5 Final nonprinted mounting hardware | Neck/bank mounting or pouch, covers' hardware, strap and strain relief as required | $15.00 | **Unverified allowance.** Printed parts are charged only in D; no claim these hardware selections match the supplied meshes. |
| **B total** | No duplicate core electronics, switches, caps, mouthpiece, headphones or bank | **$112.95** | Remaining school prints are in D. |

For B1, use the manufacturer's documented 3.3 V-compatible configuration and review its pull-ups against **Wire2 SDA 25 / SCL 24**. The guide documents level shifting, pull-ups and default address 0x68; supplying its Vin at 3.3 V is the proposed Teensy arrangement. Do not power an unknown module at 5 V and assume its I2C pins are safe. This selection does not automatically require replacing the repository's MPU library. [Module pinout guide][imuguide]

The custom PCB allowance does not establish a feasible board size or a complete reconstruction service. Quotes depend on five-board geometry, minimum quantities, panelization and revisions. A generic low-price PCB promotion is not a quote for this instrument. If the original geometry cannot be obtained, re-budget the measured reconstruction separately while retaining the sax arrangement.

### C. Tools and consumables: buy versus borrow

The default total buys every tool below; the alternative total removes tool purchases **only if actual loans are confirmed**. Borrowing school printing access does not imply borrowing its soldering equipment. Borrowed equipment must be available for both bench testing and final assembly. These tools do not become instrument components.

| Tool, one each unless noted | Buy amount | Borrow option / price basis |
| --- | ---: | --- |
| Adjustable soldering iron, 120 V, Adafruit PID 3685 | $19.95 | Observed, orderable page; borrow a suitable temperature-controlled iron instead if confirmed. Adult use. [Supplier][ironprice] |
| Stable iron stand and sponge, Adafruit PID 150 | $10.95 | Observed price but **out of stock**. Borrow, await stock or price a suitable replacement before ordering; this is a reference-priced placeholder, not an available cart. [Supplier][standprice] |
| Digital multimeter with probes | $20.00 | **Unverified allowance.** Borrow a working meter able to check continuity and 3.3/5 V rails. |
| 150 mm digital caliper, Pittsburgh 63731 | $24.99 | Observed supplier price; borrow a checked caliper instead. Needed at the very first stem-fit trial. [Supplier][caliperprice] |
| Cutters, wire stripper, small pliers and tweezers | $15.00 | **Unverified allowance for one small set.** Borrow these individually where available. |
| Full-size solderless breadboard, Adafruit PID 239 | $5.95 | Observed, orderable page. Temporary bench tool; borrow if available, not part of the final body. [Supplier][breadboardprice] |
| **Tool total** | **$96.84** | **$0 purchase cost only with all six rows confirmed borrowed.** |

| Consumable purchase | Amount | Basis / accounting |
| --- | ---: | --- |
| Lead-free SAC305 solder, 50 g, Adafruit PID 1930 | $27.50 | Observed supplier price, orderable page. Buy once for the whole project; full spool price, not a fictitious per-joint cost. School/adult must approve solder/workspace. [Supplier][solderprice] |
| Electronics flux and desoldering wick | $6.00 | **Unverified allowance.** Buy once; not hidden in iron/stand cost. |
| Hook-up/jumper wire and heat-shrink assortment | $12.00 | **Unverified allowance.** Stock for bench wiring and final harness, counted once; separate connectors are A5/B4. |
| **Consumables total** | **$45.50** | Retained even in the borrow-tools scenario; free school consumables are not assumed. |

Use an appropriate adult soldering workspace with ventilation, eye protection and a heat-resistant surface; confirm these existing/borrowable facilities before buying tools. If they are unavailable, add the actual equipment cost. A school that supplies consumables may reduce this cash cost, but obtain its permission/fees and subtract only the confirmed provision.

### D. School printing, shipping, tax and revisions

Every amount in this table is an **unverified allowance**, not a school/supplier quote or a stated local tax rate. The columns allocate the same project costs between stages; they are not overlapping estimates.

| Cost | Through first three-key bench | Additional completion | Whole project | Scope |
| --- | ---: | ---: | ---: | --- |
| School successful printing/material/setup fees | $10.00 | $25.00 | $35.00 | First one-cap trial and next two caps, then remaining approved parts. Include support/waste and any job minimums once quoted. No private filament spool. |
| School **reprint** fees/materials | $5.00 | $15.00 | $20.00 | Separate failed-fit/failed-print retry provision; quantities and school retry policy unknown. |
| Shipping/collection | $30.00 | $20.00 | $50.00 | Multiple electronics/music suppliers and later board/hardware delivery; consolidate where possible. Actual checkout charges may exceed this. |
| Sales tax | $30.00 | $15.00 | $45.00 | Replace with destination-specific cart tax, including taxable shipping/fees if applicable. |
| **Non-print** prototype/revision reserve | $20.00 | $40.00 | $60.00 | Sensor-interface changes, fittings/seals, electronic/mechanical rework, replacement small parts or some board rework. Excludes printing retries already above; not a guaranteed full PCB redesign fund. |
| **D total** | **$95.00** | **$115.00** | **$210.00** | Total revision provision is $80: $20 printing + $60 non-print. |

School successful-print charges need a quote for setup, material and time after slicing; the $35 is not evidence that all parts can be printed for that amount. A complete cap set, compatible rest/neck/holder geometry and any approved fixture jobs must be defined before quoting the remaining $25. No fee waiver, unlimited access or unlimited reprints is assumed.

### Reconciled total and comparison with $550

| Same ledger, two tool scenarios | Buy all listed tools | Borrow all listed tools, if confirmed |
| --- | ---: | ---: |
| First bench components A | $220.99 | $220.99 |
| Tools C | $96.84 | $0.00 |
| Whole-project consumables C, bought at bench stage | $45.50 | $45.50 |
| Bench-stage fees/overhead/reserve D | $95.00 | $95.00 |
| **First bench cash provision** | **$458.33** | **$361.49** |
| Additional components B | $112.95 | $112.95 |
| Additional fees/overhead/reserve D | $115.00 | $115.00 |
| **Additional completion cash** | **$227.95** | **$227.95** |
| **Complete instrument-only project** | **$686.28** | **$589.44** |
| **Above the $550 benchmark** | **$136.28** | **$39.44** |

Cross-check: **$220.99 A + $112.95 B + $96.84 tools + $45.50 consumables + $210.00 D = $686.28**. Equivalently, **$458.33 bench + $227.95 incremental completion = $686.28**. Do not add $458.33 to $686.28: that would count the bench twice.

**Budget decision:** removing printer ownership helps substantially, but a complete $550 result is still not established. Confirmed tool loans save $96.84. With those loans **and** an already-owned, validated bank/cable and headphones, the same ledger would be **$539.50**, leaving only $10.50 headroom. That scenario is conditional, not a claim that those items are owned or free. Partial borrowing saves only the corresponding tool rows. Cheaper compatible products can be substituted after pricing and validation, but no unverified bargain is credited here.

The biggest uncertainties are school charges/access, unavailable board/CAD and matching v2 models, PCB/bracket quantities, the exact moisture barrier and ADC protection, and whether tools can be borrowed. The headphone sale alone can expire and add $15 before tax. If actual print costs rise by $20 and the board set by $40, either scenario rises by $60 before any additional tax/shipping. Preserve the reserves and re-budget from actual carts and measured fabrication quotes before committing to the full body.

## 7. Smallest first order and decision gates

**Smallest sensible first parts order:** after the school accepts the one-cap trial and a caliper is available, order **one 36-pack of Haimu Heartbeat Silent Linear switches, $10.80 plus actual shipping/tax**, and request **one original `13_Standard.stl`**. Confirm the purchasable variant/pack first. The print fee is not yet known. This is **A4 and part of D**, not an extra purchase outside the ledger; use one switch now, three at the audio bench, and 22 in the final instrument. If a loaned exact Haimu sample is available, it can precede buying the pack. Generic buttons or generic replacement caps do not satisfy this fit test.

**Next, the smallest complete breath/audio order:** once the sensor interface/airway selections are reviewed, purchase A1-A3 and A5-A12, plus only missing C items. The remaining A components are **$210.19** after the switch pack; the full bench cash provision remains **$458.33 buying tools / $361.49 borrowing all tools**, including that first switch order and the staged print fees. Add original K1/K2 caps to the successful Standard cap. Omit the IMU from this bench and make the later bench-mode firmware changes described in section 4; there is no need for the complete 22-key assembly to demonstrate breath-controlled headphone sound.

**Defer the full PCB set, brackets, battery-specific holder and full cap batch.** Obtain the original v2 KiCad/assembly CAD, matching neck/battery-holder models, print quantities and license clarification. Missing v2 board/CAD files and the published model/version mismatches remain **fabrication blockers** despite school-printer access. No author/school messages were sent, and no school job or order was submitted.

| Gate | Required checks |
| --- | --- |
| Before switch order / first print | Confirm exact Haimu pack availability and landed price; school printer/process, usable volume, material, allowed jobs/license policy, scheduling and first-job/retry fees; preview original Standard cap at the checked scale. Borrow or price a caliper. No body dimensions need inventing for this isolated test. |
| Before the breath/audio order | Check which tools/accessories are actually owned or borrowable. Confirm Teensy 4.1 and Teensy-4-compatible Rev D/D2 shield, exact MPXV5010GP supply/output/package and appropriate adapter, reviewed protection BOM, actual sensor/tubing/airway fit and suitable moisture barrier. Do not buy guessed sensor adapters or a full tubing set based on inconsistent catalog barb fields. Confirm bank/charging source and mouthpiece fit strategy. |
| Before any prototype power-up | Adult electrical review: no direct 5 V sensor output to A12; approved attenuation/protection, power-off/back-power behavior and ADC loading; correct sensor pinout, shared circuit ground and decoupling; shield pin audit with optional SD/flash unused. Check shorts, rail routing and headphone **VGND isolation**. Review bank/USB supply selection; no simultaneous charging/playing. |
| Before connecting the sensor output to the Teensy | Measure rails and conditioned output first with ADC disconnected; verify worst-case pressure, startup/shutdown and fault behavior stay within the reviewed input limits. A calculated divider is not a completed protection review. |
| Before functional bench testing / child headphone use | In a later authorized implementation phase, resolve the missing toolchain/dependencies and compile the actual bench firmware. Disable IMU access and unused-key requirements, calibrate after the interface, start muted and at **0.05 or lower** headphone volume with a digital gain cap, and remove high-volume shortcuts. Adult checks off-ear first, then low-level listening; validate moisture isolation and battery-only operation. The present firmware has **not** been successfully compiled or flashed. |
| Before full fabrication | Obtain dimensioned v2 boards/assembly, measure actual components and child reach, resolve rest/neck/battery-holder mismatches, approve mesh previews and confirm the sax key geometry/locations. Obtain real school/manufacturing/shipping quotes and revise this ledger; photographs are not manufacturing measurements. |
| Before calling the instrument complete | Retain the published sax shapes and 21 playing-control layout plus config; test all fingerings, travel/tab clearance, moisture management, insulated/strain-relieved mechanics, comfortable headphone levels and dependable standalone playing. |

**Current planning result:** **$686.28 with tools purchased; $589.44 with all listed tools confirmed borrowed**, with school fees and several fabrication/interface costs still unverified. Start with the $10.80 switch pack and one published cap, then the reviewed three-key breath/audio bench. The unreviewed 5 V-to-3.3 V interface, missing local build environment/Bounce2 declaration, missing v2 fabrication/assembly geometry and mismatched rest/neck models remain unresolved. This update changes planning documentation only.

## Sources

Repository links refer to the inspected local files; the commit above fixes their upstream context. Electrical/build references were accessed or searched on **2026-09-06**; revised supplier prices and the selected MPU6050 breakout documentation were checked on **2026-09-07**. Retrieval and stock limitations are recorded with the affected items. School costs have no source yet and remain unverified allowances.

[upstream]: https://github.com/Whackalenso/CircuitSax/tree/c7d121c8ed9c5809c17bd0cfcf7615b6a861bfd8
[readme]: ../../README.md
[modules]: ../../.gitmodules
[cpp]: ../../v2/Circuit%20Sax%20v2/src/circuit_sax_v2.cpp
[ino]: ../../v2/Circuit%20Sax%20v2/circuit_sax_v2/circuit_sax_v2.ino
[pio]: ../../v2/Circuit%20Sax%20v2/platformio.ini
[patches]: ../../v2/Circuit%20Sax%20v2/src/patches.h
[models]: ../../models/
[standardcap]: ../../models/13_Standard.stl
[v1sch]: ../../v1/schematic.pdf
[v1svg]: ../../v1/images/pcb.svg
[pcbimage]: ../../v2/images/pcb.png
[v1rest]: ../../v1/images/thumb_rest.png
[v2rest]: ../../v2/images/thumb_rest.png
[neck]: ../../v2/images/neck.png
[switchlicense]: ../../Circuit-Sax-Switch-Controls/LICENSE
[lufalicense]: ../../Circuit-Sax-Switch-Controls/LUFA_LICENSE
[pinfront]: https://www.pjrc.com/teensy/card11a_rev3_web.pdf
[pinback]: https://www.pjrc.com/teensy/card11b_rev3_web.pdf
[wire]: https://www.pjrc.com/teensy/td_libs_Wire.html
[audio]: https://www.pjrc.com/store/teensy3_audio.html
[codec]: https://www.nxp.com/docs/en/data-sheet/SGTL5000.pdf
[pressure]: https://www.nxp.com.cn/docs/en/data-sheet/MPX5010.pdf
[imu]: https://product.tdk.com/system/files/dam/doc/product/sensor/mortion-inertial/imu/data_sheet/mpu-6000-datasheet1.pdf
[bounce]: https://github.com/thomasfredericks/Bounce2/blob/master/src/Bounce2.h
[pioboard]: https://docs.platformio.org/en/latest/boards/teensy/teensy41.html
[piosrc]: https://docs.platformio.org/en/latest/projectconf/sections/platformio/options/directory/src_dir.html
[prusa]: https://help.prusa3d.com/article/modeling-with-3d-printing-in-mind_164135
[teensyprice]: https://www.sparkfun.com/teensy-4-1.html
[audioprice]: https://www.sparkfun.com/teensy-4-audio-shield-rev-d.html
[sensorprice]: https://www.mouser.com/en/ProductDetail/STMicroelectronics/MPXV5010GP?qs=N2XN0KY4UWUfWoGX6cpzOg%3D%3D
[digikey]: https://www.digikey.com/en/products/detail/nxp-usa-inc/MPXV5010GP/951847
[switchprice]: https://cannonkeys.com/products/haimu-heartbeat-silent-linear-switch
[mouthprice]: https://www.sweetwater.com/store/detail/PreludeMpcAS--prelude-p3kit-alto-saxophone-mouthpiece-kit
[bankprice]: https://www.adafruit.com/product/1566
[headphoneprice]: https://electronics.sony.com/audio/headphones/headband/p/mdrzx110-blk
[cableprice]: https://www.adafruit.com/product/592
[imuprice]: https://www.adafruit.com/product/3886
[imuguide]: https://learn.adafruit.com/mpu6050-6-dof-accelerometer-and-gyro/pinouts
[ironprice]: https://www.adafruit.com/product/3685
[standprice]: https://www.adafruit.com/product/150
[caliperprice]: https://www.harborfreight.com/6-in-digital-caliper-with-sae-and-metric-fractional-readings-63731.html
[breadboardprice]: https://www.adafruit.com/product/239
[solderprice]: https://www.adafruit.com/product/1930
