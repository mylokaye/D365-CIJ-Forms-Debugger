# Repository Review

Reviewed on 20 June 2026. This document describes the repository as found; it is not a promise that every current behavior is intentional.

## Executive Summary

The repository contains a small, readable, dependency-free Manifest V3 extension for Chrome and Edge. Its source is directly loadable from `Chrome-Edge/`; there is no compilation or packaging step. The implementation is split sensibly between a service worker, a content script, a popup, and shared constants.

The best next step is to clarify and test the extension's state model before adding features. The popup presents a single activation switch, but the cache-bypass worker reads a different setting that the current UI never changes. Form detection and permissions also need a deliberate product decision because the extension supports forms embedded on arbitrary sites while its background URL handling is limited to Dynamics asset pages.

## Current Structure

```text
.
├── AGENTS.md
├── Chrome-Edge/
│   ├── background.js
│   ├── config.js
│   ├── content-script.js
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

The manifest uses version `1.0.1`; the README still says `1.0.0`. The declared action icons are 16, 48, and 128 pixels. The 300-pixel icon exists but is not referenced by the manifest.

## Architecture

### Manifest

`Chrome-Edge/manifest.json` declares:

- Manifest V3.
- `storage` and `activeTab` permissions.
- `*://*.dynamics.com/*` host permission.
- A classic background service worker at `background.js`.
- A popup action at `popup.html`.
- `config.js` and `content-script.js` as content scripts on `<all_urls>` at `document_start`.

Although `host_permissions` is limited to Dynamics domains, the `<all_urls>` content-script match is broad site access and should be treated as such during permission and store review.

### Shared Configuration

`config.js` defines the global `CONFIG` object. It contains DOM IDs, timeouts, colors, logging strings, the Dynamics asset URL pattern, the no-cache hash, storage keys, selectors, defaults, and an empty `MESSAGE_TYPES` object.

Several values are remnants of a removed in-page overlay (`STYLE`, `OVERLAY`, `OVERLAY_Z_INDEX`, and related IDs). The CommonJS export branch is not used by the extension. The message type used at runtime is currently a literal instead of a shared constant.

### Background Service Worker

`background.js` imports `config.js` with `importScripts`, listens to `chrome.tabs.onUpdated`, and filters changed tab URLs using:

```text
^https://assets-[a-z]{3}.mkt.dynamics.com/
```

For a matching URL, it reads `nocacheEnabled` from local storage. The default is `true`. It appends `#d365mkt-nocache` when enabled and removes that exact substring when disabled, calling `chrome.tabs.update` only when the string changes.

Storage and tab-update callback errors are handled. The service worker does not read `extensionEnabled`.

### Content Script

`content-script.js` starts at `document_start` and:

- Observes resource performance entries containing `landingpageforms` and logs them.
- Detects the first element matching `[data-form-id]`.
- Reads `data-form-id`, `data-form-api-url`, and `data-cached-form-url`.
- Collects form-related script URLs for diagnostic logging.
- Reports cache-hash presence and counts the form container's direct children.
- Attaches a `MutationObserver` to the detected container after DOM readiness.
- Responds to the `GET_FORM_INFO` message with detection state, form ID, and count.

It does not transmit detected data. Detection can succeed when the popup asks later, but mutation monitoring is not attached if the form container is inserted after the one initialization attempt.

### Popup

`popup.html` contains all popup markup and CSS. `popup.js`:

- Reads `nocacheEnabled` and `extensionEnabled` from local storage.
- Queries the active tab and requests form information from its content script.
- Shows form ID, direct-child count, form detection status, and cache status.
- Writes `extensionEnabled` when the activation switch changes.
- Automatically writes `extensionEnabled: false` when no form response is received or no form is detected.
- Copies form ID or count to the clipboard.
- Opens feedback and support pages on `pattens.tech`.

The HTML link destinations point to `mylokaye.info`, but click handlers prevent those defaults and open different `pattens.tech` URLs. This should be aligned for accessibility, transparency, and behavior when JavaScript is unavailable.

## State Model Found

| State | Default | Read by | Written by | Effect |
|---|---:|---|---|---|
| `nocacheEnabled` | `true` | popup, background | No current runtime UI | Controls background hash changes and popup cache label |
| `extensionEnabled` | `true` | popup | popup | Controls popup styling and switch position only |

This is the highest-priority product issue. Switching off “Activate extension” does not stop `background.js` from applying the no-cache hash. Conversely, the cache state is display-only and cannot currently be changed by the user. Decide whether one switch should control both concepts or whether two explicit controls are required.

## Findings and Risks

### High priority

1. **Activation and cache bypass are disconnected.** The service worker ignores `extensionEnabled`; the popup never writes `nocacheEnabled`. The UI can therefore say the extension is inactive while background behavior remains active.
2. **The field count is not necessarily a field count.** `formContainer.children.length` counts direct child elements, not form controls or hidden inputs specifically. The README and popup label make a stronger claim than the implementation supports.
3. **Late-inserted forms are not mutation-monitored.** The observer attaches only if a form exists at the single DOM-ready check. Popup-time rescanning finds a later form but does not establish ongoing monitoring.

### Medium priority

1. **No-form and unavailable-content-script states are conflated.** A restricted URL, injection failure, or extension-update mismatch auto-disables the extension as though a normal page had no form.
2. **Broad page access needs confirmation.** `<all_urls>` supports embedded forms on arbitrary sites, but it is a substantial permission surface. Confirm whether optional host access, user-triggered injection, or narrower matching can preserve the intended flow.
3. **Hash handling is string-based.** Appending the bypass hash to a URL that already has another fragment creates a concatenated fragment. Removing the substring can also leave an unintended fragment. Use the `URL` API once desired behavior for existing hashes is specified.
4. **The URL pattern is narrow.** It permits exactly three letters after `assets-`. Confirm all current Dynamics regional asset host formats before relying on it.
5. **Auto-disable is persistent and surprising.** Merely opening the popup on an unsupported page changes stored state. A transient observation becomes a durable preference.

### Maintenance and documentation

1. README version `1.0.0` differs from manifest version `1.0.1`.
2. README describes `<all_urls>` as a permission while the manifest splits broad content-script matching from explicit permissions. The user-facing explanation should still clearly disclose broad site access.
3. README says the extension does not store form or user data; it does store local preferences. The privacy claim can remain accurate if it distinguishes preferences from collected form data.
4. README says there are no network calls. The extension does not send telemetry, but its support links intentionally navigate to external sites. Wording should distinguish extension-initiated data transmission from user navigation.
5. `CONFIG.MESSAGE_TYPES` is empty while `GET_FORM_INFO` is hard-coded.
6. Overlay-era constants and comments remain after overlay removal.
7. The message listener returns `true` after responding synchronously.
8. Some Chrome API error paths are missing, including tab query/create and storage reads inside auto-disable and toggle flows.
9. Popup state is represented by direct inline style changes rather than state classes.
10. There is no automated validation, test suite, linting, or release packaging script.
11. `.gitignore` ignores common package-manager lockfiles. If Node tooling is introduced, its chosen lockfile should be committed for reproducibility.

## What Is Already Good

- The codebase is small and approachable.
- Manifest V3 is already in use.
- Shared constants reduce duplicated storage keys, selectors, defaults, and URL patterns.
- The service worker registers its listener at top level and does not depend on durable in-memory state.
- Storage reads preserve explicit `false` values through nullish fallback.
- The background worker avoids a tab update when the URL does not change.
- The extension has no third-party runtime dependencies, remote code, analytics, or telemetry.
- Popup scripts are external files, consistent with extension CSP requirements.
- The primary storage and tab-update operations already check `chrome.runtime.lastError`.
- The content script uses `PerformanceObserver` rather than monkey-patching page network APIs.

## Recommended Development Order

1. **Define behavior.** Decide the meaning of “Activate extension,” whether cache bypass is independently controllable, and what should happen when no form is present.
2. **Correct the state flow.** Establish one documented source of truth or two clearly named settings; migrate existing stored values safely.
3. **Define detection semantics.** Specify supported embed patterns and an exact definition of a detected field.
4. **Add minimal automated checks.** Start with manifest parsing, JavaScript syntax checks, URL/hash unit tests, and pure form-state helpers. Introduce tooling only after choosing it deliberately.
5. **Harden dynamic detection.** Handle late iframe/container insertion and observer cleanup without continuous broad DOM scans.
6. **Review permissions.** Verify current APIs and the narrowest workable access model against current Chrome documentation.
7. **Refine the popup.** Separate unavailable/error/empty states, align link destinations, use CSS state classes, and improve keyboard/status accessibility.
8. **Align documentation and release data.** Update permissions, privacy language, version, changelog, and support links together.

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
