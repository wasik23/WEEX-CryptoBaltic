# WEEX x CryptoBaltic landing page

Static bilingual campaign page for English and Russian audiences. It uses plain HTML, LESS, and JavaScript so it can be deployed to GitHub Pages, an object store, or any static host.

## Run locally

```bash
yarn install
yarn dev
```

Then open `http://127.0.0.1:3001/src/`. The LESS watcher writes the compiled stylesheet to `dist/css/main.css`.

For a one-time production stylesheet build:

```bash
yarn build:css
```

The LESS entry point is `src/less/index.less`, which imports shared tokens from `variables.less`, the page rules from `main.less`, and responsive overrides from `responsive.less`.

Use `yarn check` for a fast JavaScript syntax check. Use `yarn verify` before deployment to validate JavaScript, compile the production CSS, and generate the deployment JavaScript bundle.

The HTML entry point is `src/index.html`. It contains the document metadata, CSP, semantic sections, language hooks (`data-i18n`), and analytics hooks (`data-cta`, `data-community`, and `data-track`). GitHub Pages copies this source entry point to `public/index.html` and adjusts the compiled stylesheet path during deployment.

## Source folders

```text
src/
├── assets/
│   ├── fonts/
│   ├── icons/
│   └── images/
├── js/
│   ├── analytics.js
│   ├── config.js
│   ├── i18n.js
│   └── main.js
├── less/
└── index.html
```

JavaScript source uses native ES modules. `main.js` is the source entrypoint and imports the configuration, analytics, and language modules. The Pages workflow publishes the generated `dist/js/main.js` bundle so the extracted build also works when opened directly from a local file.

Responsive breakpoints are defined in `src/less/responsive.less`:

- Mobile: up to `767px`
- Tablet: `768px` through `1024px`
- Desktop: `1025px` and wider

## GitHub Pages deployment

The workflow in `.github/workflows/pages.yml` builds the LESS output, prepares a `public/` site with `index.html`, `assets/`, `js/`, and `dist/css/`, then publishes it on every push to `main` or `master`. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**. The workflow will then provide the published URL after its first successful run.

## Configure campaign links

Edit `src/js/main.js` and replace the `campaignLinks` values with the final WEEX referral and event URLs. Do not place API secrets in this project.

## Event tracking

Every event is sent to `window.dataLayer` as `{ event, ...payload }`. If Google Analytics 4 is installed, the same event is forwarded to `window.gtag`; an approved provider can also be connected through `window.WEEX_ANALYTICS.track`. Provider forwarding is disabled on local hosts by default and can be enabled for an intentional test with `?analytics_debug=1`. This prevents development traffic from reaching a production measurement project accidentally.

Tracked events include `page_view`, `language_changed`, `cta_clicked`, `step_selected`, `reward_clicked`, `community_clicked`, and `outbound_link_clicked`. Events include the current language, page path, and client timestamp.
