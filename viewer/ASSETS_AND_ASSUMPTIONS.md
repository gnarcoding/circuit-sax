# Asset inventory and reconstruction record

Inspected checkout: `f489e059a23dcc02d92af0e73dd39f2e44a21971`. All meshes remain byte-identical to `../models/`. No original-file edits, repairs or rescaling.

## Original meshes

File count is not installed-part count. All mappings and full-instance quantities below are inferred from filenames, the build plan, firmware controls and v2 images. Source extents are coordinate units; interpreting them as millimeters is an assumption.

| File | Triangles | Source X ? Y ? Z | Full instances | Inferred role |
| --- | ---: | --- | ---: | --- |
| `1_Gs.stl` | 16000 | 24.63 ? 19.97 ? 5.60 | 1 | Left pinky G-sharp |
| `2_B.stl` | 8102 | 17.56 ? 19.82 ? 5.60 | 1 | Left pinky low B |
| `3_Cs.stl` | 9986 | 17.20 ? 18.28 ? 5.60 | 1 | Left pinky C-sharp |
| `4_Bb.stl` | 28576 | 27.50 ? 19.90 ? 10.62 | 1 | Left pinky low B-flat |
| `5_Eb.stl` | 15026 | 23.28 ? 19.23 ? 5.60 | 1 | Right pinky E-flat |
| `6_C.stl` | 14820 | 22.87 ? 21.57 ? 5.60 | 1 | Right pinky low C |
| `7_PK1.stl` | 55206 | 12.21 ? 25.40 ? 10.70 | 1 | Palm D |
| `8_PK23.stl` | 48092 | 12.09 ? 25.40 ? 9.72 | 2 | Palm D-sharp and palm F |
| `9_FF.stl` | 75486 | 21.93 ? 15.46 ? 7.20 | 1 | Front F / octave jump |
| `10_K1.stl` | 36650 | 15.86 ? 20.50 ? 6.29 | 1 | B / left index |
| `11_Bis.stl` | 38660 | 11.80 ? 21.45 ? 6.10 | 1 | Bis |
| `12_K2.stl` | 26998 | 16.70 ? 16.69 ? 6.29 | 1 | A / left middle |
| `13_Standard.stl` | 27990 | 16.70 ? 16.70 ? 6.29 | 4 | G, F, E, D |
| `14_SK1.stl` | 43160 | 10.00 ? 19.91 ? 10.72 | 1 | Top side |
| `15_SK2.stl` | 30396 | 10.00 ? 17.00 ? 6.60 | 1 | Middle side |
| `16_SK3.stl` | 30396 | 10.00 ? 17.00 ? 6.60 | 1 | Lower side |
| `17_Oct_Lower.stl` | 31542 | 23.05 ? 28.89 ? 14.40 | 1 | Octave / left thumb |
| `18_OctRest_Angle_PLA.stl` | 56670 | 36.80 ? 150.59 ? 39.27 | 1 | Neck / octave rest stand-in |
| `19_ThumbRest.stl` | 60200 | 38.77 ? 91.62 ? 55.24 | 1 | Lower thumb rest stand-in |

Full installed STL instances: 23 (21 playing caps + two rest meshes). Configuration has a separate switch but no identified cap. Bench uses 10_K1, 12_K2, 13_Standard and the uncertain neck/rest stand-in. Every source STL can also be viewed alone in the asset library.

## Coordinate and display policy

One scene unit is assumed to be one millimeter. For cap files 1?16, the lower 0.35-unit slice supplies a bounding-box stem reference; for 17?19 the full bounds center is used. Geometry is translated only. Stem-reference extraction is an inference, not socket metrology. Scene position/rotation, parenting and explosion offsets are separate editable manifest fields. The inventory retains original min/max, center, stem reference and SHA-256 values.

The STL directory does not contain a complete assembly. K2 and Standard share bounds/origins, and PK23 must be instantiated twice; these cannot be treated as ready-made placements. Main-board switch centers, side-board angles, stack heights and all installed transforms are inferred. The CPU and battery have source-dimensioned envelopes; other procedural sizes are illustrative. No part was independently resized to force a fit.

## Geometry status

- Original meshes: all keycaps, published octave/rest and lower-rest geometry.
- Documented approximations: Teensy outline (60.96 ? 17.78 mm) and candidate USB bank envelope (90.3 ? 63 ? 23 mm from build plan A10). Small components/connectors remain simplified.
- Illustrative proxies: main plus four side boards, Haimu switch housings, Audio Shield, MPXV5010GP package/port, MPU6050 module, mouthpiece/reed/ligature, holder, cables/plugs, tubing, headers, brackets, fasteners and headphones.
- Proposed/unresolved blocks: dry-side moisture barrier/trap and pressure-signal conditioning/protection. No reviewed resistor values or installation schematic are displayed.

Rest 19 resembles the older rest/drain shape and lacks the v2 sleeve. Rest 18 is also not a verified commercial-mouthpiece neck. The original meshes are retained as explicit uncertain stand-ins; the holder is separately reconstructed around the plan candidate bank, whose fit to the original build is unknown. Exact mounting, material suitability, sealing and child ergonomics remain unresolved.

## Visually inspected reference evidence

The v2 front photograph shows pale blue sax keycaps, red switches, yellow main/daughterboards, an exposed Teensy and a dark mouthpiece/neck. `v2/images/pcb.png` shows the flat five-board layout, stepped main outline, switch groups and mounting relationships. The v2 neck and thumb-rest drawings establish the intended air-path/rest character and battery sleeve concept. No v1 wiring was copied; older-version rest resemblance is explicitly identified through the build plan.

Curated reference files and hashes:

| Original path | SHA-256 |
| --- | --- |
| `v2/images/front.png` | `c2f2eeec30ccdf267ca8c2263dd073dbefa4fb00d14a7bc815ec12f99dc00b39` |
| `v2/images/pcb.png` | `bcc663644e6e88fb3fdd9c9257649fe15e75692f14493ce4101140cdad8f71e9` |
| `v2/images/neck.png` | `c09f0e2ef5c765817c31e29d64bb619bba6e0d5b52204b27c55127b6cfa53447` |
| `v2/images/thumb_rest.png` | `72971a1dfae7869b17d8ae00b63397e9d6cefa78c106206aced1793ffef67197` |
| `README.md` | `38394997b3feb43f1a36ef003566ee713d4e87a668e40ae0133990ce993662e5` |
| `docs/build/BUILD_PLAN.md` | `61a817f4a802af2f5884a3fb8bcc4ec3ae88b93f7e90d7c2b295d781706759a1` |
| `v2/Circuit Sax v2/platformio.ini` | `6b0bc5027d0acaa8e450e08cfa58763b7c5725d082d8204cfc5b2a3e787f7477` |
| `v2/Circuit Sax v2/src/circuit_sax_v2.cpp` | `db486a5cc773b2b882988285e9a719eb42137af58de44416a09a1b7a8c593eba` |
| `v2/Circuit Sax v2/src/patches.h` | `f44ea87554e3a2f693f4cb6ca1a039af6190f061bde93cbf8e34f72c2c0b658d` |
| `v2/Circuit Sax v2/src/waveforms.h` | `62dde6278067518d873d4fa601b82d2a6f27fd8268d19566bf2fdd55cbb441ef` |

## Remaining engineering work

Original v2 CAD, switch centers, complete BOM, board manufacturing files, bracket bends, all clearances, neck/rest version compatibility and holder geometry are missing or unverified. Mesh validation checks record structure and finite vertices, not manifoldness or printability. The build plan reports higher-incidence edges for files 14?16, 18 and 19.

The pressure sensor is a 5 V dry-air device; safe attenuation/protection for the Teensy 3.3 V ADC, startup/back-power handling and calibration remain unresolved. Headphone virtual ground is isolated. Optional shield storage is unused. The original firmware is neither compiled nor changed. There is no enclosure design in this Phase 1 viewer.

Attribution: upstream Circuit Sax / Whackalenso, preserved README and photographs. No explicit license grant for the original models/firmware was found. Resolve licensing before public redistribution; the submodule license is separate.
