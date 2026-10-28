# Company network revision

Use `partners-network.js`. It preserves the original network camera, six tile positions, rounded tile and hub solids, 700 ms discrete tweens, distance-based neighbor response, and resting-plane hit tests. The standalone artifact is `hairline-partners-network.html`.

The six source SVGs in `public/partners` wrap embedded PNG images. `trace-logos.py` extracts their alpha and source color regions into native SVG polygon paths. It crops Deloitte to its own wordmark, removing the unrelated Business Forum Group mark. It uses GeoComply's actual shield symbol to retain identity at small size. RBC, a16z, Tesla, and EA preserve their original shapes. `logo-paths.json` records source paths and pixel crops. No logo is guessed or represented with a substitute glyph.

The figure embeds all paths directly and needs no fetched image, image decoder, external font, or asset copy. Each logo uses the same projection `P()` as its tile top. The transform is recomputed only when its tile height changes.

Each company body has `data-company` and `data-active="true|false"`. The `.company-logo-outline` group and paths draw at rest with no fill, 0.65px monochrome strokes, and `vector-effect:non-scaling-stroke`. The `.company-logo-color` group and paths display only on the selected tile. Source colors are RBC #0059b3, #ffde00, white; GeoComply #0041ed; Deloitte dot #80c342; Tesla #e82127; EA #255af6. The source a16z and Deloitte wordmarks are white, so their neutral wordmark layer inherits `currentColor` for contrast on light or dark surfaces. This is a surface-aware neutral variant, not an independently verified new brand palette.

Do not force generic path fill or stroke declarations onto descendants carrying either company logo class. The source also sets the chosen tile border and its direct link to that company's brand stroke. All other tile logos stay monochrome.

All six company selections pass the local interaction fixture, including exactly one active tile, visible color group, repeated selection at the original rest point after lift, leave reset, and destroy cleanup. All six tiles remain inside the 400 x 320 frame at both intensity endpoints. `static-checks.json` records the values. `verify-static.mjs` runs the unchanged public kernel geometry, uses a DOM fixture, and rasterizes the resulting native SVG through Sharp. It does not claim a real browser input or browser rendering check.

`network-contact-sheet.png` shows rest and each company selected. `network-rest-110.png` is the 110px rest preview. Both were visually inspected. The full wordmarks are naturally limited at this size, while the Tesla, EA, GeoComply shield, and RBC shield retain their distinctive forms. Parent should complete actual application hover checks using the `data-rest-point` metadata.

The unmodified stock validator reports exactly one paint-rule failure because the user explicitly requested outlined logos and original-color hover, overriding the skill's fixed monochrome/no-logo rules. `validation.txt` preserves that result; no validation rule, kernel, or bench was changed. The automated tour remains RBC, GeoComply, Tesla, then leave. Its real browser playback has not been judged.
