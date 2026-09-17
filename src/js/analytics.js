// Analytics helpers for local dataLayer events and optional provider forwarding.
// Identify whether analytics is running on a local development host.
const isLocalHost = () => {
  if (typeof window === 'undefined') return true;

  return window.location.protocol === 'file:'
    || ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
};

// Check whether analytics debug logging was explicitly enabled.
const isDebugEnabled = () => {
  if (typeof window === 'undefined') return false;

  return new URL(window.location.href).searchParams.get('analytics_debug') === '1';
};

// Report provider errors only when analytics debugging is enabled.
const reportProviderError = (error) => {
  if (isDebugEnabled()) console.error('[WEEX analytics]', error);
};

// Create a tracker that records events locally and forwards them to providers.
export function createTracker() {
  const allowProviderForwarding = !isLocalHost() || isDebugEnabled();

  return (event, payload = {}) => {
    if (!event) return;

    const context = {
      language: document.documentElement.lang || 'en',
      page: window.location.pathname,
      timestamp: new Date().toISOString()
    };
    const detail = { event, ...payload, ...context };

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(detail);

    if (!allowProviderForwarding) return;

    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', event, { ...payload, ...context });
      }
    } catch (error) {
      reportProviderError(error);
    }

    try {
      if (window.WEEX_ANALYTICS && typeof window.WEEX_ANALYTICS.track === 'function') {
        window.WEEX_ANALYTICS.track(event, detail);
      }
    } catch (error) {
      reportProviderError(error);
    }
  };
}
