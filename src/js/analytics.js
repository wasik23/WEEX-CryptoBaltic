export function createTracker() {
  return (event, payload = {}) => {
    const detail = {
      event,
      ...payload,
      language: document.documentElement.lang,
      timestamp: new Date().toISOString()
    };

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(detail);

    if (typeof window.gtag === 'function') {
      window.gtag('event', event, payload);
    }

    if (window.WEEX_ANALYTICS && typeof window.WEEX_ANALYTICS.track === 'function') {
      window.WEEX_ANALYTICS.track(event, detail);
    }
  };
}
