// cursor.config.js — Claude-ified upgrade
// Focus: rendering perf, React correctness, DX, a11y — with Claude Code-style steerability
// Philosophy: one loop, strong rules, examples, and agent-managed TODOs.

import fs from "fs";
import path from "path";

const has = (p) => fs.existsSync(path.resolve(process.cwd(), p));
const read = (p) => (has(p) ? fs.readFileSync(p, "utf8") : "");

// Repo feature flags
const hasTailwind = has("tailwind.config.js");
const hasShadcn = has("src/components/ui") || has("components/ui");
const pkg = read("package.json");
const hasZustand = /"zustand"\s*:|\bzustand\b/.test(pkg);
const hasRQ = /@tanstack\/react-query/.test(pkg);
const hasNext = /"next"\s*:|\bnext\b/.test(pkg) || has("next.config.js");
const hasVitest = /\bvitest\b/.test(pkg);
const hasJest = /\bjest\b/.test(pkg);
const hasStorybook = has(".storybook") || /\b@storybook\//.test(pkg);

export default {
  // ────────────────────────────────────────────────────────────────────────────
  // GLOBAL GUARDRAILS (Tone & Style)
  // These are injected contextually by Cursor. Keep them crisp and enforceable.
  // IMPORTANT: Avoid pre/postambles. Prefer minimal diffs and inline rationale only on request.
  // IMPORTANT: Do not use emojis unless explicitly asked. Keep messages concise.
  // IMPORTANT: When editing code, return a unified diff or a patch block when possible.
  // IMPORTANT: Prefer small, verifiable steps. If a plan is needed, first write TODOs, then execute.
  // IMPORTANT: Use codebase search before guessing. Cite file paths in responses.
  // IMPORTANT: If uncertain, propose a small spike behind a flag or separate commit.
  // ────────────────────────────────────────────────────────────────────────────

  ignores: [
    "node_modules/**",
    ".next/**",
    "dist/**",
    "build/**",
    "coverage/**",
    "**/*.d.ts",
    "**/*.map",
    "**/__mocks__/**",
    "**/.cache/**",
    "**/.turbo/**",
    "**/.swc/**",
    "**/*.snap",
    hasStorybook ? "storybook-static/**" : null,
    "public/**/*.png",
    "public/**/*.jpg",
    "public/**/*.jpeg",
    "public/**/*.gif",
    "public/**/*.webp",
  ].filter(Boolean),

  // ────────────────────────────────────────────────────────────────────────────
  // PRESETS — Fast, opinionated commands you can run from Cmd+K
  // ────────────────────────────────────────────────────────────────────────────
  presets: {
    // Search-first workflow, like CC's LLM search (not RAG)
    "code-search": `Search the repo like a developer would. Use ripgrep-style terms. 
Show me a short table (path:line:preview) for candidates, then propose next reads.
Examples:\n<good-example>\n- Find reducers handling \"CART_ADD\" under src/**.\n- Search for \"useAuth\(\)\" defs and call sites.\n</good-example>\n<bad-example>\n- Vague semantic search without concrete patterns.\n</bad-example>`,

    // Minimal-diff refactor with explicit constraints
    "refactor-minimal": `IMPORTANT: Make the smallest safe change.
Return a unified diff. No extra commentary.
Honor repo style (Tailwind? ${hasTailwind}, shadcn? ${hasShadcn}).
If a migration is risky, add a TODO item instead of speculative changes.`,

    // Repo audit à la CC
    "repo-audit": `Scan src/**/*.tsx for rendering perf issues, a11y gaps, and correctness smells.
Report per-file findings with path+line anchors, then propose a minimal-diff fix list.
Group fixes by impact: high (perf correctness), medium (a11y), low (DX).
Return a TODO checklist in .ai/todo.md.`,

    // Perf scan for selected files
    "perf-scan": `For the selected files, list causes of re-renders: unstable props, inline handlers in lists, expensive calculations in render.
Suggest useCallback/useMemo or memo, with measured thresholds. Return unified diffs only.`,

    // Agent-managed TODOs (Claude-style)
    "todo-bootstrap": `Create or update .ai/todo.md with a crisp checklist for the current task.
Each item: [ ] short verb phrase, file path if known. Keep it under 10 items.
After creation, confirm the list and ask to execute top item.`,

    "todo-execute": `Open .ai/todo.md. Execute the top unchecked item only.
Return a unified diff for that item. Then mark it checked and stop.`,

    // A11y quick pass
    "a11y-pass": `Run an accessibility pass on src/**/*.tsx.
Flag missing alt text, aria-labels, improper roles, focus-visible, label/input association.
Propose minimal diffs with concrete code.`,

    // Test hardening
    "test-harden": `Identify fragile tests (sleep-based waits, snapshots-only, implicit timing).
Refactor to use user-event and queries-by-role/name. Provide unified diffs.`,
  },

  // ────────────────────────────────────────────────────────────────────────────
  // RULES — Heuristics that steer the agent with examples and thresholds
  // ────────────────────────────────────────────────────────────────────────────
  rules: [
    // 1) Styling & UI components
    {
      match: "*.tsx",
      rules: [
        "no-inline-styles",
        ...(hasTailwind ? ["prefer-tailwind-over-styled-components"] : ["no-styled-components-overuse"]),
        ...(hasShadcn ? ["prefer-shadcn-over-raw-html"] : []),
        "no-css-module-bloat",
      ],
      options: {
        "no-css-module-bloat": { repeatThreshold: 3 },
      },
      examples: `
<good-example>
<div className=\"p-2 md:p-4\">…</div>
</good-example>
<bad-example>
<div style={{ padding: 8 }}>…</div>
</bad-example>
      `,
    },

    // 2) Rendering performance & React correctness
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
        "no-new-object-or-array-in-props": { maxProps: 0 },
        "no-inline-arrow-handlers-in-big-lists": { listSizeThreshold: 8 },
        "prefer-useMemo-for-expensive-calcs": { msCostThreshold: 2 },
        "prefer-memo-for-heavy-components": { locThreshold: 120, jsxThreshold: 30 },
        "limit-prop-drilling-depth": { depth: 3, suggestContextOrHooks: true },
        "no-context-provider-bloat": { maxValues: 6, suggestSliceContext: true },
      },
      examples: `
<good-example>
const handler = useCallback(() => onSelect(id), [onSelect, id]);
return <Item onSelect={handler} />;
</good-example>
<bad-example>
return <Item onSelect={() => onSelect(id)} />;
</bad-example>
      `,
    },

    // 3) Code clarity & maintainability
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
      examples: `
<good-example>
function getEligibleOrders(orders) { /* … */ }
</good-example>
<bad-example>
function proc(ary) { /* … */ }
</bad-example>
      `,
    },

    // 4) State management patterns (Zustand)
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
          examples: `
<good-example>
const price = useStore(s => s.price, shallow);
</good-example>
<bad-example>
const { price } = useStore();
</bad-example>
            `,
        },
      ]
      : []),

    // 5) Data fetching patterns (React Query)
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
          examples: `
<good-example>
useQuery({ queryKey: ['orders', userId], queryFn: fetchOrders, staleTime: 60_000 });
</good-example>
<bad-example>
useQuery({ queryKey: ['orders'], queryFn: () => fetch('/api/orders?u=' + userId) });
</bad-example>
            `,
        },
      ]
      : []),

    // 6) Accessibility (a11y)
    {
      match: "*.tsx",
      rules: [
        "alt-text-required",
        "interactive-has-accessible-name",
        "label-input-association",
        "no-div-onclick-without-role",
        "focus-visible-required-for-key-interactive",
      ],
      examples: `
<good-example>
<button aria-label="Close dialog">×</button>
</good-example>
<bad-example>
<div onClick={close}>×</div>
</bad-example>
      `,
    },

    // 7) Testing
    {
      match: "*.{test.ts,test.tsx}",
      rules: [
        "test-name-must-be-descriptive",
        "no-hardcoded-wait",
        "prefer-user-event-over-fireEvent",
        "no-snapshot-only-tests",
      ],
    },

    // 8) Safety & security footguns
    {
      match: "*.tsx",
      rules: [
        "no-dangerously-set-innerHTML",
        "sanitize-external-html",
        "no-unescaped-user-content",
      ],
    },

    // 9) File & naming hygiene
    {
      match: "*",
      rules: [
        "file-name-must-match-component",
        "use-kebab-case-for-folders",
        { rule: "max-folder-depth", maxDepth: 3 },
        "index-files-should-be-simple-reexports",
      ],
    },
  ]
};
