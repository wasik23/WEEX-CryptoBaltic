# WEEX x CryptoBaltic landing page

Static bilingual campaign page for English and Russian audiences. It uses plain HTML, LESS, and JavaScript so it can be deployed to GitHub Pages, an object store, or any static host.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://127.0.0.1:3001/src/`. The LESS watcher writes the compiled stylesheet to `dist/css/main.css`.

For a one-time production stylesheet build:

```bash
npm run build:css
```

The LESS entry point is `src/less/index.less`, which imports shared tokens from `variables.less`, the page rules from `main.less`, and responsive overrides from `responsive.less`.

## GitHub Pages deployment

The workflow in `.github/workflows/pages.yml` publishes the `src/` directory on every push to `main` or `master`. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**. The workflow will then provide the published URL after its first successful run.

## Configure campaign links

Edit `src/js/main.js` and replace the `campaignLinks` values with the final WEEX referral and event URLs. Do not place API secrets in this project.

## Event tracking

Every event is sent to `window.dataLayer` as `{ event, ...payload }`. If Google Analytics 4 is installed, the same event is forwarded to `window.gtag`. The adapter is intentionally provider-neutral; a production deployment can load GTM/GA4 before `main.js` or replace `window.WEEX_ANALYTICS.track` with the approved analytics SDK.

Tracked events include `page_view`, `language_changed`, `cta_clicked`, `reward_clicked`, `community_clicked`, and `outbound_link_clicked`.
