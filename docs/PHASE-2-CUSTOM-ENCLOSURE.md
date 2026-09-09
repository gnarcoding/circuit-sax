# Circuit Sax — Phase 2: Custom Enclosure

**Recorded:** September 8, 2026  
**Status:** Planned enhancement; detailed design has not started.  
**Priority:** After the original instrument works and its fit has been checked.

## The idea

Give our Circuit Sax a custom, finished appearance with a lightweight, removable shell around the existing build. The goal is a cool-looking digital practice sax for my kid—not a giant plastic saxophone body.

Start with a **removable back cover and side guards**, leaving the keys and playing surfaces accessible. Treat the shell as an addition around the original structure, not a replacement for it.

This is a custom-design idea. We have not identified or approved an existing enclosure STL, and there is no print-ready enclosure file yet.

## When to start

**Phase 1 comes first:** build and test the original Circuit Sax, confirm its keys and breath control work, and let him try it in playing position.

Begin enclosure design only after we can check the actual assembled instrument. Do not delay the initial build to design the shell, and do not change the original key geometry just to make an early shell concept fit.

## Visual direction — ideas, not final selections

- Slim, matte-black shell with contrasting or gold-colored printed keys.
- Rounded edges and a comfortable, finished feel.
- Optional embossed name or a small custom badge.

Choose the final colors and personalization with him. Decorative changes should not change the key surfaces, travel, or spacing needed for playing.

## Initial scope

Design a removable back cover and narrow side protection around the assembled hardware. Keep the key area open and preserve comfortable access to the thumb controls and rests.

The design should allow inspection, repairs, and removal without damaging the boards or wiring. Prefer a simple, serviceable attachment method once suitable mounting locations have been verified.

**Out of scope for the first enclosure version:** a full sax-shaped body, redesigned keys or electronics, permanent encapsulation, and waterproofing claims.

## Fit and access requirements

Check these against the actual build before finalizing any model:

- **Playing clearance:** No contact with keys, switches, or moving parts throughout their full travel. Leave room for fingers, palms, and both thumbs in normal playing positions.
- **Connections and service:** Keep the fitted USB/audio connections, controls, battery access, and other service points usable. Allow space for the actual cable plugs, not just the sockets.
- **Breath and moisture:** Preserve the existing airflow and drainage arrangement. Do not create a cavity that collects moisture around electronics or obstructs cleaning and inspection.
- **Mechanical fit:** Avoid pressure on components, solder joints, wires, and the battery. Use verified mounting locations; do not assume a board can be drilled or that a component can support the shell.
- **Comfort:** Avoid sharp edges and excessive bulk or weight. Check the instrument with him holding and playing it, not only on a workbench.

These are design requirements, not a claim that the enclosure will be waterproof, drop-proof, or suitable for unattended charging.

## Design and prototype sequence

1. **Document the working build.** Photograph the front, back, sides, and playing grip. Measure the assembled hardware, component heights, mounting features, port positions, and moving-key clearances.
2. **Create a basic CAD envelope.** Model the space occupied by the hardware and the space that must remain empty for movement, cables, hands, and maintenance. Do not derive final dimensions from photos alone.
3. **Print a small fit sample.** Test an attachment point or short shell section before printing a complete cover. Check tolerances on the printer and material we will actually use.
4. **Print a plain first shell.** Prioritize fit and removability before adding names, badges, textures, or decorative features.
5. **Test while playing.** Check every key, thumb access, grip, balance, cables, airflow/drainage access, and removal. Revise anything that interferes with the original instrument.
6. **Finish the design.** Add the selected appearance and personalization only after the functional fit passes.

## Budget and printing

Use an available school or friend's printer. **Do not include purchasing a printer in this phase's budget.**

There is no confirmed enclosure printing cost yet. Calculate material use from the finished model in the intended slicer, including supports and waste. Track any setup/printing fee, mounting hardware, and prototype reprints separately.

The earlier conversation about approximately $2 of plastic concerned the small keycaps. It is **not** an enclosure quote or a verified total for this phase.

## Definition of done

- [ ] Every key operates freely through its full travel with the shell installed.
- [ ] He can reach all keys and thumb controls comfortably while playing.
- [ ] Required ports, controls, battery access, and maintenance points remain usable.
- [ ] The original airflow/drainage arrangement is unobstructed and inspectable.
- [ ] The shell does not squeeze wiring, the battery, or board components.
- [ ] The enclosure can be removed and reinstalled without damage.
- [ ] The editable CAD source, print files, hardware list, and tested print settings are saved together.

## Files to produce later

Keep this note with the project documentation, for example under `docs/phase-2-custom-enclosure.md`.

When design begins, save the editable CAD source alongside a STEP export where supported, STL or 3MF print files, a short mounting-hardware list, assembly notes, and photos of the tested fit. Record the instrument revision and print settings used so future changes can be checked against the same baseline.

## Reference and open decisions

Upstream project reference: https://github.com/Whackalenso/CircuitSax

This note records our concept; it is not a fresh audit of upstream hardware or model files. Confirm the actual revision and assembled layout before designing.

Still to decide: final coverage, mounting method, material, wall thickness, clearances, colors, personalization, and print cost.

**Resume here:** Once the original sax is working, measure the assembled instrument and design a small removable back-cover/side-guard fit prototype.
