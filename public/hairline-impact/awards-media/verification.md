# Awards and media figures

All three standalone HTML pages were built with the supplied, unchanged Hairline kernel and bench. Each figure is under 200 lines. Static validation and the eight-shot browser look pass for every page. All stays inside the frame, readouts are correct, the page consoles are clean, and springs settle without flicker. The final look sheets and motion strips were visually inspected.

| Figure | Object and pointer answer | Rules | Tour stops in viewBox coordinates |
| --- | --- | --- | --- |
| Conference trophy | Two curved handles, a cup, a narrow stem, and a rounded square plinth turn gently as one coherent object. | 1, 3, 4, 6, 8, 9, 10 | 119,136; 281,136; 217,93; leave |
| Social megaphone | A tapered body, open elliptical mouth, and compact handle swivel toward the pointer. | 1, 3, 4, 6, 8, 9, 10 | 285,131; 139,153; 258,192; leave |
| Optional news television | A rounded cabinet, inset glass, short feet, and two rods. The nearer antenna leans more through a fixed distance falloff. | 1, 3, 4, 6, 8, 9, 10 | 137,91; 252,91; 203,57; leave |

The trophy source is shared identically for the 2025 and 2026 Conference of the Year cards. Separate saved creation prompts name each year, while the SVG contains neither year nor words. The television is an optional preview; these files do not change the live photograph.

The actual 80px stage captures in `figures-80px.png` were visually inspected. All three silhouettes remain recognizable. Every rest and answering state has exactly one highlight. Computed colors after settling match the fixed kernel palette: light highlight rgb(35,35,39), dark highlight rgb(208,214,224), dark silhouette rgb(91,93,100). Full measurements are in `80px-checks.json`.

Visual checks: the silhouettes read at both 240px and 80px; rest is composed; hit areas use fixed rest geometry; motion is clamped; curves and corners are rounded; opaque front surfaces hide the parts behind them; highlights remain singular; both themes render; no SVG text or logos appear. The empty-state and source-drawing checks do not apply.

The trophy and megaphone move as coherent objects, as requested. The television intentionally keeps its cabinet still and moves only the antennas. The look tool reports 26% changed thumbnail ink for its answer, below its 37% general motion suggestion. That smaller motion fits the requested slight lean. The rods visibly change angle in the motion strip, with the closer rod moving more. The tool exits successfully.

The look runner emitted a Node TimeoutNegativeWarning from its own wait calculation on some runs. The generated pages have no console errors or warnings. One permission review timed out and the permitted retry succeeded. No verification remains blocked. The tours were provided and their response poses were inspected; the full unattended laps were not separately judged by a person.

Reproduce the look from this directory:

```
HAIRLINE_LOOK_CACHE=/Users/johngrey/.cache/codex-runtimes/codex-primary-runtime/dependencies/node node /private/tmp/hairline-skill/look.mjs conference-trophy.js --answer 280,130 --edge 310,130
HAIRLINE_LOOK_CACHE=/Users/johngrey/.cache/codex-runtimes/codex-primary-runtime/dependencies/node node /private/tmp/hairline-skill/look.mjs social-megaphone.js --answer 285,135 --edge 310,150
HAIRLINE_LOOK_CACHE=/Users/johngrey/.cache/codex-runtimes/codex-primary-runtime/dependencies/node node /private/tmp/hairline-skill/look.mjs news-television.js --answer 142,84 --edge 276,85
node capture-80px.mjs
```
