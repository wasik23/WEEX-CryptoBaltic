import { campaignLinks } from './config.js';
import { createTracker } from './analytics.js';
import { applyLanguage, resolveLanguage } from './i18n.js';

const track = createTracker();

const languageSwitcher = document.querySelector('.language-switcher');
const languageTrigger = document.querySelector('.language-trigger');
const languageMenu = document.querySelector('.language-menu');

const setLanguageMenuOpen = (open) => {
  if (!languageSwitcher || !languageTrigger || !languageMenu) return;
  languageMenu.hidden = !open;
  languageTrigger.setAttribute('aria-expanded', String(open));
};

languageTrigger?.addEventListener('click', () => {
  setLanguageMenuOpen(languageMenu.hidden);
});

document.addEventListener('click', (event) => {
  if (languageSwitcher && !languageSwitcher.contains(event.target)) {
    setLanguageMenuOpen(false);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    setLanguageMenuOpen(false);
  }
});

document.querySelectorAll('[data-lang]').forEach((button) => {
  button.addEventListener('click', () => {
    const language = applyLanguage(button.dataset.lang);
    track('language_changed', { to_language: language });
    setLanguageMenuOpen(false);
  });
});

document.querySelectorAll('[data-cta]').forEach((link) => {
  link.addEventListener('click', () => {
    track('cta_clicked', { cta: link.dataset.cta });
    link.href = campaignLinks.register;
  });
});

document.querySelectorAll('[data-reward]').forEach((item) => {
  item.addEventListener('click', () => {
    track('reward_clicked', { reward: item.dataset.reward });
  });
});

document.querySelectorAll('[data-community]').forEach((link) => {
  link.addEventListener('click', () => {
    track('community_clicked');
    link.href = campaignLinks.community;
  });
});

document.querySelectorAll('a[data-track]').forEach((link) => {
  link.addEventListener('click', () => {
    track('outbound_link_clicked', { link: link.dataset.track });
  });
});

applyLanguage(resolveLanguage());
track('page_view', { page: window.location.pathname });
