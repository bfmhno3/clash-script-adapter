# Clash Script Adapter - System Context & Agent Rulebook

  ## Project Overview

  Clash Script Adapter is a modular JavaScript generator for Clash/Mihomo script adapters. It keeps the configuration logic in reusable modules, combines them through three presets, and builds minified runtime scripts with esbuild and Terser.

  The project targets Clash Verge Rev and Mihomo-compatible clients. Each preset selects a different feature set so the final output only includes the code needed for that scenario:

  - `lite`: small output for routers and low-resource devices.
  - `default`: balanced desktop configuration with common routing features.
  - `full`: complete configuration with TUN, extended regions, and full rules.

  ## Directory Structure

  ```
  clash-script-adapter/
  |-- src/
  |   |-- presets/          # Build entry points for lite, default, and full scripts
  |   |-- features/         # Compile-time feature flags used for dead code removal
  |   `-- modules/          # Shared config builders for DNS, rules, groups, platform, and network
  |-- test/                 # Node test suite organized by feature/module
  |-- dist/                 # Generated minified scripts
  |-- build.js              # esbuild bundle and Terser minification pipeline
  |-- package.json          # npm scripts and dependencies
  |-- mise.toml             # Toolchain task configuration
  `-- README.md             # Project documentation
  ```

  ## Runtime Environment & API Support

  The JavaScript runtime in Clash Verge Rev is `boa_engine`. The APIs supported by `boa_engine` are restricted to the following, excluding all network I/O and file I/O operations:

  | API Type                 | API Scope                                                    |
  | :----------------------- | :----------------------------------------------------------- |
  | Constants                | `Infinity`, `NaN`, `undefined`                               |
  | Core Functions & Objects | `Function`, `Object`, `Math`, `JSON`, `Array`, `Proxy`       |
  | Data Types & Arrays      | `ArrayBuffer`, `SharedArrayBuffer`, `BigInt`, `Boolean`, `Date`, `DataView`, `Map`, `TypedArray`, `Int8Array`, `Uint8Array`, `Uint8ClampedArray`, `Int16Array`, `Uint16Array`, `Int32Array`, `Uint32Array`, `BigInt64Array`, `BigUint64Array`, `Float32Array`, `Float64Array` |
  | Strings, Regex & Symbols | `String`, `RegExp`, `Symbol`                                 |
  | Error Objects            | `Error`, `RangeError`, `ReferenceError`, `TypeError`, `SyntaxError`, `EvalError`, `URIError`, `AggregateError` |
  | Reflection & Async       | `Reflect`, `Promise`                                         |
  | Encoding & Decoding      | `encodeURI`, `encodeURIComponent`, `decodeURI`, `decodeURIComponent` |
  | Weak References          | `WeakRef`, `WeakMap`, `WeakSet`                              |
  | Console Output           | `console`                                                    |

  ## Build and Test Commands

  - Only use `mise` to manage the Node.js runtime environment.
  - All dependencies MUST be managed and installed exclusively using `npm`.
  - Using `mise` to install or manage project dependencies is strictly prohibited.

  ### Toolchain and Runtime

  - `mise install`
  - `mise use node@lts`
  - `mise current`
  - `mise exec node@lts --command "node --version"`
  - `node --version`

  ### Development Pipeline

  - `npm install`
  - `npm ci`
  - `node build.js` (or `npm run build`)
  - `node --test test/*.test.mjs` (or `npm test`)
  - `npm run check`
  - `npm outdated`
  - `npm update`

  ## Code Style Guidelines

  - Strictly follow the Google JavaScript Style Guide.
  - Comments MUST use English exclusively.
  - Write highly descriptive, structured, and rich logs (relevant apis provided by `src/modules/logger.js`) to ensure traceability.

---

  ## Agent Behavior & Automation Rules

  ### Output Protocol

  - **Code First:** Return modifications, file creations, or script blocks first.
  - **Minimal Explanation:** Provide explanations after the code block only if the execution logic is non-obvious.
  - **No Prose:** Do not include conversational filler, greetings, or inline commentary.
  - **Comments:** Use code comments sparingly, only where logic is highly ambiguous. Do not generate docstrings or type annotations for unchanged/existing code.

  ### Runtime Constraints & Feature Flags

  - **Boa Engine Compliance:** Strictly avoid using any JavaScript features, global objects, or web/Node APIs (like `fs`, `path`, `fetch`) not explicitly listed in the API Support table.
  - **Feature Flag & Dead Code Integrity:** When updating modules in `src/modules/`, ensure that features can still be conditionally removed via compile-time flags in `src/features/`. Do not break tree-shaking for the `lite` preset.

  ### Review & Debugging Protocol

  - State the exact bug found during inspection.
  - Show the explicit fix immediately.
  - Stop. Do not offer broader architectural suggestions, alternatives, or compliments.
  - Never hypothesize or speculate about a bug without reading the relevant source files or logs first. If the cause is indeterminate, state it explicitly without guessing.

  ### Formatting Guardrails

  - Use plain hyphens and straight quotes (`'` or `"`) only.
  - Do not emit smart quotes, em dashes, or decorative Unicode shapes.

  ### Git Workflow Protocol

  - **Atomic Commits:** Commit early and often. Create a separate commit for each logical change or calculation step. Do not bundle multiple unrelated structural updates into a single monolithic commit.
  - **Conventional Commits:** Every commit message must strictly follow the Conventional Commits specification (e.g., `feat(modules): add custom dns rules`, `fix(presets): fix build failure in lite preset`).
  - **Summarization:** The commit message summary line must be highly descriptive and precise, capturing the exact engineering change made.

  ### Search & Analysis Infrastructure

  - **Efficient Tooling:** Utilize high-performance search utilities such as `ripgrep` (`rg`) and `ast-grep` for scanning codebase patterns when gathering context.
  - **Dependency Missing Protocol:** If these external search utilities are missing from the system path, immediately pause execution and explicitly prompt the user to install them before attempting any file modifications.

  ### Content Preservation & Safety

  - **Additive Bias:** Prioritize adding new content, configurations, and scripts. Avoid deleting or overriding existing functional code or prose unless strictly necessary.
  - **Destructive Change Safeguard:** Never silently delete or heavily modify pre-existing logic or text. If code or content appears incorrect, pause and prompt the user for confirmation.
  - **Post-Modification Accountability:** After executing any user-approved deletion or modification, explicitly summarize exactly what was changed or removed and state the outcome.

  ### Testing & Verification Protocol

  - **Pre-flight Validation:** After making any structural or logical code changes, validate them by running the native test suite: `npm test` (or `node --test test/*.test.mjs`).
  - **Build Verification:** Ensure the bundling pipeline is functional by triggering `npm run build` to confirm that esbuild and Terser compile the presets without syntax errors or minification breaks.