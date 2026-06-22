# Repository Review

Reviewed on 22 June 2026. This document describes the repository as found; it is not a promise that every current behavior is intentional.

## Executive Summary

The repository contains a small, readable, dependency-free Manifest V3 extension for Chrome and Edge. Its source is directly loadable from `Chrome-Edge/`; there is no compilation or packaging step. The implementation is split sensibly between a service worker, a content script, a popup, and shared constants.

The extension keeps cache bypass active and automatically renders editable hidden-field copies. Form detection and permissions still need deliberate review because the extension supports forms embedded on arbitrary sites while its background URL handling is limited to Dynamics asset pages.

## Current Structure

```text
.
├── AGENTS.md
├── Chrome-Edge/
│   ├── background.js
│   ├── config.js
│   ├── content-script.js
│   ├── _locales/
│   ├── icons/
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   ├── icon128.png
│   │   └── icon300.png
│   ├── manifest.json
│   ├── popup.html
│   └── popup.js
├── docs/
│   └── REPOSITORY_REVIEW.md
├── LICENSE
└── README.md
```

The manifest and README use version `1.2.1`. The declared action icons are 16, 48, and 128 pixels. The popup also uses the packaged 300-pixel icon for its centered brand mark.

## Architecture

### Manifest

`Chrome-Edge/manifest.json` declares:

- Manifest V3.
- The `activeTab` permission.
- English as the default locale, with ten supported languages across eleven packaged locale catalogs under `_locales/`.
- `*://*.dynamics.com/*` host permission.
- A classic background service worker at `background.js`.
- A popup action at `popup.html`.
- `config.js` and `content-script.js` as content scripts on `<all_urls>` at `document_start`.

Although `host_permissions` is limited to Dynamics domains, the `<all_urls>` content-script match is broad site access and should be treated as such during permission and store review.

### Shared Configuration

`config.js` defines the global `CONFIG` object. It contains DOM IDs, timeouts, logging styles, support URLs, the Dynamics asset URL pattern, the no-cache hash, selectors, and message types.

Several values are remnants of a removed in-page overlay (`STYLE`, `OVERLAY`, `OVERLAY_Z_INDEX`, and related IDs). The CommonJS export branch is not used by the extension. Runtime message types are shared through `CONFIG.MESSAGE_TYPES`.

### Background Service Worker

`background.js` imports `config.js` with `importScripts`, listens to `chrome.tabs.onUpdated`, and filters changed tab URLs using:

```text
^https://assets-[a-z]{3}.mkt.dynamics.com/
```

For a matching URL, it appends `#d365mkt-nocache` when the hash is not already present. There is no activation preference or storage read.

Tab-update callback errors are handled.

### Content Script

`content-script.js` starts at `document_start` and:

- Observes resource performance entries containing `landingpageforms` and logs them.
- Checks the first element matching `[data-form-id]` for Form ID metadata independently of field detection.
- Reads `data-form-id`, `data-form-api-url`, and `data-cached-form-url` when present.
- Counts descendant `input`, `select`, and `textarea` controls inside the Form ID container or a standalone `form.marketingForm`.
- Attaches a `MutationObserver` to the field container after DOM readiness and observes nested control changes.
- Responds to `GET_FORM_INFO` with the detected Form ID state.
- Automatically renders editable, non-submitting visual copies of native hidden inputs and Dynamics form-designer hidden field blocks.
- Synchronizes edits from those visual copies to source controls for the current page session.

It does not transmit detected data. Detection can succeed when the popup asks later, but mutation monitoring is not attached if the form container is inserted after the one initialization attempt.

### Popup

`popup.html` contains all popup markup and CSS. `popup.js`:

- Queries the active tab and requests form information from its content script.
- Shows the Form ID, always-active cache-bypass status, and installed version in a compact branded panel.
- Copies the Form ID to the clipboard.
- Opens the support page from the popup information button.
- Localizes visible popup text with `chrome.i18n.getMessage()` and displays the closest supported browser UI language.

The information button opens the centralized `CONFIG.URLS.SUPPORT` destination at `mylokaye.info`.

## State Model Found

The extension has no persisted state. The background worker always applies cache bypass to supported Dynamics asset URLs. Form names and values are not stored or transmitted by the extension. Editing a shown field updates its source control, which the host page may transmit through its normal form submission.

## Findings and Risks

### Medium priority

1. **No-form and unavailable-content-script states are conflated.** A restricted URL, injection failure, or extension-update mismatch is displayed as though a normal page had no form.
2. **Broad page access needs confirmation.** `<all_urls>` supports embedded forms on arbitrary sites, but it is a substantial permission surface. Confirm whether optional host access, user-triggered injection, or narrower matching can preserve the intended flow.
3. **Hash handling is string-based.** Appending the bypass hash to a URL that already has another fragment creates a concatenated fragment. Removing the substring can also leave an unintended fragment. Use the `URL` API once desired behavior for existing hashes is specified.
4. **The URL pattern is narrow.** It permits exactly three letters after `assets-`. Confirm all current Dynamics regional asset host formats before relying on it.

### Maintenance and documentation

1. Overlay-era constants and comments remain after overlay removal.
2. The field-count observer attaches only when a form container exists at its DOM-ready initialization; hidden-field rendering has its own document-level observer and does handle late insertion.
3. There is no automated validation, test suite, linting, or release packaging script.
4. `.gitignore` ignores common package-manager lockfiles. If Node tooling is introduced, its chosen lockfile should be committed for reproducibility.

## What Is Already Good

- The codebase is small and approachable.
- Manifest V3 is already in use.
- Shared constants reduce duplicated selectors, message types, URLs, logging styles, and URL patterns.
- The service worker registers its listener at top level and does not depend on durable in-memory state.
- The always-active design requires no persisted preference or storage permission.
- The background worker avoids a tab update when the URL does not change.
- The extension has no third-party runtime dependencies, remote code, analytics, or telemetry.
- Popup scripts are external files, consistent with extension CSP requirements.
- Tab query, messaging, tab creation, clipboard, and tab-update failure paths are handled.
- The content script uses `PerformanceObserver` rather than monkey-patching page network APIs.

## Recommended Development Order

1. **Define detection semantics.** Specify supported embed patterns and an exact definition of a detected field.
2. **Add minimal automated checks.** Start with manifest parsing, JavaScript syntax checks, URL/hash unit tests, and pure form-state helpers. Introduce tooling only after choosing it deliberately.
3. **Harden dynamic detection.** Handle late iframe/container insertion and observer cleanup without continuous broad DOM scans.
4. **Review permissions.** Verify current APIs and the narrowest workable access model against current Chrome documentation.
5. **Refine unavailable states.** Separate restricted-page, missing-receiver, and no-form states where the distinction helps users.

## Suggested Future Structure

Do not reorganize solely for aesthetics. If the extension grows or adopts a build step, a useful target would be:

```text
extension/
├── manifest.json
├── src/
│   ├── background/
│   ├── content/
│   ├── popup/
│   └── shared/
├── assets/
└── tests/
```

Until then, the current flat `Chrome-Edge/` structure is proportionate. A premature framework migration would add more maintenance than value.

## Current Validation Baseline

With no project test runner, the minimum non-browser validation is:

```sh
node -e 'JSON.parse(require("fs").readFileSync("Chrome-Edge/manifest.json", "utf8"))'
node --check Chrome-Edge/config.js
node --check Chrome-Edge/background.js
node --check Chrome-Edge/content-script.js
node --check Chrome-Edge/popup.js
```

These checks catch only parse and syntax errors. Behavioral changes still require loading `Chrome-Edge/` as an unpacked extension and testing the service worker, content script, and popup together.
