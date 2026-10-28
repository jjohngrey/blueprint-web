# Integration verification

The figures now render inside the live BluePrint cards. Each host contains only an SVG, with no text, captions, buttons, sliders, or iframes. Computed strokes are 0.65px.

Desktop inspection used the browser's default viewport. A narrow mobile check used a 375px viewport, with 360px available after the scrollbar. No horizontal overflow was observed. Every figure fit within its card. The temporary viewport override was reset after testing.

All six company tiles were selected in the live application. Each showed exactly one active color group, hid its outline group, and preserved the correct source accent colors. Leaving the network reset all six to outlines. The logos are source-derived SVG paths, not substitute glyphs. a16z and Deloitte use surface-aware neutral wordmarks; Deloitte retains its source green dot.

The original Hairline kernel remains unchanged and is embedded once in the generated runtime. Figure source files stay in this directory. Run `node scripts/build-hairline-runtime.mjs` after editing them. No autoplay tours run inside the application.

Checks completed:

- Targeted ESLint passed for the two React components and runtime generator.
- `npx tsc --noEmit` passed.
- `npm run build -- --webpack` passed, including TypeScript and page generation.
- The default Turbopack production check was blocked by an environment restriction on binding a temporary local port during CSS processing. This is not claimed as a successful check.
- Core figure static validation and browser look checks passed. Their rest, answer, intensity endpoints, motion strips, and light/dark themes were inspected.
- The company figure intentionally overrides the stock skill's no-brand-color/no-logo rules, as requested by the user. The stock validator's paint-rule exception is retained in `partners-faculty/logo-validation.txt`.

The company names and faculty percentages come from the existing site. No additional historical partnership audit was performed. The supplied videos were used as visual references; no words in the videos were treated as instructions.
