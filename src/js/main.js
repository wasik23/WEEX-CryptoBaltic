import { campaignLinks } from './config.js';
import { createTracker } from './analytics.js';
import { applyLanguage, resolveLanguage } from './i18n.js';

const track = createTracker();

const getCampaignLink = (type) => {
  const language = document.documentElement.lang || 'en';
  return campaignLinks[type][language] || campaignLinks[type].en;
};

const syncCampaignLinks = () => {
  document.querySelectorAll('[data-cta]').forEach((link) => {
    link.href = getCampaignLink('register');
  });
  document.querySelectorAll('[data-community]').forEach((link) => {
    link.href = getCampaignLink('community');
  });
};

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
    syncCampaignLinks();
    track('language_changed', { to_language: language });
    setLanguageMenuOpen(false);
  });
});

document.querySelectorAll('[data-cta]').forEach((link) => {
  link.addEventListener('click', () => {
    track('cta_clicked', {
      cta: link.dataset.cta,
      destination: 'register'
    });
    link.href = getCampaignLink('register');
  });
});

document.querySelectorAll('[data-event]').forEach((link) => {
  link.addEventListener('click', () => {
    track('cta_clicked', {
      cta: link.dataset.event,
      destination: 'welcome_event'
    });
    window.location.href = getCampaignLink('welcomeEvent');
  });
});

document.querySelectorAll('[data-signup]').forEach((link) => {
  const openSignup = () => {
    track('cta_clicked', {
      cta: 'signup',
      destination: 'register'
    });
    window.location.href = getCampaignLink('register');
  };

  link.addEventListener('click', openSignup);
  link.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openSignup();
    }
  });
});

const stepTabs = [...document.querySelectorAll('[data-step][role="tab"]')];
const stepPanels = [...document.querySelectorAll('[data-step-panel]')];
const startedPanels = document.querySelector('.started-panels');

const selectStep = (step, source = 'script') => {
  const previousStep = stepTabs.find((tab) => tab.getAttribute('aria-selected') === 'true')?.dataset.step;

  stepTabs.forEach((tab) => {
    const selected = tab.dataset.step === step;
    tab.classList.toggle('active', selected);
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  stepPanels.forEach((panel) => {
    panel.hidden = panel.dataset.stepPanel !== step;
  });

  if (startedPanels) {
    if (window.matchMedia('(max-width: 767px)').matches) {
      stepPanels.forEach((panel) => startedPanels.appendChild(panel));
      const activeTab = stepTabs.find((tab) => tab.dataset.step === step);
      const activePanel = stepPanels.find((panel) => panel.dataset.stepPanel === step);
      if (activeTab && activePanel) activeTab.after(activePanel);
    } else {
      stepPanels.forEach((panel) => startedPanels.appendChild(panel));
    }
  }

  if (source === 'tab' && previousStep !== step) track('step_selected', { step });
};

stepTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectStep(tab.dataset.step, 'tab'));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? stepTabs.length - 1 : (index + direction + stepTabs.length) % stepTabs.length;
    stepTabs[nextIndex].focus();
    selectStep(stepTabs[nextIndex].dataset.step, 'tab');
  });
});
selectStep('account');

window.addEventListener('resize', () => {
  if (startedPanels && !window.matchMedia('(max-width: 767px)').matches) {
    stepPanels.forEach((panel) => startedPanels.appendChild(panel));
  }
});

document.querySelectorAll('[data-reward]').forEach((item) => {
  item.addEventListener('click', () => {
    track('reward_clicked', { reward: item.dataset.reward });
  });
});

document.querySelectorAll('[data-community]').forEach((link) => {
  link.addEventListener('click', () => {
    track('community_clicked');
    link.href = getCampaignLink('community');
  });
});

document.querySelectorAll('a[data-track]').forEach((link) => {
  link.addEventListener('click', () => {
    track('outbound_link_clicked', { link: link.dataset.track });
  });
});

const sectionLinks = [...document.querySelectorAll('[data-section-link]')];
if (sectionLinks.length) {
  const mobileSectionNav = window.matchMedia('(max-width: 767px)');
  const mobileSectionNavElement = document.querySelector('.mobile-section-nav');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let activeSectionId = sectionLinks.find((link) => link.getAttribute('aria-current') === 'page')?.dataset.sectionLink;
  let navScrollFrame = 0;

  const cancelNavScroll = () => {
    if (!navScrollFrame) return;
    window.cancelAnimationFrame(navScrollFrame);
    navScrollFrame = 0;
  };

  const moveSectionNav = (targetLeft, animate) => {
    if (!mobileSectionNavElement) return;
    cancelNavScroll();

    const startLeft = mobileSectionNavElement.scrollLeft;
    const distance = targetLeft - startLeft;
    if (Math.abs(distance) <= 1) return;

    if (!animate || reducedMotion.matches) {
      mobileSectionNavElement.scrollLeft = targetLeft;
      return;
    }

    const duration = Math.min(420, Math.max(220, Math.abs(distance) * 0.6));
    const startedAt = performance.now();
    const animateScroll = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - ((1 - progress) ** 3);
      mobileSectionNavElement.scrollLeft = startLeft + distance * eased;

      if (progress < 1) {
        navScrollFrame = window.requestAnimationFrame(animateScroll);
      } else {
        navScrollFrame = 0;
      }
    };

    navScrollFrame = window.requestAnimationFrame(animateScroll);
  };

  const setActiveSectionLink = (sectionId, animateNav = true) => {
    const changed = activeSectionId !== sectionId;
    activeSectionId = sectionId;
    sectionLinks.forEach((link) => {
      const active = link.dataset.sectionLink === sectionId;
      if (active) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    if (changed && mobileSectionNav.matches && mobileSectionNavElement) {
      const activeLink = sectionLinks.find((link) => link.dataset.sectionLink === sectionId);
      if (activeLink) {
        const edgePadding = 16;
        const visibleLeft = mobileSectionNavElement.scrollLeft + edgePadding;
        const visibleRight = mobileSectionNavElement.scrollLeft
          + mobileSectionNavElement.clientWidth
          - edgePadding;
        let targetLeft = mobileSectionNavElement.scrollLeft;

        if (activeLink.offsetLeft < visibleLeft) {
          targetLeft = activeLink.offsetLeft - edgePadding;
        } else if (activeLink.offsetLeft + activeLink.offsetWidth > visibleRight) {
          targetLeft = activeLink.offsetLeft + activeLink.offsetWidth
            - mobileSectionNavElement.clientWidth + edgePadding;
        }

        targetLeft = Math.max(
          0,
          Math.min(targetLeft, mobileSectionNavElement.scrollWidth - mobileSectionNavElement.clientWidth)
        );

        if (Math.abs(targetLeft - mobileSectionNavElement.scrollLeft) > 1) {
          moveSectionNav(targetLeft, animateNav);
        }
      }
    }
  };

  sectionLinks.forEach((link) => {
    link.addEventListener('click', () => {
      setActiveSectionLink(link.dataset.sectionLink);
    });
  });

  mobileSectionNavElement?.addEventListener('pointerdown', cancelNavScroll, { passive: true });
  mobileSectionNavElement?.addEventListener('wheel', cancelNavScroll, { passive: true });

  const sections = sectionLinks
    .map((link) => document.getElementById(link.dataset.sectionLink))
    .filter(Boolean);
  let scrollFrame = 0;

  const updateSectionNavState = () => {
    if (!mobileSectionNavElement) return;
    const stuck = mobileSectionNav.matches
      && mobileSectionNavElement.getBoundingClientRect().top <= 64;
    mobileSectionNavElement.classList.toggle('is-stuck', stuck);
  };

  const updateActiveSection = () => {
    scrollFrame = 0;
    updateSectionNavState();
    if (!mobileSectionNav.matches || !sections.length) return;

    const marker = window.scrollY + Math.min(window.innerHeight * 0.35, 240);
    let activeSection = sections[0];

    sections.forEach((section) => {
      if (section.offsetTop <= marker) activeSection = section;
    });

    setActiveSectionLink(activeSection.id, false);
  };

  const scheduleActiveSectionUpdate = () => {
    if (!mobileSectionNav.matches) return;
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(updateActiveSection);
  };

  window.addEventListener('scroll', scheduleActiveSectionUpdate, { passive: true });
  window.addEventListener('resize', scheduleActiveSectionUpdate);
  window.addEventListener('load', scheduleActiveSectionUpdate, { once: true });
  scheduleActiveSectionUpdate();
}

const referralDots = [...document.querySelectorAll('.referral-dots span')];
if (referralDots.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let activeReferralDot = 0;
  window.setInterval(() => {
    referralDots[activeReferralDot].classList.remove('active');
    referralDots[activeReferralDot].removeAttribute('aria-current');
    activeReferralDot = (activeReferralDot + 1) % referralDots.length;
    referralDots[activeReferralDot].classList.add('active');
    referralDots[activeReferralDot].setAttribute('aria-current', 'true');
  }, 3000);
}

const challengeCards = [...document.querySelectorAll('[data-challenge-carousel] article')];
const challengeTrack = document.querySelector('[data-challenge-carousel] .challenge-track');
if (challengeCards.length && challengeTrack && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const challengeMobile = window.matchMedia('(max-width: 767px)');
  const challengeLoopCards = [...challengeCards];
  if (challengeMobile.matches) {
    const leadingClone = challengeCards[challengeCards.length - 1].cloneNode(true);
    leadingClone.classList.remove('selected');
    leadingClone.setAttribute('aria-hidden', 'true');
    challengeTrack.prepend(leadingClone);
  }
  challengeCards.forEach((card) => {
    const loopClone = card.cloneNode(true);
    loopClone.classList.remove('selected');
    loopClone.setAttribute('aria-hidden', 'true');
    challengeTrack.appendChild(loopClone);
    challengeLoopCards.push(loopClone);
  });
  let challengePosition = 0;
  const challengeDots = [...document.querySelectorAll('.challenge-dots span')];
  const challengeMobileOffset = 32;
  const challengeMoveDuration = 420;
  const challengeCycleDuration = 5200;
  const challengeDesktopDistance = 112;
  const challengeActiveOffset = challengeMobile.matches ? 0 : 1;

  challengeLoopCards.forEach((card) => card.classList.remove('selected'));
  challengeCards[challengeActiveOffset].classList.add('selected');

  const setChallengeTransform = () => {
    const distance = challengeMobile.matches ? window.innerWidth - 96 : challengeDesktopDistance;
    challengeTrack.style.transform = challengeMobile.matches
      ? `translateX(calc(-${(challengePosition + 1) * distance}px + ${challengeMobileOffset}px))`
      : `translateY(-${challengePosition * distance}px)`;
  };

  if (challengeMobile.matches) {
    challengeTrack.style.transition = 'none';
    setChallengeTransform();
    challengeTrack.offsetHeight;
    challengeTrack.style.transition = '';
  }

  window.setInterval(() => {
    challengePosition += 1;
    challengeTrack.classList.add('is-moving');
    setChallengeTransform();

    window.setTimeout(() => {
      challengeLoopCards.forEach((card) => card.classList.remove('selected'));
      const selectedIndex = challengePosition + challengeActiveOffset;
      challengeLoopCards[selectedIndex].classList.add('selected');
      challengeDots.forEach((dot, index) => {
        const active = index === (challengePosition + challengeActiveOffset) % challengeCards.length;
        dot.classList.toggle('active', active);
        dot.toggleAttribute('aria-current', active);
      });

      if (challengePosition === challengeCards.length) {
        window.setTimeout(() => {
          challengeTrack.classList.add('is-resetting');
          challengeTrack.style.transition = 'none';
          challengePosition = 0;
          challengeLoopCards.forEach((card) => card.classList.remove('selected'));
          challengeCards[challengeActiveOffset].classList.add('selected');
          if (challengeMobile.matches) {
            setChallengeTransform();
          } else {
            challengeTrack.style.transform = 'translateY(0)';
          }
          challengeTrack.offsetHeight;
          challengeTrack.style.transition = '';
          challengeTrack.classList.remove('is-moving', 'is-resetting');
        }, challengeMoveDuration);
      }
    }, challengeMoveDuration);
  }, challengeCycleDuration);
}

applyLanguage(resolveLanguage());
syncCampaignLinks();
track('page_view', { page: window.location.pathname });
