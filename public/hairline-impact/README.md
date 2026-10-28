# BluePrint impact figures

Open `index.html` in a browser to compare the figures, or use `/hairline-impact/` while the BluePrint development server is running. Each preview is a standalone HTML file with the original Hairline engine and bench embedded. The website now mounts the figures as small inline SVG illustrations without any preview captions, controls, or borders.

`prompts.md` records the figure concepts. The 2025 and 2026 cards share one trophy. The NFC figure replaces the coffee illustration in the first partner benefit card.

| Card | Generated page |
| --- | --- |
| Attendee registrations | `badges-score/hairline-attendee-badges.html` |
| Partners | `partners-faculty/hairline-partners-network.html` |
| Net promoter score | `badges-score/hairline-feedback-token.html` |
| Faculty representation | `partners-faculty/hairline-faculty-pie.html` |
| 2025 and 2026 awards | `awards-media/hairline-conference-trophy.html` |
| Social media impressions | `awards-media/hairline-social-megaphone.html` |
| News illustration, optional alternative to photo | `awards-media/hairline-news-television.html` |

The company network uses six companies from `components/impact-section-v2.tsx`. It connects them to a central hub and does not claim those companies partnered with one another. The tiles now contain thin vector outlines of the supplied company logos. Their source colors appear on the selected tile, following the explicit user override to the generic Hairline monochrome rules. No read-out is visible in the application.

The faculty chart uses the current source percentages exactly. Science is 36.3%, Commerce 36.1%, Engineering 11.3%, Arts 10.9%, and Other 5.4%. Their angular proportions stay fixed while slices lift.

Each figure's JavaScript source sits beside its HTML page. Rebuild and check it with the official `skills/hairline-create/build.mjs`, `validate.mjs`, and `look.mjs` tools from https://github.com/lucasmarkes/hairline. The original engine and bench are embedded without modification. Hairline's MIT license is included in `HAIRLINE-LICENSE`.

The previews include theme, intensity, and play controls. Default motion responds to the pointer. The play button runs a guided tour and can be stopped. Append `?play=1` to a preview URL to start its tour automatically.

## Application runtime

Edit a figure source, then run `node scripts/build-hairline-runtime.mjs` from the repository root. The generator creates the shared application runtime and rejects changes to the original kernel. `components/hairline-figure.tsx` mounts only the SVG and disposes the figure on unmount.

The application uses 0.65px strokes. Impact figures use 72 to 110px host widths; the NFC partner figure is 170px. The existing card numbers and copy are preserved.
