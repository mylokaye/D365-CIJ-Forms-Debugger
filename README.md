# Dynamics 365 Form Debugger

A dependency-free Chrome and Microsoft Edge extension for debugging **Dynamics 365 Customer Insights - Journeys forms**.

It automatically applies the `#d365mkt-nocache` cache-bypass hash on supported Dynamics asset URLs, identifies the active Form ID, and exposes hidden form fields for submission testing.

## Installation

Install the extension from your browser's store:

- **Chrome Web Store:** [Dynamics 365 Form Debugger](https://chromewebstore.google.com/detail/dynamics-365-form-debugge/kdhnliicfgopcijgepghgohnhafphohf)
- **Microsoft Edge Add-ons:** [Dynamics 365 Form Debugger](https://microsoftedge.microsoft.com/addons/detail/dynamics-365-form-debugge/ceoaoafhphcpdokfdfkiilmndbepbbec)

For local development:

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose the repository's `Chrome-Edge/` directory.

## Features

- **Automatic cache bypass** — Adds `#d365mkt-nocache` to supported `assets-*.mkt.dynamics.com` form URLs.
- **Form ID detection** — Displays the detected Dynamics Form ID in the popup and copies it on click.
- **Editable hidden fields** — Renders hidden fields in their original form layout with a green debug border.
- **Complete Dynamics field support** — Handles native hidden inputs and designer-hidden `input`, `select`, and `textarea` controls.
- **Submission testing** — Synchronizes edits to the original source controls and dispatches normal `input` and `change` events.
- **Dynamic form support** — Labels newly inserted hidden fields without creating duplicates.
- **Compact popup** — Uses a 400 × 218px layout with the extension logo, cache status, Form ID, installed version, and support link.
- **Consistent diagnostics** — Uses the **Dynamics 365 Form Debugger** console prefix with blue branding and clear black message text.
- **Localized interface** — Supports the ten most-used web content languages through Chrome's native locale system.
- **No runtime dependencies or telemetry** — Uses browser APIs and plain HTML, CSS, and JavaScript only.

## How It Works

1. Open a supported Dynamics standalone form or a page containing an embedded Dynamics form.
2. The extension detects the form and automatically displays editable copies of its hidden fields.
3. Hidden-field copies use the form's existing styles and a green border so they are easy to distinguish.
4. Editing a displayed copy updates the corresponding original control used by the form submission.
5. On supported Dynamics asset pages, cache bypass is applied automatically.
6. Open the extension popup to view or copy the Form ID, confirm cache status, view the installed version, or open support.

Reload the extension and refresh existing form tabs after installing a local update so the latest content script is injected.

## Hidden-Field Editing

The rendered controls are debug copies. Their `id`, `name`, `required`, `form`, and list bindings are removed so the copies cannot submit duplicate values.

When you edit a debug copy, the extension updates the original hidden control and dispatches the same `input` or `change` event. If you then submit the form, the website receives the edited value through its normal submission process.

Turning a native `input[type="hidden"]` into a visible debug control affects only the copy; the original input remains hidden.

## Privacy & Data

The extension does not collect, store, or transmit form values, browsing history, credentials, or telemetry.

- Form IDs are read from the current page and shown only in the popup.
- Hidden-field values and edits remain in the current page session.
- Edited values may be transmitted by the host website only when you submit its form.
- The extension does not persist preferences or form data.
- Selecting the popup's information button opens the external [support website](https://mylokaye.info).

## Permissions and Site Access

- **`activeTab`** — Allows the popup to request the detected Form ID from the current tab.
- **`*://*.dynamics.com/*` host access** — Allows the service worker to apply cache bypass on supported Dynamics asset URLs.
- **`<all_urls>` content-script access** — Allows detection when Dynamics forms are embedded on third-party websites. The content script limits field inspection to detected Dynamics form containers.

The extension does not request the `storage` permission.

## Supported Languages

The manifest and popup are localized for the ten most-used website content languages reported by [W3Techs on 22 June 2026](https://w3techs.com/technologies/overview/content_language):

- English
- Spanish
- German
- Japanese
- French
- Portuguese (Brazil and Portugal)
- Russian
- Italian
- Dutch
- Polish

Chrome selects the closest supported locale from the browser UI language and falls back to English.
Portuguese is packaged as both `pt_BR` and `pt_PT`; the ten languages therefore use eleven locale catalogs.

## Development

The unpacked extension is loaded directly from `Chrome-Edge/`; there is no build step or package manager.

Minimum static validation:

```sh
node -e 'JSON.parse(require("fs").readFileSync("Chrome-Edge/manifest.json", "utf8"))'
node --check Chrome-Edge/config.js
node --check Chrome-Edge/background.js
node --check Chrome-Edge/content-script.js
node --check Chrome-Edge/popup.js
```

Behavior changes should also be tested by loading `Chrome-Edge/` as an unpacked extension and exercising standalone, embedded, dynamically inserted, normal, and restricted pages.

## Changelog

### [1.2.1] - 2026-06-22

- Added automatic editable rendering for native and Dynamics designer-hidden fields.
- Added support for hidden text inputs, option sets, lookup controls, and textareas using their user-facing labels.
- Preserved the original form layout and styling while adding green debug borders.
- Synchronized debug edits to original submitted controls through `input` and `change` events.
- Added dynamic hidden-field refresh and duplicate-label prevention.
- Kept cache bypass always active on supported Dynamics asset URLs.
- Removed activation, cache, hidden-field display, and edit toggles.
- Removed persisted state and the `storage` permission.
- Redesigned the popup to a compact 400 × 218px layout with centered branding, cache status, Form ID, runtime version, and support access.
- Removed the popup field-count and separate form-detection status rows.
- Updated console branding to **Dynamics 365 Form Debugger**, with a blue plugin name and black diagnostic text.
- Improved Chrome API error handling and centralized message types, selectors, URLs, and logging styles.
- Updated privacy and permissions documentation to match current behavior.
- Added native Chrome localization for English, Spanish, German, Japanese, French, Portuguese, Russian, Italian, Dutch, and Polish.

### [1.0.0] - 2025-01-XX

- Added Dynamics Form ID and field-count detection.
- Added click-to-copy form details.
- Added cache bypass using `#d365mkt-nocache`.
- Added the original activation toggle, popup status indicators, resource observation, and mutation monitoring.
- Shipped as a dependency-free Manifest V3 extension for Chrome and Edge.

## Support

Visit [mylokaye.info](https://mylokaye.info) for support and feedback.

## Legal Notice

**Dynamics 365** and **Microsoft Edge** are registered trademarks of **Microsoft Corporation**. Dynamics 365 Form Debugger is an independent tool created by **Mylo Kaye** and is not affiliated with, endorsed by, or sponsored by Microsoft Corporation.

- **Author:** Mylo Kaye
- **License:** Apache 2.0
- **Version:** 1.2.1
