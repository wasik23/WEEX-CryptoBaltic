# JavaScript Workflow

- `config.js` stores campaign URLs and shared browser configuration.
- `i18n.js` owns English/Russian copy and language persistence.
- `analytics.js` provides the provider-neutral event adapter.
- `main.js` is the browser entrypoint that binds page interactions.

The project uses native ES modules. There is no JavaScript bundler: the browser loads `main.js`, which imports the other modules from the same `js/` folder. GitHub Pages copies the whole folder unchanged.
