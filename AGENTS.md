# AGENTS.md

This file defines the working rules for AI agents and contributors in this repository. It applies to the entire repository unless a more specific `AGENTS.md` exists in a subdirectory.

## Project Overview

Dynamics 365 Form Debugger is a dependency-free Chrome and Microsoft Edge extension for inspecting Dynamics 365 Customer Insights - Journeys forms and applying the `#d365mkt-nocache` cache-bypass hash.

The shipped extension lives in `Chrome-Edge/` and currently uses Manifest V3 with plain HTML, CSS, and JavaScript. There is no build step, package manager, automated test suite, or generated source. Keep the extension loadable as an unpacked extension directly from `Chrome-Edge/` unless a deliberate tooling migration is part of the task.

## Repository Map

- `Chrome-Edge/manifest.json`: Manifest V3 entry point, permissions, content-script registration, action, service worker, and icons.
- `Chrome-Edge/config.js`: shared constants exposed through the global `CONFIG` object.
- `Chrome-Edge/background.js`: service worker that watches Dynamics asset-tab URL changes and adds the no-cache hash.
- `Chrome-Edge/content-script.js`: page-side form detection, resource observation, mutation observation, and popup messaging.
- `Chrome-Edge/popup.html`: popup markup and styles.
- `Chrome-Edge/popup.js`: popup state, active-tab messaging, copy actions, and support links.
- `Chrome-Edge/icons/`: packaged extension artwork.
- `README.md`: user-facing installation, behavior, privacy, and release information.
- `docs/REPOSITORY_REVIEW.md`: current architecture review, known gaps, and development priorities.

## Current Runtime Flow

1. Chrome injects `config.js` and `content-script.js` into matching pages at `document_start`.
2. The content script checks `[data-form-id]` metadata separately from field controls, observes resource entries and nested form mutations, and responds to `GET_FORM_INFO`.
3. Opening the popup queries the active tab and sends `GET_FORM_INFO` to its content script.
4. The popup renders the detected form state and reports that cache bypass is active; it has no activation control or persisted activation state.
5. The background service worker listens to `chrome.tabs.onUpdated` and adds the no-cache hash to matching Dynamics asset URLs.

The extension is intentionally always active on supported Dynamics form URLs. Adding an activation or cache preference requires an explicit product decision, a storage migration plan, and updated permissions documentation.

## Documentation

When working with Chrome Extensions:

- Use Context7 for current Chrome Extension API documentation.
- Preferred library: /yosefhayim/chrome-extension-api-reference-mcp
- Assume Manifest V3 unless explicitly told otherwise.
- Prefer official Chrome Extension APIs over third-party wrappers.
- Check permissions, service workers, storage, messaging, and tabs APIs against Context7 documentation before implementing.

Record material API findings in the task summary or relevant project documentation. If Context7 is unavailable, say so before relying on another source; prefer official Chrome documentation as the fallback.

## Extension Standards

- Use Manifest V3.
- Use ES Modules where possible.
- Avoid unnecessary permissions.
- Prefer chrome.storage.local over localStorage.
- Include error handling for all Chrome API calls.

In addition:

- Keep `manifest.json` valid JSON; it cannot contain comments.
- Treat service workers as short-lived. Persist durable state in `chrome.storage.local`, register listeners at top level, and do not depend on in-memory state surviving suspension.
- Use Promise-based Chrome APIs where the verified API and minimum browser support permit. When callbacks are used, check `chrome.runtime.lastError` inside the callback.
- For message responses, define a named message type in `CONFIG.MESSAGE_TYPES`; validate message shape and handle missing receivers and malformed responses.
- Request the narrowest permissions and match patterns that satisfy a documented user flow. Explain any use of `<all_urls>`, `tabs`, scripting, network interception, or broadened host access.
- Do not add remote code, `eval`, dynamically constructed executable code, or inline executable scripts. Preserve Manifest V3 Content Security Policy compatibility.
- Keep privileged work in the service worker or extension pages. Keep content scripts limited to the page access needed for form inspection.
- Do not collect telemetry, browsing history, form values, credentials, or page content unless the product requirements and privacy documentation are explicitly updated first.
- Never log form field values, tokens, credentials, or full sensitive URLs. Debug logs should be purposeful and safe to leave in a release build.
- Do not add third-party runtime dependencies when a small official Web or Chrome API is sufficient.

## Source Conventions

- Use clear, small functions with one responsibility and early returns for error paths.
- Use `const` by default and `let` only for reassignment. Do not use `var`.
- Prefer strict equality, descriptive names, and immutable data where practical.
- Centralize shared selectors, storage keys, message types, URL patterns, defaults, timeouts, and user-facing state constants in `config.js` or its eventual module replacement.
- Do not introduce new magic message strings or storage-key strings in runtime files.
- Keep storage state names semantically precise. Cache bypass state and overall extension activation state must not be treated as interchangeable without an explicit product decision and migration plan.
- Keep DOM selectors aligned between `popup.html`, `popup.js`, and `CONFIG.ELEMENT_IDS`. Remove stale constants when removing features.
- Prefer CSS classes over repeated inline style mutation for UI states.
- Use accessible HTML: associated labels, keyboard-operable controls, visible focus states, and status text that does not rely on color alone.
- Preserve browser compatibility between current Chrome and Edge releases. Document any browser-specific path.
- Keep comments focused on why code exists or on non-obvious platform constraints; remove comments that describe deleted behavior.

## Permissions and Privacy Review

Any change to `permissions`, `optional_permissions`, `host_permissions`, `content_scripts.matches`, externally opened URLs, or collected/stored data requires all of the following:

1. Verify the API and permission requirement with Context7.
2. Document why the access is necessary and why a narrower scope is insufficient.
3. Test both allowed and disallowed pages.
4. Update the README privacy and permissions sections in the same change.
5. Recheck Chrome Web Store implications, especially broad host access and remote-code rules.

Do not claim that no data is stored when preferences are stored locally. Distinguish local preference storage from collection or transmission. Do not claim that there are no network interactions if a feature opens an external site; describe the behavior accurately.

## State and Messaging Rules

- The extension currently has no persisted runtime state and does not require the `storage` permission.
- Do not introduce persisted activation or cache state without an explicit product requirement and migration plan.
- Storage writes must handle failures and leave the UI consistent with the persisted state. If a write fails, revert optimistic UI state or show an error.
- Messages must use constants from `CONFIG.MESSAGE_TYPES` and return a documented response shape.
- Only return `true` from `chrome.runtime.onMessage` when a response will actually be sent asynchronously.
- Expect content scripts to be absent on restricted browser pages, before injection, or after an extension update. Treat a missing receiver separately from “no form detected” where the distinction affects the UI.
- Avoid reload or URL-update loops. Compare normalized current and target URLs before calling `chrome.tabs.update`.

## Form Detection Rules

- Treat `[data-form-id]` only as the Form ID signal; its absence must not prevent independent field detection.
- Field count means descendant `input`, `select`, and `textarea` controls, including hidden inputs and excluding submit/button/reset controls.
- Scope field detection to a Form ID container when present, otherwise to `form.marketingForm`; do not count unrelated controls across the whole page.
- Dynamics forms may be injected after `DOMContentLoaded`; detection and observation changes must cover late insertion without observing the entire document more broadly than needed.
- Test top-level Dynamics asset pages and forms embedded in third-party pages separately. A host page URL and an iframe/resource URL are different execution and permission contexts.
- Preserve page performance. Disconnect observers when no longer needed and avoid repeated full-document scans.

## Development Workflow

Before editing:

1. Read `README.md`, `Chrome-Edge/manifest.json`, and the runtime files involved in the change.
2. Read `docs/REPOSITORY_REVIEW.md` for known gaps and intentional constraints.
3. Check `git status` and preserve unrelated user changes.
4. Verify relevant Chrome APIs through Context7.

While editing:

- Keep the change scoped to the requested behavior.
- Update configuration, manifest declarations, runtime code, user-facing text, and docs together when they describe the same behavior.
- Do not add a build system, framework, TypeScript, formatter, or package manager solely for a small change. Propose tooling migrations separately and include their maintenance cost.
- If tooling is introduced, commit its lockfile. Do not ignore package-manager lockfiles.

Before finishing:

1. Parse `manifest.json` and syntax-check every changed JavaScript file.
2. Search for stale identifiers, storage keys, permissions, URLs, comments, and README claims affected by the change.
3. Load `Chrome-Edge/` as an unpacked extension in Chrome or Edge for behavior changes.
4. Inspect the service-worker console, popup console, and target-page console for errors.
5. Exercise the manual test matrix below and report exactly what was and was not tested.
6. Review the final diff for permission expansion, privacy impact, and unrelated changes.

## Manual Test Matrix

At minimum, test:

- A supported Dynamics asset URL with a detected form.
- A supported page before the form is inserted, followed by late form insertion.
- A normal website with no form.
- A Dynamics form embedded in a non-Dynamics host page, when that flow is in scope.
- Always-active cache bypass, including a URL that already has a hash or query string.
- Popup reopening after navigation and after a browser restart.
- Missing content-script receiver, such as a restricted browser page.
- Copy-to-clipboard success and failure.
- Feedback and support links.

For UI changes, check keyboard use, focus visibility, narrow popup layout, long form IDs, and status text in both color states.

## Release Hygiene

- Keep the manifest version and README version/changelog aligned.
- Use valid four-part-or-fewer Chrome extension versions and bump them only when preparing a release.
- Package only the files required by the extension. Do not commit `.crx`, `.pem`, `.xpi`, or release ZIP artifacts.
- Confirm all manifest-referenced files exist and all used icons are declared intentionally.
- Re-read the privacy and permission claims before store submission.
- Never commit secrets, signing keys, store credentials, or environment files.

## Shell Output

Pipe every non-interactive shell command through `distill` unless exact uncompressed output is required or `distill` would break an interactive/TUI workflow. Prompts to `distill` must state exactly what to return, including the required format. Wait for `distill` to finish before continuing.

Examples:

```sh
git diff 2>&1 | distill "What changed? Return only the files changed and a one-line summary for each file."
node --check Chrome-Edge/popup.js 2>&1 | distill "Did JavaScript syntax validation pass? Return only PASS or FAIL, followed by each syntax error if any."
```

## Change Boundaries

- Do not silently fix the known behavior gaps listed in `docs/REPOSITORY_REVIEW.md`; confirm intended product behavior when a choice affects users.
- Do not broaden permissions as a shortcut around a messaging, iframe, or injection design issue.
- Do not rewrite the extension into a framework or add a build pipeline without explicit approval.
- Do not modify generated release artifacts or store listings as a substitute for changing source.
- Preserve unrelated working-tree changes and never use destructive Git commands without explicit approval.
