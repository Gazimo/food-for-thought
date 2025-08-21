// cursor.config.js (TypeScript is fine here; Cursor will transpile)
// Focus: rendering performance, React correctness, DX, and a11y.

import fs from "fs";
import path from "path";

const has = (p: string) => fs.existsSync(path.resolve(process.cwd(), p));

const isTailwindRepo = has("tailwind.config.js");
const hasShadcn = has("src/components/ui") || has("components/ui");
const hasZustand = has("package.json") && /zustand/.test(fs.readFileSync("package.json", "utf8"));
const hasRQ = has("package.json") && /@tanstack\/react-query/.test(fs.readFileSync("package.json", "utf8"));

export default {
  // Files/folders Cursor should ignore entirely (generated, vendor, etc.)
  ignores: [
    "node_modules/**",
    ".next/**",
    "dist/**",
    "build/**",
    "coverage/**",
    "**/*.d.ts",
    "**/*.map",
    "**/__mocks__/**",
  ],

  // Optional: lightweight “presets” you can call from Cmd+K
  // e.g. “Run: repo-audit” or “Run: perf-scan”
  presets: {
    "repo-audit": "Scan for rendering issues, bad practices, and a11y problems across src/**.tsx. Summarize top risks and give file-specific diffs.",
    "perf-scan": "For highlighted files, find unnecessary re-renders, unstable props, missing memo/callbacks, and costly operations in render. Propose minimal fixes first.",
  },

  rules: [
    // ─────────────────────────────────────────────────────────────────────────────
    // 1) Styling & UI components
    // ─────────────────────────────────────────────────────────────────────────────
    {
      match: "*.tsx",
      rules: [
        "no-inline-styles",
        ...(isTailwindRepo
          ? ["prefer-tailwind-over-styled-components"]
          : ["no-styled-components-overuse"]),
        ...(hasShadcn ? ["prefer-shadcn-over-raw-html"] : []),
        "no-css-module-bloat", // Suggest extracting shared utilities/tokens if > N classes repeat
      ],
      options: {
        "no-css-module-bloat": { repeatThreshold: 3 },
      },
    },

    // ─────────────────────────────────────────────────────────────────────────────
    // 2) Rendering performance & React correctness
    // ─────────────────────────────────────────────────────────────────────────────
    {
      match: "*.tsx",
      rules: [
        "no-anonymous-default-export",
        "split-hooks-from-render",
        "avoid-logic-in-JSX",
        "no-new-object-or-array-in-props",
        "no-inline-arrow-handlers-in-big-lists",
        "prefer-useMemo-for-expensive-calcs",
        "prefer-useCallback-for-stable-handlers",
        "no-effect-without-deps",
        "no-setState-in-render-paths",
        "prefer-memo-for-heavy-components",
        "limit-prop-drilling-depth",
        "no-context-provider-bloat",
      ],
      options: {
        "no-new-object-or-array-in-props": { maxProps: 0 }, // always discourage
        "no-inline-arrow-handlers-in-big-lists": { listSizeThreshold: 8 },
        "prefer-useMemo-for-expensive-calcs": { msCostThreshold: 2 },
        "prefer-memo-for-heavy-components": { locThreshold: 120, jsxThreshold: 30 },
        "limit-prop-drilling-depth": { depth: 3, suggestContextOrHooks: true },
        "no-context-provider-bloat": { maxValues: 6, suggestSliceContext: true },
      },
    },

    // ─────────────────────────────────────────────────────────────────────────────
    // 3) Code clarity & maintainability
    // ─────────────────────────────────────────────────────────────────────────────
    {
      match: "*.tsx",
      rules: [
        "prefer-readable-names",
        "no-abbreviations",
        "no-complex-nesting",
        { rule: "function-size-limit", maxLines: 50 },
        { rule: "file-size-limit", maxLines: 400 },
        { rule: "cyclomatic-complexity-limit", max: 10 },
        "cohesive-component-responsibility",
        "prefer-module-boundaries",
        "no-todo-leftovers",
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────────
    // 4) State management patterns (Zustand)
    // ─────────────────────────────────────────────────────────────────────────────
    ...(hasZustand
      ? [
        {
          match: "src/**/**.ts?(x)",
          rules: [
            "avoid-unnamed-zustand-slices",
            "split-ui-state-from-domain-state",
            "prefer-zustand-selectors",
            "use-shallow-for-zustand-selectors",
            "no-store-getState-in-render",
          ],
        },
      ]
      : []),

    // ─────────────────────────────────────────────────────────────────────────────
    // 5) Data fetching patterns (React Query)
    // ─────────────────────────────────────────────────────────────────────────────
    ...(hasRQ
      ? [
        {
          match: "src/**/**.ts?(x)",
          rules: [
            "prefer-react-query-for-async-state",
            "require-stable-query-keys",
            "no-inline-query-fn-in-render",
            "prefer-retry-and-staleTime",
            "use-cancelation-or-abort-signal",
          ],
          options: {
            "prefer-retry-and-staleTime": { minStaleTimeMs: 30000, defaultRetry: 2 },
          },
        },
      ]
      : []),

    // ─────────────────────────────────────────────────────────────────────────────
    // 6) Accessibility (a11y)
    // ─────────────────────────────────────────────────────────────────────────────
    {
      match: "*.tsx",
      rules: [
        "alt-text-required",
        "interactive-has-accessible-name",
        "label-input-association",
        "no-div-onclick-without-role",
        "focus-visible-required-for-key-interactive",
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────────
    // 7) Testing
    // ─────────────────────────────────────────────────────────────────────────────
    {
      match: "*.{test.ts,test.tsx}",
      rules: [
        "test-name-must-be-descriptive",
        "no-hardcoded-wait",
        "prefer-user-event-over-fireEvent",
        "no-snapshot-only-tests",
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────────
    // 8) Safety & security footguns
    // ─────────────────────────────────────────────────────────────────────────────
    {
      match: "*.tsx",
      rules: [
        "no-dangerously-set-innerHTML",
        "sanitize-external-html",
        "no-unescaped-user-content",
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────────
    // 9) File & naming hygiene
    // ─────────────────────────────────────────────────────────────────────────────
    {
      match: "*",
      rules: [
        "file-name-must-match-component",
        "use-kebab-case-for-folders",
        { rule: "max-folder-depth", maxDepth: 3 },
        "index-files-should-be-simple-reexports",
      ],
    },
  ],
};
